import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { getSession } from '@/lib/session';

// ========================================
// SCHÉMA DE VALIDATION SIMPLIFIÉ
// ========================================
const activateQRSchema = z.object({
  shortCode: z.string().min(8),
  vehicle: z.object({
    make: z.string().min(1, "Marque requise"),
    model: z.string().min(1, "Modèle requis"),
    year: z.number().int().optional().nullable(),
    color: z.string().optional().nullable(),
    licensePlate: z.string().min(1, "Immatriculation requise"),
  }),
  owner: z.object({
    name: z.string().min(1, "Nom requis"),
    phone: z.string().optional().nullable(),
  }),
  mileage: z.number().int().min(0).optional().nullable(),
});

// ========================================
// FONCTIONS UTILITAIRES SÉCURISÉES
// ========================================

/**
 * Generate cryptographically secure temporary password
 * Uses crypto.randomBytes instead of Math.random
 */
function generateSecureTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(10);
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(bytes[i] % chars.length);
  }
  return password;
}

/**
 * Generate cryptographically secure vehicle reference
 */
function generateVehicleReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return `OKAR-${code}`;
}

// ========================================
// API: ACTIVATION D'UN QR CODE
// ========================================
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 🔒 ÉTAPE 1: VÉRIFICATION D'AUTHENTIFICATION
    // ============================================
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication requise. Veuillez vous connecter.'
      }, { status: 401 });
    }

    // Vérifier que l'utilisateur a le rôle garage
    if (sessionUser.role !== 'garage') {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé. Seuls les garages peuvent activer des QR codes.'
      }, { status: 403 });
    }

    // Vérifier que le garage est associé à l'utilisateur
    if (!sessionUser.garageId) {
      return NextResponse.json({
        success: false,
        error: 'Aucun garage associé à votre compte.'
      }, { status: 403 });
    }

    // ============================================
    // 🔒 ÉTAPE 2: VÉRIFICATION DU GARAGE
    // ============================================
    const garage = await db.$queryRawUnsafe<any[]>(
      `SELECT id, name, isCertified, accountStatus 
       FROM Garage 
       WHERE id = ?`,
      sessionUser.garageId
    );

    if (!garage || garage.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Garage non trouvé.'
      }, { status: 404 });
    }

    const garageData = garage[0];

    // Vérifier que le garage est certifié
    if (!garageData.isCertified) {
      return NextResponse.json({
        success: false,
        error: 'Votre garage n\'est pas encore certifié. Activation impossible.'
      }, { status: 403 });
    }

    // Vérifier que le garage n'est pas suspendu
    if (garageData.accountStatus === 'SUSPENDED_BY_ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Votre garage est suspendu. Activation impossible.'
      }, { status: 403 });
    }

    // ============================================
    // ÉTAPE 3: VALIDATION DES DONNÉES
    // ============================================
    const body = await request.json();
    const validatedData = activateQRSchema.parse(body);
    const { shortCode, vehicle, owner, mileage } = validatedData;
    const now = new Date().toISOString();

    // ============================================
    // ÉTAPE 4: VÉRIFICATION DU QR CODE
    // ============================================
    const qrCodeRecord = await db.$queryRawUnsafe<any[]>(
      `SELECT qs.*, g.id as garageId, g.name as garageName, g.accountStatus as garageAccountStatus
       FROM QRCodeStock qs
       LEFT JOIN Garage g ON qs.assignedGarageId = g.id
       WHERE qs.shortCode = ?`,
      shortCode
    );

    if (!qrCodeRecord || qrCodeRecord.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'QR Code non trouvé'
      }, { status: 404 });
    }

    const qr = qrCodeRecord[0];

    // Vérifier le statut du QR
    if (qr.status === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR Code est déjà activé'
      }, { status: 400 });
    }

    if (qr.status === 'REVOKED' || qr.status === 'LOST') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR Code a été révoqué ou déclaré perdu'
      }, { status: 400 });
    }

    // ============================================
    // 🔒 ÉTAPE 5: VÉRIFICATION D'APPARTENANCE DU QR
    // ============================================
    // Le QR doit être assigné à CE garage ou non assigné (stock central)
    if (qr.assignedGarageId && qr.assignedGarageId !== sessionUser.garageId) {
      // Log tentative d'activation frauduleuse
      await db.$executeRawUnsafe(
        `INSERT INTO AuditLog (id, action, entityType, entityId, userId, userEmail, details, createdAt)
         VALUES (?, 'UNAUTHORIZED_QR_ACTIVATION_ATTEMPT', 'QR_CODE', ?, ?, ?, ?, ?)`,
        `log-${randomBytes(8).toString('hex')}`,
        qr.id,
        sessionUser.id,
        sessionUser.email,
        JSON.stringify({
          shortCode,
          garageAttempt: sessionUser.garageId,
          qrAssignedTo: qr.assignedGarageId,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }),
        now
      );

      return NextResponse.json({
        success: false,
        error: 'Ce QR Code n\'appartient pas à votre garage.'
      }, { status: 403 });
    }

    // ============================================
    // ÉTAPE 6: CRÉATION OU RECHERCHE DE L'UTILISATEUR
    // ============================================
    let userId;
    let tempPassword = null;

    // Chercher par téléphone
    if (owner.phone) {
      const existingUser = await db.$queryRawUnsafe<any[]>(
        'SELECT id FROM User WHERE phone = ?',
        owner.phone
      );
      if (existingUser && existingUser.length > 0) {
        userId = existingUser[0].id;
      }
    }

    // Créer nouvel utilisateur si nécessaire
    if (!userId) {
      userId = `user-${randomBytes(8).toString('hex')}`;
      tempPassword = generateSecureTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12); // Increased cost factor

      await db.$executeRawUnsafe(
        `INSERT INTO User (id, email, name, phone, password, role, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'driver', ?, ?)`,
        userId,
        owner.phone ? `${owner.phone.replace(/\D/g, '')}@okar.temp` : `user${Date.now()}@okar.temp`,
        owner.name,
        owner.phone || '',
        hashedPassword,
        now,
        now
      );
    }

    // ============================================
    // ÉTAPE 7: CRÉATION DU VÉHICULE
    // ============================================
    const vehicleId = `veh-${randomBytes(8).toString('hex')}`;
    const vehicleReference = generateVehicleReference();

    await db.$executeRawUnsafe(
      `INSERT INTO Vehicle (
        id, reference, make, model, year, color, licensePlate,
        mileage, ownerId, ownerName, ownerPhone, garageId, lotId,
        qrStatus, status, activatedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'active', ?, ?, ?)`,
      vehicleId,
      vehicleReference,
      vehicle.make,
      vehicle.model,
      vehicle.year || null,
      vehicle.color || null,
      vehicle.licensePlate.toUpperCase(),
      mileage || 0,
      userId,
      owner.name,
      owner.phone || '',
      sessionUser.garageId, // Use authenticated garage
      qr.lotId,
      now,
      now,
      now
    );

    // ============================================
    // ÉTAPE 8: MISE À JOUR DU QR CODE
    // ============================================
    await db.$executeRawUnsafe(
      `UPDATE QRCodeStock
       SET status = 'ACTIVE',
           linkedVehicleId = ?,
           activationDate = ?,
           updatedAt = ?
       WHERE id = ?`,
      vehicleId,
      now,
      now,
      qr.id
    );

    // ============================================
    // ÉTAPE 9: CRÉATION DE L'INTERVENTION D'ACTIVATION
    // ============================================
    await db.$executeRawUnsafe(
      `INSERT INTO MaintenanceRecord (
        id, vehicleId, garageId, category, description,
        status, ownerValidation, interventionDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, 'activation', ?, 'COMPLETED', 'VALIDATED', ?, ?, ?)`,
      `mr-${randomBytes(8).toString('hex')}`,
      vehicleId,
      sessionUser.garageId,
      `Activation du passeport OKAR - ${vehicle.make} ${vehicle.model}`,
      now,
      now,
      now
    );

    // ============================================
    // ÉTAPE 10: AUDIT LOG DE L'ACTIVATION
    // ============================================
    await db.$executeRawUnsafe(
      `INSERT INTO AuditLog (id, action, entityType, entityId, userId, userEmail, garageId, details, createdAt)
       VALUES (?, 'QR_ACTIVATED', 'VEHICLE', ?, ?, ?, ?, ?, ?)`,
      `log-${randomBytes(8).toString('hex')}`,
      vehicleId,
      sessionUser.id,
      sessionUser.email,
      sessionUser.garageId,
      JSON.stringify({
        shortCode,
        vehicleReference,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        licensePlate: vehicle.licensePlate,
        ownerName: owner.name,
        ownerPhone: owner.phone ? '***' + owner.phone.slice(-4) : null, // Masked for privacy
      }),
      now
    );

    // ============================================
    // RÉPONSE
    // ============================================
    return NextResponse.json({
      success: true,
      message: 'QR Code activé avec succès',
      vehicle: {
        id: vehicleId,
        reference: vehicleReference,
        make: vehicle.make,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
      },
      owner: {
        id: userId,
        name: owner.name,
        phone: owner.phone,
        tempPassword,
      },
      qrCode: {
        shortCode: qr.shortCode,
        scanUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn'}/v/${qr.shortCode}`,
      },
      activatedBy: {
        garageId: sessionUser.garageId,
        garageName: garageData.name,
      },
    });

  } catch (error) {
    console.error('Activate QR error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur de validation',
        details: error.errors
      }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
