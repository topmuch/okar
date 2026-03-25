import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Vehicle row type for raw query
interface VehicleRow {
  id: string;
  reference: string;
  type: string;
  lotId: string | null;
  garageId: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  vehicleType: string;
  status: string;
  createdAt: string;
}

// Garage row type for raw query
interface GarageRow {
  id: string;
  name: string;
}

// GET - List all QR code sets, optionally filtered by type and grouped by garage
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'hajj' or 'voyageur'
    const search = searchParams.get('search');
    const garageId = searchParams.get('garageId');

    // Build where clause
    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    
    if (type && type !== 'all') {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    if (garageId) {
      whereClause += ' AND garageId = ?';
      params.push(garageId);
    }
    
    if (search) {
      whereClause += ' AND (reference LIKE ? OR lotId LIKE ? OR ownerFirstName LIKE ? OR ownerLastName LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm.toUpperCase(), searchTerm.toUpperCase(), searchTerm, searchTerm);
    }

    const query = `
      SELECT v.id, v.reference, v.type, v.lotId, v.garageId, 
             v.ownerFirstName, v.ownerLastName, v.vehicleType, v.status, v.createdAt,
             g.name as garageName
      FROM Vehicle v
      LEFT JOIN Garage g ON v.garageId = g.id
      ${whereClause}
      ORDER BY v.createdAt DESC
    `;

    const vehicles = await db.$queryRawUnsafe<(VehicleRow & { garageName: string | null })[]>(query, ...params);

    // Group by lotId or create virtual lots based on reference prefix (first part before -)
    const lotsMap = new Map<string, {
      id: string;
      lotId: string;
      type: string;
      garageId: string | null;
      garageName: string | null;
      createdAt: Date;
      qrCount: number;
      references: string[];
      status: string;
      ownerName: string | null;
      vehicleIds: string[];
    }>();

    (vehicles || []).forEach((vehicle) => {
      // Use lotId if available, otherwise group by reference prefix (e.g., HAJJ26)
      const lotId = vehicle.lotId || vehicle.reference.split('-')[0];
      
      if (!lotsMap.has(lotId)) {
        lotsMap.set(lotId, {
          id: lotId,
          lotId: lotId,
          type: vehicle.type,
          garageId: vehicle.garageId,
          garageName: vehicle.garageName,
          createdAt: new Date(vehicle.createdAt),
          qrCount: 0,
          references: [],
          status: 'generated',
          ownerName: vehicle.ownerFirstName 
            ? `${vehicle.ownerFirstName} ${vehicle.ownerLastName || ''}`.trim()
            : null,
          vehicleIds: [],
        });
      }
      
      const lot = lotsMap.get(lotId)!;
      lot.qrCount++;
      lot.references.push(vehicle.reference);
      lot.vehicleIds.push(vehicle.id);
    });

    // Convert to array and sort by date
    const lots = Array.from(lotsMap.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate stats
    const stats = {
      totalLots: lots.length,
      totalQr: vehicles?.length || 0,
      hajjLots: lots.filter(s => s.type === 'hajj').length,
      voyageurLots: lots.filter(s => s.type === 'voyageur').length,
    };

    return NextResponse.json({
      sets: lots,
      stats,
    });

  } catch (error) {
    console.error('Get QR codes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a QR code lot
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lotId = searchParams.get('lotId');

    if (!lotId) {
      return NextResponse.json(
        { error: 'Lot ID is required' },
        { status: 400 }
      );
    }

    console.log(`[DELETE QR] Attempting to delete lot: ${lotId}`);

    // Find all vehicles matching this lot
    const vehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT id, reference
      FROM Vehicle
      WHERE lotId = ${lotId} OR reference LIKE ${`${lotId}-%`}
    `;

    if (!vehicles || vehicles.length === 0) {
      console.log(`[DELETE QR] No vehicles found for lot: ${lotId}`);
      return NextResponse.json(
        { error: 'Lot not found', lotId },
        { status: 404 }
      );
    }

    console.log(`[DELETE QR] Found ${vehicles.length} vehicles:`, vehicles.map(v => v.reference));

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

    console.log(`[DELETE QR] Successfully deleted ${vehicles.length} vehicles`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: vehicles.length,
      lotId,
      deletedReferences: vehicles.map(v => v.reference)
    });

  } catch (error) {
    console.error('Delete QR code lot error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
