import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// Vehicle row type
interface VehicleRow {
  id: string;
  reference: string;
  type: string;
  lotId: string | null;
  garageId: string | null;
  status: string;
}

// Garage row type
interface GarageRow {
  id: string;
  name: string;
  slug: string;
}

// PUT - Declare vehicle as lost/stolen
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get vehicle using raw SQL
    const vehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT id, reference, type, lotId, garageId, status
      FROM Vehicle WHERE id = ${id} LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const vehicle = vehicles[0];

    // Only allow declaring active or scanned vehicles as lost
    if (vehicle.status !== 'active' && vehicle.status !== 'scanned') {
      return NextResponse.json(
        { error: 'Cannot declare this vehicle as lost' },
        { status: 400 }
      );
    }

    // Get garage if exists
    let garage: GarageRow | null = null;
    if (vehicle.garageId) {
      const garages = await db.$queryRaw<GarageRow[]>`
        SELECT id, name, slug FROM Garage WHERE id = ${vehicle.garageId} LIMIT 1
      `;
      garage = garages && garages.length > 0 ? garages[0] : null;
    }

    // Update vehicle status and set declaredLostAt timestamp
    const now = new Date().toISOString();
    await db.$executeRaw`
      UPDATE Vehicle SET status = 'lost', declaredLostAt = ${now} WHERE id = ${id}
    `;

    // Create notification for SuperAdmin using raw SQL
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, garageId, vehicleId, message, data, read, createdAt, updatedAt)
      VALUES (
        ${notificationId},
        'vehicle_declared_lost',
        null,
        ${vehicle.garageId},
        ${vehicle.id},
        ${`🚨 Le garage ${garage?.name || 'Inconnu'} a déclaré le véhicule ${vehicle.reference} comme perdu`},
        ${JSON.stringify({
          reference: vehicle.reference,
          garageName: garage?.name,
          type: vehicle.type,
        })},
        0,
        ${now},
        ${now}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Vehicle declared as lost',
      vehicle: {
        id: vehicle.id,
        reference: vehicle.reference,
        status: 'lost',
        declaredLostAt: now,
      }
    });

  } catch (error) {
    console.error('Declare lost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
