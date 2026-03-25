import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateCuid } from '@/lib/qr';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const markLostSchema = z.object({
  qrCodeId: z.string().min(1, "L'ID du QR code est requis"),
  reason: z.string().min(5, "La raison doit contenir au moins 5 caractères"),
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

// ========================================
// API: MARQUER UN QR CODE COMME PERDU
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

    // 2. Vérifier que l'utilisateur est un garage ou admin
    if (user.role !== 'garage' && user.role !== 'superadmin' && user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Seul un garage peut marquer un QR code comme perdu'
      }, { status: 403 });
    }

    // 3. Valider les données
    const body = await request.json();
    const validatedData = markLostSchema.parse(body);
    const { qrCodeId, reason } = validatedData;
    const now = new Date();

    // 4. Récupérer le QR code
    const qrCodes = await db.$queryRaw<any[]>`
      SELECT qs.*, v.id as vehicleId, v.reference, v.make, v.model, v.licensePlate,
             g.name as garageName
      FROM QRCodeStock qs
      LEFT JOIN Vehicle v ON qs.linkedVehicleId = v.id
      LEFT JOIN Garage g ON qs.assignedGarageId = g.id
      WHERE qs.id = ${qrCodeId}
      LIMIT 1
    `;

    if (!qrCodes || qrCodes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'QR code non trouvé'
      }, { status: 404 });
    }

    const qrCode = qrCodes[0];

    // 5. Vérifier que le QR code appartient au garage de l'utilisateur (si garage)
    if (user.role === 'garage' && qrCode.assignedGarageId !== user.garageId) {
      await logAudit({
        action: 'QR_MARK_LOST_UNAUTHORIZED',
        entityType: 'QR_CODE',
        entityId: qrCodeId,
        userId: user.id,
        userEmail: user.email,
        details: JSON.stringify({ reason: 'QR code non assigné au garage' })
      });

      return NextResponse.json({
        success: false,
        error: 'Ce QR code n\'est pas assigné à votre garage'
      }, { status: 403 });
    }

    // 6. Vérifier le statut actuel
    if (qrCode.status === 'LOST') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR code est déjà marqué comme perdu'
      }, { status: 400 });
    }

    if (qrCode.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR code a été révoqué'
      }, { status: 400 });
    }

    if (qrCode.status === 'SWAPPED') {
      return NextResponse.json({
        success: false,
        error: 'Ce QR code a déjà été remplacé'
      }, { status: 400 });
    }

    // 7. Marquer le QR code comme perdu
    await db.$executeRaw`
      UPDATE QRCodeStock 
      SET status = 'LOST',
          lostAt = ${now.toISOString()},
          markedLostBy = ${user.id},
          lostReason = ${reason},
          updatedAt = ${now.toISOString()}
      WHERE id = ${qrCodeId}
    `;

    // 8. Si le QR est lié à un véhicule, mettre à jour le statut du véhicule
    if (qrCode.vehicleId) {
      await db.$executeRaw`
        UPDATE Vehicle 
        SET qrStatus = 'INACTIVE',
            declaredLostAt = ${now.toISOString()},
            updatedAt = ${now.toISOString()}
        WHERE id = ${qrCode.vehicleId}
      `;
    }

    // 9. Logger l'action
    await logAudit({
      action: 'QR_MARK_LOST',
      entityType: 'QR_CODE',
      entityId: qrCodeId,
      userId: user.id,
      userEmail: user.email,
      details: JSON.stringify({
        codeUnique: qrCode.codeUnique,
        shortCode: qrCode.shortCode,
        reason,
        vehicleId: qrCode.vehicleId,
        vehicleRef: qrCode.reference
      }),
      garageId: user.garageId
    });

    // 10. Réponse
    return NextResponse.json({
      success: true,
      message: 'QR code marqué comme perdu avec succès',
      qrCode: {
        id: qrCodeId,
        codeUnique: qrCode.codeUnique,
        shortCode: qrCode.shortCode,
        status: 'LOST',
        lostAt: now.toISOString(),
        lostReason: reason,
        vehicle: qrCode.vehicleId ? {
          id: qrCode.vehicleId,
          reference: qrCode.reference,
          make: qrCode.make,
          model: qrCode.model,
          licensePlate: qrCode.licensePlate
        } : null,
        garage: qrCode.garageName ? {
          name: qrCode.garageName
        } : null
      }
    });

  } catch (error) {
    console.error('Erreur mark QR lost:', error);
    
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
