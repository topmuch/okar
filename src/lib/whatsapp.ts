/**
 * ================================================
 * OKAR WhatsApp Utility
 * ================================================
 * 
 * Fonctions utilitaires pour l'envoi de messages WhatsApp
 * Génère des liens wa.me avec messages pré-remplis
 */

export interface WhatsAppTicketData {
  driverName: string;
  driverPhone: string;
  vehicleInfo: string;
  qrReference: string;
  tempPassword: string;
  loginUrl: string;
  generatedAt: Date;
}

export interface WhatsAppMessage {
  phone: string;
  message: string;
}

/**
 * Nettoie un numéro de téléphone pour WhatsApp
 * Supprime les espaces, tirets, et ajoute le préfixe pays si nécessaire
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Supprimer tous les caractères non numériques
  let cleaned = phone.replace(/\D/g, '');
  
  // Si le numéro commence par 0, le remplacer par 221 (Sénégal)
  if (cleaned.startsWith('0')) {
    cleaned = '221' + cleaned.substring(1);
  }
  
  // Si le numéro n'a pas de préfixe pays et fait 9 chiffres, ajouter 221
  if (cleaned.length === 9) {
    cleaned = '221' + cleaned;
  }
  
  return cleaned;
}

/**
 * Génère un lien WhatsApp wa.me
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanedPhone = cleanPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
}

/**
 * Génère le message de bienvenue avec les accès
 */
export function generateWelcomeMessage(data: WhatsAppTicketData): string {
  const formattedDate = formatDate(data.generatedAt);
  
  return `🚗 *Bienvenue sur OKAR !*

Votre passeport numérique automobile a été activé avec succès.

━━━━━━━━━━━━━━━━━━━━━
📋 *VOS INFORMATIONS*

👤 *Nom:* ${data.driverName}
📱 *Téléphone:* ${data.driverPhone}
🚙 *Véhicule:* ${data.vehicleInfo}
🏷️ *Référence QR:* ${data.qrReference}

━━━━━━━━━━━━━━━━━━━━━
🔐 *VOS ACCÈS*

📌 *Lien de connexion:*
${data.loginUrl}

📞 *Login (Téléphone):*
${data.driverPhone}

🔑 *Mot de passe provisoire:*
\`${data.tempPassword}\`

⚠️ _À changer à la première connexion_

━━━━━━━━━━━━━━━━━━━━━

📅 Activé le: ${formattedDate}

Téléchargez l'app OKAR pour gérer votre véhicule:
- Historique d'entretien
- Rappels visite technique & assurance
- Transfert de propriété simplifié
- Et bien plus encore !

_OKAR - Le passeport numérique automobile du Sénégal_`;
}

/**
 * Génère un message court pour les rappels
 */
export function generateReminderMessage(
  driverName: string,
  vehicleInfo: string,
  reminderType: string,
  expiryDate: string
): string {
  const emoji = reminderType === 'VT' ? '🔧' : reminderType === 'Assurance' ? '🛡️' : '⚠️';
  
  return `${emoji} *Rappel OKAR*

Bonjour ${driverName},

Votre ${reminderType} pour le véhicule:
🚙 ${vehicleInfo}

${reminderType === 'VT' ? 'La visite technique' : "L'assurance"} expire le *${expiryDate}*.

Pensez à renouveler pour éviter les amendes et rester en règle.

_Connectez-vous à votre espace OKAR pour plus de détails._`;
}

/**
 * Génère un message de transfert de propriété
 */
export function generateTransferMessage(
  sellerName: string,
  buyerName: string,
  vehicleInfo: string,
  transferCode: string,
  expiryDate: string
): string {
  return `🔄 *Transfert de Propriété OKAR*

Bonjour ${buyerName},

${sellerName} vous transmet son véhicule:

🚙 *Véhicule:* ${vehicleInfo}

🔐 *Code de transfert:* \`${transferCode}\`

⏰ *Valide jusqu'au:* ${expiryDate}

Pour accepter ce transfert:
1. Connectez-vous à votre compte OKAR
2. Allez dans "Transferts"
3. Entrez le code ci-dessus

_Si vous n'attendiez pas ce transfert, ignorez ce message._`;
}

/**
 * Génère un message de confirmation de transfert
 */
export function generateTransferConfirmationMessage(
  previousOwner: string,
  newOwner: string,
  vehicleInfo: string
): string {
  return `✅ *Transfert Réussi - OKAR*

Le véhicule a été officiellement transféré.

🚙 *Véhicule:* ${vehicleInfo}
👤 *Ancien propriétaire:* ${previousOwner}
👤 *Nouveau propriétaire:* ${newOwner}

Retrouvez toutes les informations du véhicule dans votre espace OKAR.

_Merci d'utiliser OKAR !_`;
}

/**
 * Ouvre WhatsApp avec un message pré-rempli
 */
export function openWhatsApp(phone: string, message: string): Window | null {
  const link = generateWhatsAppLink(phone, message);
  return window.open(link, '_blank');
}

/**
 * Envoie le ticket d'accès via WhatsApp
 */
export function sendTicketViaWhatsApp(data: WhatsAppTicketData): Window | null {
  const message = generateWelcomeMessage(data);
  return openWhatsApp(data.driverPhone, message);
}

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Génère un message pour partage du rapport PDF
 */
export function generateReportShareMessage(
  driverName: string,
  vehicleInfo: string,
  reportUrl: string,
  verificationCode: string
): string {
  return `📄 *Rapport OKAR Certifié*

Bonjour ${driverName},

Votre rapport certifié pour le véhicule:
🚙 ${vehicleInfo}

📥 *Télécharger le rapport:*
${reportUrl}

🔐 *Code de vérification:* \`${verificationCode}\`

Ce rapport est valable 30 jours.
Vérifiez son authenticité sur: okar.sn/verifier`;
}

const whatsappUtils = {
  cleanPhoneNumber,
  generateWhatsAppLink,
  generateWelcomeMessage,
  generateReminderMessage,
  generateTransferMessage,
  generateTransferConfirmationMessage,
  openWhatsApp,
  sendTicketViaWhatsApp,
  generateReportShareMessage,
};

export default whatsappUtils;
