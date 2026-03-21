/**
 * ================================================
 * OKAR Fleet Management Service
 * ================================================
 * 
 * Gestion de flottes pour entreprises:
 * - Multi-véhicules
 * - Alertes groupées
 * - Export comptable
 * - Gestion des chauffeurs
 */

import prisma from './prisma';

// Types
export type FleetRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface CreateFleetParams {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  businessType?: string;
  adminUserId: string;
  subscriptionTier?: 'BASIC' | 'PRO' | 'ENTERPRISE';
  vehiclesIncluded?: number;
}

export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  totalMileage: number;
  avgMileagePerVehicle: number;
  pendingAlerts: number;
  vtExpiringSoon: number;
  insuranceExpiringSoon: number;
  maintenanceDue: number;
}

/**
 * Créer un compte flotte
 */
export async function createFleetAccount(params: CreateFleetParams) {
  // Vérifier que l'utilisateur n'a pas déjà un compte flotte
  const existingFleet = await prisma.fleetAccount.findFirst({
    where: { adminUserId: params.adminUserId },
  });

  if (existingFleet) {
    throw new Error('Cet utilisateur a déjà un compte flotte');
  }

  const fleet = await prisma.fleetAccount.create({
    data: {
      companyName: params.companyName,
      companyEmail: params.companyEmail,
      companyPhone: params.companyPhone,
      companyAddress: params.companyAddress,
      businessType: params.businessType,
      adminUserId: params.adminUserId,
      subscriptionTier: params.subscriptionTier || 'BASIC',
      vehiclesIncluded: params.vehiclesIncluded || 5,
      pricePerVehicle: 1000, // 1000 FCFA/véhicule/mois
    },
  });

  // Ajouter l'admin comme membre
  await prisma.fleetMember.create({
    data: {
      fleetAccountId: fleet.id,
      userId: params.adminUserId,
      role: 'ADMIN',
      canExport: true,
      canManageDrivers: true,
      acceptedAt: new Date(),
    },
  });

  return fleet;
}

/**
 * Ajouter un véhicule à une flotte
 */
export async function addVehicleToFleet(
  fleetAccountId: string,
  vehicleId: string,
  internalId?: string,
  assignedDriverId?: string,
  assignedDriverName?: string
): Promise<any> {
  // Vérifier que le véhicule n'est pas déjà dans une flotte
  const existingAssignment = await prisma.fleetVehicle.findUnique({
    where: { vehicleId },
  });

  if (existingAssignment) {
    throw new Error('Ce véhicule est déjà assigné à une flotte');
  }

  // Vérifier la limite de véhicules
  const fleet = await prisma.fleetAccount.findUnique({
    where: { id: fleetAccountId },
    include: {
      _count: { vehicles: true },
    },
  });

  if (!fleet) {
    throw new Error('Compte flotte non trouvé');
  }

  if (fleet._count.vehicles >= fleet.vehiclesIncluded) {
    throw new Error(`Limite de ${fleet.vehiclesIncluded} véhicules atteinte. Veuillez upgrader votre abonnement.`);
  }

  // Ajouter le véhicule
  const fleetVehicle = await prisma.fleetVehicle.create({
    data: {
      fleetAccountId,
      vehicleId,
      internalId,
      assignedDriverId,
      assignedDriverName,
    },
  });

  // Mettre à jour les stats de la flotte
  await updateFleetStats(fleetAccountId);

  return fleetVehicle;
}

/**
 * Retirer un véhicule d'une flotte
 */
export async function removeVehicleFromFleet(
  fleetAccountId: string,
  vehicleId: string
): Promise<void> {
  await prisma.fleetVehicle.updateMany({
    where: {
      fleetAccountId,
      vehicleId,
      active: true,
    },
    data: {
      active: false,
      removedAt: new Date(),
    },
  });

  await updateFleetStats(fleetAccountId);
}

/**
 * Obtenir les statistiques d'une flotte
 */
export async function getFleetStats(fleetAccountId: string): Promise<FleetStats> {
  const fleet = await prisma.fleetAccount.findUnique({
    where: { id: fleetAccountId },
    include: {
      vehicles: {
        where: { active: true },
        include: {
          vehicle: {
            include: {
              maintenanceRecords: { take: 1, orderBy: { createdAt: 'desc' } },
            },
          },
        },
      },
    },
  });

  if (!fleet) {
    throw new Error('Compte flotte non trouvé');
  }

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let totalMileage = 0;
  let vtExpiringSoon = 0;
  let insuranceExpiringSoon = 0;
  let maintenanceDue = 0;
  let pendingAlerts = 0;

  for (const fv of fleet.vehicles) {
    const v = fv.vehicle;
    
    // Kilométrage total
    totalMileage += v.currentMileage || 0;

    // VT expirant
    if (v.vtEndDate && v.vtEndDate <= thirtyDays && v.vtEndDate >= now) {
      vtExpiringSoon++;
      pendingAlerts++;
    }

    // Assurance expirant
    if (v.insuranceEndDate && v.insuranceEndDate <= thirtyDays && v.insuranceEndDate >= now) {
      insuranceExpiringSoon++;
      pendingAlerts++;
    }

    // Maintenance due
    if (v.nextMaintenanceDueDate && v.nextMaintenanceDueDate <= thirtyDays) {
      maintenanceDue++;
      pendingAlerts++;
    }
    if (v.nextMaintenanceDueKm && v.currentMileage && v.nextMaintenanceDueKm <= v.currentMileage + 1000) {
      maintenanceDue++;
      pendingAlerts++;
    }
  }

  const activeVehicles = fleet.vehicles.filter(fv => fv.active).length;

  return {
    totalVehicles: fleet.vehicles.length,
    activeVehicles,
    totalMileage,
    avgMileagePerVehicle: activeVehicles > 0 ? Math.round(totalMileage / activeVehicles) : 0,
    pendingAlerts,
    vtExpiringSoon,
    insuranceExpiringSoon,
    maintenanceDue,
  };
}

/**
 * Mettre à jour les statistiques d'une flotte
 */
async function updateFleetStats(fleetAccountId: string): Promise<void> {
  const stats = await getFleetStats(fleetAccountId);

  await prisma.fleetAccount.update({
    where: { id: fleetAccountId },
    data: {
      totalVehicles: stats.totalVehicles,
      activeVehicles: stats.activeVehicles,
      totalMileage: stats.totalMileage,
      pendingAlerts: stats.pendingAlerts,
      lastAlertDate: stats.pendingAlerts > 0 ? new Date() : null,
    },
  });
}

/**
 * Obtenir les alertes groupées pour une flotte
 */
export async function getFleetAlerts(fleetAccountId: string) {
  const fleet = await prisma.fleetAccount.findUnique({
    where: { id: fleetAccountId },
    include: {
      vehicles: {
        where: { active: true },
        include: { vehicle: true },
      },
    },
  });

  if (!fleet) return [];

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const alerts: any[] = [];

  for (const fv of fleet.vehicles) {
    const v = fv.vehicle;

    // Alertes VT
    if (v.vtEndDate) {
      if (v.vtEndDate <= now) {
        alerts.push({
          type: 'VT_EXPIRED',
          severity: 'critical',
          vehicleId: v.id,
          vehicleName: `${v.make} ${v.model}`,
          vehiclePlate: v.licensePlate,
          internalId: fv.internalId,
          message: `Visite technique expirée`,
          dueDate: v.vtEndDate,
        });
      } else if (v.vtEndDate <= sevenDays) {
        alerts.push({
          type: 'VT_EXPIRING',
          severity: 'high',
          vehicleId: v.id,
          vehicleName: `${v.make} ${v.model}`,
          vehiclePlate: v.licensePlate,
          internalId: fv.internalId,
          message: `VT expire dans 7 jours`,
          dueDate: v.vtEndDate,
        });
      } else if (v.vtEndDate <= thirtyDays) {
        alerts.push({
          type: 'VT_EXPIRING',
          severity: 'medium',
          vehicleId: v.id,
          vehicleName: `${v.make} ${v.model}`,
          vehiclePlate: v.licensePlate,
          internalId: fv.internalId,
          message: `VT expire dans 30 jours`,
          dueDate: v.vtEndDate,
        });
      }
    }

    // Alertes Assurance
    if (v.insuranceEndDate) {
      if (v.insuranceEndDate <= now) {
        alerts.push({
          type: 'INSURANCE_EXPIRED',
          severity: 'critical',
          vehicleId: v.id,
          vehicleName: `${v.make} ${v.model}`,
          vehiclePlate: v.licensePlate,
          internalId: fv.internalId,
          message: `Assurance expirée`,
          dueDate: v.insuranceEndDate,
        });
      } else if (v.insuranceEndDate <= sevenDays) {
        alerts.push({
          type: 'INSURANCE_EXPIRING',
          severity: 'high',
          vehicleId: v.id,
          vehicleName: `${v.make} ${v.model}`,
          vehiclePlate: v.licensePlate,
          internalId: fv.internalId,
          message: `Assurance expire dans 7 jours`,
          dueDate: v.insuranceEndDate,
        });
      } else if (v.insuranceEndDate <= thirtyDays) {
        alerts.push({
          type: 'INSURANCE_EXPIRING',
          severity: 'medium',
          vehicleId: v.id,
          vehicleName: `${v.make} ${v.model}`,
          vehiclePlate: v.licensePlate,
          internalId: fv.internalId,
          message: `Assurance expire dans 30 jours`,
          dueDate: v.insuranceEndDate,
        });
      }
    }

    // Alertes Maintenance
    if (v.nextMaintenanceDueDate && v.nextMaintenanceDueDate <= thirtyDays) {
      alerts.push({
        type: 'MAINTENANCE_DUE',
        severity: v.nextMaintenanceDueDate <= now ? 'critical' : 'medium',
        vehicleId: v.id,
        vehicleName: `${v.make} ${v.model}`,
        vehiclePlate: v.licensePlate,
        internalId: fv.internalId,
        message: `Maintenance prévue: ${v.nextMaintenanceType || 'Entretien'}`,
        dueDate: v.nextMaintenanceDueDate,
      });
    }

    // Maintenance basée sur kilométrage
    if (v.nextMaintenanceDueKm && v.currentMileage) {
      const kmRemaining = v.nextMaintenanceDueKm - v.currentMileage;
      if (kmRemaining <= 500) {
        alerts.push({
          type: 'MAINTENANCE_KM',
          severity: kmRemaining <= 0 ? 'critical' : 'high',
          vehicleId: v.id,
          vehicleName: `${v.make} ${v.model}`,
          vehiclePlate: v.licensePlate,
          internalId: fv.internalId,
          message: `Maintenance à ${v.nextMaintenanceDueKm.toLocaleString()} km (reste ${kmRemaining} km)`,
          dueKm: v.nextMaintenanceDueKm,
        });
      }
    }
  }

  // Trier par sévérité
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Exporter les données de flotte (CSV/PDF)
 */
export async function exportFleetData(
  fleetAccountId: string,
  format: 'CSV' | 'PDF' | 'EXCEL' = 'CSV'
): Promise<string> {
  const fleet = await prisma.fleetAccount.findUnique({
    where: { id: fleetAccountId },
    include: {
      vehicles: {
        where: { active: true },
        include: { vehicle: true },
      },
    },
  });

  if (!fleet) throw new Error('Flotte non trouvée');

  if (format === 'CSV') {
    const headers = [
      'ID Interne',
      'Marque',
      'Modèle',
      'Année',
      'Immatriculation',
      'Kilométrage',
      'VT Expiration',
      'Assurance Expiration',
      'Prochaine Maintenance',
      'Chauffeur',
    ];

    const rows = fleet.vehicles.map(fv => {
      const v = fv.vehicle;
      return [
        fv.internalId || '',
        v.make || '',
        v.model || '',
        v.year?.toString() || '',
        v.licensePlate || '',
        v.currentMileage?.toString() || '0',
        v.vtEndDate ? new Date(v.vtEndDate).toLocaleDateString('fr-FR') : '',
        v.insuranceEndDate ? new Date(v.insuranceEndDate).toLocaleDateString('fr-FR') : '',
        v.nextMaintenanceDueDate ? new Date(v.nextMaintenanceDueDate).toLocaleDateString('fr-FR') : '',
        fv.assignedDriverName || '',
      ];
    });

    const csv = [
      headers.join(';'),
      ...rows.map(r => r.join(';')),
    ].join('\n');

    // Mettre à jour la date d'export
    await prisma.fleetAccount.update({
      where: { id: fleetAccountId },
      data: { lastExportDate: new Date() },
    });

    return csv;
  }

  // PDF et EXCEL nécessitent des bibliothèques supplémentaires
  throw new Error('Format non supporté pour le moment');
}

/**
 * Ajouter un membre à la flotte
 */
export async function addFleetMember(
  fleetAccountId: string,
  userId: string,
  role: FleetRole,
  invitedBy: string
): Promise<any> {
  // Vérifier que l'utilisateur a le droit d'inviter
  const inviterMember = await prisma.fleetMember.findFirst({
    where: {
      fleetAccountId,
      userId: invitedBy,
      role: { in: ['ADMIN', 'MANAGER'] },
    },
  });

  if (!inviterMember) {
    throw new Error('Vous n\'avez pas les droits pour inviter des membres');
  }

  return prisma.fleetMember.create({
    data: {
      fleetAccountId,
      userId,
      role,
      invitedBy,
      canExport: role === 'ADMIN' || role === 'MANAGER',
      canManageDrivers: role === 'ADMIN' || role === 'MANAGER',
    },
  });
}

/**
 * Obtenir la flotte d'un utilisateur
 */
export async function getUserFleet(userId: string) {
  const membership = await prisma.fleetMember.findFirst({
    where: { userId, active: true },
    include: {
      fleetAccount: {
        include: {
          vehicles: {
            where: { active: true },
            include: { vehicle: true },
          },
          members: {
            where: { active: true },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  return membership?.fleetAccount || null;
}
