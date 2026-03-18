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

// GET - Fetch Voyageurs (type: voyageur)
export async function GET() {
  try {
    // Get all Voyageur vehicles using raw SQL
    const vehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT
        id, reference, type, lotId, garageId,
        ownerFirstName, ownerLastName, ownerPhone,
        vehicleType, status, createdAt
      FROM Vehicle
      WHERE type = 'voyageur'
      ORDER BY createdAt DESC
    `;

    // Get garages with voyageur vehicles
    const garagesRaw = await db.$queryRaw<GarageRow[]>`
      SELECT DISTINCT g.id, g.name
      FROM Garage g
      INNER JOIN Vehicle v ON g.id = v.garageId
      WHERE v.type = 'voyageur'
      ORDER BY g.name ASC
    `;

    // Build garage map
    const garageMap = new Map<string, GarageRow>();
    (garagesRaw || []).forEach(g => garageMap.set(g.id, g));

    // Group vehicles by owner
    const ownersMap = new Map<string, {
      id: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      garageId: string | null;
      garage: { id: string; name: string } | null;
      vehicleCount: number;
      vehicles: VehicleRow[];
      createdAt: Date;
      vehicleIds: string[];
    }>();

    (vehicles || []).forEach(vehicle => {
      // Create a unique key using JSON stringify
      const keyData = {
        firstName: vehicle.ownerFirstName || '',
        lastName: vehicle.ownerLastName || '',
        phone: vehicle.ownerPhone || '',
        garageId: vehicle.garageId || ''
      };
      const key = JSON.stringify(keyData);

      if (!ownersMap.has(key)) {
        const garage = vehicle.garageId ? garageMap.get(vehicle.garageId) : null;
        ownersMap.set(key, {
          id: key,
          firstName: vehicle.ownerFirstName,
          lastName: vehicle.ownerLastName,
          phone: vehicle.ownerPhone,
          garageId: vehicle.garageId,
          garage: garage ? { id: garage.id, name: garage.name } : null,
          vehicleCount: 0,
          vehicles: [],
          createdAt: new Date(vehicle.createdAt),
          vehicleIds: []
        });
      }

      const owner = ownersMap.get(key)!;
      owner.vehicles.push(vehicle);
      owner.vehicleCount = owner.vehicles.length;
      owner.vehicleIds.push(vehicle.id);
    });

    // Convert to array and sort
    const owners = Array.from(ownersMap.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    return NextResponse.json({
      owners,
      garages: garagesRaw || []
    });
  } catch (error) {
    console.error('Error fetching voyageurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voyageurs' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a owner and all their vehicles
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerKey = searchParams.get('id');

    if (!ownerKey) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    console.log('[DELETE VOYAGEUR] Key received:', ownerKey);

    // Parse the key
    let keyData: { firstName: string; lastName: string; phone: string; garageId: string };
    try {
      keyData = JSON.parse(ownerKey);
    } catch {
      console.error('[DELETE VOYAGEUR] Failed to parse key');
      return NextResponse.json({ error: 'Clé invalide' }, { status: 400 });
    }

    const { firstName, lastName, phone, garageId } = keyData;

    console.log('[DELETE VOYAGEUR] Parsed:', { firstName, lastName, phone, garageId });

    // Find vehicles using raw SQL
    const vehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT id, reference
      FROM Vehicle
      WHERE type = 'voyageur'
        AND (ownerFirstName = ${firstName || null} OR (${firstName || ''} = '' AND ownerFirstName IS NULL))
        AND (ownerLastName = ${lastName || null} OR (${lastName || ''} = '' AND ownerLastName IS NULL))
        AND (ownerPhone = ${phone || null} OR (${phone || ''} = '' AND ownerPhone IS NULL))
        AND (garageId = ${garageId || null} OR (${garageId || ''} = '' AND garageId IS NULL))
    `;

    console.log(`[DELETE VOYAGEUR] Found ${vehicles?.length || 0} vehicles`);

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        error: 'Voyageur non trouvé',
        key: keyData
      }, { status: 404 });
    }

    const vehicleIds = vehicles.map(v => v.id);

    // Delete maintenance records first
    if (vehicleIds.length > 0) {
      const placeholders = vehicleIds.map(() => '?').join(',');
      await db.$executeRawUnsafe(
        `DELETE FROM MaintenanceRecord WHERE vehicleId IN (${placeholders})`,
        ...vehicleIds
      );

      // Delete vehicles
      await db.$executeRawUnsafe(
        `DELETE FROM Vehicle WHERE id IN (${placeholders})`,
        ...vehicleIds
      );
    }

    console.log(`[DELETE VOYAGEUR] Deleted ${vehicles.length} vehicles`);

    return NextResponse.json({
      success: true,
      deletedCount: vehicles.length,
      deletedReferences: vehicles.map(v => v.reference)
    });
  } catch (error) {
    console.error('Error deleting owner:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: String(error) },
      { status: 500 }
    );
  }
}
