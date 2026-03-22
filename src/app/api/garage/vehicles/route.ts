import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// Vehicle row type for raw query results
interface VehicleRow {
  id: string;
  reference: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  currentMileage: number | null;
  engineType: string | null;
  licensePlate: string | null;
  qrStatus: string;
  status: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  garageId: string | null;
  lotId: string | null;
  activatedAt: string | null;
  createdAt: string;
}

// GET - List all vehicles for a garage
export async function GET(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await getSession();
    
    if (!session || !session.garageId) {
      return NextResponse.json(
        {
          error: 'Non autorisé',
          vehicles: [],
          stats: { total: 0, active: 0, inactive: 0, blocked: 0 }
        },
        { status: 401 }
      );
    }

    const garageId = session.garageId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const qrStatus = searchParams.get('qrStatus');
    const search = searchParams.get('search');

    // Build the query dynamically based on filters
    let whereClause = 'WHERE garageId = ?';
    const params: (string | number)[] = [garageId];

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (qrStatus && qrStatus !== 'all') {
      whereClause += ' AND qrStatus = ?';
      params.push(qrStatus);
    }

    if (search) {
      whereClause += ' AND (reference LIKE ? OR vin LIKE ? OR licensePlate LIKE ? OR ownerName LIKE ? OR make LIKE ? OR model LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const query = `
      SELECT
        id, reference, vin, make, model, year, color, currentMileage, engineType,
        licensePlate, qrStatus, status, ownerId, ownerName, ownerPhone,
        garageId, lotId, activatedAt, createdAt
      FROM Vehicle
      ${whereClause}
      ORDER BY createdAt DESC
    `;

    const vehicles = await db.$queryRawUnsafe<VehicleRow[]>(query, ...params);

    // Get maintenance counts for each vehicle (all records for garage view)
    const vehicleIds = vehicles.map(v => v.id);
    const maintenanceCounts: { vehicleId: string; count: bigint }[] = vehicleIds.length > 0 
      ? await db.$queryRawUnsafe(
          `SELECT vehicleId, COUNT(*) as count 
           FROM MaintenanceRecord 
           WHERE vehicleId IN (${vehicleIds.map(() => '?').join(',')})
           GROUP BY vehicleId`,
          ...vehicleIds
        )
      : [];

    const countMap = new Map(maintenanceCounts.map(m => [m.vehicleId, Number(m.count)]));

    // Transform to match frontend interface
    const transformedVehicles = vehicles.map(v => ({
      id: v.id,
      reference: v.reference,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      licensePlate: v.licensePlate,
      mileage: v.currentMileage,
      qrStatus: v.qrStatus,
      ownerName: v.ownerName,
      ownerPhone: v.ownerPhone,
      activatedAt: v.activatedAt,
      maintenanceCount: countMap.get(v.id) || 0,
    }));

    // Calculate stats
    const stats = {
      total: vehicles.length,
      active: vehicles.filter(v => v.qrStatus === 'ACTIVE').length,
      inactive: vehicles.filter(v => v.qrStatus === 'INACTIVE').length,
      blocked: vehicles.filter(v => v.qrStatus === 'BLOCKED').length,
    };

    return NextResponse.json({
      vehicles: transformedVehicles,
      stats
    });

  } catch (error) {
    console.error('Get garage vehicles error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      vehicles: [],
      stats: { total: 0, active: 0, inactive: 0, blocked: 0 }
    }, { status: 500 });
  }
}

// POST - Create a new vehicle for a garage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      garageId,
      lotId,
      reference,
      make,
      model,
      year,
      color,
      licensePlate,
      vin,
      engineType,
      ownerName,
      ownerPhone,
    } = body;

    if (!garageId || !reference) {
      return NextResponse.json(
        { error: 'Garage ID et référence sont requis' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Insert vehicle using raw SQL
    await db.$executeRaw`
      INSERT INTO Vehicle (
        id, reference, garageId, lotId,
        make, model, year, color, licensePlate, vin, engineType,
        ownerName, ownerPhone,
        qrStatus, status, createdAt, updatedAt
      ) VALUES (
        gen_random_uuid(), ${reference}, ${garageId}, ${lotId || null},
        ${make || null}, ${model || null}, ${year || null}, ${color || null},
        ${licensePlate || null}, ${vin || null}, ${engineType || 'essence'},
        ${ownerName || null}, ${ownerPhone || null},
        'INACTIVE', 'pending_activation', ${now}, ${now}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Véhicule créé avec succès'
    });

  } catch (error) {
    console.error('Create vehicle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
