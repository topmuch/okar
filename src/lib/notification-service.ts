/**
 * ================================================
 * OKAR Notification Service - Multi-Channel
 * ================================================
 * 
 * Service unifié pour l'envoi de notifications via:
 * - SMS (Twilio / Orange SMS API)
 * - WhatsApp (Twilio / Meta API)
 * - Email (SMTP via Nodemailer)
 */

import { sendEmail, EmailData } from './email';
import { cleanPhoneNumber, generateWhatsAppLink } from './whatsapp';
import { db } from './db';

// ============ TYPES ============

export type NotificationChannel = 'sms' | 'whatsapp' | 'email' | 'all';

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  error?: string;
  messageId?: string;
}

export interface GarageNotificationData {
  garageId: string;
  garageName: string;
  phone: string;
  whatsappNumber?: string | null;
  email?: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
}

export interface GarageApprovalData extends GarageNotificationData {
  loginEmail: string;
  temporaryPassword: string;
  loginUrl: string;
}

export interface GarageRejectionData extends GarageNotificationData {
  rejectionReason: string;
  correctionUrl: string;
}

// ============ CONFIGURATION ============

interface NotificationConfig {
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  whatsappBusinessId?: string;
  whatsappAccessToken?: string;
  orangeApiKey?: string;
  orangeSender?: string;
}

async function getNotificationConfig(): Promise<NotificationConfig> {
  // Récupérer les paramètres depuis la base de données ou les variables d'environnement
  return {
    smsEnabled: process.env.SMS_ENABLED === 'true',
    whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
    emailEnabled: process.env.EMAIL_ENABLED === 'true',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    whatsappBusinessId: process.env.WHATSAPP_BUSINESS_ID,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    orangeApiKey: process.env.ORANGE_SMS_API_KEY,
    orangeSender: process.env.ORANGE_SMS_SENDER || 'OKAR',
  };
}

// ============ SMS FUNCTIONS ============

/**
 * Envoie un SMS via Twilio
 */
async function sendSmsViaTwilio(
  phone: string,
  message: string,
  config: NotificationConfig
): Promise<NotificationResult> {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    return {
      success: false,
      channel: 'sms',
      error: 'Configuration Twilio incomplète',
    };
  }

  try {
    const client = require('twilio')(config.twilioAccountSid, config.twilioAuthToken);
    
    const result = await client.messages.create({
      body: message,
      from: config.twilioPhoneNumber,
      to: phone,
    });

    return {
      success: true,
      channel: 'sms',
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS Error:', error);
    return {
      success: false,
      channel: 'sms',
      error: error.message || 'Erreur Twilio',
    };
  }
}

/**
 * Envoie un SMS via Orange SMS API (Sénégal)
 */
async function sendSmsViaOrange(
  phone: string,
  message: string,
  config: NotificationConfig
): Promise<NotificationResult> {
  if (!config.orangeApiKey) {
    return {
      success: false,
      channel: 'sms',
      error: 'Configuration Orange SMS incomplète',
    };
  }

  try {
    const response = await fetch('https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B221' + config.orangeSender + '/requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.orangeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: `tel:+${phone}`,
          senderAddress: `tel:+221${config.orangeSender}`,
          outboundSMSTextMessage: {
            message: message.substring(0, 160), // SMS limit
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Orange API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      channel: 'sms',
      messageId: data.outboundSMSMessageRequest?.resourceURL,
    };
  } catch (error: any) {
    console.error('Orange SMS Error:', error);
    return {
      success: false,
      channel: 'sms',
      error: error.message || 'Erreur Orange SMS',
    };
  }
}

/**
 * Envoie un SMS (choix automatique du provider)
 */
async function sendSms(
  phone: string,
  message: string,
  config: NotificationConfig
): Promise<NotificationResult> {
  const cleanedPhone = cleanPhoneNumber(phone);
  
  // Préférer Twilio si configuré, sinon Orange
  if (config.twilioAccountSid) {
    return sendSmsViaTwilio(cleanedPhone, message, config);
  } else if (config.orangeApiKey) {
    return sendSmsViaOrange(cleanedPhone, message, config);
  }
  
  // Mode développement: logger seulement
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 SMS (Mode Dev)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: +${cleanedPhone}`);
  console.log(`Message: ${message}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return {
    success: true,
    channel: 'sms',
    messageId: `dev-${Date.now()}`,
  };
}

// ============ WHATSAPP FUNCTIONS ============

/**
 * Envoie un message WhatsApp via Twilio
 */
async function sendWhatsAppViaTwilio(
  phone: string,
  message: string,
  config: NotificationConfig
): Promise<NotificationResult> {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    return {
      success: false,
      channel: 'whatsapp',
      error: 'Configuration Twilio WhatsApp incomplète',
    };
  }

  try {
    const client = require('twilio')(config.twilioAccountSid, config.twilioAuthToken);
    
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${config.twilioPhoneNumber}`,
      to: `whatsapp:+${cleanPhoneNumber(phone)}`,
    });

    return {
      success: true,
      channel: 'whatsapp',
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio WhatsApp Error:', error);
    return {
      success: false,
      channel: 'whatsapp',
      error: error.message || 'Erreur Twilio WhatsApp',
    };
  }
}

/**
 * Envoie un message WhatsApp via Meta Business API
 */
async function sendWhatsAppViaMeta(
  phone: string,
  message: string,
  config: NotificationConfig
): Promise<NotificationResult> {
  if (!config.whatsappBusinessId || !config.whatsappAccessToken) {
    return {
      success: false,
      channel: 'whatsapp',
      error: 'Configuration Meta WhatsApp incomplète',
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${config.whatsappBusinessId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhoneNumber(phone),
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      channel: 'whatsapp',
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error('Meta WhatsApp Error:', error);
    return {
      success: false,
      channel: 'whatsapp',
      error: error.message || 'Erreur Meta WhatsApp',
    };
  }
}

/**
 * Envoie un message WhatsApp (choix automatique du provider)
 */
async function sendWhatsApp(
  phone: string,
  message: string,
  config: NotificationConfig
): Promise<NotificationResult> {
  // Préférer Twilio si configuré, sinon Meta
  if (config.twilioAccountSid) {
    return sendWhatsAppViaTwilio(phone, message, config);
  } else if (config.whatsappBusinessId) {
    return sendWhatsAppViaMeta(phone, message, config);
  }
  
  // Mode développement: générer un lien wa.me
  const waLink = generateWhatsAppLink(phone, message);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💬 WHATSAPP (Mode Dev - Lien généré)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${phone}`);
  console.log(`Link: ${waLink}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return {
    success: true,
    channel: 'whatsapp',
    messageId: `dev-wa-${Date.now()}`,
  };
}

// ============ EMAIL FUNCTIONS ============

/**
 * Envoie un email
 */
async function sendEmailNotification(
  to: string,
  subject: string,
  html: string,
  text: string,
  type: string
): Promise<NotificationResult> {
  const emailData: EmailData = {
    to,
    subject,
    html,
    text,
    type,
  };

  const result = await sendEmail(emailData);

  return {
    success: result.success,
    channel: 'email',
    error: result.error,
    messageId: result.success ? `email-${Date.now()}` : undefined,
  };
}

// ============ MESSAGE TEMPLATES ============

/**
 * Génère le message d'approbation pour garage
 */
function generateApprovalMessage(data: GarageApprovalData): { sms: string; whatsapp: string; emailSubject: string; emailHtml: string; emailText: string } {
  const sms = `OKAR: Félicitations ${data.garageName}! Votre inscription est validée. Email: ${data.loginEmail}, MDP: ${data.temporaryPassword}. Connectez-vous: ${data.loginUrl}`;

  const whatsapp = `🎉 *Félicitations ${data.garageName} !*

Votre inscription OKAR est validée !

━━━━━━━━━━━━━━━━━━━━━
🔐 *Vos identifiants de connexion*

📧 Email: ${data.loginEmail}
🔑 Mot de passe: \`${data.temporaryPassword}\`

━━━━━━━━━━━━━━━━━━━━━

📌 *Connectez-vous ici:*
${data.loginUrl}

⚠️ _Changez votre mot de passe après la première connexion_

_Bienvenue dans le réseau OKAR !_`;

  const emailSubject = `🎉 Votre garage est validé sur OKAR !`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ff6600; margin: 0;">OKAR</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Passeport Numérique Automobile</p>
      </div>
      <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 10px 10px 0 0; padding: 30px; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 24px;">🎉 Félicitations !</h2>
      </div>
      <div style="background: #f9f9f9; border-radius: 0 0 10px 10px; padding: 30px;">
        <p style="color: #666;">Bonjour ${data.managerName || data.garageName},</p>
        <p style="color: #666;">Votre garage <strong>${data.garageName}</strong> a été validé et fait désormais partie du réseau OKAR de garages certifiés.</p>
        
        <div style="background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0; text-align: center;">🔐 Vos identifiants de connexion</h3>
          <table style="width: 100%; color: #666;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email :</td>
              <td style="padding: 8px 0;">${data.loginEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Mot de passe :</td>
              <td style="padding: 8px 0; font-family: monospace; background: #f0f0f0; padding: 5px 10px; border-radius: 5px;">${data.temporaryPassword}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.loginUrl}" style="background: #ff6600; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Accéder à mon espace</a>
        </div>
        
        <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="color: #92400e; margin: 0; font-weight: bold;">⚠️ Important</p>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Pour votre sécurité, changez votre mot de passe lors de votre première connexion.</p>
        </div>
        
        <div style="background: #e0f2fe; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="color: #0369a1; margin: 0; font-weight: bold;">📋 Prochaines étapes</p>
          <ul style="color: #666; margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
            <li>Complétez votre profil garage</li>
            <li>Commandez vos QR codes OKAR</li>
            <li>Commencez à enregistrer vos interventions</li>
          </ul>
        </div>
      </div>
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>© OKAR - Le passeport numérique automobile du Sénégal</p>
        <p>Besoin d'aide ? Contactez-nous au +221 78 123 45 67</p>
      </div>
    </div>
  `;

  const emailText = `OKAR - Votre garage est validé !

Bonjour ${data.managerName || data.garageName},

Félicitations ! Votre garage "${data.garageName}" a été validé et fait désormais partie du réseau OKAR.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Vos identifiants de connexion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email : ${data.loginEmail}
Mot de passe : ${data.temporaryPassword}

Connectez-vous : ${data.loginUrl}

⚠️ Important : Changez votre mot de passe lors de votre première connexion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Prochaines étapes :
1. Complétez votre profil garage
2. Commandez vos QR codes OKAR
3. Commencez à enregistrer vos interventions

Besoin d'aide ? Contactez-nous au +221 78 123 45 67

© OKAR - Le passeport numérique automobile du Sénégal`;

  return { sms, whatsapp, emailSubject, emailHtml, emailText };
}

/**
 * Génère le message de rejet pour garage
 */
function generateRejectionMessage(data: GarageRejectionData): { sms: string; whatsapp: string; emailSubject: string; emailHtml: string; emailText: string } {
  const sms = `OKAR: Votre inscription a été rejetée. Motif: ${data.rejectionReason.substring(0, 80)}. Corrigez: ${data.correctionUrl}`;

  const whatsapp = `❌ *Demande non validée*

Bonjour ${data.garageName},

Votre demande d'inscription OKAR n'a pas pu être validée.

━━━━━━━━━━━━━━━━━━━━━
📝 *Motif:*
${data.rejectionReason}

━━━━━━━━━━━━━━━━━━━━━

Vous pouvez corriger votre demande et la resoumettre:

🔗 ${data.correctionUrl}

_Pour toute question, contactez-nous au +221 78 123 45 67_`;

  const emailSubject = `Demande d'inscription OKAR - Action requise`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ff6600; margin: 0;">OKAR</h1>
      </div>
      <div style="background: #fef2f2; border-radius: 10px; padding: 30px;">
        <h2 style="color: #dc2626; margin-top: 0;">Demande non validée</h2>
        <p style="color: #666;">Bonjour ${data.managerName || data.garageName},</p>
        <p style="color: #666;">Votre demande d'inscription pour le garage <strong>${data.garageName}</strong> n'a pas pu être validée.</p>
        
        <div style="background: white; border: 2px solid #dc2626; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">📝 Motif</h3>
          <p style="color: #666; margin: 0;">${data.rejectionReason}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.correctionUrl}" style="background: #ff6600; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Corriger ma demande</a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">Vous pouvez corriger les éléments mentionnés et resoumettre votre demande.</p>
      </div>
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>© OKAR - Le passeport numérique automobile du Sénégal</p>
        <p>Besoin d'aide ? Contactez-nous au +221 78 123 45 67</p>
      </div>
    </div>
  `;

  const emailText = `OKAR - Demande non validée

Bonjour ${data.managerName || data.garageName},

Votre demande d'inscription pour "${data.garageName}" n'a pas pu être validée.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Motif:
${data.rejectionReason}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vous pouvez corriger votre demande ici:
${data.correctionUrl}

Pour toute question, contactez-nous au +221 78 123 45 67.

© OKAR - Le passeport numérique automobile du Sénégal`;

  return { sms, whatsapp, emailSubject, emailHtml, emailText };
}

// ============ MAIN NOTIFICATION FUNCTIONS ============

/**
 * Envoie une notification multi-canal
 */
export async function sendMultiChannelNotification(
  data: {
    phone?: string;
    whatsappNumber?: string | null;
    email?: string | null;
  },
  message: {
    sms: string;
    whatsapp: string;
    emailSubject: string;
    emailHtml: string;
    emailText: string;
  },
  channels: NotificationChannel[] = ['sms', 'whatsapp', 'email']
): Promise<NotificationResult[]> {
  const config = await getNotificationConfig();
  const results: NotificationResult[] = [];

  // SMS
  if (channels.includes('sms') || channels.includes('all')) {
    if (config.smsEnabled && data.phone) {
      const result = await sendSms(data.phone, message.sms, config);
      results.push(result);
    }
  }

  // WhatsApp
  if (channels.includes('whatsapp') || channels.includes('all')) {
    if (config.whatsappEnabled && (data.whatsappNumber || data.phone)) {
      const result = await sendWhatsApp(
        data.whatsappNumber || data.phone || '',
        message.whatsapp,
        config
      );
      results.push(result);
    }
  }

  // Email
  if (channels.includes('email') || channels.includes('all')) {
    if (config.emailEnabled && data.email) {
      const result = await sendEmailNotification(
        data.email,
        message.emailSubject,
        message.emailHtml,
        message.emailText,
        'garage_notification'
      );
      results.push(result);
    }
  }

  return results;
}

/**
 * Envoie les identifiants à un garage nouvellement approuvé
 */
export async function sendGarageApprovalNotification(
  data: GarageApprovalData
): Promise<NotificationResult[]> {
  const message = generateApprovalMessage(data);
  
  // Logger la notification
  await db.notification.create({
    data: {
      type: 'GARAGE_APPROVED',
      message: `Garage ${data.garageName} approuvé. Identifiants envoyés à ${data.phone} / ${data.email}`,
    },
  });

  return sendMultiChannelNotification(
    {
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      email: data.email,
    },
    message,
    ['all']
  );
}

/**
 * Envoie une notification de rejet à un garage
 */
export async function sendGarageRejectionNotification(
  data: GarageRejectionData
): Promise<NotificationResult[]> {
  const message = generateRejectionMessage(data);
  
  // Logger la notification
  await db.notification.create({
    data: {
      type: 'GARAGE_REJECTED',
      message: `Garage ${data.garageName} rejeté. Motif: ${data.rejectionReason}`,
    },
  });

  return sendMultiChannelNotification(
    {
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      email: data.email,
    },
    message,
    ['all']
  );
}

/**
 * Envoie une notification de resoumission aux admins
 */
export async function sendGarageResubmissionNotification(
  garageName: string,
  garageId: string
): Promise<void> {
  await db.notification.create({
    data: {
      type: 'GARAGE_RESUBMITTED',
      message: `Le garage "${garageName}" a corrigé et resoumis sa demande. À examiner.`,
    },
  });

  console.log(`📧 Notification: Garage ${garageName} (${garageId}) a resoumis sa demande`);
}

// Export default
const notificationService = {
  sendMultiChannelNotification,
  sendGarageApprovalNotification,
  sendGarageRejectionNotification,
  sendGarageResubmissionNotification,
  sendSms,
  sendWhatsApp,
  sendEmailNotification,
};

export default notificationService;
