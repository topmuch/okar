/**
 * ================================================
 * OKAR Launch Configuration
 * ================================================
 * 
 * Configuration des offres de lancement:
 * - Codes promo
 * - Périodes d'essai
 * - Offres spéciales
 */

import prisma from './prisma';

// Configuration des codes promo de lancement
export const LAUNCH_PROMOS = [
  {
    code: 'PREMIER',
    description: 'Premier rapport gratuit',
    discountType: 'PERCENTAGE',
    discountValue: 100,
    applicableTo: 'REPORT',
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    maxUses: 1000,
    minAmount: 500,
    maxDiscount: 1000,
    firstTimeOnly: true,
  },
  {
    code: 'PREMIUM30',
    description: 'Essai Premium 30 jours',
    discountType: 'PERCENTAGE',
    discountValue: 100,
    applicableTo: 'SUB_GARAGE',
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    maxUses: 500,
    firstTimeOnly: true,
  },
  {
    code: 'BOOST20',
    description: '20% sur le boost d\'annonce',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    applicableTo: 'BOOST',
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    maxUses: null,
  },
  {
    code: 'FLOTTE50',
    description: '50% sur le premier mois flotte',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    applicableTo: 'FLEET',
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    maxUses: 200,
    firstTimeOnly: true,
  },
];

// Seuils d'affichage des publicités
export const AD_THRESHOLDS = {
  // Ne pas afficher de pub si l'utilisateur a moins de X véhicules
  minVehiclesForAds: 1,
  
  // Nombre max de pubs par page
  maxAdsPerPage: 3,
  
  // Délai minimum entre les pubs (en pixels de scroll)
  minAdSpacing: 500,
  
  // Ne pas montrer de pub aux utilisateurs premium
  hideForPremium: true,
  
  // Fréquence max d'impression par utilisateur/jour
  maxImpressionsPerDay: 20,
};

// Configuration des prix
export const PRICING_CONFIG = {
  REPORT: {
    BASIC: 500,
    PREMIUM: 750,
    CERTIFIED: 1000,
  },
  SUB_GARAGE: {
    MONTHLY: 7500,
    QUARTERLY: 20000, // ~11% discount
    YEARLY: 70000,    // ~22% discount
  },
  BOOST: {
    BASIC: 2000,
    PREMIUM: 3500,
    TOP_LISTING: 5000,
  },
  VERIFICATION: {
    STANDARD: 5000,
    EXPRESS: 7500,
  },
  FLEET: {
    PER_VEHICLE_MONTHLY: 1000,
    MIN_VEHICLES: 5,
    ENTERPRISE_MIN: 20,
  },
};

// Partenaires par défaut
export const DEFAULT_PARTNERS = [
  {
    id: 'axa-senegal',
    name: 'AXA Assurances Sénégal',
    type: 'INSURANCE',
    active: true,
    commissionRate: 0.10,
  },
  {
    id: 'saham-senegal',
    name: 'SAHAM Assurances',
    type: 'INSURANCE',
    active: true,
    commissionRate: 0.08,
  },
  {
    id: 'ct-dakar',
    name: 'Centre de Contrôle Dakar',
    type: 'VT',
    active: true,
    commissionRate: 0.05,
  },
];

/**
 * Initialiser les codes promo de lancement
 */
export async function initLaunchPromos(): Promise<void> {
  for (const promo of LAUNCH_PROMOS) {
    const existing = await prisma.promoCode.findUnique({
      where: { code: promo.code },
    });

    if (!existing) {
      await prisma.promoCode.create({
        data: {
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          applicableTo: promo.applicableTo,
          validFrom: promo.validFrom,
          validUntil: promo.validUntil,
          maxUses: promo.maxUses,
          minAmount: promo.minAmount,
          maxDiscount: promo.maxDiscount,
          firstTimeOnly: promo.firstTimeOnly || false,
          isActive: true,
        },
      });
      console.log(`[INIT] Created promo code: ${promo.code}`);
    }
  }
}

/**
 * Vérifier si un utilisateur est éligible pour une offre
 */
export async function checkOfferEligibility(
  userId: string,
  offerType: 'FIRST_FREE_REPORT' | 'PREMIUM_TRIAL' | 'FLEET_DISCOUNT'
): Promise<{ eligible: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        where: { status: 'SUCCESS' },
      },
    },
  });

  if (!user) {
    return { eligible: false, reason: 'Utilisateur non trouvé' };
  }

  switch (offerType) {
    case 'FIRST_FREE_REPORT':
      // Éligible si jamais acheté de rapport
      const hasReport = user.transactions.some(t => t.type === 'REPORT');
      if (hasReport) {
        return { eligible: false, reason: 'Offre valable pour le premier rapport uniquement' };
      }
      return { eligible: true };

    case 'PREMIUM_TRIAL':
      // Éligible si jamais eu d'abonnement premium
      const garage = await prisma.garage.findFirst({
        where: { users: { some: { id: userId } } },
        include: { profile: true },
      });
      if (garage?.profile?.subscriptionEndDate) {
        return { eligible: false, reason: 'Essai déjà utilisé' };
      }
      return { eligible: true };

    case 'FLEET_DISCOUNT':
      // Éligible si jamais créé de flotte
      const fleet = await prisma.fleetAccount.findFirst({
        where: { adminUserId: userId },
      });
      if (fleet) {
        return { eligible: false, reason: 'Offre valable pour la première flotte uniquement' };
      }
      return { eligible: true };

    default:
      return { eligible: false, reason: 'Offre inconnue' };
  }
}

/**
 * Obtenir les offres disponibles pour un utilisateur
 */
export async function getAvailableOffers(userId: string): Promise<any[]> {
  const offers: any[] = [];

  // Premier rapport gratuit
  const firstReport = await checkOfferEligibility(userId, 'FIRST_FREE_REPORT');
  if (firstReport.eligible) {
    offers.push({
      id: 'first-free-report',
      title: 'Premier rapport gratuit',
      description: 'Obtenez votre premier rapport PDF certifié gratuitement',
      code: 'PREMIER',
      type: 'REPORT',
    });
  }

  // Essai Premium
  const premiumTrial = await checkOfferEligibility(userId, 'PREMIUM_TRIAL');
  if (premiumTrial.eligible) {
    offers.push({
      id: 'premium-trial',
      title: '30 jours Premium offerts',
      description: 'Testez toutes les fonctionnalités Premium sans engagement',
      code: 'PREMIUM30',
      type: 'SUB_GARAGE',
    });
  }

  // Remise flotte
  const fleetDiscount = await checkOfferEligibility(userId, 'FLEET_DISCOUNT');
  if (fleetDiscount.eligible) {
    offers.push({
      id: 'fleet-discount',
      title: '50% sur le premier mois',
      description: 'Lancez votre flotte avec une remise exclusive',
      code: 'FLOTTE50',
      type: 'FLEET',
    });
  }

  return offers;
}
