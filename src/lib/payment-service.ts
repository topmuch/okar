/**
 * ================================================
 * OKAR Payment Service - Intégration Paiements Mobiles
 * ================================================
 * 
 * Support pour:
 * - Orange Money Sénégal
 * - Wave Sénégal  
 * - CinetPay / PayDunya (agrégateur)
 * - Free Money
 */

import prisma from './prisma';
import crypto from 'crypto';

// Types
export type PaymentProvider = 'ORANGE_MONEY' | 'WAVE' | 'CINETPAY' | 'FREE_MONEY';
export type TransactionType = 'REPORT' | 'SUB_GARAGE' | 'BOOST' | 'VERIFICATION' | 'FLEET' | 'LEAD';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface InitiatePaymentParams {
  type: TransactionType;
  amount: number;
  phone: string;
  provider: PaymentProvider;
  userId?: string;
  garageId?: string;
  metadata?: Record<string, any>;
  promoCode?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: TransactionStatus;
  message: string;
  providerRef?: string;
  ussdCode?: string;  // Pour Orange Money Push USSD
}

export interface WebhookPayload {
  transactionId: string;
  providerRef: string;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  phone?: string;
  timestamp: string;
  signature?: string;
}

// Configuration des providers
const PROVIDER_CONFIG = {
  ORANGE_MONEY: {
    name: 'Orange Money',
    apiUrl: process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay',
    merchantId: process.env.ORANGE_MERCHANT_ID,
    apiKey: process.env.ORANGE_API_KEY,
    secretKey: process.env.ORANGE_SECRET_KEY,
    webhookSecret: process.env.ORANGE_WEBHOOK_SECRET,
  },
  WAVE: {
    name: 'Wave',
    apiUrl: process.env.WAVE_API_URL || 'https://api.wave.com/v1',
    apiKey: process.env.WAVE_API_KEY,
    secretKey: process.env.WAVE_SECRET_KEY,
    webhookSecret: process.env.WAVE_WEBHOOK_SECRET,
  },
  CINETPAY: {
    name: 'CinetPay',
    apiUrl: process.env.CINETPAY_API_URL || 'https://api.cinetpay.com/v2',
    siteId: process.env.CINETPAY_SITE_ID,
    apiKey: process.env.CINETPAY_API_KEY,
    secretKey: process.env.CINETPAY_SECRET_KEY,
    webhookSecret: process.env.CINETPAY_WEBHOOK_SECRET,
  },
  FREE_MONEY: {
    name: 'Free Money',
    apiUrl: process.env.FREE_MONEY_API_URL || 'https://api.freemoney.sn/v1',
    merchantId: process.env.FREE_MERCHANT_ID,
    apiKey: process.env.FREE_API_KEY,
    secretKey: process.env.FREE_SECRET_KEY,
  },
};

// Prix des services
export const SERVICE_PRICES: Record<TransactionType, { min: number; max: number; default: number }> = {
  REPORT: { min: 500, max: 1000, default: 750 },        // Rapport Premium
  SUB_GARAGE: { min: 5000, max: 10000, default: 7500 }, // Abonnement Garage Premium
  BOOST: { min: 1000, max: 3000, default: 2000 },       // Boost annonce
  VERIFICATION: { min: 3000, max: 7500, default: 5000 }, // Vérification OKAR
  FLEET: { min: 500, max: 2000, default: 1000 },        // Par véhicule/mois
  LEAD: { min: 500, max: 2000, default: 1000 },         // Commission par lead
};

/**
 * Initier un paiement mobile
 */
export async function initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
  const { type, amount, phone, provider, userId, garageId, metadata, promoCode } = params;

  // Validation du montant
  const priceConfig = SERVICE_PRICES[type];
  if (amount < priceConfig.min || amount > priceConfig.max * 10) {
    return {
      success: false,
      transactionId: '',
      status: 'FAILED',
      message: `Montant invalide. Minimum: ${priceConfig.min} FCFA`,
    };
  }

  // Calcul de la remise promo
  let discount = 0;
  let promoCodeId = null;
  
  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: promoCode, isActive: true },
    });
    
    if (promo && new Date() >= promo.validFrom && new Date() <= promo.validUntil) {
      if (promo.applicableTo === 'ALL' || promo.applicableTo === type) {
        if (!promo.maxUses || promo.usesCount < promo.maxUses) {
          if (promo.discountType === 'PERCENTAGE') {
            discount = (amount * promo.discountValue) / 100;
            if (promo.maxDiscount) {
              discount = Math.min(discount, promo.maxDiscount);
            }
          } else {
            discount = promo.discountValue;
          }
          promoCodeId = promo.id;
        }
      }
    }
  }

  const finalAmount = amount - discount;

  // Créer la transaction en base
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      garageId,
      amount: finalAmount,
      currency: 'XOF',
      provider,
      type,
      status: 'PENDING',
      payerPhone: phone,
      metadata: metadata ? JSON.stringify(metadata) : null,
      promoCodeId,
      promoDiscount: discount,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
  });

  try {
    // Appeler l'API du provider
    let providerResult;
    
    switch (provider) {
      case 'ORANGE_MONEY':
        providerResult = await initiateOrangeMoneyPayment(transaction.id, finalAmount, phone);
        break;
      case 'WAVE':
        providerResult = await initiateWavePayment(transaction.id, finalAmount, phone);
        break;
      case 'CINETPAY':
        providerResult = await initiateCinetPayPayment(transaction.id, finalAmount, phone);
        break;
      case 'FREE_MONEY':
        providerResult = await initiateFreeMoneyPayment(transaction.id, finalAmount, phone);
        break;
      default:
        throw new Error(`Provider non supporté: ${provider}`);
    }

    // Mettre à jour la transaction avec la référence provider
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PROCESSING',
        providerRef: providerResult.providerRef,
      },
    });

    return {
      success: true,
      transactionId: transaction.id,
      status: 'PROCESSING',
      message: 'Paiement initié. Veuillez confirmer sur votre téléphone.',
      providerRef: providerResult.providerRef,
      ussdCode: providerResult.ussdCode,
    };

  } catch (error: any) {
    // Marquer la transaction comme échouée
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        webhookData: JSON.stringify({ error: error.message }),
      },
    });

    return {
      success: false,
      transactionId: transaction.id,
      status: 'FAILED',
      message: error.message || 'Erreur lors de l\'initiation du paiement',
    };
  }
}

/**
 * Orange Money - Paiement Push USSD
 */
async function initiateOrangeMoneyPayment(
  transactionId: string,
  amount: number,
  phone: string
): Promise<{ providerRef: string; ussdCode?: string }> {
  const config = PROVIDER_CONFIG.ORANGE_MONEY;
  
  // En mode développement, simuler le paiement
  if (process.env.NODE_ENV !== 'production' || !config.apiKey) {
    console.log('[DEV] Simulating Orange Money payment:', { transactionId, amount, phone });
    return {
      providerRef: `OM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ussdCode: '#144#',
    };
  }

  const response = await fetch(`${config.apiUrl}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      merchant_id: config.merchantId,
      order_id: transactionId,
      amount: amount,
      currency: 'XOF',
      customer_phone: phone.replace('+221', ''),
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
      notif_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Orange Money API error: ${error}`);
  }

  const data = await response.json();
  return {
    providerRef: data.transaction_id || data.pay_token,
    ussdCode: data.ussd_code,
  };
}

/**
 * Wave - Paiement
 */
async function initiateWavePayment(
  transactionId: string,
  amount: number,
  phone: string
): Promise<{ providerRef: string }> {
  const config = PROVIDER_CONFIG.WAVE;
  
  // Mode développement
  if (process.env.NODE_ENV !== 'production' || !config.apiKey) {
    console.log('[DEV] Simulating Wave payment:', { transactionId, amount, phone });
    return {
      providerRef: `WV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  const response = await fetch(`${config.apiUrl}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'XOF',
      client_reference: transactionId,
      customer_phone: phone,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback?status=success`,
      fail_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback?status=fail`,
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Wave API error: ${error}`);
  }

  const data = await response.json();
  return {
    providerRef: data.id || data.session_id,
  };
}

/**
 * CinetPay - Paiement (Agrégateur multi-opérateurs)
 */
async function initiateCinetPayPayment(
  transactionId: string,
  amount: number,
  phone: string
): Promise<{ providerRef: string }> {
  const config = PROVIDER_CONFIG.CINETPAY;
  
  // Mode développement
  if (process.env.NODE_ENV !== 'production' || !config.apiKey) {
    console.log('[DEV] Simulating CinetPay payment:', { transactionId, amount, phone });
    return {
      providerRef: `CP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  const response = await fetch(`${config.apiUrl}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id: transactionId,
      amount: amount,
      currency: 'XOF',
      description: 'Paiement OKAR',
      customer_phone: phone,
      customer_name: 'Client OKAR',
      notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CinetPay API error: ${error}`);
  }

  const data = await response.json();
  return {
    providerRef: data.transaction_id || data.cinetpay_transaction_id,
  };
}

/**
 * Free Money - Paiement
 */
async function initiateFreeMoneyPayment(
  transactionId: string,
  amount: number,
  phone: string
): Promise<{ providerRef: string }> {
  const config = PROVIDER_CONFIG.FREE_MONEY;
  
  // Mode développement
  if (process.env.NODE_ENV !== 'production' || !config.apiKey) {
    console.log('[DEV] Simulating Free Money payment:', { transactionId, amount, phone });
    return {
      providerRef: `FM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  const response = await fetch(`${config.apiUrl}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      merchantId: config.merchantId,
      orderId: transactionId,
      amount: amount,
      currency: 'XOF',
      customerMsisdn: phone.replace('+221', ''),
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Free Money API error: ${error}`);
  }

  const data = await response.json();
  return {
    providerRef: data.transactionId || data.ref,
  };
}

/**
 * Traiter le webhook de paiement
 */
export async function handlePaymentWebhook(
  payload: WebhookPayload,
  provider: PaymentProvider,
  signature?: string
): Promise<{ success: boolean; message: string }> {
  // Vérifier la signature HMAC
  if (!verifyWebhookSignature(payload, provider, signature)) {
    return { success: false, message: 'Signature invalide' };
  }

  // Trouver la transaction
  const transaction = await prisma.transaction.findUnique({
    where: { id: payload.transactionId },
  });

  if (!transaction) {
    return { success: false, message: 'Transaction non trouvée' };
  }

  if (transaction.status === 'SUCCESS') {
    return { success: true, message: 'Transaction déjà traitée' };
  }

  // Mettre à jour le statut
  const newStatus = payload.status === 'SUCCESS' ? 'SUCCESS' : 
                    payload.status === 'FAILED' ? 'FAILED' : 'FAILED';

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: newStatus,
      providerRef: payload.providerRef,
      webhookReceived: true,
      webhookData: JSON.stringify(payload),
      completedAt: newStatus === 'SUCCESS' ? new Date() : null,
    },
  });

  // Si succès, exécuter l'action post-paiement
  if (newStatus === 'SUCCESS') {
    await executePostPaymentAction(transaction);
    
    // Incrémenter l'utilisation du code promo
    if (transaction.promoCodeId) {
      await prisma.promoCode.update({
        where: { id: transaction.promoCodeId },
        data: { usesCount: { increment: 1 } },
      });
    }
  }

  return { success: true, message: 'Webhook traité avec succès' };
}

/**
 * Vérifier la signature HMAC du webhook
 */
function verifyWebhookSignature(
  payload: WebhookPayload,
  provider: PaymentProvider,
  signature?: string
): boolean {
  if (!signature) {
    // En développement, accepter sans signature
    return process.env.NODE_ENV !== 'production';
  }

  const config = PROVIDER_CONFIG[provider];
  const secret = config.webhookSecret;
  
  if (!secret) return true; // Si pas de secret configuré, accepter

  const payloadString = JSON.stringify(payload);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Exécuter l'action post-paiement selon le type de transaction
 */
async function executePostPaymentAction(transaction: any): Promise<void> {
  const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};

  switch (transaction.type) {
    case 'REPORT':
      await handleReportPayment(transaction, metadata);
      break;
    case 'SUB_GARAGE':
      await handleGarageSubscriptionPayment(transaction, metadata);
      break;
    case 'BOOST':
      await handleBoostPayment(transaction, metadata);
      break;
    case 'VERIFICATION':
      await handleVerificationPayment(transaction, metadata);
      break;
    case 'FLEET':
      await handleFleetPayment(transaction, metadata);
      break;
    case 'LEAD':
      await handleLeadPayment(transaction, metadata);
      break;
  }
}

/**
 * Gérer le paiement d'un rapport premium
 */
async function handleReportPayment(transaction: any, metadata: any): Promise<void> {
  const vehicleId = metadata.vehicleId;
  if (!vehicleId) return;

  // Générer le PDF premium
  const pdfReport = await generatePremiumPdfReport(vehicleId, transaction.id);

  // Envoyer le lien par SMS/WhatsApp
  await sendReportNotification(transaction.payerPhone, pdfReport);
}

/**
 * Gérer le paiement d'un abonnement garage premium
 */
async function handleGarageSubscriptionPayment(transaction: any, metadata: any): Promise<void> {
  const garageId = transaction.garageId || metadata.garageId;
  if (!garageId) return;

  const durationMonths = metadata.durationMonths || 1;

  // Créer ou mettre à jour le profil garage
  const existingProfile = await prisma.garageProfile.findUnique({
    where: { garageId },
  });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  if (existingProfile) {
    // Étendre l'abonnement existant
    const newEndDate = existingProfile.subscriptionEndDate && existingProfile.subscriptionEndDate > startDate
      ? new Date(existingProfile.subscriptionEndDate)
      : startDate;
    newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

    await prisma.garageProfile.update({
      where: { garageId },
      data: {
        subscriptionTier: 'PREMIUM',
        subscriptionStartDate: startDate,
        subscriptionEndDate: newEndDate,
        subscriptionAutoRenew: metadata.autoRenew || false,
      },
    });
  } else {
    await prisma.garageProfile.create({
      data: {
        garageId,
        subscriptionTier: 'PREMIUM',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        subscriptionAutoRenew: metadata.autoRenew || false,
      },
    });
  }

  // Mettre à jour le garage
  await prisma.garage.update({
    where: { id: garageId },
    data: {
      subscriptionPlan: 'premium',
      subscriptionExpiresAt: endDate,
    },
  });
}

/**
 * Gérer le paiement d'un boost d'annonce
 */
async function handleBoostPayment(transaction: any, metadata: any): Promise<void> {
  const vehicleId = metadata.vehicleId;
  if (!vehicleId) return;

  const durationDays = metadata.durationDays || 7;
  const boostType = metadata.boostType || 'BASIC';

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  // Créer ou mettre à jour la vente
  await prisma.vehicleSale.upsert({
    where: { vehicleId },
    update: {
      isBoosted: true,
      boostStartDate: startDate,
      boostEndDate: endDate,
      boostType,
    },
    create: {
      vehicleId,
      isForSale: true,
      isBoosted: true,
      boostStartDate: startDate,
      boostEndDate: endDate,
      boostType,
      publishedAt: startDate,
    },
  });
}

/**
 * Gérer le paiement d'une vérification OKAR
 */
async function handleVerificationPayment(transaction: any, metadata: any): Promise<void> {
  const vehicleId = metadata.vehicleId;
  if (!vehicleId) return;

  // Marquer comme en attente de vérification
  await prisma.vehicleSale.upsert({
    where: { vehicleId },
    update: {
      verificationStatus: 'PENDING',
    },
    create: {
      vehicleId,
      isForSale: true,
      verificationStatus: 'PENDING',
    },
  });

  // TODO: Notifier les inspecteurs
}

/**
 * Gérer le paiement d'abonnement flotte
 */
async function handleFleetPayment(transaction: any, metadata: any): Promise<void> {
  const fleetAccountId = metadata.fleetAccountId;
  const vehicleCount = metadata.vehicleCount || 1;
  
  if (!fleetAccountId) return;

  const durationMonths = metadata.durationMonths || 1;
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  await prisma.fleetAccount.update({
    where: { id: fleetAccountId },
    data: {
      subscriptionEndDate: endDate,
      vehiclesIncluded: vehicleCount,
    },
  });
}

/**
 * Gérer le paiement de lead
 */
async function handleLeadPayment(transaction: any, metadata: any): Promise<void> {
  const leadRequestId = metadata.leadRequestId;
  if (!leadRequestId) return;

  await prisma.leadRequest.update({
    where: { id: leadRequestId },
    data: {
      status: 'SENT',
      sentToPartnerAt: new Date(),
    },
  });
}

/**
 * Générer un rapport PDF premium
 */
async function generatePremiumPdfReport(vehicleId: string, transactionId: string): Promise<any> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      maintenanceRecords: {
        where: { status: 'VALIDATED' },
        orderBy: { interventionDate: 'desc' },
        take: 50,
      },
      photos: true,
      qrCode: true,
    },
  });

  if (!vehicle) throw new Error('Vehicle not found');

  const verificationCode = `OKAR-${Date.now().toString(36).toUpperCase()}`;

  // En production, générer le vrai PDF avec Puppeteer/pdfmake
  const report = await prisma.pdfReport.create({
    data: {
      vehicleId,
      transactionId,
      reportType: 'PREMIUM',
      fileName: `rapport-${vehicle.reference}-${Date.now()}.pdf`,
      fileUrl: `/api/reports/download/${verificationCode}`,
      verificationCode,
      certifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    },
  });

  return report;
}

/**
 * Envoyer la notification de rapport
 */
async function sendReportNotification(phone: string, report: any): Promise<void> {
  // En production, envoyer via WhatsApp/SMS
  console.log(`[NOTIFICATION] Sending report link to ${phone}: ${report.fileUrl}`);
}

/**
 * Vérifier les abonnements expirés (Cron Job)
 */
export async function checkExpiredSubscriptions(): Promise<{
  garageSubscriptions: number;
  fleetSubscriptions: number;
  boostsExpired: number;
}> {
  const now = new Date();

  // Expirer les abonnements garage
  const garageProfiles = await prisma.garageProfile.findMany({
    where: {
      subscriptionEndDate: { lt: now },
      subscriptionTier: { not: 'FREE' },
    },
  });

  for (const profile of garageProfiles) {
    await prisma.garageProfile.update({
      where: { id: profile.id },
      data: {
        subscriptionTier: 'FREE',
        subscriptionAutoRenew: false,
      },
    });

    await prisma.garage.update({
      where: { id: profile.garageId },
      data: {
        subscriptionPlan: 'basic',
        subscriptionExpiresAt: null,
      },
    });

    // TODO: Envoyer notification de renouvellement
  }

  // Expirer les abonnements flotte
  const fleetAccounts = await prisma.fleetAccount.findMany({
    where: {
      subscriptionEndDate: { lt: now },
    },
  });

  for (const fleet of fleetAccounts) {
    await prisma.fleetAccount.update({
      where: { id: fleet.id },
      data: {
        subscriptionEndDate: null,
      },
    });
  }

  // Expirer les boosts
  const expiredBoosts = await prisma.vehicleSale.findMany({
    where: {
      isBoosted: true,
      boostEndDate: { lt: now },
    },
  });

  for (const sale of expiredBoosts) {
    await prisma.vehicleSale.update({
      where: { id: sale.id },
      data: {
        isBoosted: false,
      },
    });
  }

  return {
    garageSubscriptions: garageProfiles.length,
    fleetSubscriptions: fleetAccounts.length,
    boostsExpired: expiredBoosts.length,
  };
}

/**
 * Obtenir le statut d'une transaction
 */
export async function getTransactionStatus(transactionId: string): Promise<any> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: { select: { name: true, email: true } },
      garage: { select: { name: true } },
      pdfReport: true,
    },
  });

  if (!transaction) return null;

  return {
    id: transaction.id,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    provider: transaction.provider,
    type: transaction.type,
    createdAt: transaction.createdAt,
    completedAt: transaction.completedAt,
    report: transaction.pdfReport,
  };
}
