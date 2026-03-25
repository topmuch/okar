import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// Schéma de validation
const submitInterventionSchema = z.object({
  vehicleId: z.string().min(1, "ID véhicule requis"),
  type: z.string().min(1, "Type d'intervention requis"),
  description: z.string().min(10, "Description minimale de 10 caractères"),
  cost: z.number().min(0).optional(),
  mileage: z.number().int().min(0).optional(),
});

/**
 * POST - Enregistrer une intervention
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.role !== 'garage' || !session.garageId) {
      return NextResponse.json({ error: 'Accès réservé aux garages' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = submitInterventionSchema.parse(body);

    // Vérifier le véhicule
    const vehicle = await db.vehicle.findUnique({
      where: { id: validatedData.vehicleId }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });
    }

    // Créer l'intervention
    const record = await db.maintenanceRecord.create({
      data: {
        type: validatedData.type,
        description: validatedData.description,
        cost: validatedData.cost || 0,
        mileage: validatedData.mileage || vehicle.mileage || 0,
        vehicleId: validatedData.vehicleId,
        garageId: session.garageId,
      }
    });

    // Mettre à jour le kilométrage du véhicule si fourni
    if (validatedData.mileage && validatedData.mileage > (vehicle.mileage || 0)) {
      await db.vehicle.update({
        where: { id: validatedData.vehicleId },
        data: { mileage: validatedData.mileage }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Intervention enregistrée avec succès',
      record
    });

  } catch (error) {
    console.error('Submit intervention error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur de validation',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

/**
 * GET - Récupérer les interventions du garage
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.role !== 'garage' || !session.garageId) {
      return NextResponse.json({ error: 'Accès réservé aux garages' }, { status: 403 });
    }

    const records = await db.maintenanceRecord.findMany({
      where: { garageId: session.garageId },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            licensePlate: true,
          }
        }
      },
      orderBy: { performedAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ records });

  } catch (error) {
    console.error('Get interventions error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
