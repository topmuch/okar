import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// ========================================
// SCHÉMA DE VALIDATION
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
    phone: z.string().min(8, "Téléphone requis"),
    email: z.string().email().optional().nullable(),
  }),
  mileage: z.number().int().min(0).optional().nullable(),
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateVehicleReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OKAR-${code}`;
}

// ========================================
// API: ACTIVATION D'UN QR CODE (PUBLIC)
// Pour les particuliers
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateQRSchema.parse(body);
    const { shortCode, vehicle, owner, mileage } = validatedData;
    const now = new Date().toISOString();

    // 1. TROUVER LE QR CODE
    const qrCodeRecord = await db.$queryRawUnsafe<any[]>(
      `SELECT qs.* FROM QRCodeStock qs WHERE qs.shortCode = ?`,
      shortCode
    );

    if (!qrCodeRecord || qrCodeRecord.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'QR Code non trouvé'
      }, { status: 404 });
    }

    const qr = qrCodeRecord[0];

    // 2. VÉRIFIER LE STATUT
    if (qr.status === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR Code est déjà activé'
      }, { status: 400 });
    }

    if (qr.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR Code a été révoqué'
      }, { status: 400 });
    }

    // 3. VÉRIFIER QU'IL N'EST PAS ASSIGNÉ À UN GARAGE
    if (qr.assignedGarageId) {
      return NextResponse.json({
        success: false,
        error: 'Ce QR Code est assigné à un garage. Veuillez vous rendre chez le partenaire pour l\'activation.'
      }, { status: 400 });
    }

    // 4. CRÉER OU TROUVER L'UTILISATEUR
    let userId;
    let tempPassword = null;

    // Chercher par téléphone
    const existingUser = await db.$queryRawUnsafe<any[]>(
      'SELECT id FROM User WHERE phone = ?',
      owner.phone
    );

    if (existingUser && existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      // Créer nouvel utilisateur
      userId = `user-${randomBytes(8).toString('hex')}`;
      tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await db.$executeRawUnsafe(
        `INSERT INTO User (id, email, name, phone, password, role, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'driver', ?, ?)`,
        userId,
        owner.email || `${owner.phone.replace(/\D/g, '')}@okar.temp`,
        owner.name,
        owner.phone,
        hashedPassword,
        now,
        now
      );
    }

    // 5. TROUVER UN GARAGE CERTIFIÉ PAR DÉFAUT (pour les interventions futures)
    const defaultGarage = await db.$queryRawUnsafe<any[]>(
      `SELECT id FROM Garage WHERE isCertified = 1 AND active = 1 LIMIT 1`
    );
    const garageId = defaultGarage?.[0]?.id || null;

    // 6. CRÉER LE VÉHICULE
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
      owner.phone,
      garageId,
      qr.lotId,
      now,
      now,
      now
    );

    // 7. METTRE À JOUR LE QR CODE
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

    // 8. CRÉER L'INTERVENTION D'ACTIVATION
    if (garageId) {
      await db.$executeRawUnsafe(
        `INSERT INTO MaintenanceRecord (
          id, vehicleId, garageId, category, description,
          status, ownerValidation, interventionDate, createdAt, updatedAt
        ) VALUES (?, ?, ?, 'activation', ?, 'COMPLETED', 'VALIDATED', ?, ?, ?)`,
        `mr-${randomBytes(8).toString('hex')}`,
        vehicleId,
        garageId,
        `Activation du passeport OKAR par le propriétaire - ${vehicle.make} ${vehicle.model}`,
        now,
        now,
        now
      );
    }

    // 9. RÉPONSE
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
    });

  } catch (error) {
    console.error('Public activate QR error:', error);

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
      details: errorMessage
    }, { status: 500 });
  }
}
