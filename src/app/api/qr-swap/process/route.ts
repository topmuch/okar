import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateCuid } from '@/lib/qr';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const processQrSwapSchema = z.object({
  swapRequestId: z.string().min(1, "L'ID de la demande est requis"),
  newQrCodeId: z.string().optional(),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'L\'action doit être approve ou reject' })
  }),
  adminNotes: z.string().optional(),
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
 * Créer une notification pour l'utilisateur
 */
async function createNotification(params: {
  userId?: string;
  vehicleId?: string;
  type: string;
  title: string;
  message: string;
  data?: string;
}) {
  try {
    await db.$executeRaw`
      INSERT INTO UserNotification (id, userId, vehicleId, type, title, message, data, read, createdAt)
      VALUES (${generateCuid()}, ${params.userId || null}, ${params.vehicleId || null}, 
              ${params.type}, ${params.title}, ${params.message}, ${params.data || null}, 0, ${new Date().toISOString()})
    `;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
  }
}

// ========================================
// API: TRAITER UNE DEMANDE DE REMPLACEMENT QR
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

    // 2. Vérifier que l'utilisateur est un superadmin
    if (user.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Seul un SuperAdmin peut traiter les demandes de remplacement'
      }, { status: 403 });
    }

    // 3. Valider les données
    const body = await request.json();
    const validatedData = processQrSwapSchema.parse(body);
    const { swapRequestId, newQrCodeId, action, adminNotes } = validatedData;
    const now = new Date();

    // 4. Récupérer la demande de remplacement
    const swapRequests = await db.$queryRaw<any[]>`
      SELECT sr.*, v.reference, v.make, v.model, v.licensePlate,
             oldQr.id as oldQrId, oldQr.codeUnique as oldCodeUnique, oldQr.shortCode as oldShortCode
      FROM QRSwapRequest sr
      JOIN Vehicle v ON sr.vehicleId = v.id
      LEFT JOIN QRCodeStock oldQr ON sr.oldQrCodeId = oldQr.id
      WHERE sr.id = ${swapRequestId}
      LIMIT 1
    `;

    if (!swapRequests || swapRequests.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Demande de remplacement non trouvée'
      }, { status: 404 });
    }

    const swapRequest = swapRequests[0];

    // 5. Vérifier le statut de la demande
    if (swapRequest.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: `Cette demande a déjà été traitée (statut: ${swapRequest.status})`
      }, { status: 400 });
    }

    // 6. Traitement selon l'action
    if (action === 'reject') {
      // Rejeter la demande
      await db.$executeRaw`
        UPDATE QRSwapRequest 
        SET status = 'REJECTED',
            processedAt = ${now.toISOString()},
            processedBy = ${user.id},
            adminNotes = ${adminNotes || null}
        WHERE id = ${swapRequestId}
      `;

      // Notifier le demandeur
      await createNotification({
        userId: swapRequest.requesterId,
        vehicleId: swapRequest.vehicleId,
        type: 'QR_SWAP_REJECTED',
        title: 'Demande de remplacement rejetée',
        message: `Votre demande de remplacement de QR code pour le véhicule ${swapRequest.make} ${swapRequest.model} a été rejetée. ${adminNotes ? `Note: ${adminNotes}` : ''}`,
        data: JSON.stringify({
          swapRequestId,
          vehicleId: swapRequest.vehicleId,
          adminNotes
        })
      });

      // Logger l'action
      await logAudit({
        action: 'QR_SWAP_REJECT',
        entityType: 'QR_SWAP_REQUEST',
        entityId: swapRequestId,
        userId: user.id,
        userEmail: user.email,
        details: JSON.stringify({
          vehicleId: swapRequest.vehicleId,
          vehicleRef: swapRequest.reference,
          adminNotes
        }),
        garageId: user.garageId
      });

      return NextResponse.json({
        success: true,
        message: 'Demande rejetée',
        swapRequest: {
          id: swapRequestId,
          status: 'REJECTED',
          processedAt: now.toISOString(),
          adminNotes
        }
      });
    }

    // 7. Approuver la demande
    // Vérifier qu'un nouveau QR code est fourni
    if (!newQrCodeId) {
      return NextResponse.json({
        success: false,
        error: 'Un nouveau QR code est requis pour approuver la demande'
      }, { status: 400 });
    }

    // 8. Vérifier le nouveau QR code
    const newQrCodes = await db.$queryRaw<any[]>`
      SELECT id, codeUnique, shortCode, status, assignedGarageId
      FROM QRCodeStock
      WHERE id = ${newQrCodeId}
      LIMIT 1
    `;

    if (!newQrCodes || newQrCodes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nouveau QR code non trouvé'
      }, { status: 404 });
    }

    const newQrCode = newQrCodes[0];

    // Vérifier que le QR code est disponible (STOCK)
    if (newQrCode.status !== 'STOCK') {
      return NextResponse.json({
        success: false,
        error: `Ce QR code n'est pas disponible (statut: ${newQrCode.status})`
      }, { status: 400 });
    }

    // Vérifier que le QR code n'est pas déjà lié à un véhicule
    if (newQrCode.linkedVehicleId) {
      return NextResponse.json({
        success: false,
        error: 'Ce QR code est déjà lié à un autre véhicule'
      }, { status: 400 });
    }

    // 9. Effectuer le remplacement
    // 9.1. Marquer l'ancien QR comme SWAPPED
    await db.$executeRaw`
      UPDATE QRCodeStock 
      SET status = 'SWAPPED',
          swappedToId = ${newQrCodeId},
          updatedAt = ${now.toISOString()}
      WHERE id = ${swapRequest.oldQrCodeId}
    `;

    // 9.2. Lier le nouveau QR au véhicule
    await db.$executeRaw`
      UPDATE QRCodeStock 
      SET status = 'ACTIVE',
          linkedVehicleId = ${swapRequest.vehicleId},
          activationDate = ${now.toISOString()},
          replacementForId = ${swapRequest.oldQrCodeId},
          updatedAt = ${now.toISOString()}
      WHERE id = ${newQrCodeId}
    `;

    // 9.3. Mettre à jour la demande
    await db.$executeRaw`
      UPDATE QRSwapRequest 
      SET status = 'COMPLETED',
          newQrCodeId = ${newQrCodeId},
          processedAt = ${now.toISOString()},
          processedBy = ${user.id},
          adminNotes = ${adminNotes || null}
      WHERE id = ${swapRequestId}
    `;

    // 10. Notifier le demandeur
    await createNotification({
      userId: swapRequest.requesterId,
      vehicleId: swapRequest.vehicleId,
      type: 'QR_SWAP_APPROVED',
      title: 'QR code remplacé avec succès',
      message: `Le QR code du véhicule ${swapRequest.make} ${swapRequest.model} a été remplacé. Le nouveau QR code est ${newQrCode.shortCode}.`,
      data: JSON.stringify({
        swapRequestId,
        vehicleId: swapRequest.vehicleId,
        newQrCodeId,
        newShortCode: newQrCode.shortCode
      })
    });

    // 11. Logger l'action
    await logAudit({
      action: 'QR_SWAP_APPROVE',
      entityType: 'QR_SWAP_REQUEST',
      entityId: swapRequestId,
      userId: user.id,
      userEmail: user.email,
      details: JSON.stringify({
        vehicleId: swapRequest.vehicleId,
        vehicleRef: swapRequest.reference,
        oldQrCodeId: swapRequest.oldQrCodeId,
        oldCodeUnique: swapRequest.oldCodeUnique,
        newQrCodeId,
        newCodeUnique: newQrCode.codeUnique,
        adminNotes
      }),
      garageId: user.garageId
    });

    // 12. Réponse
    return NextResponse.json({
      success: true,
      message: 'QR code remplacé avec succès',
      swapRequest: {
        id: swapRequestId,
        status: 'COMPLETED',
        vehicle: {
          id: swapRequest.vehicleId,
          reference: swapRequest.reference,
          make: swapRequest.make,
          model: swapRequest.model,
          licensePlate: swapRequest.licensePlate
        },
        oldQrCode: {
          id: swapRequest.oldQrCodeId,
          codeUnique: swapRequest.oldCodeUnique,
          shortCode: swapRequest.oldShortCode,
          status: 'SWAPPED'
        },
        newQrCode: {
          id: newQrCodeId,
          codeUnique: newQrCode.codeUnique,
          shortCode: newQrCode.shortCode,
          status: 'ACTIVE'
        },
        processedAt: now.toISOString(),
        adminNotes
      }
    });

  } catch (error) {
    console.error('Erreur process QR swap:', error);
    
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
