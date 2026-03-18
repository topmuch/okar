import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Vehicle row type
interface VehicleRow {
  id: string;
  reference: string;
  type: string;
  lotId: string | null;
  garageId: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerPhone: string | null;
  vehicleType: string;
  status: string;
  createdAt: string;
}

// Garage row type
interface GarageRow {
  id: string;
  name: string;
}

// GET - Fetch Hajj pilgrims with their vehicles
export async function GET() {
  try {
    // Get all Hajj vehicles using raw SQL
    const vehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT
        id, reference, type, lotId, garageId,
        ownerFirstName, ownerLastName, ownerPhone,
        vehicleType, status, createdAt
      FROM Vehicle
      WHERE type = 'hajj'
      ORDER BY createdAt DESC
    `;

    // Get garages with hajj vehicles
    const garagesRaw = await db.$queryRaw<GarageRow[]>`
      SELECT DISTINCT g.id, g.name
      FROM Garage g
      INNER JOIN Vehicle v ON g.id = v.garageId
      WHERE v.type = 'hajj'
      ORDER BY g.name ASC
    `;

    // Build garage map for quick lookup
    const garageMap = new Map<string, GarageRow>();
    (garagesRaw || []).forEach(g => garageMap.set(g.id, g));

    // Group vehicles by owner (firstName + lastName combination)
    const pilgrimsMap = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      garageId: string | null;
      garage: { id: string; name: string } | null;
      createdAt: Date;
      vehicles: VehicleRow[];
    }>();

    (vehicles || []).forEach(vehicle => {
      const key = `${vehicle.ownerFirstName || 'Unknown'}_${vehicle.ownerLastName || 'Unknown'}_${vehicle.garageId || 'no-garage'}`;

      if (!pilgrimsMap.has(key)) {
        const garage = vehicle.garageId ? garageMap.get(vehicle.garageId) : null;
        pilgrimsMap.set(key, {
          id: key,
          firstName: vehicle.ownerFirstName || 'Unknown',
          lastName: vehicle.ownerLastName || 'Unknown',
          phone: vehicle.ownerPhone,
          garageId: vehicle.garageId,
          garage: garage ? { id: garage.id, name: garage.name } : null,
          createdAt: new Date(vehicle.createdAt),
          vehicles: []
        });
      }

      pilgrimsMap.get(key)!.vehicles.push(vehicle);
    });

    // Convert to array and sort by creation date
    const pilgrims = Array.from(pilgrimsMap.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    return NextResponse.json({
      pilgrims,
      garages: garagesRaw || []
    });
  } catch (error) {
    console.error('Error fetching Hajj pilgrims:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pèlerins' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pilgrim and all their vehicles
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pilgrimKey = searchParams.get('id');

    if (!pilgrimKey) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Parse the key to get owner info
    const [firstName, lastName, garagePart] = pilgrimKey.split('_');
    const garageId = garagePart === 'no-garage' ? null : garagePart;

    // Delete all vehicles for this pilgrim using raw SQL
    await db.$executeRaw`
      DELETE FROM Vehicle
      WHERE type = 'hajj'
        AND ownerFirstName = ${firstName}
        AND ownerLastName = ${lastName}
        AND garageId = ${garageId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pilgrim:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
