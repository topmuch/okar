import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateCuid } from '@/lib/qr';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const qrSwapRequestSchema = z.object({
  vehicleId: z.string().min(1, "L'ID du véhicule est requis"),
  reason: z.enum(['ENDOMMAGE', 'PERDU', 'ILLISIBLE'], {
    errorMap: () => ({ message: 'La raison doit être ENDOMMAGE, PERDU ou ILLISIBLE' })
  }),
  description: z.string().optional(),
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Log l'action dans AuditLog
 */
async function logAudit(params: {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  userEmail?: string;
  details?: string;
  garageId?: string;
}) {
  try {
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, entityId, userId, userEmail, details, garageId, createdAt)
      VALUES (${generateCuid()}, ${params.action}, ${params.entityType}, ${params.entityId}, 
              ${params.userId || null}, ${params.userEmail || null}, ${params.details || null}, 
              ${params.garageId || null}, ${new Date().toISOString()})
    `;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'audit:', error);
  }
}

/**
 * Raison display labels
 */
const REASON_LABELS: Record<string, string> = {
  ENDOMMAGE: 'QR Code endommagé',
  PERDU: 'QR Code perdu',
  ILLISIBLE: 'QR Code illisible',
};

// ========================================
// API: DEMANDER UN REMPLACEMENT DE QR CODE
// ========================================
export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Vous devez être connecté pour effectuer cette action'
      }, { status: 401 });
    }

    // 2. Valider les données
    const body = await request.json();
    const validatedData = qrSwapRequestSchema.parse(body);
    const { vehicleId, reason, description } = validatedData;
    const now = new Date();

    // 3. Récupérer le véhicule avec son QR code
    const vehicles = await db.$queryRaw<any[]>`
      SELECT v.id, v.reference, v.make, v.model, v.licensePlate, 
             v.ownerId, v.ownerName, v.ownerPhone, v.garageId,
             qs.id as qrCodeId, qs.codeUnique, qs.shortCode, qs.status as qrStatus
      FROM Vehicle v
      LEFT JOIN QRCodeStock qs ON qs.linkedVehicleId = v.id
      WHERE v.id = ${vehicleId}
      LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Véhicule non trouvé'
      }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // 4. Vérifier que l'utilisateur est le propriétaire
    if (vehicle.ownerId !== user.id) {
      await logAudit({
        action: 'QR_SWAP_REQUEST_UNAUTHORIZED',
        entityType: 'VEHICLE',
        entityId: vehicleId,
        userId: user.id,
        userEmail: user.email,
        details: JSON.stringify({ reason: 'Utilisateur non propriétaire' })
      });

      return NextResponse.json({
        success: false,
        error: 'Seul le propriétaire peut demander un remplacement de QR code'
      }, { status: 403 });
    }

    // 5. Vérifier qu'un QR code est lié au véhicule
    if (!vehicle.qrCodeId) {
      return NextResponse.json({
        success: false,
        error: 'Aucun QR code n\'est lié à ce véhicule'
      }, { status: 400 });
    }

    // 6. Vérifier qu'il n'y a pas déjà une demande en cours
    const existingRequests = await db.$queryRaw<any[]>`
      SELECT id, status 
      FROM QRSwapRequest 
      WHERE vehicleId = ${vehicleId} AND status IN ('PENDING', 'APPROVED')
      LIMIT 1
    `;

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Une demande de remplacement est déjà en cours pour ce véhicule',
        existingRequest: {
          id: existingRequests[0].id,
          status: existingRequests[0].status
        }
      }, { status: 400 });
    }

    // 7. Créer la demande de remplacement
    const swapRequestId = generateCuid();
    await db.$executeRaw`
      INSERT INTO QRSwapRequest (
        id, vehicleId, oldQrCodeId, requesterId, requesterPhone,
        reason, status, garageId, createdAt
      ) VALUES (
        ${swapRequestId}, ${vehicleId}, ${vehicle.qrCodeId}, ${user.id},
        ${user.garage?.phone || vehicle.ownerPhone || ''}, ${reason},
        'PENDING', ${vehicle.garageId || null}, ${now.toISOString()}
      )
    `;

    // 8. Logger l'action
    await logAudit({
      action: 'QR_SWAP_REQUEST',
      entityType: 'QR_SWAP_REQUEST',
      entityId: swapRequestId,
      userId: user.id,
      userEmail: user.email,
      details: JSON.stringify({
        vehicleId,
        vehicleRef: vehicle.reference,
        oldQrCodeId: vehicle.qrCodeId,
        reason,
        description
      }),
      garageId: vehicle.garageId
    });

    // 9. Réponse
    return NextResponse.json({
      success: true,
      message: 'Demande de remplacement créée avec succès',
      swapRequest: {
        id: swapRequestId,
        vehicle: {
          id: vehicle.id,
          reference: vehicle.reference,
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate
        },
        oldQrCode: {
          id: vehicle.qrCodeId,
          codeUnique: vehicle.codeUnique,
          shortCode: vehicle.shortCode
        },
        reason: REASON_LABELS[reason],
        status: 'PENDING',
        createdAt: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur QR swap request:', error);
    
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
