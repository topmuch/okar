/**
 * ================================================
 * OKAR Lead Distribution Service
 * ================================================
 * 
 * Distribution de leads vers les partenaires:
 * - Assureurs
 * - Centres de contrôle technique
 * - Garages certifiés
 */

import prisma from './prisma';

// Types
export type LeadType = 'INSURANCE' | 'VT' | 'BOTH';

export interface PartnerConfig {
  id: string;
  name: string;
  type: 'INSURANCE' | 'VT' | 'BOTH';
  webhookUrl?: string;
  email?: string;
  commission: number;
  active: boolean;
}

// Configuration des partenaires (à déplacer en DB en production)
const PARTNERS: PartnerConfig[] = [
  {
    id: 'axa-senegal',
    name: 'AXA Assurances Sénégal',
    type: 'INSURANCE',
    webhookUrl: process.env.AXA_WEBHOOK_URL,
    email: 'leads@axa.sn',
    commission: 500,
    active: true,
  },
  {
    id: 'saham-senegal',
    name: 'SAHAM Assurances',
    type: 'INSURANCE',
    webhookUrl: process.env.SAHAM_WEBHOOK_URL,
    email: 'prospection@saham.sn',
    commission: 500,
    active: true,
  },
  {
    id: 'sunu-assurance',
    name: 'SUNU Assurances',
    type: 'INSURANCE',
    webhookUrl: process.env.SUNU_WEBHOOK_URL,
    commission: 500,
    active: true,
  },
  {
    id: 'ct-dakar',
    name: 'Centre de Contrôle Dakar',
    type: 'VT',
    webhookUrl: process.env.CT_DAKAR_WEBHOOK_URL,
    commission: 300,
    active: true,
  },
  {
    id: 'auto-surveillance',
    name: 'Auto Surveillance',
    type: 'VT',
    webhookUrl: process.env.AUTO_SURVEILLANCE_WEBHOOK_URL,
    commission: 300,
    active: true,
  },
];

/**
 * Créer une demande de lead
 */
export async function createLeadRequest(params: {
  vehicleId: string;
  userId?: string;
  type: LeadType;
}): Promise<any> {
  const { vehicleId, userId, type } = params;

  // Récupérer les infos du véhicule
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      owner: true,
    },
  });

  if (!vehicle) {
    throw new Error('Véhicule non trouvé');
  }

  // Vérifier qu'il n'y a pas déjà un lead récent
  const existingLead = await prisma.leadRequest.findFirst({
    where: {
      vehicleId,
      type,
      status: { in: ['NEW', 'SENT'] },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    },
  });

  if (existingLead) {
    return {
      success: false,
      message: 'Une demande récente existe déjà pour ce véhicule',
      lead: existingLead,
    };
  }

  // Masquer les données sensibles
  const maskedPhone = maskPhone(vehicle.ownerPhone || vehicle.owner?.phone);
  const maskedEmail = maskEmail(vehicle.ownerEmail || vehicle.owner?.email);
  const maskedPlate = maskPlate(vehicle.licensePlate);

  // Créer le lead
  const lead = await prisma.leadRequest.create({
    data: {
      vehicleId,
      userId,
      type,
      status: 'NEW',
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      vehiclePlate: maskedPlate,
      ownerPhone: maskedPhone,
      ownerEmail: maskedEmail,
      ownerName: vehicle.ownerName || vehicle.owner?.name,
      location: vehicle.lastLocation,
    },
  });

  return {
    success: true,
    lead,
  };
}

/**
 * Distribuer un lead aux partenaires
 */
export async function distributeLead(leadId: string): Promise<{
  success: boolean;
  partners: string[];
  errors: string[];
}> {
  const lead = await prisma.leadRequest.findUnique({
    where: { id: leadId },
    include: {
      vehicle: true,
    },
  });

  if (!lead) {
    throw new Error('Lead non trouvé');
  }

  // Trouver les partenaires appropriés
  const eligiblePartners = PARTNERS.filter(p => 
    p.active && (p.type === lead.type || p.type === 'BOTH')
  );

  const results: { partner: string; success: boolean; error?: string }[] = [];

  for (const partner of eligiblePartners) {
    try {
      const payload = formatLeadPayload(lead, partner);

      if (partner.webhookUrl) {
        // Envoyer via webhook
        const response = await fetch(partner.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Lead-Source': 'OKAR',
            'X-Partner-Id': partner.id,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        results.push({ partner: partner.name, success: true });
      } else if (partner.email) {
        // Envoyer par email (simulé en dev)
        console.log(`[LEAD EMAIL] To: ${partner.email}`, payload);
        results.push({ partner: partner.name, success: true });
      } else {
        results.push({ 
          partner: partner.name, 
          success: false, 
          error: 'Pas de canal de distribution configuré' 
        });
      }
    } catch (error: any) {
      results.push({ 
        partner: partner.name, 
        success: false, 
        error: error.message 
      });
    }
  }

  // Mettre à jour le statut du lead
  const successCount = results.filter(r => r.success).length;
  const newStatus = successCount > 0 ? 'SENT' : 'NEW';

  await prisma.leadRequest.update({
    where: { id: leadId },
    data: {
      status: newStatus,
      sentToPartnerAt: successCount > 0 ? new Date() : null,
      partnerId: results.find(r => r.success)?.partner || null,
      partnerName: results.find(r => r.success)?.partner || null,
      partnerCommission: eligiblePartners[0]?.commission || 0,
    },
  });

  return {
    success: successCount > 0,
    partners: results.filter(r => r.success).map(r => r.partner),
    errors: results.filter(r => !r.success).map(r => `${r.partner}: ${r.error}`),
  };
}

/**
 * Formater le payload du lead pour le partenaire
 */
function formatLeadPayload(lead: any, partner: PartnerConfig): any {
  return {
    leadId: lead.id,
    source: 'OKAR',
    generatedAt: new Date().toISOString(),
    type: lead.type,
    vehicle: {
      make: lead.vehicleMake,
      model: lead.vehicleModel,
      year: lead.vehicleYear,
      plate: lead.vehiclePlate, // Masqué
      location: lead.location,
      vtExpiry: lead.vehicle?.vtEndDate,
      insuranceExpiry: lead.vehicle?.insuranceEndDate,
    },
    owner: {
      name: lead.ownerName,
      phone: lead.ownerPhone, // Masqué
      email: lead.ownerEmail, // Masqué
    },
    notes: lead.notes,
    // Données de contact non masquées (à révéler après validation partenaire)
    revealContactUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/leads/${lead.id}/reveal`,
  };
}

/**
 * Révéler les données de contact d'un lead (après validation partenaire)
 */
export async function revealLeadContact(
  leadId: string,
  partnerId: string,
  accessToken: string
): Promise<any> {
  // Vérifier le token d'accès partenaire
  const validToken = process.env[`PARTNER_${partnerId.toUpperCase()}_TOKEN`];
  if (accessToken !== validToken) {
    throw new Error('Token invalide');
  }

  const lead = await prisma.leadRequest.findUnique({
    where: { id: leadId },
    include: {
      vehicle: {
        include: { owner: true },
      },
    },
  });

  if (!lead) {
    throw new Error('Lead non trouvé');
  }

  // Mettre à jour le statut
  await prisma.leadRequest.update({
    where: { id: leadId },
    data: {
      status: 'CONTACTED',
      partnerResponseAt: new Date(),
    },
  });

  // Retourner les données non masquées
  return {
    leadId: lead.id,
    ownerPhone: lead.vehicle?.ownerPhone || lead.vehicle?.owner?.phone,
    ownerEmail: lead.vehicle?.ownerEmail || lead.vehicle?.owner?.email,
    vehiclePlate: lead.vehicle?.licensePlate,
    revealedAt: new Date().toISOString(),
  };
}

// Fonctions utilitaires pour masquer les données
function maskPhone(phone: string | null): string {
  if (!phone) return 'Non renseigné';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 9) {
    return `+221 ${cleaned.slice(0, 3)}***${cleaned.slice(-2)}`;
  }
  return phone;
}

function maskEmail(email: string | null): string {
  if (!email) return 'Non renseigné';
  const [localPart, domain] = email.split('@');
  if (localPart && domain) {
    const masked = localPart.slice(0, 2) + '***';
    return `${masked}@${domain}`;
  }
  return email;
}

function maskPlate(plate: string | null): string {
  if (!plate) return 'Non renseigné';
  // Format sénégalais: AB-123-CD
  const cleaned = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (cleaned.length >= 4) {
    return `${cleaned.slice(0, 2)}***${cleaned.slice(-2)}`;
  }
  return plate;
}

/**
 * Obtenir les leads pour un véhicule
 */
export async function getVehicleLeads(vehicleId: string) {
  return prisma.leadRequest.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtenir les leads proches de l'expiration (pour alertes)
 */
export async function getLeadsNearExpiry(daysThreshold: number = 30): Promise<any[]> {
  const now = new Date();
  const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  const vehiclesNeedingVT = await prisma.vehicle.findMany({
    where: {
      vtEndDate: {
        gte: now,
        lte: threshold,
      },
    },
    include: { owner: true },
  });

  const vehiclesNeedingInsurance = await prisma.vehicle.findMany({
    where: {
      insuranceEndDate: {
        gte: now,
        lte: threshold,
      },
    },
    include: { owner: true },
  });

  return {
    vt: vehiclesNeedingVT,
    insurance: vehiclesNeedingInsurance,
  };
}
