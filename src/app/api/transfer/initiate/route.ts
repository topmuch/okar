import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateCuid } from '@/lib/qr';
import { randomBytes } from 'crypto';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const initiateTransferSchema = z.object({
  vehicleId: z.string().min(1, "L'ID du véhicule est requis"),
  buyerPhone: z.string().optional(), // Optionnel: téléphone de l'acheteur pour notifier
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Génère un code de transfert à 6 chiffres sécurisé
 */
function generateTransferCode(): string {
  const chars = '0123456789';
  let code = '';
  const randomBytesBuffer = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomBytesBuffer[i] % chars.length);
  }
  return code;
}

/**
 * Génère un code unique (vérifie qu'il n'existe pas déjà)
 */
async function generateUniqueTransferCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const code = generateTransferCode();
    
    // Vérifier si le code existe déjà
    const existing = await db.$queryRaw<any[]>`
      SELECT id FROM TransferCode WHERE code = ${code} LIMIT 1
    `;
    
    if (!existing || existing.length === 0) {
      return code;
    }
    
    attempts++;
  }
  
  // Fallback avec timestamp si on n'arrive pas à générer un code unique
  const timestamp = Date.now().toString().slice(-6);
  return timestamp;
}

/**
 * Nettoie un numéro de téléphone (format Sénégal)
 */
function cleanPhoneNumber(phone: string): string {
  // Supprimer tous les caractères non numériques
  let cleaned = phone.replace(/\D/g, '');
  
  // Si ça commence par 221, c'est déjà au format international
  if (cleaned.startsWith('221')) {
    return cleaned;
  }
  
  // Si ça commence par 77, 78, 76, 70 (numéros sénégalais), ajouter 221
  if (cleaned.length === 9 && ['77', '78', '76', '70'].includes(cleaned.substring(0, 2))) {
    return '221' + cleaned;
  }
  
  return cleaned;
}

/**
 * Envoie un SMS via l'API configurée (Twilio ou Orange)
 */
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const cleanedPhone = cleanPhoneNumber(phone);
  
  // Mode développement: logger seulement
  if (process.env.NODE_ENV !== 'production' || !process.env.SMS_ENABLED) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 SMS (Mode Dev)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: +${cleanedPhone}`);
    console.log(`Message: ${message}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true };
  }

  // Twilio SMS
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = await import('twilio').then(m => m.default);
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+${cleanedPhone}`,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Twilio SMS Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Orange SMS API
  if (process.env.ORANGE_SMS_API_KEY) {
    try {
      const sender = process.env.ORANGE_SMS_SENDER || 'OKAR';
      const response = await fetch(
        `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B221${sender}/requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.ORANGE_SMS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            outboundSMSMessageRequest: {
              address: `tel:+${cleanedPhone}`,
              senderAddress: `tel:+221${sender}`,
              outboundSMSTextMessage: {
                message: message.substring(0, 160),
              },
            },
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Orange API error: ${response.status}`);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Orange SMS Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Fallback: logger
  console.log('📱 SMS (No provider configured)');
  console.log(`To: +${cleanedPhone}`);
  console.log(`Message: ${message}`);
  return { success: true };
}

/**
 * Envoie un message WhatsApp via lien wa.me
 */
function generateWhatsAppLink(phone: string, message: string): string {
  const cleanedPhone = cleanPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
}

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
// API: INITIER UN TRANSFERT DE PROPRIÉTÉ
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
    const validatedData = initiateTransferSchema.parse(body);
    const { vehicleId } = validatedData;

    // 3. Récupérer le véhicule
    const vehicles = await db.$queryRaw<any[]>`
      SELECT id, ownerId, ownerName, ownerPhone, reference, make, model, licensePlate
      FROM Vehicle 
      WHERE id = ${vehicleId}
      LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Véhicule non trouvé'
      }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // 4. Vérifier que l'utilisateur est le propriétaire actuel
    if (vehicle.ownerId !== user.id) {
      await logAudit({
        action: 'TRANSFER_INITIATE_UNAUTHORIZED',
        entityType: 'VEHICLE',
        entityId: vehicleId,
        userId: user.id,
        userEmail: user.email,
        details: JSON.stringify({ reason: 'Utilisateur non propriétaire' })
      });
      
      return NextResponse.json({
        success: false,
        error: 'Seul le propriétaire actuel peut initier un transfert'
      }, { status: 403 });
    }

    // 5. Vérifier qu'il n'y a pas de transfert en cours
    const existingTransfer = await db.$queryRaw<any[]>`
      SELECT id, code, expiresAt 
      FROM TransferCode 
      WHERE vehicleId = ${vehicleId} 
        AND status = 'PENDING' 
        AND expiresAt > ${new Date().toISOString()}
      LIMIT 1
    `;

    if (existingTransfer && existingTransfer.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Un transfert est déjà en cours pour ce véhicule',
        existingTransfer: {
          code: existingTransfer[0].code,
          expiresAt: existingTransfer[0].expiresAt
        }
      }, { status: 400 });
    }

    // 6. Générer le code de transfert
    const transferCode = await generateUniqueTransferCode();
    const transferCodeId = generateCuid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 heures

    // 7. Créer l'enregistrement TransferCode
    await db.$executeRaw`
      INSERT INTO TransferCode (
        id, code, vehicleId, sellerId, sellerName, sellerPhone,
        status, createdAt, expiresAt
      ) VALUES (
        ${transferCodeId}, ${transferCode}, ${vehicleId}, ${user.id},
        ${user.name || ''}, ${user.garage?.phone || ''},
        'PENDING', ${now.toISOString()}, ${expiresAt.toISOString()}
      )
    `;

    // 8. Logger l'action
    await logAudit({
      action: 'TRANSFER_INITIATE',
      entityType: 'TRANSFER_CODE',
      entityId: transferCodeId,
      userId: user.id,
      userEmail: user.email,
      details: JSON.stringify({
        vehicleId,
        vehicleRef: vehicle.reference,
        code: transferCode,
        expiresAt: expiresAt.toISOString()
      }),
      garageId: user.garageId
    });

    // 9. Préparer les messages
    const vehicleDescription = `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.licensePlate || vehicle.reference})`.trim();
    
    // Message SMS pour le vendeur
    const smsMessage = `OKAR - Transfert de propriété
Code: ${transferCode}
Véhicule: ${vehicleDescription}
Valable 48h
Donnez ce code à l'acheteur pour finaliser le transfert.`;

    // Message WhatsApp pour le vendeur (plus détaillé)
    const whatsappMessage = `🚗 *OKAR - Transfert de Propriété*

Votre véhicule a été marqué pour transfert.

━━━━━━━━━━━━━━━━━━━━━
🔢 *Code de transfert:* \`${transferCode}\`
🚙 *Véhicule:* ${vehicleDescription}
⏰ *Valable:* 48 heures
━━━━━━━━━━━━━━━━━━━━━

📝 *Instructions:*
Partagez ce code avec l'acheteur pour qu'il puisse finaliser le transfert sur okar.sn/transfer/valider

_Ce code expire dans 48 heures._`;

    // 10. Envoyer les notifications
    let smsSent = false;
    let whatsappLink = null;
    
    // Envoyer SMS au vendeur si téléphone disponible
    const sellerPhone = user.garage?.phone || vehicle.ownerPhone;
    if (sellerPhone) {
      const smsResult = await sendSMS(sellerPhone, smsMessage);
      smsSent = smsResult.success;
      
      // Générer lien WhatsApp
      whatsappLink = generateWhatsAppLink(sellerPhone, whatsappMessage);
    }
    
    // Si acheteur fourni, envoyer aussi le code
    let buyerNotified = false;
    if (validatedData.buyerPhone) {
      const buyerMessage = `OKAR - Transfert en attente
Code: ${transferCode}
Véhicule: ${vehicleDescription}
Allez sur okar.sn/transfer/valider pour accepter.`;
      
      const buyerSmsResult = await sendSMS(validatedData.buyerPhone, buyerMessage);
      buyerNotified = buyerSmsResult.success;
    }

    // 11. Réponse
    return NextResponse.json({
      success: true,
      message: 'Code de transfert généré avec succès',
      transfer: {
        id: transferCodeId,
        code: transferCode,
        vehicle: {
          id: vehicle.id,
          reference: vehicle.reference,
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate
        },
        expiresAt: expiresAt.toISOString(),
        expiresIn: '48 heures'
      },
      notification: {
        smsSent,
        whatsappLink,
        buyerNotified
      }
    });

  } catch (error) {
    console.error('Erreur initiate transfer:', error);
    
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
