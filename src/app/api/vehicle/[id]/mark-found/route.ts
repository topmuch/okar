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

// PUT - Mark lost vehicle as found
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

    // Only allow marking lost vehicles as found
    if (vehicle.status !== 'lost') {
      return NextResponse.json(
        { error: 'This vehicle is not marked as lost' },
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

    const now = new Date().toISOString();

    // Update vehicle status and set foundAt timestamp
    await db.$executeRaw`
      UPDATE Vehicle SET status = 'found', foundAt = ${now} WHERE id = ${id}
    `;

    // Mark existing "vehicle_declared_lost" notifications for this vehicle as read
    await db.$executeRaw`
      UPDATE Notification SET read = 1, updatedAt = ${now}
      WHERE vehicleId = ${id} AND type = 'vehicle_declared_lost' AND read = 0
    `;

    // Create notification for SuperAdmin
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, garageId, vehicleId, message, data, read, createdAt, updatedAt)
      VALUES (
        ${notificationId},
        'vehicle_found',
        null,
        ${vehicle.garageId},
        ${vehicle.id},
        ${`Le véhicule ${vehicle.reference} a été marqué comme retrouvé !`},
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
      message: 'Vehicle marked as found',
      vehicle: {
        id: vehicle.id,
        reference: vehicle.reference,
        status: 'found',
        foundAt: now,
      }
    });

  } catch (error) {
    console.error('Mark found error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
