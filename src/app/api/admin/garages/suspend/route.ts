import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getSession } from '@/lib/session';

// Validation schema
const suspendSchema = z.object({
  garageId: z.string().min(1, 'ID du garage requis'),
  action: z.enum(['suspend', 'reactivate']),
  reason: z.string().optional(),
  force: z.boolean().optional(), // Force suspension even with pending interventions
});

/**
 * POST - Suspendre ou réactiver un garage
 * 
 * Body: { garageId, action: 'suspend' | 'reactivate', reason?, force? }
 * 
 * Sécurité: Seul le Superadmin peut modifier accountStatus
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les droits
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur pour vérifier le rôle
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user || user.role !== 'superadmin') {
      // Log la tentative d'accès non autorisé
      await db.auditLog.create({
        data: {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          action: 'UNAUTHORIZED_SUSPENSION_ATTEMPT',
          entityType: 'GARAGE',
          entityId: 'unknown',
          userId: session.id,
          userEmail: user?.email || 'unknown',
          details: JSON.stringify({
            message: 'Tentative de suspension sans droit superadmin',
          }),
        },
      });

      return NextResponse.json(
        { error: 'Accès non autorisé. Droits Superadmin requis.' },
        { status: 403 }
      );
    }

    // Valider les données
    const body = await request.json();
    const validatedData = suspendSchema.parse(body);

    // Récupérer le garage
    const garage = await db.garage.findUnique({
      where: { id: validatedData.garageId },
      select: {
        id: true,
        name: true,
        accountStatus: true,
        validationStatus: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le garage est approuvé
    if (garage.validationStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Ce garage n\'est pas encore validé. Impossible de modifier son statut.' },
        { status: 400 }
      );
    }

    let updatedGarage;
    let auditAction: string;
    let auditDetails: Record<string, unknown>;

    if (validatedData.action === 'suspend') {
      // Vérifier qu'il n'est pas déjà suspendu
      if (garage.accountStatus === 'SUSPENDED_BY_ADMIN') {
        return NextResponse.json(
          { error: 'Ce garage est déjà suspendu.' },
          { status: 400 }
        );
      }

      // Vérifier que le motif est fourni pour la suspension
      if (!validatedData.reason?.trim()) {
        return NextResponse.json(
          { error: 'Le motif de suspension est requis.' },
          { status: 400 }
        );
      }

      // ⚠️ CRITICAL FIX: Vérifier les interventions en cours
      const pendingInterventions = await db.maintenanceRecord.count({
        where: {
          garageId: validatedData.garageId,
          status: 'PENDING',
        },
      });

      const pendingValidations = await db.maintenanceRecord.count({
        where: {
          garageId: validatedData.garageId,
          ownerValidation: 'PENDING',
        },
      });

      if ((pendingInterventions > 0 || pendingValidations > 0) && !validatedData.force) {
        return NextResponse.json(
          {
            error: 'ATTENTION: Interventions en cours détectées',
            message: `Ce garage a ${pendingInterventions} intervention(s) en cours et ${pendingValidations} validation(s) en attente. La suspension bloquera ces opérations.`,
            pendingInterventions,
            pendingValidations,
            requiresConfirmation: true,
            hint: 'Ajoutez "force: true" pour confirmer la suspension malgré les interventions en cours.',
          },
          { status: 400 }
        );
      }

      // Suspendre le garage
      updatedGarage = await db.garage.update({
        where: { id: validatedData.garageId },
        data: {
          accountStatus: 'SUSPENDED_BY_ADMIN',
          suspendedAt: new Date(),
          suspendedBy: user.id,
          suspensionReason: validatedData.reason.trim(),
        },
      });

      auditAction = 'SUSPEND_GARAGE';
      auditDetails = {
        previousStatus: garage.accountStatus,
        newStatus: 'SUSPENDED_BY_ADMIN',
        reason: validatedData.reason,
        garageName: garage.name,
        suspendedBy: user.name || user.email,
        pendingInterventions,
        pendingValidations,
        forced: validatedData.force || false,
      };

    } else {
      // Reactivation
      // Vérifier qu'il est bien suspendu
      if (garage.accountStatus !== 'SUSPENDED_BY_ADMIN') {
        return NextResponse.json(
          { error: 'Ce garage n\'est pas suspendu.' },
          { status: 400 }
        );
      }

      // Réactiver le garage
      updatedGarage = await db.garage.update({
        where: { id: validatedData.garageId },
        data: {
          accountStatus: 'ACTIVE',
          // On garde l'historique de suspension dans suspendedAt, suspendedBy, suspensionReason
          // pour consultation ultérieure
        },
      });

      auditAction = 'REACTIVATE_GARAGE';
      auditDetails = {
        previousStatus: 'SUSPENDED_BY_ADMIN',
        newStatus: 'ACTIVE',
        previousSuspensionReason: garage.suspensionReason,
        previousSuspendedAt: garage.suspendedAt,
        garageName: garage.name,
        reactivatedBy: user.name || user.email,
        reactivationReason: validatedData.reason,
      };
    }

    // Créer un log d'audit
    await db.auditLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        action: auditAction,
        entityType: 'GARAGE',
        entityId: garage.id,
        userId: user.id,
        userEmail: user.email,
        details: JSON.stringify(auditDetails),
        garageId: garage.id,
      },
    });

    return NextResponse.json({
      success: true,
      garage: {
        id: updatedGarage.id,
        name: updatedGarage.name,
        accountStatus: updatedGarage.accountStatus,
        suspendedAt: updatedGarage.suspendedAt,
        suspensionReason: updatedGarage.suspensionReason,
      },
      message: validatedData.action === 'suspend'
        ? 'Garage suspendu avec succès.'
        : 'Garage réactivé avec succès.',
    });

  } catch (error) {
    console.error('Erreur suspension garage:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupérer l'historique de suspension d'un garage
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garageId');

    if (!garageId) {
      return NextResponse.json(
        { error: 'ID du garage requis' },
        { status: 400 }
      );
    }

    // Récupérer les logs d'audit pour ce garage concernant les suspensions
    const auditLogs = await db.auditLog.findMany({
      where: {
        garageId,
        action: {
          in: ['SUSPEND_GARAGE', 'REACTIVATE_GARAGE'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Récupérer les infos actuelles du garage
    const garage = await db.garage.findUnique({
      where: { id: garageId },
      select: {
        id: true,
        name: true,
        accountStatus: true,
        suspendedAt: true,
        suspendedBy: true,
        suspensionReason: true,
        contractEndDate: true,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les infos de l'admin qui a suspendu
    let suspendedByUser = null;
    if (garage.suspendedBy) {
      suspendedByUser = await db.user.findUnique({
        where: { id: garage.suspendedBy },
        select: { id: true, name: true, email: true },
      });
    }

    return NextResponse.json({
      garage: {
        ...garage,
        suspendedByUser,
      },
      history: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        userEmail: log.userEmail,
        details: log.details ? JSON.parse(log.details) : null,
      })),
    });

  } catch (error) {
    console.error('Erreur récupération historique suspension:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
