import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateCuid } from '@/lib/qr';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const confirmTransferSchema = z.object({
  transferCodeId: z.string().min(1, "L'ID du code de transfert est requis"),
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
// API: CONFIRMER UN TRANSFERT
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
    const validatedData = confirmTransferSchema.parse(body);
    const { transferCodeId } = validatedData;
    const now = new Date();

    // 3. Récupérer le code de transfert
    const transferCodes = await db.$queryRaw<any[]>`
      SELECT tc.*, v.id as vehicleId, v.reference, v.make, v.model, v.licensePlate, 
             v.ownerId as currentOwnerId, v.ownerName as currentOwnerName, v.ownerPhone as currentOwnerPhone
      FROM TransferCode tc
      JOIN Vehicle v ON tc.vehicleId = v.id
      WHERE tc.id = ${transferCodeId}
      LIMIT 1
    `;

    if (!transferCodes || transferCodes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Code de transfert non trouvé'
      }, { status: 404 });
    }

    const transferCode = transferCodes[0];

    // 4. Vérifier que l'utilisateur est le vendeur
    if (transferCode.sellerId !== user.id) {
      await logAudit({
        action: 'TRANSFER_CONFIRM_UNAUTHORIZED',
        entityType: 'TRANSFER_CODE',
        entityId: transferCodeId,
        userId: user.id,
        userEmail: user.email,
        details: JSON.stringify({ reason: 'Utilisateur non autorisé' })
      });

      return NextResponse.json({
        success: false,
        error: 'Seul le vendeur peut confirmer le transfert'
      }, { status: 403 });
    }

    // 5. Vérifier le statut
    if (transferCode.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: `Ce transfert ne peut pas être confirmé (statut: ${transferCode.status})`
      }, { status: 400 });
    }

    // 6. Vérifier qu'un acheteur a validé le code
    if (!transferCode.buyerName || !transferCode.buyerPhone) {
      return NextResponse.json({
        success: false,
        error: 'Aucun acheteur n\'a encore validé ce code de transfert'
      }, { status: 400 });
    }

    // 7. Effectuer le transfert dans une transaction
    const previousOwnerId = transferCode.currentOwnerId;
    const previousOwnerName = transferCode.currentOwnerName;
    const newOwnerId = transferCode.buyerId;
    const newOwnerName = transferCode.buyerName;
    const newOwnerPhone = transferCode.buyerPhone;

    // 7.1. Mettre à jour le véhicule avec le nouveau propriétaire
    await db.$executeRaw`
      UPDATE Vehicle 
      SET ownerId = ${newOwnerId || null},
          ownerName = ${newOwnerName},
          ownerPhone = ${newOwnerPhone},
          updatedAt = ${now.toISOString()}
      WHERE id = ${transferCode.vehicleId}
    `;

    // 7.2. Créer l'enregistrement OwnershipHistory
    const historyId = generateCuid();
    await db.$executeRaw`
      INSERT INTO OwnershipHistory (
        id, vehicleId, previousOwnerId, previousOwnerName, 
        newOwnerId, newOwnerName, newOwnerPhone, 
        transferType, transferDate, createdAt
      ) VALUES (
        ${historyId}, ${transferCode.vehicleId}, ${previousOwnerId}, ${previousOwnerName},
        ${newOwnerId || null}, ${newOwnerName}, ${newOwnerPhone},
        'sale', ${now.toISOString()}, ${now.toISOString()}
      )
    `;

    // 7.3. Marquer le code de transfert comme utilisé
    await db.$executeRaw`
      UPDATE TransferCode 
      SET status = 'USED',
          usedAt = ${now.toISOString()},
          confirmedBy = ${user.id},
          confirmedAt = ${now.toISOString()}
      WHERE id = ${transferCodeId}
    `;

    // 8. Créer les notifications
    // Notification pour l'acheteur
    if (newOwnerId) {
      await createNotification({
        userId: newOwnerId,
        vehicleId: transferCode.vehicleId,
        type: 'TRANSFER_CONFIRMED',
        title: 'Transfert confirmé',
        message: `Le transfert du véhicule ${transferCode.make} ${transferCode.model} a été confirmé. Vous êtes maintenant le propriétaire.`,
        data: JSON.stringify({
          transferCodeId,
          vehicleId: transferCode.vehicleId
        })
      });
    }

    // Notification pour le vendeur (confirmation)
    await createNotification({
      userId: user.id,
      vehicleId: transferCode.vehicleId,
      type: 'TRANSFER_COMPLETED',
      title: 'Transfert terminé',
      message: `Le transfert du véhicule ${transferCode.make} ${transferCode.model} à ${newOwnerName} a été effectué avec succès.`,
      data: JSON.stringify({
        transferCodeId,
        vehicleId: transferCode.vehicleId
      })
    });

    // 9. Logger l'action
    await logAudit({
      action: 'TRANSFER_CONFIRM',
      entityType: 'VEHICLE',
      entityId: transferCode.vehicleId,
      userId: user.id,
      userEmail: user.email,
      details: JSON.stringify({
        transferCodeId,
        vehicleRef: transferCode.reference,
        previousOwnerId,
        newOwnerId,
        newOwnerName,
        newOwnerPhone
      }),
      garageId: user.garageId
    });

    // 10. Réponse
    return NextResponse.json({
      success: true,
      message: 'Transfert effectué avec succès',
      transfer: {
        id: transferCodeId,
        vehicle: {
          id: transferCode.vehicleId,
          reference: transferCode.reference,
          make: transferCode.make,
          model: transferCode.model,
          licensePlate: transferCode.licensePlate
        },
        previousOwner: {
          id: previousOwnerId,
          name: previousOwnerName
        },
        newOwner: {
          id: newOwnerId,
          name: newOwnerName,
          phone: newOwnerPhone
        },
        transferDate: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur confirm transfer:', error);
    
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
