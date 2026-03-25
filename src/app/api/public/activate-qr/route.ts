import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const activateQRSchema = z.object({
  shortCode: z.string().min(4, "Code QR requis"),
  vehicle: z.object({
    make: z.string().min(1, "Marque requise"),
    model: z.string().min(1, "Modèle requis"),
    year: z.number().int().optional().nullable(),
    color: z.string().optional().nullable(),
    licensePlate: z.string().min(1, "Immatriculation requise"),
    mainPhoto: z.string().optional().nullable(),
  }),
  owner: z.object({
    name: z.string().min(1, "Nom requis"),
    phone: z.string().min(8, "Téléphone requis"),
    email: z.string().email().optional().nullable(),
  }),
  mileage: z.number().int().min(0).optional().nullable(),
  // Visite technique
  vtStartDate: z.string().optional().nullable(),
  vtEndDate: z.string().optional().nullable(),
  // Assurance
  insuranceStartDate: z.string().optional().nullable(),
  insuranceEndDate: z.string().optional().nullable(),
  insuranceCompany: z.string().optional().nullable(),
  insurancePolicyNum: z.string().optional().nullable(),
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
    const {
      shortCode,
      vehicle,
      owner,
      mileage,
      vtStartDate,
      vtEndDate,
      insuranceStartDate,
      insuranceEndDate,
      insuranceCompany,
      insurancePolicyNum
    } = validatedData;
    const now = new Date();

    // 1. TROUVER LE QR CODE avec Prisma
    const qrCodeRecord = await db.qRCodeStock.findUnique({
      where: { shortCode }
    });

    if (!qrCodeRecord) {
      return NextResponse.json({
        success: false,
        error: 'QR Code non trouvé'
      }, { status: 404 });
    }

    // 2. VÉRIFIER LE STATUT
    if (qrCodeRecord.status === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR Code est déjà activé'
      }, { status: 400 });
    }

    if (qrCodeRecord.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR Code a été révoqué'
      }, { status: 400 });
    }

    // 3. VÉRIFIER QU'IL N'EST PAS ASSIGNÉ À UN GARAGE
    if (qrCodeRecord.assignedGarageId) {
      return NextResponse.json({
        success: false,
        error: 'Ce QR Code est assigné à un garage. Veuillez vous rendre chez le partenaire pour l\'activation.'
      }, { status: 400 });
    }

    // 4. CRÉER OU TROUVER L'UTILISATEUR
    let userId: string;
    let tempPassword: string | null = null;

    // Chercher par téléphone
    const existingUser = await db.user.findFirst({
      where: { phone: owner.phone }
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Créer nouvel utilisateur avec Prisma
      userId = `user-${randomBytes(8).toString('hex')}`;
      tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await db.user.create({
        data: {
          id: userId,
          email: owner.email || `${owner.phone.replace(/\D/g, '')}@okar.temp`,
          name: owner.name,
          phone: owner.phone,
          password: hashedPassword,
          role: 'driver',
          emailVerified: false,
          updatedAt: now,
        }
      });
    }

    // 5. TROUVER UN GARAGE CERTIFIÉ PAR DÉFAUT
    const defaultGarage = await db.garage.findFirst({
      where: { isCertified: true, active: true }
    });
    const garageId = defaultGarage?.id || null;

    // 6. CRÉER LE VÉHICULE avec Prisma
    const vehicleId = `veh-${randomBytes(8).toString('hex')}`;
    const vehicleReference = generateVehicleReference();

    await db.vehicle.create({
      data: {
        id: vehicleId,
        reference: vehicleReference,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || null,
        color: vehicle.color || null,
        licensePlate: vehicle.licensePlate.toUpperCase(),
        currentMileage: mileage || 0,
        mainPhoto: vehicle.mainPhoto || null,
        ownerId: userId,
        ownerName: owner.name,
        ownerPhone: owner.phone,
        garageId,
        lotId: qrCodeRecord.lotId,
        qrStatus: 'ACTIVE',
        status: 'active',
        activatedAt: now,
        // Visite technique
        vtStartDate: vtStartDate ? new Date(vtStartDate) : null,
        vtEndDate: vtEndDate ? new Date(vtEndDate) : null,
        // Assurance
        insuranceStartDate: insuranceStartDate ? new Date(insuranceStartDate) : null,
        insuranceEndDate: insuranceEndDate ? new Date(insuranceEndDate) : null,
        insuranceCompany: insuranceCompany || null,
        insurancePolicyNum: insurancePolicyNum || null,
        okarScore: 0,
        okarBadge: 'BRONZE',
        updatedAt: now,
      }
    });

    // 7. METTRE À JOUR LE QR CODE
    await db.qRCodeStock.update({
      where: { id: qrCodeRecord.id },
      data: {
        status: 'ACTIVE',
        linkedVehicleId: vehicleId,
        activationDate: now,
        updatedAt: now,
      }
    });

    // 8. CRÉER L'INTERVENTION D'ACTIVATION
    if (garageId) {
      await db.maintenanceRecord.create({
        data: {
          id: `mr-${randomBytes(8).toString('hex')}`,
          vehicleId,
          garageId,
          category: 'activation',
          description: `Activation du passeport OKAR par le propriétaire - ${vehicle.make} ${vehicle.model}`,
          status: 'COMPLETED',
          ownerValidation: 'VALIDATED',
          interventionDate: now,
          updatedAt: now,
        }
      });
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
        mainPhoto: vehicle.mainPhoto,
      },
      owner: {
        id: userId,
        name: owner.name,
        phone: owner.phone,
        tempPassword,
      },
      qrCode: {
        shortCode: qrCodeRecord.shortCode,
        scanUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn'}/v/${qrCodeRecord.shortCode}`,
      },
    });

  } catch (error) {
    console.error('Public activate QR error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur de validation',
        details: error.issues
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
