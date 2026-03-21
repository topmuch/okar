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
  lastScanDate: string | null;
  lastLocation: string | null;
}

// Garage row type
interface GarageRow {
  id: string;
  name: string;
}

// GET - List all owners with their vehicles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const garageId = searchParams.get('garageId');
    const search = searchParams.get('search');

    // Build where conditions for raw SQL
    const conditions: string[] = ['ownerFirstName IS NOT NULL'];
    const params: (string | number)[] = [];

    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }

    if (garageId && garageId !== 'all') {
      conditions.push('garageId = ?');
      params.push(garageId);
    }

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    // Search conditions
    if (search) {
      conditions.push('(ownerFirstName LIKE ? OR ownerLastName LIKE ? OR reference LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm.toUpperCase());
    }

    const whereClause = conditions.join(' AND ');

    // Get all activated vehicles using raw SQL
    const vehicles = await db.$queryRawUnsafe<VehicleRow[]>(
      `SELECT
        id, reference, type, lotId, garageId,
        ownerFirstName, ownerLastName, ownerPhone,
        vehicleType, status, createdAt,
        lastScanDate, lastLocation
       FROM Vehicle
       WHERE ${whereClause}
       ORDER BY createdAt DESC`,
      ...params
    );

    // Get garages for lookup
    const garages = await db.$queryRaw<GarageRow[]>`
      SELECT id, name FROM Garage
    `;

    const garageMap = new Map<string, string>();
    (garages || []).forEach(g => garageMap.set(g.id, g.name));

    // Group by owner (first name + last name + phone)
    const ownersMap = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      type: string;
      garageName: string | null;
      vehicles: VehicleRow[];
      lastScan: Date | null;
    }>();

    (vehicles || []).forEach((vehicle) => {
      const key = `${vehicle.ownerFirstName}_${vehicle.ownerLastName}_${vehicle.ownerPhone}`;

      if (!ownersMap.has(key)) {
        ownersMap.set(key, {
          id: key,
          firstName: vehicle.ownerFirstName || '',
          lastName: vehicle.ownerLastName || '',
          phone: vehicle.ownerPhone || '',
          type: vehicle.type,
          garageName: vehicle.garageId ? (garageMap.get(vehicle.garageId) || null) : null,
          vehicles: [],
          lastScan: null,
        });
      }

      const owner = ownersMap.get(key)!;
      owner.vehicles.push(vehicle);

      // Update last scan
      if (vehicle.lastScanDate) {
        const scanDate = new Date(vehicle.lastScanDate);
        if (!owner.lastScan || scanDate > owner.lastScan) {
          owner.lastScan = scanDate;
        }
      }
    });

    // Convert to array
    const owners = Array.from(ownersMap.values()).map((owner) => ({
      ...owner,
      vehicles: owner.vehicles.map((v) => ({
        id: v.id,
        reference: v.reference,
        type: v.type,
        vehicleType: v.vehicleType,
        status: v.status,
        lastScanDate: v.lastScanDate,
        lastLocation: v.lastLocation,
      })),
      lastScan: owner.lastScan?.toISOString() || null,
    }));

    return NextResponse.json({
      owners,
      total: owners.length,
    });

  } catch (error) {
    console.error('Get travelers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
