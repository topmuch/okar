/**
 * Garage Middleware - Vérification du statut du compte garage
 * 
 * Ce middleware est utilisé pour vérifier si un garage est actif avant
 * d'autoriser certaines actions critiques (scan, activation, submission).
 * 
 * Utilisation dans les API:
 * ```typescript
 * const statusCheck = await checkGarageStatus(garageId);
 * if (!statusCheck.allowed) {
 *   return NextResponse.json({ error: statusCheck.message }, { status: 403 });
 * }
 * ```
 */

import { db } from '@/lib/db';

export interface GarageStatusResult {
  allowed: boolean;
  message: string;
  garage?: {
    id: string;
    name: string;
    accountStatus: string;
    suspendedAt: Date | null;
    suspensionReason: string | null;
  };
}

/**
 * Vérifie si un garage est actif et autorisé à effectuer des actions
 * 
 * @param garageId - L'ID du garage à vérifier
 * @returns GarageStatusResult avec le statut et un message explicatif
 */
export async function checkGarageStatus(garageId: string): Promise<GarageStatusResult> {
  try {
    const garage = await db.garage.findUnique({
      where: { id: garageId },
      select: {
        id: true,
        name: true,
        accountStatus: true,
        suspendedAt: true,
        suspensionReason: true,
        active: true,
        validationStatus: true,
      },
    });

    // Garage non trouvé
    if (!garage) {
      return {
        allowed: false,
        message: 'Garage non trouvé.',
      };
    }

    // Vérifier si le garage est validé
    if (garage.validationStatus !== 'APPROVED') {
      return {
        allowed: false,
        message: 'Ce garage n\'est pas encore validé.',
        garage: {
          id: garage.id,
          name: garage.name,
          accountStatus: garage.accountStatus,
          suspendedAt: garage.suspendedAt,
          suspensionReason: garage.suspensionReason,
        },
      };
    }

    // Vérifier si le compte est suspendu par l'admin
    if (garage.accountStatus === 'SUSPENDED_BY_ADMIN') {
      const suspensionDate = garage.suspendedAt
        ? new Date(garage.suspendedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'date inconnue';

      const reasonText = garage.suspensionReason
        ? ` Motif: ${garage.suspensionReason}`
        : '';

      return {
        allowed: false,
        message: `Ce compte a été suspendu le ${suspensionDate}.${reasonText} Contactez l'administration OKAR pour plus d'informations.`,
        garage: {
          id: garage.id,
          name: garage.name,
          accountStatus: garage.accountStatus,
          suspendedAt: garage.suspendedAt,
          suspensionReason: garage.suspensionReason,
        },
      };
    }

    // Vérifier si le garage est désactivé (champ active)
    if (!garage.active) {
      return {
        allowed: false,
        message: 'Ce garage est actuellement désactivé. Contactez l\'administration OKAR.',
        garage: {
          id: garage.id,
          name: garage.name,
          accountStatus: garage.accountStatus,
          suspendedAt: garage.suspendedAt,
          suspensionReason: garage.suspensionReason,
        },
      };
    }

    // Tout est OK
    return {
      allowed: true,
      message: 'Garage actif et autorisé.',
      garage: {
        id: garage.id,
        name: garage.name,
        accountStatus: garage.accountStatus,
        suspendedAt: garage.suspendedAt,
        suspensionReason: garage.suspensionReason,
      },
    };
  } catch (error) {
    console.error('Erreur lors de la vérification du statut du garage:', error);
    return {
      allowed: false,
      message: 'Erreur lors de la vérification du statut du garage.',
    };
  }
}

/**
 * Vérifie si un garage peut être suspendu
 * 
 * @param garageId - L'ID du garage à vérifier
 * @returns boolean indiquant si le garage peut être suspendu
 */
export async function canSuspendGarage(garageId: string): Promise<boolean> {
  try {
    const garage = await db.garage.findUnique({
      where: { id: garageId },
      select: {
        accountStatus: true,
        validationStatus: true,
      },
    });

    // Un garage ne peut être suspendu que s'il est approuvé et actif
    return garage?.validationStatus === 'APPROVED' && garage.accountStatus === 'ACTIVE';
  } catch {
    return false;
  }
}

/**
 * Vérifie si un garage peut être réactivé
 * 
 * @param garageId - L'ID du garage à vérifier
 * @returns boolean indiquant si le garage peut être réactivé
 */
export async function canReactivateGarage(garageId: string): Promise<boolean> {
  try {
    const garage = await db.garage.findUnique({
      where: { id: garageId },
      select: {
        accountStatus: true,
      },
    });

    return garage?.accountStatus === 'SUSPENDED_BY_ADMIN';
  } catch {
    return false;
  }
}
