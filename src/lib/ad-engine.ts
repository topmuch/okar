/**
 * ================================================
 * OKAR Contextual Ad Engine
 * ================================================
 * 
 * Moteur de publicité contextuelle:
 * - Ciblage par catégorie véhicule
 * - Ciblage par localisation
 * - Ciblage par type d'alerte
 * - Tracking impressions/clics
 */

import prisma from './prisma';

// Types
export interface AdContext {
  vehicleId?: string;
  vehicleType?: string;
  vehicleMake?: string;
  category?: string;        // VEHICLE_MAINTENANCE, TIRES, OIL, INSURANCE, VT
  location?: string;
  alertType?: string;       // VT_EXPIRING, INSURANCE_EXPIRING, MAINTENANCE_DUE
  userId?: string;
  garageId?: string;
  pageType?: string;        // vehicle_detail, scan_result, dashboard, marketplace
}

export interface TargetedAd {
  id: string;
  headline: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  advertiserName: string;
  isSponsored: boolean;
}

// Règles de ciblage
const TARGETING_RULES: Record<string, (ctx: AdContext) => boolean> = {
  // Pneus: cibler véhicules avec alerte usure pneus ou maintenance pneus
  TIRES: (ctx) => 
    ctx.category === 'TIRES' || 
    ctx.alertType?.includes('pneu') ||
    ctx.vehicleType === 'camion',
  
  // Huile: cibler véhicules avec alerte vidange
  OIL: (ctx) => 
    ctx.category === 'VEHICLE_MAINTENANCE' ||
    ctx.alertType === 'MAINTENANCE_DUE' ||
    ctx.pageType === 'vehicle_detail',
  
  // Assurance: cibler véhicules avec VT/assurance expirant
  INSURANCE: (ctx) => 
    ctx.category === 'INSURANCE' ||
    ctx.alertType === 'INSURANCE_EXPIRING' ||
    ctx.alertType === 'VT_EXPIRING',
  
  // Contrôle technique
  VT: (ctx) => 
    ctx.category === 'VT' ||
    ctx.alertType === 'VT_EXPIRING',
  
  // Garages
  GARAGE_SERVICES: (ctx) => 
    ctx.pageType === 'scan_result' ||
    ctx.pageType === 'vehicle_detail',
  
  // Pièces auto
  AUTO_PARTS: (ctx) => 
    ctx.category === 'VEHICLE_MAINTENANCE' ||
    ctx.vehicleType === 'utilitaire',
};

/**
 * Obtenir les publicités ciblées pour un contexte donné
 */
export async function getTargetedAds(
  context: AdContext,
  limit: number = 3
): Promise<TargetedAd[]> {
  // Construire les conditions de recherche
  const whereConditions: any = {
    status: 'ACTIVE',
    startDate: { lte: new Date() },
    OR: [
      { endDate: null },
      { endDate: { gte: new Date() } },
    ],
    budgetSpent: { lt: { _ref: 'budgetTotal' } },
  };

  // Ajouter les filtres de ciblage
  if (context.category) {
    whereConditions.OR = [
      { targetCategory: context.category },
      { targetCategory: null },
    ];
  }

  if (context.location) {
    whereConditions.OR.push(
      { targetLocation: context.location },
      { targetLocation: null },
    );
  }

  if (context.vehicleType) {
    whereConditions.OR.push(
      { targetVehicleType: context.vehicleType },
      { targetVehicleType: null },
    );
  }

  // Récupérer les campagnes actives
  const campaigns = await prisma.adCampaign.findMany({
    where: whereConditions,
    orderBy: [
      { priority: 'desc' },
      { ctr: 'desc' },
    ],
    take: limit * 2, // Prendre plus pour filtrer par règles
  });

  // Filtrer par règles de ciblage et formater
  const targetedAds: TargetedAd[] = [];

  for (const campaign of campaigns) {
    // Vérifier si la campagne correspond aux règles de ciblage
    const category = campaign.targetCategory || '';
    const ruleMatcher = TARGETING_RULES[category];
    
    if (ruleMatcher && !ruleMatcher(context)) {
      continue;
    }

    targetedAds.push({
      id: campaign.id,
      headline: campaign.headline || campaign.name,
      description: campaign.description || '',
      imageUrl: campaign.creativeUrl || '',
      ctaText: campaign.ctaText || 'En savoir plus',
      ctaUrl: campaign.ctaUrl || '#',
      advertiserName: campaign.advertiserName,
      isSponsored: true,
    });

    if (targetedAds.length >= limit) break;
  }

  // Enregistrer les impressions
  if (targetedAds.length > 0 && (context.userId || context.garageId || context.vehicleId)) {
    await trackImpressions(
      targetedAds.map(a => a.id),
      context,
      'IMPRESSION'
    );
  }

  return targetedAds;
}

/**
 * Tracker une impression ou un clic
 */
export async function trackImpressions(
  campaignIds: string[],
  context: AdContext,
  action: 'IMPRESSION' | 'CLICK' | 'CONVERSION'
): Promise<void> {
  const impressions = campaignIds.map(campaignId => ({
    campaignId,
    vehicleId: context.vehicleId,
    userId: context.userId,
    action,
  }));

  await prisma.adCampaignImpression.createMany({
    data: impressions,
  });

  // Mettre à jour les stats de la campagne
  for (const campaignId of campaignIds) {
    const updateData: any = {};
    
    if (action === 'IMPRESSION') {
      updateData.impressions = { increment: 1 };
    } else if (action === 'CLICK') {
      updateData.clicks = { increment: 1 };
    } else if (action === 'CONVERSION') {
      updateData.conversions = { increment: 1 };
    }

    // Recalculer le CTR
    if (action === 'CLICK' || action === 'IMPRESSION') {
      const campaign = await prisma.adCampaign.findUnique({
        where: { id: campaignId },
        select: { impressions: true, clicks: true },
      });
      
      if (campaign && campaign.impressions > 0) {
        updateData.ctr = (campaign.clicks / campaign.impressions) * 100;
      }
    }

    await prisma.adCampaign.update({
      where: { id: campaignId },
      data: updateData,
    });
  }
}

/**
 * Enregistrer un clic sur une publicité
 */
export async function trackAdClick(
  campaignId: string,
  context: AdContext
): Promise<void> {
  await trackImpressions([campaignId], context, 'CLICK');
}

/**
 * Obtenir les stats d'une campagne
 */
export async function getCampaignStats(campaignId: string) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: {
      adImpressions: {
        where: { action: 'CLICK' },
        select: { createdAt: true },
      },
    },
  });

  if (!campaign) return null;

  // Grouper les clics par jour
  const clicksByDay: Record<string, number> = {};
  for (const impression of campaign.adImpressions) {
    const day = impression.createdAt.toISOString().split('T')[0];
    clicksByDay[day] = (clicksByDay[day] || 0) + 1;
  }

  return {
    id: campaign.id,
    name: campaign.name,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    ctr: campaign.ctr,
    budgetTotal: campaign.budgetTotal,
    budgetSpent: campaign.budgetSpent,
    remainingBudget: campaign.budgetTotal - campaign.budgetSpent,
    clicksByDay,
  };
}

/**
 * Créer une nouvelle campagne publicitaire
 */
export async function createAdCampaign(data: {
  name: string;
  advertiserName: string;
  advertiserEmail?: string;
  advertiserPhone?: string;
  targetCategory?: string;
  targetLocation?: string;
  targetVehicleType?: string;
  creativeType?: string;
  creativeUrl?: string;
  headline?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  pricingModel?: string;
  budgetTotal: number;
  costPerUnit?: number;
  startDate: Date;
  endDate?: Date;
}): Promise<any> {
  return prisma.adCampaign.create({
    data: {
      name: data.name,
      advertiserName: data.advertiserName,
      advertiserEmail: data.advertiserEmail,
      advertiserPhone: data.advertiserPhone,
      targetCategory: data.targetCategory,
      targetLocation: data.targetLocation,
      targetVehicleType: data.targetVehicleType,
      creativeType: data.creativeType || 'IMAGE',
      creativeUrl: data.creativeUrl,
      headline: data.headline,
      description: data.description,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      pricingModel: data.pricingModel || 'CPM',
      budgetTotal: data.budgetTotal,
      costPerUnit: data.costPerUnit || 0,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'DRAFT',
    },
  });
}

/**
 * Activer une campagne
 */
export async function activateCampaign(campaignId: string): Promise<any> {
  return prisma.adCampaign.update({
    where: { id: campaignId },
    data: { status: 'ACTIVE' },
  });
}

/**
 * Mettre en pause une campagne
 */
export async function pauseCampaign(campaignId: string): Promise<any> {
  return prisma.adCampaign.update({
    where: { id: campaignId },
    data: { status: 'PAUSED' },
  });
}
