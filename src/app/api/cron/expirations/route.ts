import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// API: CHECK EXPIRATIONS (Cron Job Quotidien)
// Scanne VT, Assurance et Maintenance Due
// ============================================

interface VehicleExpiration {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  licensePlate: string | null;
  ownerPhone: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  vtEndDate: string | null;
  insuranceEndDate: string | null;
  nextMaintenanceDueKm: number | null;
  nextMaintenanceDueDate: string | null;
  currentMileage: number;
}

interface AlertToSend {
  vehicleId: string;
  type: 'VT' | 'ASSURANCE' | 'MAINTENANCE';
  channel: 'WHATSAPP' | 'EMAIL';
  recipient: string;
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  expiresAt: string | null;
  kmDueAt: number | null;
}

function toNumber(value: any): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function generateWhatsAppMessage(
  vehicleInfo: { make: string | null; model: string | null; licensePlate: string | null },
  alertType: 'VT' | 'ASSURANCE' | 'MAINTENANCE',
  daysLeft: number | null,
  kmLeft: number | null
): string {
  const vehicle = `${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim() || 'votre véhicule';
  const plate = vehicleInfo.licensePlate || '';
  
  switch (alertType) {
    case 'VT':
      if (daysLeft && daysLeft <= 0) {
        return `🚨 *OKAR - ALERTE URGENTE*\n\nVotre Visite Technique pour ${vehicle} (${plate}) est *EXPIRÉE*.\n\nRendez-vous immédiatement dans un centre agréé pour éviter les sanctions.\n\n📍 Centres partenaires: okar.sn/centres\n\n_OKAR - Passeport Automobile du Sénégal_`;
      }
      return `⚠️ *OKAR - RAPPEL VISITE TECHNIQUE*\n\nBonjour,\n\nVotre Visite Technique pour ${vehicle} (${plate}) expire dans *${daysLeft} jours*.\n\n📅 Date d'expiration: J-${daysLeft}\n\nPrenez rendez-vous dès maintenant dans un centre agréé.\n\n_OKAR - Passeport Automobile du Sénégal_`;
    
    case 'ASSURANCE':
      if (daysLeft && daysLeft <= 0) {
        return `🚨 *OKAR - ALERTE URGENTE*\n\nVotre Assurance pour ${vehicle} (${plate}) est *EXPIRÉE*.\n\n🔴 Vous roulez sans couverture légale!\n\nRenouvelez immédiatement votre assurance.\n\n_OKAR - Passeport Automobile du Sénégal_`;
      }
      return `⚠️ *OKAR - RAPPEL ASSURANCE*\n\nBonjour,\n\nVotre assurance pour ${vehicle} (${plate}) expire dans *${daysLeft} jours*.\n\nRenouvelez votre contrat pour rester en règle.\n\n_OKAR - Passeport Automobile du Sénégal_`;
    
    case 'MAINTENANCE':
      if (kmLeft && kmLeft <= 0) {
        return `🔧 *OKAR - VIDANGE DÉPASSÉE*\n\nBonjour,\n\nLe kilométrage de vidange pour ${vehicle} (${plate}) est *DÉPASSÉ*.\n\nPensez à prendre rendez-vous chez un garage certifié OKAR.\n\n🔧 Garages certifiés: okar.sn/garages\n\n_OKAR - Passeport Automobile du Sénégal_`;
      }
      return `🔧 *OKAR - RAPPEL ENTRETIEN*\n\nBonjour,\n\nProchaine vidange pour ${vehicle} (${plate}) prévue à *${kmLeft} km*.\n\nAnticipez votre rendez-vous chez un garage certifié.\n\n_OKAR - Passeport Automobile du Sénégal_`;
    
    default:
      return `*OKAR - Rappel*\n\nConsultez votre passeport automobile: okar.sn`;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const alerts: AlertToSend[] = [];
  const sentReminders: any[] = [];
  const errors: any[] = [];
  
  try {
    // 1. RÉCUPÉRER TOUS LES VÉHICULES AVEC LEURS DATES
    const vehicles = await db.$queryRawUnsafe<VehicleExpiration[]>(`
      SELECT 
        v.id, v.reference, v.make, v.model, v.licensePlate,
        v.currentMileage, v.nextMaintenanceDueKm, v.nextMaintenanceDueDate,
        v.vtEndDate, v.insuranceEndDate,
        u.phone as ownerPhone, u.name as ownerName, u.email as ownerEmail
      FROM Vehicle v
      LEFT JOIN User u ON v.ownerId = u.id
      WHERE v.status = 'active'
    `);
    
    const today = new Date();
    
    // 2. VÉRIFIER CHAQUE VÉHICULE
    for (const vehicle of vehicles) {
      
      // ===== VISITE TECHNIQUE =====
      if (vehicle.vtEndDate) {
        const daysLeft = daysUntil(vehicle.vtEndDate);
        
        // Alertes: J-30, J-14, J-7, J-0, J+1 (expiré)
        const alertDays = [30, 14, 7, 0, -1];
        
        if (alertDays.includes(daysLeft)) {
          const message = generateWhatsAppMessage(vehicle, 'VT', daysLeft, null);
          
          if (vehicle.ownerPhone) {
            alerts.push({
              vehicleId: vehicle.id,
              type: 'VT',
              channel: 'WHATSAPP',
              recipient: vehicle.ownerPhone,
              message,
              priority: daysLeft <= 0 ? 'HIGH' : daysLeft <= 7 ? 'MEDIUM' : 'LOW',
              expiresAt: vehicle.vtEndDate,
              kmDueAt: null,
            });
          }
          
          if (vehicle.ownerEmail) {
            alerts.push({
              vehicleId: vehicle.id,
              type: 'VT',
              channel: 'EMAIL',
              recipient: vehicle.ownerEmail,
              message,
              priority: daysLeft <= 0 ? 'HIGH' : daysLeft <= 7 ? 'MEDIUM' : 'LOW',
              expiresAt: vehicle.vtEndDate,
              kmDueAt: null,
            });
          }
        }
      }
      
      // ===== ASSURANCE =====
      if (vehicle.insuranceEndDate) {
        const daysLeft = daysUntil(vehicle.insuranceEndDate);
        
        const alertDays = [30, 14, 7, 0, -1];
        
        if (alertDays.includes(daysLeft)) {
          const message = generateWhatsAppMessage(vehicle, 'ASSURANCE', daysLeft, null);
          
          if (vehicle.ownerPhone) {
            alerts.push({
              vehicleId: vehicle.id,
              type: 'ASSURANCE',
              channel: 'WHATSAPP',
              recipient: vehicle.ownerPhone,
              message,
              priority: daysLeft <= 0 ? 'HIGH' : daysLeft <= 7 ? 'MEDIUM' : 'LOW',
              expiresAt: vehicle.insuranceEndDate,
              kmDueAt: null,
            });
          }
          
          if (vehicle.ownerEmail) {
            alerts.push({
              vehicleId: vehicle.id,
              type: 'ASSURANCE',
              channel: 'EMAIL',
              recipient: vehicle.ownerEmail,
              message,
              priority: daysLeft <= 0 ? 'HIGH' : daysLeft <= 7 ? 'MEDIUM' : 'LOW',
              expiresAt: vehicle.insuranceEndDate,
              kmDueAt: null,
            });
          }
        }
      }
      
      // ===== MAINTENANCE (Kilométrage) =====
      if (vehicle.nextMaintenanceDueKm && vehicle.currentMileage) {
        const kmLeft = toNumber(vehicle.nextMaintenanceDueKm) - toNumber(vehicle.currentMileage);
        
        // Alertes: -500km, 0km, +500km (dépassé)
        const kmThresholds = [500, 0, -500];
        
        for (const threshold of kmThresholds) {
          if (kmLeft === threshold || (threshold < 0 && kmLeft < threshold)) {
            const message = generateWhatsAppMessage(vehicle, 'MAINTENANCE', null, kmLeft);
            
            if (vehicle.ownerPhone) {
              alerts.push({
                vehicleId: vehicle.id,
                type: 'MAINTENANCE',
                channel: 'WHATSAPP',
                recipient: vehicle.ownerPhone,
                message,
                priority: kmLeft <= 0 ? 'HIGH' : 'LOW',
                expiresAt: null,
                kmDueAt: toNumber(vehicle.nextMaintenanceDueKm),
              });
            }
            break;
          }
        }
      }
    }
    
    // 3. ENVOYER LES ALERTES (via webhook n8n)
    for (const alert of alerts) {
      try {
        // Vérifier si un rappel a déjà été envoyé aujourd'hui
        const existingReminder = await db.$queryRawUnsafe<any[]>(`
          SELECT id FROM ReminderLog 
          WHERE vehicleId = ? AND type = ? AND channel = ? 
          AND date(sentAt) = date('now')
          LIMIT 1
        `, alert.vehicleId, alert.type, alert.channel);
        
        if (existingReminder && existingReminder.length > 0) {
          continue; // Déjà envoyé aujourd'hui
        }
        
        // Envoyer via webhook
        const webhookResponse = await fetch(
          `${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'}/webhook/okar/reminders`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel: alert.channel,
              recipient: alert.recipient,
              message: alert.message,
              vehicleId: alert.vehicleId,
              type: alert.type,
              priority: alert.priority,
            })
          }
        );
        
        // Logger le rappel
        const logId = `rl-${Date.now().toString(36)}`;
        await db.$executeRawUnsafe(`
          INSERT INTO ReminderLog (id, vehicleId, type, channel, recipient, message, status, sentAt, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, 'SENT', datetime('now'), datetime('now'))
        `, logId, alert.vehicleId, alert.type, alert.channel, alert.recipient, alert.message);
        
        sentReminders.push({
          vehicleId: alert.vehicleId,
          type: alert.type,
          channel: alert.channel,
          recipient: alert.recipient,
          status: 'SENT',
        });
        
      } catch (sendError: any) {
        errors.push({
          vehicleId: alert.vehicleId,
          type: alert.type,
          channel: alert.channel,
          error: sendError.message,
        });
        
        // Logger l'échec
        const logId = `rl-${Date.now().toString(36)}`;
        await db.$executeRawUnsafe(`
          INSERT INTO ReminderLog (id, vehicleId, type, channel, recipient, message, status, errorDetails, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, 'FAILED', ?, datetime('now'))
        `, logId, alert.vehicleId, alert.type, alert.channel, alert.recipient, alert.message, sendError.message);
      }
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      executedAt: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        vehiclesScanned: vehicles.length,
        alertsGenerated: alerts.length,
        remindersSent: sentReminders.length,
        errors: errors.length,
      },
      sentReminders,
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error) {
    console.error('Check expirations error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification des expirations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ============================================
// API: RE-ENVOYER UN RAPPEL MANUEL
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleId, type, channel } = body;
    
    // Récupérer le véhicule
    const vehicle = await db.$queryRawUnsafe<VehicleExpiration[]>(`
      SELECT v.*, u.phone as ownerPhone, u.name as ownerName, u.email as ownerEmail
      FROM Vehicle v
      LEFT JOIN User u ON v.ownerId = u.id
      WHERE v.id = ?
    `, vehicleId);
    
    if (!vehicle || vehicle.length === 0) {
      return NextResponse.json({ success: false, error: 'Véhicule non trouvé' }, { status: 404 });
    }
    
    const v = vehicle[0];
    let message = '';
    
    if (type === 'VT') {
      const daysLeft = v.vtEndDate ? daysUntil(v.vtEndDate) : null;
      message = generateWhatsAppMessage(v, 'VT', daysLeft, null);
    } else if (type === 'ASSURANCE') {
      const daysLeft = v.insuranceEndDate ? daysUntil(v.insuranceEndDate) : null;
      message = generateWhatsAppMessage(v, 'ASSURANCE', daysLeft, null);
    } else {
      const kmLeft = v.nextMaintenanceDueKm && v.currentMileage 
        ? toNumber(v.nextMaintenanceDueKm) - toNumber(v.currentMileage) 
        : null;
      message = generateWhatsAppMessage(v, 'MAINTENANCE', null, kmLeft);
    }
    
    const recipient = channel === 'EMAIL' ? v.ownerEmail : v.ownerPhone;
    
    if (!recipient) {
      return NextResponse.json({ success: false, error: 'Aucun destinataire trouvé' }, { status: 400 });
    }
    
    // Envoyer
    await fetch(`${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'}/webhook/okar/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, recipient, message, vehicleId, type })
    });
    
    // Logger
    const logId = `rl-${Date.now().toString(36)}`;
    await db.$executeRawUnsafe(`
      INSERT INTO ReminderLog (id, vehicleId, type, channel, recipient, message, status, sentAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 'SENT', datetime('now'), datetime('now'))
    `, logId, vehicleId, type, channel, recipient, message);
    
    return NextResponse.json({ success: true, message: 'Rappel envoyé', recipient });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
