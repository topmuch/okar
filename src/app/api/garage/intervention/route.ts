import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// ============================================
// SCHÉMA DE VALIDATION
// ============================================
const submitInterventionSchema = z.object({
  // Vehicle
  vehicleId: z.string().min(1, "ID véhicule requis"),
  shortCode: z.string().optional(), // Alternative: scan QR
  
  // Intervention details
  category: z.enum([
    'vidange', 'freins', 'pneus', 'moteur', 'electricite', 
    'carrosserie', 'suspension', 'climatisation', 'batterie', 
    'transmission', 'echappement', 'diagnostic', 'activation', 'autre'
  ]),
  subCategory: z.string().optional(),
  description: z.string().min(10, "Description minimale de 10 caractères"),
  
  // Mileage - CRITICAL FOR TRACKING
  mileage: z.number().int().min(0, "Kilométrage invalide"),
  
  // Parts (JSON string)
  partsList: z.string().optional(), // JSON array [{name, partNumber, brand, quantity}]
  
  // Costs - STORED BUT NOT EXPOSED PUBLICLY
  partsCost: z.number().min(0).optional().default(0),
  laborCost: z.number().min(0).optional().default(0),
  totalCost: z.number().min(0).optional().default(0),
  
  // Proofs
  invoicePhoto: z.string().optional(), // URL
  invoiceNumber: z.string().optional(),
  workPhotos: z.string().optional(), // JSON array of URLs
  
  // Mechanic info
  mechanicName: z.string().optional(),
  mechanicSignature: z.string().optional(), // Base64 signature
  mechanicPhone: z.string().optional(),
  
  // Date
  interventionDate: z.string().optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateRecordId(): string {
  return `mr-${randomBytes(8).toString('hex')}`;
}

function calculateNextMaintenance(
  category: string, 
  currentMileage: number, 
  interventionDate: Date
): { nextKm: number | null; nextDate: Date | null; nextType: string | null } {
  const maintenanceSchedules: Record<string, { kmInterval: number; monthInterval: number }> = {
    vidange: { kmInterval: 5000, monthInterval: 6 },
    freins: { kmInterval: 30000, monthInterval: 24 },
    pneus: { kmInterval: 40000, monthInterval: 36 },
    batterie: { kmInterval: 0, monthInterval: 36 },
    climatisation: { kmInterval: 0, monthInterval: 12 },
    courroie: { kmInterval: 60000, monthInterval: 48 },
    transmission: { kmInterval: 60000, monthInterval: 36 },
  };
  
  const schedule = maintenanceSchedules[category];
  if (!schedule) {
    return { nextKm: null, nextDate: null, nextType: null };
  }
  
  const nextKm = schedule.kmInterval > 0 ? currentMileage + schedule.kmInterval : null;
  const nextDate = schedule.monthInterval > 0 
    ? new Date(interventionDate.getTime() + schedule.monthInterval * 30 * 24 * 60 * 60 * 1000)
    : null;
  
  return { nextKm, nextDate, nextType: category };
}

// ============================================
// API: SUBMIT INTERVENTION (Garage Certifié)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = submitInterventionSchema.parse(body);
    const now = new Date();
    
    // 1. RÉCUPÉRER LE GARAGE (simulation - en production: depuis session/token)
    // TODO: Implémenter l'authentification garage
    const garageResult = await db.$queryRawUnsafe<any[]>(
      `SELECT id, name, isCertified, active FROM Garage WHERE isCertified = 1 AND active = 1 LIMIT 1`
    );
    
    if (!garageResult || garageResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucun garage certifié trouvé. Veuillez vous connecter.'
      }, { status: 403 });
    }
    
    const garage = garageResult[0];
    
    // 2. TROUVER LE VÉHICULE
    let vehicleId = validatedData.vehicleId;
    
    // Alternative: trouver par shortCode
    if (validatedData.shortCode && !vehicleId) {
      const qrResult = await db.$queryRawUnsafe<any[]>(
        `SELECT qs.linkedVehicleId, v.id as vehicleId, v.currentMileage
         FROM QRCodeStock qs
         LEFT JOIN Vehicle v ON qs.linkedVehicleId = v.id
         WHERE qs.shortCode = ? AND qs.status = 'ACTIVE'`,
        validatedData.shortCode
      );
      
      if (!qrResult || qrResult.length === 0 || !qrResult[0].vehicleId) {
        return NextResponse.json({
          success: false,
          error: 'QR Code non valide ou véhicule non activé'
        }, { status: 404 });
      }
      
      vehicleId = qrResult[0].vehicleId;
    }
    
    // Récupérer le véhicule
    const vehicle = await db.$queryRawUnsafe<any[]>(
      `SELECT id, currentMileage, ownerId, ownerPhone, ownerName FROM Vehicle WHERE id = ?`,
      vehicleId
    );
    
    if (!vehicle || vehicle.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Véhicule non trouvé'
      }, { status: 404 });
    }
    
    const vehicleData = vehicle[0];
    
    // 3. VÉRIFIER COHÉRENCE KILOMÉTRAGE (ANOMALIE DETECTION)
    const currentMileage = vehicleData.currentMileage || 0;
    const newMileage = validatedData.mileage;
    
    if (newMileage < currentMileage) {
      // Anomalie détectée - on accepte mais on signale
      return NextResponse.json({
        success: false,
        error: 'ANOMALIE_KM',
        message: `Anomalie détectée: Le kilométrage saisi (${newMileage} km) est inférieur au dernier relevé (${currentMileage} km). Veuillez confirmer ou corriger.`,
        currentMileage,
        proposedMileage: newMileage,
        requiresConfirmation: true
      }, { status: 400 });
    }
    
    // 4. CRÉER L'INTERVENTION
    const recordId = generateRecordId();
    const interventionDate = validatedData.interventionDate 
      ? new Date(validatedData.interventionDate) 
      : now;
    
    await db.$executeRawUnsafe(
      `INSERT INTO MaintenanceRecord (
        id, vehicleId, garageId, category, subCategory, description,
        mileage, partsList, partsCost, laborCost, totalCost,
        invoicePhoto, invoiceNumber, workPhotos,
        mechanicName, mechanicSignature, mechanicPhone,
        status, ownerValidation, interventionDate,
        serverCreatedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', ?, ?, ?, ?)`,
      recordId,
      vehicleId,
      garage.id,
      validatedData.category,
      validatedData.subCategory || null,
      validatedData.description,
      newMileage,
      validatedData.partsList || null,
      validatedData.partsCost || 0,
      validatedData.laborCost || 0,
      validatedData.totalCost || 0,
      validatedData.invoicePhoto || null,
      validatedData.invoiceNumber || null,
      validatedData.workPhotos || null,
      validatedData.mechanicName || null,
      validatedData.mechanicSignature || null,
      validatedData.mechanicPhone || null,
      interventionDate.toISOString(),
      now.toISOString(),
      now.toISOString(),
      now.toISOString()
    );
    
    // 5. METTRE À JOUR LE KILOMÉTRAGE DU VÉHICULE
    if (newMileage > currentMileage) {
      await db.$executeRawUnsafe(
        `UPDATE Vehicle SET currentMileage = ?, mileageUpdatedAt = ?, updatedAt = ? WHERE id = ?`,
        newMileage,
        now.toISOString(),
        now.toISOString(),
        vehicleId
      );
    }
    
    // 6. CALCULER PROCHAINE ÉCHÉANCE
    const { nextKm, nextDate, nextType } = calculateNextMaintenance(
      validatedData.category,
      newMileage,
      interventionDate
    );
    
    if (nextKm || nextDate) {
      await db.$executeRawUnsafe(
        `UPDATE Vehicle SET 
          nextMaintenanceDueKm = ?, 
          nextMaintenanceDueDate = ?,
          nextMaintenanceType = ?,
          lastMaintenanceKm = ?,
          lastMaintenanceDate = ?,
          lastMaintenanceType = ?,
          updatedAt = ?
        WHERE id = ?`,
        nextKm,
        nextDate ? nextDate.toISOString() : null,
        nextType,
        newMileage,
        interventionDate.toISOString(),
        validatedData.category,
        now.toISOString(),
        vehicleId
      );
    }
    
    // 7. DÉCLENCHER WEBHOOK NOTIFICATION (n8n)
    // En production: appeler le webhook n8n pour notifier le propriétaire
    try {
      await fetch(`${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'}/webhook/okar/intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'INTERVENTION_SUBMITTED',
          recordId,
          vehicleId,
          garageId: garage.id,
          garageName: garage.name,
          ownerId: vehicleData.ownerId,
          ownerPhone: vehicleData.ownerPhone,
          ownerName: vehicleData.ownerName,
          category: validatedData.category,
          mileage: newMileage,
          interventionDate: interventionDate.toISOString(),
        })
      });
    } catch (webhookError) {
      console.error('Webhook notification failed:', webhookError);
      // Don't fail the request if webhook fails
    }
    
    // 8. RÉPONSE
    return NextResponse.json({
      success: true,
      message: 'Intervention enregistrée avec succès',
      record: {
        id: recordId,
        category: validatedData.category,
        mileage: newMileage,
        status: 'PENDING',
        ownerValidation: 'PENDING',
        interventionDate: interventionDate.toISOString(),
        serverCreatedAt: now.toISOString(),
      },
      vehicle: {
        id: vehicleId,
        currentMileage: newMileage,
        nextMaintenance: {
          dueKm: nextKm,
          dueDate: nextDate?.toISOString(),
          type: nextType,
        }
      },
      notification: {
        sent: true,
        channel: 'WHATSAPP',
        recipient: vehicleData.ownerPhone
      }
    });
    
  } catch (error) {
    console.error('Submit intervention error:', error);
    
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
