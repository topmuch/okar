import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateCuid } from '@/lib/qr';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const validateTransferSchema = z.object({
  code: z.string().length(6, "Le code doit contenir exactement 6 chiffres"),
  buyerName: z.string().min(2, "Le nom de l'acheteur est requis"),
  buyerPhone: z.string().min(8, "Numéro de téléphone invalide"),
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
// API: VALIDER UN CODE DE TRANSFERT
// ========================================
export async function POST(request: NextRequest) {
  try {
    // 1. Valider les données
    const body = await request.json();
    const validatedData = validateTransferSchema.parse(body);
    const { code, buyerName, buyerPhone } = validatedData;

    // 2. Récupérer l'utilisateur connecté (optionnel - acheteur peut ne pas avoir de compte)
    const user = await getSession();

    // 3. Vérifier le code de transfert
    const transferCodes = await db.$queryRaw<any[]>`
      SELECT tc.*, v.reference, v.make, v.model, v.licensePlate, v.ownerName as sellerName
      FROM TransferCode tc
      JOIN Vehicle v ON tc.vehicleId = v.id
      WHERE tc.code = ${code}
      LIMIT 1
    `;

    if (!transferCodes || transferCodes.length === 0) {
      await logAudit({
        action: 'TRANSFER_VALIDATE_NOT_FOUND',
        entityType: 'TRANSFER_CODE',
        entityId: code,
        userId: user?.id,
        userEmail: user?.email,
        details: JSON.stringify({ reason: 'Code non trouvé', buyerPhone })
      });

      return NextResponse.json({
        success: false,
        error: 'Code de transfert invalide'
      }, { status: 404 });
    }

    const transferCode = transferCodes[0];

    // 4. Vérifier le statut du code
    if (transferCode.status === 'USED') {
      return NextResponse.json({
        success: false,
        error: 'Ce code de transfert a déjà été utilisé'
      }, { status: 400 });
    }

    if (transferCode.status === 'CANCELLED') {
      return NextResponse.json({
        success: false,
        error: 'Ce code de transfert a été annulé'
      }, { status: 400 });
    }

    // 5. Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(transferCode.expiresAt);
    
    if (now > expiresAt) {
      // Marquer comme expiré
      await db.$executeRaw`
        UPDATE TransferCode SET status = 'EXPIRED' WHERE id = ${transferCode.id}
      `;

      return NextResponse.json({
        success: false,
        error: 'Ce code de transfert a expiré'
      }, { status: 400 });
    }

    // 6. Vérifier que l'acheteur n'est pas le vendeur
    if (user && transferCode.sellerId === user.id) {
      return NextResponse.json({
        success: false,
        error: 'Vous ne pouvez pas valider votre propre transfert'
      }, { status: 400 });
    }

    // 7. Mettre à jour le TransferCode avec les infos de l'acheteur
    await db.$executeRaw`
      UPDATE TransferCode 
      SET buyerId = ${user?.id || null},
          buyerName = ${buyerName},
          buyerPhone = ${buyerPhone}
      WHERE id = ${transferCode.id}
    `;

    // 8. Créer une notification pour le vendeur
    await createNotification({
      userId: transferCode.sellerId,
      vehicleId: transferCode.vehicleId,
      type: 'TRANSFER_PENDING',
      title: 'Demande de transfert en attente',
      message: `${buyerName} (${buyerPhone}) souhaite acquérir votre véhicule ${transferCode.make} ${transferCode.model}. Veuillez confirmer le transfert.`,
      data: JSON.stringify({
        transferCodeId: transferCode.id,
        buyerName,
        buyerPhone
      })
    });

    // 9. Logger l'action
    await logAudit({
      action: 'TRANSFER_VALIDATE',
      entityType: 'TRANSFER_CODE',
      entityId: transferCode.id,
      userId: user?.id,
      userEmail: user?.email,
      details: JSON.stringify({
        code,
        vehicleId: transferCode.vehicleId,
        vehicleRef: transferCode.reference,
        buyerName,
        buyerPhone
      }),
      garageId: user?.garageId
    });

    // 10. Réponse
    return NextResponse.json({
      success: true,
      message: 'Code validé. En attente de confirmation du vendeur.',
      transfer: {
        id: transferCode.id,
        vehicle: {
          reference: transferCode.reference,
          make: transferCode.make,
          model: transferCode.model,
          licensePlate: transferCode.licensePlate
        },
        sellerName: transferCode.sellerName,
        status: 'PENDING_CONFIRMATION',
        buyerName,
        buyerPhone
      }
    });

  } catch (error) {
    console.error('Erreur validate transfer:', error);
    
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
