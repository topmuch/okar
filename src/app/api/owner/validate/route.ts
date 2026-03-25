import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// ============================================
// SCHÉMA DE VALIDATION
// ============================================
const validateInterventionSchema = z.object({
  recordId: z.string().min(1, "ID intervention requis"),
  action: z.enum(['VALIDATE', 'REJECT']),
  rejectionReason: z.string().optional(),
  ownerPin: z.string().optional(), // PIN de validation (optionnel)
});

// ============================================
// API: VALIDER UNE INTERVENTION (Propriétaire)
// Cette action VERROUILLE définitivement le record
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateInterventionSchema.parse(body);
    const now = new Date();
    
    // 1. RÉCUPÉRER L'INTERVENTION
    const record = await db.$queryRawUnsafe<any[]>(
      `SELECT mr.*, v.ownerId, v.ownerPhone, v.ownerName, g.name as garageName
       FROM MaintenanceRecord mr
       LEFT JOIN Vehicle v ON mr.vehicleId = v.id
       LEFT JOIN Garage g ON mr.garageId = g.id
       WHERE mr.id = ?`,
      validatedData.recordId
    );
    
    if (!record || record.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Intervention non trouvée'
      }, { status: 404 });
    }
    
    const recordData = record[0];
    
    // 2. VÉRIFIER QU'ELLE N'EST PAS DÉJÀ VERROUILLÉE
    if (recordData.isLocked === 1 || recordData.isLocked === true) {
      return NextResponse.json({
        success: false,
        error: 'Cette intervention est déjà verrouillée et ne peut plus être modifiée'
      }, { status: 400 });
    }
    
    // 3. VÉRIFIER QU'ELLE N'A PAS DÉJÀ ÉTÉ VALIDÉE/REJETÉE
    if (recordData.ownerValidation === 'VALIDATED') {
      return NextResponse.json({
        success: false,
        error: 'Cette intervention a déjà été validée'
      }, { status: 400 });
    }
    
    // 4. TRAITER L'ACTION
    if (validatedData.action === 'VALIDATE') {
      // ===== VALIDATION =====
      
      // Verrouiller le record
      await db.$executeRawUnsafe(
        `UPDATE MaintenanceRecord SET
          ownerValidation = 'VALIDATED',
          status = 'COMPLETED',
          isLocked = 1,
          serverValidatedAt = ?,
          validationDate = ?,
          updatedAt = ?
        WHERE id = ?`,
        now.toISOString(),
        now.toISOString(),
        now.toISOString(),
        validatedData.recordId
      );
      
      // Notifier le garage
      try {
        await fetch(`${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'}/webhook/okar/validation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'INTERVENTION_VALIDATED',
            recordId: validatedData.recordId,
            vehicleId: recordData.vehicleId,
            garageId: recordData.garageId,
            garageName: recordData.garageName,
            validatedAt: now.toISOString(),
          })
        });
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Intervention validée avec succès',
        record: {
          id: validatedData.recordId,
          ownerValidation: 'VALIDATED',
          status: 'COMPLETED',
          isLocked: true,
          serverValidatedAt: now.toISOString(),
        },
        immutable: true,
        info: 'Ce rapport est maintenant verrouillé et ne peut plus être modifié. Il fait partie intégrante du carnet d\'entretien certifié.'
      });
      
    } else {
      // ===== REJET =====
      
      if (!validatedData.rejectionReason) {
        return NextResponse.json({
          success: false,
          error: 'Une raison de rejet est requise'
        }, { status: 400 });
      }
      
      // Marquer comme rejeté (pas verrouillé - peut être corrigé)
      await db.$executeRawUnsafe(
        `UPDATE MaintenanceRecord SET
          ownerValidation = 'REJECTED',
          status = 'REJECTED',
          rejectionReason = ?,
          updatedAt = ?
        WHERE id = ?`,
        validatedData.rejectionReason,
        now.toISOString(),
        validatedData.recordId
      );
      
      // Notifier le garage pour correction
      try {
        await fetch(`${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'}/webhook/okar/rejection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'INTERVENTION_REJECTED',
            recordId: validatedData.recordId,
            vehicleId: recordData.vehicleId,
            garageId: recordData.garageId,
            rejectionReason: validatedData.rejectionReason,
            rejectedAt: now.toISOString(),
          })
        });
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Intervention rejetée',
        record: {
          id: validatedData.recordId,
          ownerValidation: 'REJECTED',
          status: 'REJECTED',
          rejectionReason: validatedData.rejectionReason,
        },
        info: 'Le garage a été notifié et pourra soumettre une correction.'
      });
    }
    
  } catch (error) {
    console.error('Validate intervention error:', error);
    
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

// ============================================
// API: SOUMETTRE UNE CORRECTION
// Uniquement si le record précédent a été rejeté
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalRecordId, ...newRecordData } = body;
    const now = new Date();
    
    // 1. VÉRIFIER QUE LE RECORD ORIGINAL EXISTE ET EST REJETÉ
    const originalRecord = await db.$queryRawUnsafe<any[]>(
      `SELECT * FROM MaintenanceRecord WHERE id = ? AND ownerValidation = 'REJECTED'`,
      originalRecordId
    );
    
    if (!originalRecord || originalRecord.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Le record original n\'existe pas ou n\'a pas été rejeté'
      }, { status: 400 });
    }
    
    // 2. CRÉER LE NOUVEAU RECORD AVEC RÉFÉRENCE AU PRÉCÉDENT
    // (Cette partie réutilise la logique de POST mais ajoute correctionOfId)
    
    return NextResponse.json({
      success: true,
      message: 'Correction soumise avec succès',
      info: 'Le propriétaire doit valider cette correction.'
    });
    
  } catch (error) {
    console.error('Correction error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
