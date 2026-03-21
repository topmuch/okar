import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateCuid } from '@/lib/qr';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const cancelTransferSchema = z.object({
  transferCodeId: z.string().min(1, "L'ID du code de transfert est requis"),
  reason: z.string().optional(),
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
// API: ANNULER UN TRANSFERT
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
    const validatedData = cancelTransferSchema.parse(body);
    const { transferCodeId, reason } = validatedData;
    const now = new Date();

    // 3. Récupérer le code de transfert
    const transferCodes = await db.$queryRaw<any[]>`
      SELECT tc.*, v.reference, v.make, v.model
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
        action: 'TRANSFER_CANCEL_UNAUTHORIZED',
        entityType: 'TRANSFER_CODE',
        entityId: transferCodeId,
        userId: user.id,
        userEmail: user.email,
        details: JSON.stringify({ reason: 'Utilisateur non autorisé' })
      });

      return NextResponse.json({
        success: false,
        error: 'Seul le vendeur peut annuler le transfert'
      }, { status: 403 });
    }

    // 5. Vérifier le statut
    if (transferCode.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: `Ce transfert ne peut pas être annulé (statut: ${transferCode.status})`
      }, { status: 400 });
    }

    // 6. Annuler le transfert
    await db.$executeRaw`
      UPDATE TransferCode 
      SET status = 'CANCELLED',
          cancelledAt = ${now.toISOString()},
          cancelReason = ${reason || null}
      WHERE id = ${transferCodeId}
    `;

    // 7. Notifier l'acheteur si un acheteur avait validé
    if (transferCode.buyerId) {
      await createNotification({
        userId: transferCode.buyerId,
        vehicleId: transferCode.vehicleId,
        type: 'TRANSFER_CANCELLED',
        title: 'Transfert annulé',
        message: `Le transfert du véhicule ${transferCode.make} ${transferCode.model} a été annulé par le vendeur. ${reason ? `Raison: ${reason}` : ''}`,
        data: JSON.stringify({
          transferCodeId,
          vehicleId: transferCode.vehicleId,
          reason
        })
      });
    }

    // 8. Logger l'action
    await logAudit({
      action: 'TRANSFER_CANCEL',
      entityType: 'TRANSFER_CODE',
      entityId: transferCodeId,
      userId: user.id,
      userEmail: user.email,
      details: JSON.stringify({
        vehicleId: transferCode.vehicleId,
        vehicleRef: transferCode.reference,
        reason
      }),
      garageId: user.garageId
    });

    // 9. Réponse
    return NextResponse.json({
      success: true,
      message: 'Transfert annulé avec succès',
      transfer: {
        id: transferCodeId,
        vehicle: {
          reference: transferCode.reference,
          make: transferCode.make,
          model: transferCode.model
        },
        cancelledAt: now.toISOString(),
        reason
      }
    });

  } catch (error) {
    console.error('Erreur cancel transfer:', error);
    
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
