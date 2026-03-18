import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// ========================================
// SCHÉMA DE VALIDATION POUR ACTIVATION
// ========================================
const activateQRSchema = z.object({
  // QR Code (shortCode ou codeUnique)
  qrCode: z.string().min(8),
  
  // Données véhicule
  vehicle: z.object({
    make: z.string().min(1, "Marque requise"),
    model: z.string().min(1, "Modèle requis"),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    color: z.string().optional(),
    licensePlate: z.string().min(1, "Immatriculation requise"),
    vin: z.string().optional(),
    mileage: z.number().int().min(0).optional(),
    vehicleType: z.string().default('voiture'),
    engineType: z.string().optional(),
  }),
  
  // Données propriétaire
  owner: z.object({
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().min(1, "Nom requis"),
    phone: z.string().min(8, "Téléphone requis"),
    email: z.string().email().optional(),
  }),
  
  // ID du garage (pour vérification)
  garageId: z.string().min(1, "ID Garage requis"),
});

// ========================================
// FONCTION: GÉNÉRER MOT DE PASSE TEMPORAIRE
// ========================================
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ========================================
// FONCTION: GÉNÉRER RÉFÉRENCE VÉHICULE
// ========================================
function generateVehicleReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OKAR-${code}`;
}

// ========================================
// API: ACTIVATION D'UN QR CODE PAR GARAGE
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateQRSchema.parse(body);
    const { qrCode, vehicle, owner, garageId } = validatedData;
    const now = new Date().toISOString();

    // 1. VÉRIFIER QUE LE GARAGE EST CERTIFIÉ
    const garage = await db.$queryRawUnsafe<any[]>(
      `SELECT id, name, isCertified, active FROM Garage WHERE id = ?`,
      garageId
    );

    if (!garage || garage.length === 0) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    if (!garage[0].isCertified) {
      return NextResponse.json(
        { error: 'Ce garage n\'est pas certifié pour activer des QR Codes' },
        { status: 403 }
      );
    }

    if (!garage[0].active) {
      return NextResponse.json(
        { error: 'Ce garage est inactif' },
        { status: 403 }
      );
    }

    // 2. TROUVER LE QR CODE (par shortCode ou codeUnique)
    const qrCodeRecord = await db.$queryRawUnsafe<any[]>(
      `SELECT qs.*, ql.assignedToId as lotGarageId
       FROM QRCodeStock qs
       JOIN QRCodeLot ql ON qs.lotId = ql.id
       WHERE (qs.shortCode = ? OR qs.codeUnique = ?)`,
      qrCode, qrCode
    );

    if (!qrCodeRecord || qrCodeRecord.length === 0) {
      return NextResponse.json(
        { error: 'QR Code non trouvé' },
        { status: 404 }
      );
    }

    const qr = qrCodeRecord[0];

    // 3. VÉRIFIER LE STATUT DU QR CODE
    if (qr.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Ce QR Code est déjà activé', linkedVehicle: qr.linkedVehicleId },
        { status: 400 }
      );
    }

    if (qr.status === 'REVOKED') {
      return NextResponse.json(
        { error: 'Ce QR Code a été révoqué et ne peut plus être activé' },
        { status: 400 }
      );
    }

    // 4. VÉRIFIER L'ASSIGNATION AU GARAGE
    // Si le lot est assigné à un garage spécifique, seul ce garage peut activer
    if (qr.lotGarageId && qr.lotGarageId !== garageId) {
      return NextResponse.json(
        { error: 'Ce QR Code n\'est pas assigné à votre garage' },
        { status: 403 }
      );
    }

    // 5. CRÉER OU TROUVER L'UTILISATEUR PROPRIÉTAIRE
    let existingUser = null;
    if (owner.email) {
      existingUser = await db.$queryRawUnsafe<any[]>(
        'SELECT id, email, name FROM User WHERE email = ?',
        owner.email
      );
    }

    // Chercher aussi par téléphone
    if (!existingUser || existingUser.length === 0) {
      existingUser = await db.$queryRawUnsafe<any[]>(
        'SELECT id, email, name, phone FROM User WHERE phone = ?',
        owner.phone
      );
    }

    let userId;
    let tempPassword = null;

    if (existingUser && existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      // Créer un nouvel utilisateur
      userId = `user-${Date.now().toString(36)}`;
      tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await db.$executeRawUnsafe(
        `INSERT INTO User (id, email, name, phone, password, role, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'driver', ?, ?)`,
        userId,
        owner.email || `${owner.phone}@okar.temp`,
        `${owner.firstName} ${owner.lastName}`,
        owner.phone,
        hashedPassword,
        now,
        now
      );
    }

    // 6. CRÉER LE VÉHICULE
    const vehicleId = `veh-${Date.now().toString(36)}`;
    const vehicleReference = generateVehicleReference();

    await db.$executeRawUnsafe(
      `INSERT INTO Vehicle (
        id, reference, make, model, year, color, licensePlate, vin,
        mileage, vehicleType, engineType, ownerId, ownerName,
        ownerFirstName, ownerLastName, ownerPhone, garageId, lotId,
        qrStatus, status, activatedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'active', ?, ?, ?)`,
      vehicleId,
      vehicleReference,
      vehicle.make,
      vehicle.model,
      vehicle.year || null,
      vehicle.color || null,
      vehicle.licensePlate.toUpperCase(),
      vehicle.vin || null,
      vehicle.mileage || 0,
      vehicle.vehicleType,
      vehicle.engineType || 'essence',
      userId,
      `${owner.firstName} ${owner.lastName}`,
      owner.firstName,
      owner.lastName,
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
           assignedGarageId = ?,
           updatedAt = ?
       WHERE id = ?`,
      vehicleId,
      now,
      garageId,
      now,
      qr.id
    );

    // 8. CRÉER LA PREMIÈRE INTERVENTION (Activation)
    await db.$executeRawUnsafe(
      `INSERT INTO MaintenanceRecord (
        id, vehicleId, garageId, category, description, 
        status, interventionDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, 'activation', ?, 'COMPLETED', ?, ?, ?)`,
      `mr-${Date.now().toString(36)}`,
      vehicleId,
      garageId,
      `Activation du passeport OKAR pour ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      now,
      now,
      now
    );

    // 9. RETOURNER LES INFORMATIONS
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
        name: `${owner.firstName} ${owner.lastName}`,
        phone: owner.phone,
        email: owner.email,
        isNew: !existingUser || existingUser.length === 0,
        tempPassword: tempPassword, // Seulement si nouvel utilisateur
      },
      qrCode: {
        shortCode: qr.shortCode,
        scanUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn'}/v/${qr.shortCode}`,
      },
      dashboardUrl: `/driver/tableau-de-bord`,
    });

  } catch (error) {
    console.error('Activate QR error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Erreur serveur', details: errorMessage },
      { status: 500 }
    );
  }
}
