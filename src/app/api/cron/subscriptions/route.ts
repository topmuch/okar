import { NextRequest, NextResponse } from 'next/server';
import { checkExpiredSubscriptions } from '@/lib/payment-service';
import { getLeadsNearExpiry, createLeadRequest, distributeLead } from '@/lib/lead-service';
import prisma from '@/lib/prisma';

/**
 * GET /api/cron/subscriptions
 * Cron job pour vérifier et mettre à jour les abonnements expirés
 * 
 * À configurer avec un cron scheduler (vercel cron, node-cron, etc.)
 * Recommandé: toutes les heures
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret d'autorisation
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting subscription check...');

    // 1. Vérifier les abonnements expirés
    const subscriptionResults = await checkExpiredSubscriptions();
    console.log('[CRON] Subscription results:', subscriptionResults);

    // 2. Générer des leads pour les véhicules proches de l'expiration
    const leadsNearExpiry = await getLeadsNearExpiry(30);
    let leadsCreated = 0;
    let leadsDistributed = 0;

    // Leads pour VT
    for (const vehicle of leadsNearExpiry.vt) {
      // Vérifier si un lead existe déjà
      const existingLead = await prisma.leadRequest.findFirst({
        where: {
          vehicleId: vehicle.id,
          type: 'VT',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingLead) {
        const result = await createLeadRequest({
          vehicleId: vehicle.id,
          userId: vehicle.ownerId || undefined,
          type: 'VT',
        });

        if (result.success) {
          leadsCreated++;
          // Distribuer aux partenaires
          const distribution = await distributeLead(result.lead.id);
          if (distribution.success) leadsDistributed++;
        }
      }
    }

    // Leads pour Assurance
    for (const vehicle of leadsNearExpiry.insurance) {
      const existingLead = await prisma.leadRequest.findFirst({
        where: {
          vehicleId: vehicle.id,
          type: 'INSURANCE',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingLead) {
        const result = await createLeadRequest({
          vehicleId: vehicle.id,
          userId: vehicle.ownerId || undefined,
          type: 'INSURANCE',
        });

        if (result.success) {
          leadsCreated++;
          const distribution = await distributeLead(result.lead.id);
          if (distribution.success) leadsDistributed++;
        }
      }
    }

    console.log('[CRON] Leads created:', leadsCreated, 'distributed:', leadsDistributed);

    // 3. Envoyer les notifications de rappel (J-30, J-7, J-1)
    const notificationsSent = await sendExpirationNotifications();

    console.log('[CRON] Notifications sent:', notificationsSent);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        subscriptions: subscriptionResults,
        leads: {
          created: leadsCreated,
          distributed: leadsDistributed,
        },
        notifications: notificationsSent,
      },
    });

  } catch (error: any) {
    console.error('[CRON ERROR]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Envoyer les notifications d'expiration
 */
async function sendExpirationNotifications(): Promise<{
  vt30: number;
  vt7: number;
  vt1: number;
  insurance30: number;
  insurance7: number;
  insurance1: number;
}> {
  const now = new Date();
  const results = {
    vt30: 0,
    vt7: 0,
    vt1: 0,
    insurance30: 0,
    insurance7: 0,
    insurance1: 0,
  };

  // J-30 VT
  const vt30 = await prisma.vehicle.findMany({
    where: {
      vtEndDate: {
        gte: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000),
      },
    },
    include: { owner: true },
  });

  for (const vehicle of vt30) {
    // Vérifier si notification déjà envoyée
    const existingNotification = await prisma.reminderLog.findFirst({
      where: {
        vehicleId: vehicle.id,
        type: 'VT',
        channel: 'WHATSAPP',
        sentAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (!existingNotification) {
      await sendNotification(vehicle, 'VT', 30);
      results.vt30++;
    }
  }

  // J-7 VT
  const vt7 = await prisma.vehicle.findMany({
    where: {
      vtEndDate: {
        gte: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      },
    },
    include: { owner: true },
  });

  for (const vehicle of vt7) {
    const existingNotification = await prisma.reminderLog.findFirst({
      where: {
        vehicleId: vehicle.id,
        type: 'VT',
        channel: 'WHATSAPP',
        sentAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
    });

    if (!existingNotification) {
      await sendNotification(vehicle, 'VT', 7);
      results.vt7++;
    }
  }

  // J-1 VT
  const vt1 = await prisma.vehicle.findMany({
    where: {
      vtEndDate: {
        gte: new Date(now.getTime() + 23 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + 25 * 60 * 60 * 1000),
      },
    },
    include: { owner: true },
  });

  for (const vehicle of vt1) {
    const existingNotification = await prisma.reminderLog.findFirst({
      where: {
        vehicleId: vehicle.id,
        type: 'VT',
        channel: 'WHATSAPP',
        sentAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existingNotification) {
      await sendNotification(vehicle, 'VT', 1);
      results.vt1++;
    }
  }

  // Même logique pour Assurance
  const insurance30 = await prisma.vehicle.findMany({
    where: {
      insuranceEndDate: {
        gte: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000),
      },
    },
    include: { owner: true },
  });

  for (const vehicle of insurance30) {
    const existingNotification = await prisma.reminderLog.findFirst({
      where: {
        vehicleId: vehicle.id,
        type: 'ASSURANCE',
        channel: 'WHATSAPP',
        sentAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (!existingNotification) {
      await sendNotification(vehicle, 'ASSURANCE', 30);
      results.insurance30++;
    }
  }

  const insurance7 = await prisma.vehicle.findMany({
    where: {
      insuranceEndDate: {
        gte: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      },
    },
    include: { owner: true },
  });

  for (const vehicle of insurance7) {
    const existingNotification = await prisma.reminderLog.findFirst({
      where: {
        vehicleId: vehicle.id,
        type: 'ASSURANCE',
        channel: 'WHATSAPP',
        sentAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
    });

    if (!existingNotification) {
      await sendNotification(vehicle, 'ASSURANCE', 7);
      results.insurance7++;
    }
  }

  const insurance1 = await prisma.vehicle.findMany({
    where: {
      insuranceEndDate: {
        gte: new Date(now.getTime() + 23 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + 25 * 60 * 60 * 1000),
      },
    },
    include: { owner: true },
  });

  for (const vehicle of insurance1) {
    const existingNotification = await prisma.reminderLog.findFirst({
      where: {
        vehicleId: vehicle.id,
        type: 'ASSURANCE',
        channel: 'WHATSAPP',
        sentAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existingNotification) {
      await sendNotification(vehicle, 'ASSURANCE', 1);
      results.insurance1++;
    }
  }

  return results;
}

/**
 * Envoyer une notification
 */
async function sendNotification(
  vehicle: any,
  type: 'VT' | 'ASSURANCE' | 'MAINTENANCE',
  daysRemaining: number
): Promise<void> {
  const phone = vehicle.ownerPhone || vehicle.owner?.phone;
  const userId = vehicle.ownerId;

  if (!phone && !userId) return;

  let message = '';
  
  if (type === 'VT') {
    if (daysRemaining === 30) {
      message = `🚗 OKAR - Rappel: Votre visite technique expire dans 30 jours (${vehicle.make} ${vehicle.model}, ${vehicle.licensePlate}). Prenez rendez-vous dès maintenant!`;
    } else if (daysRemaining === 7) {
      message = `⚠️ OKAR - URGENT: Votre visite technique expire dans 7 jours! Prenez rendez-vous immédiatement pour éviter une amende.`;
    } else if (daysRemaining === 1) {
      message = `🚨 OKAR - ALERTE: Votre visite technique expire DEMAIN! Véhicule: ${vehicle.make} ${vehicle.model}. Centre le plus proche: okar.sn/centres-vt`;
    }
  } else if (type === 'ASSURANCE') {
    if (daysRemaining === 30) {
      message = `🛡️ OKAR - Rappel: Votre assurance auto expire dans 30 jours (${vehicle.make} ${vehicle.model}). Comparez les offres: okar.sn/assurance`;
    } else if (daysRemaining === 7) {
      message = `⚠️ OKAR - URGENT: Votre assurance auto expire dans 7 jours! Renouvelez maintenant pour rester protégé.`;
    } else if (daysRemaining === 1) {
      message = `🚨 OKAR - ALERTE: Votre assurance auto expire DEMAIN! Véhicule: ${vehicle.make} ${vehicle.model}. Obtenez un devis express: okar.sn/devis`;
    }
  }

  // Créer le log de notification
  await prisma.reminderLog.create({
    data: {
      vehicleId: vehicle.id,
      type,
      channel: 'WHATSAPP',
      recipient: phone,
      message,
      status: 'SENT',
      sentAt: new Date(),
      userId,
    },
  });

  // En production, envoyer via WhatsApp API
  console.log(`[NOTIFICATION ${type}] To: ${phone}, Days: ${daysRemaining}`);
}
