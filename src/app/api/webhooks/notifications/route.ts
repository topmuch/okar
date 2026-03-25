import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// API: WEBHOOKS NOTIFICATIONS
// Point d'entrée pour n8n et autres intégrations
// ============================================

interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp?: string;
  signature?: string;
}

// Validate webhook signature (security)
function validateSignature(payload: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET || 'okar-webhook-secret';
  // In production: use crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return signature === `sha256=${secret}`;
}

// ============================================
// INCOMING WEBHOOKS (from n8n, WhatsApp, etc.)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json();
    const { event, data } = body;
    
    console.log(`[Webhook] Received event: ${event}`);
    
    switch (event) {
      
      // ===== WHATSAPP MESSAGE STATUS =====
      case 'WHATSAPP_DELIVERED':
      case 'WHATSAPP_READ':
      case 'WHATSAPP_FAILED':
        await handleWhatsAppStatus(data);
        break;
        
      // ===== EMAIL STATUS =====
      case 'EMAIL_SENT':
      case 'EMAIL_DELIVERED':
      case 'EMAIL_BOUNCED':
      case 'EMAIL_OPENED':
        await handleEmailStatus(data);
        break;
        
      // ===== INTERVENTION SUBMITTED (from Garage) =====
      case 'INTERVENTION_SUBMITTED':
        await handleInterventionSubmitted(data);
        break;
        
      // ===== INTERVENTION VALIDATED (from Owner) =====
      case 'INTERVENTION_VALIDATED':
        await handleInterventionValidated(data);
        break;
        
      // ===== VEHICLE SCANNED =====
      case 'VEHICLE_SCANNED':
        await handleVehicleScanned(data);
        break;
        
      default:
        console.log(`[Webhook] Unknown event: ${event}`);
    }
    
    return NextResponse.json({ success: true, event, processed: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur traitement webhook'
    }, { status: 500 });
  }
}

// ============================================
// HANDLERS
// ============================================

async function handleWhatsAppStatus(data: any) {
  const { reminderLogId, status, messageId, error } = data;
  
  if (reminderLogId) {
    await db.$executeRawUnsafe(`
      UPDATE ReminderLog 
      SET status = ?, webhookResponse = ?, sentAt = CASE WHEN ? = 'SENT' THEN datetime('now') ELSE sentAt END
      WHERE id = ?
    `, status, JSON.stringify({ messageId, error }), status, reminderLogId);
  }
}

async function handleEmailStatus(data: any) {
  const { reminderLogId, status, messageId, error } = data;
  
  if (reminderLogId) {
    await db.$executeRawUnsafe(`
      UPDATE ReminderLog 
      SET status = ?, webhookResponse = ?, sentAt = CASE WHEN ? = 'SENT' THEN datetime('now') ELSE sentAt END
      WHERE id = ?
    `, status, JSON.stringify({ messageId, error }), status, reminderLogId);
  }
}

async function handleInterventionSubmitted(data: any) {
  const { recordId, vehicleId, garageId, ownerPhone } = data;
  
  // Create notification for owner
  const notificationId = `notif-${Date.now().toString(36)}`;
  await db.$executeRawUnsafe(`
    INSERT INTO UserNotification (id, vehicleId, type, title, message, createdAt)
    VALUES (?, ?, 'INTERVENTION', 'Nouvelle intervention', 'Un garage a enregistré une intervention sur votre véhicule. Veuillez la valider.', datetime('now'))
  `, notificationId, vehicleId);
  
  console.log(`[Webhook] Intervention ${recordId} submitted, owner notified`);
}

async function handleInterventionValidated(data: any) {
  const { recordId, vehicleId, garageId } = data;
  
  // Create notification for garage
  const notificationId = `notif-${Date.now().toString(36)}`;
  await db.$executeRawUnsafe(`
    INSERT INTO UserNotification (id, type, title, message, createdAt)
    VALUES (?, 'VALIDATION', 'Intervention validée', 'Le propriétaire a validé l'intervention.', datetime('now'))
  `, notificationId);
  
  console.log(`[Webhook] Intervention ${recordId} validated`);
}

async function handleVehicleScanned(data: any) {
  const { vehicleId, scanLocation, scannedBy } = data;
  
  // Update last scan info
  await db.$executeRawUnsafe(`
    UPDATE Vehicle 
    SET lastScanDate = datetime('now'), lastLocation = ?, updatedAt = datetime('now')
    WHERE id = ?
  `, scanLocation || null, vehicleId);
  
  console.log(`[Webhook] Vehicle ${vehicleId} scanned`);
}

// ============================================
// GET: WEBHOOK INFO
// ============================================
export async function GET() {
  return NextResponse.json({
    service: 'OKAR Webhook Handler',
    version: '1.0.0',
    endpoints: {
      'POST /api/webhooks/notifications': 'Receive webhook events',
    },
    supportedEvents: [
      'WHATSAPP_DELIVERED',
      'WHATSAPP_READ',
      'WHATSAPP_FAILED',
      'EMAIL_SENT',
      'EMAIL_DELIVERED',
      'EMAIL_BOUNCED',
      'EMAIL_OPENED',
      'INTERVENTION_SUBMITTED',
      'INTERVENTION_VALIDATED',
      'VEHICLE_SCANNED',
    ]
  });
}
