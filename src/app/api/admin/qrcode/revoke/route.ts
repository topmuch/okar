import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateCuid } from '@/lib/qr';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const revokeQrSchema = z.object({
  vehicleId: z.string().min(1, "L'ID du véhicule est requis"),
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
// API: RÉVOQUER UN QR CODE
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

    // 2. Vérifier que l'utilisateur est un superadmin ou admin
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Seul un administrateur peut révoquer un QR code'
      }, { status: 403 });
    }

    // 3. Valider les données
    const body = await request.json();
    const validatedData = revokeQrSchema.parse(body);
    const { vehicleId, reason } = validatedData;
    const now = new Date();

    // 4. Récupérer le véhicule et son QR code
    const vehicles = await db.$queryRaw<any[]>`
      SELECT v.id, v.reference, v.make, v.model, v.licensePlate, v.qrStatus,
             v.ownerId, v.proprietorId, v.garageId,
             qs.id as qrCodeId, qs.codeUnique, qs.shortCode, qs.status as qrStockStatus
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

    // 5. Vérifier que le véhicule a un QR code actif
    if (vehicle.qrStatus !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'Ce véhicule n\'a pas de QR code actif à révoquer'
      }, { status: 400 });
    }

    // 6. Révoquer le QR code dans QRCodeStock
    if (vehicle.qrCodeId) {
      await db.$executeRaw`
        UPDATE QRCodeStock 
        SET status = 'REVOKED',
            revokedAt = ${now.toISOString()},
            revokedBy = ${user.id},
            revokeReason = ${reason},
            updatedAt = ${now.toISOString()}
        WHERE id = ${vehicle.qrCodeId}
      `;
    }

    // 7. Mettre à jour le statut du véhicule
    await db.$executeRaw`
      UPDATE Vehicle 
      SET qrStatus = 'INACTIVE',
          status = 'pending_activation',
          updatedAt = ${now.toISOString()}
      WHERE id = ${vehicleId}
    `;

    // 8. Logger l'action
    await logAudit({
      action: 'QR_CODE_REVOKED',
      entityType: 'VEHICLE',
      entityId: vehicleId,
      userId: user.id,
      userEmail: user.email,
      details: JSON.stringify({
        vehicleReference: vehicle.reference,
        qrCodeId: vehicle.qrCodeId,
        codeUnique: vehicle.codeUnique,
        reason,
        previousQrStatus: vehicle.qrStatus
      }),
      garageId: vehicle.garageId
    });

    // 9. Réponse
    return NextResponse.json({
      success: true,
      message: 'QR code révoqué avec succès',
      vehicle: {
        id: vehicleId,
        reference: vehicle.reference,
        make: vehicle.make,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        qrStatus: 'INACTIVE',
        status: 'pending_activation'
      }
    });

  } catch (error) {
    console.error('Erreur revoke QR:', error);
    
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
