import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Vehicle row type for raw queries
interface VehicleRow {
  id: string;
  reference: string;
  qrStatus: string;
  status: string;
  garageId: string | null;
  lotId: string | null;
  createdAt: string;
}

// Garage row type
interface GarageRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isCertified: boolean;
}

// Validation schema for vehicle activation
const activateSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
  // Vehicle info
  make: z.string().min(1, 'Marque est requise'),
  model: z.string().min(1, 'Modèle est requis'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  licensePlate: z.string().optional(),
  vin: z.string().optional(),
  engineType: z.enum(['essence', 'diesel', 'hybride', 'electrique']).optional(),
  mileage: z.number().int().min(0).optional(),
  // Owner info
  ownerName: z.string().min(1, 'Nom du propriétaire est requis'),
  ownerPhone: z.string().min(1, 'Téléphone est requis'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    // Find the vehicle by reference using raw SQL
    const vehicleRows = await db.$queryRaw<VehicleRow[]>`
      SELECT id, reference, qrStatus, status, garageId, lotId, createdAt
      FROM Vehicle
      WHERE reference = ${validatedData.reference}
      LIMIT 1
    `;

    if (!vehicleRows || vehicleRows.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found', message: 'Code QR non valide' },
        { status: 404 }
      );
    }

    const vehicle = vehicleRows[0];

    if (vehicle.qrStatus !== 'INACTIVE') {
      return NextResponse.json(
        { error: 'Already activated', message: 'Ce véhicule a déjà été activé' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update vehicle with info using raw SQL
    await db.$executeRaw`
      UPDATE Vehicle SET
        make = ${validatedData.make},
        model = ${validatedData.model},
        year = ${validatedData.year || null},
        color = ${validatedData.color || null},
        licensePlate = ${validatedData.licensePlate || null},
        vin = ${validatedData.vin || null},
        engineType = ${validatedData.engineType || 'essence'},
        mileage = ${validatedData.mileage || 0},
        ownerName = ${validatedData.ownerName},
        ownerPhone = ${validatedData.ownerPhone},
        qrStatus = 'ACTIVE',
        status = 'active',
        activatedAt = ${now},
        updatedAt = ${now}
      WHERE id = ${vehicle.id}
    `;

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        reference: vehicle.reference,
        qrStatus: 'ACTIVE',
        status: 'active',
        activatedAt: now,
      }
    });

  } catch (error) {
    console.error('Activation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
