import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getSession } from '@/lib/session';

// Validation schema
const suspendSchema = z.object({
  garageId: z.string().min(1, 'ID du garage requis'),
  action: z.enum(['suspend', 'reactivate']),
  reason: z.string().optional(),
});

/**
 * POST - Suspendre ou réactiver un garage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Accès non autorisé. Droits Superadmin requis.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = suspendSchema.parse(body);

    const garage = await db.garage.findUnique({
      where: { id: validatedData.garageId },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    let updatedGarage;

    if (validatedData.action === 'suspend') {
      if (!validatedData.reason?.trim()) {
        return NextResponse.json(
          { error: 'Le motif de suspension est requis.' },
          { status: 400 }
        );
      }

      updatedGarage = await db.garage.update({
        where: { id: validatedData.garageId },
        data: {
          isActive: false,
        },
      });

    } else {
      updatedGarage = await db.garage.update({
        where: { id: validatedData.garageId },
        data: {
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      garage: {
        id: updatedGarage.id,
        name: updatedGarage.name,
        isActive: updatedGarage.isActive,
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
 * GET - Récupérer le statut d'un garage
 */
export async function GET(request: NextRequest) {
  try {
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

    const garage = await db.garage.findUnique({
      where: { id: garageId },
      select: {
        id: true,
        name: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ garage });

  } catch (error) {
    console.error('Erreur récupération garage:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
