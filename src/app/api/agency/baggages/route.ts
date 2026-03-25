import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Vehicle type for raw query results (using new Vehicle table)
interface VehicleRow {
  id: string;
  reference: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
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
  expiresAt: string | null;
}

// GET - List all vehicles for a garage (backward compatible with baggages naming)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('agencyId') || searchParams.get('garageId');
    const status = searchParams.get('status');
    const qrStatus = searchParams.get('qrStatus');
    const search = searchParams.get('search');

    if (!garageId) {
      return NextResponse.json(
        { error: 'Garage ID is required', baggages: [], vehicles: [], stats: { total: 0, active: 0, inactive: 0, blocked: 0 } },
        { status: 400 }
      );
    }

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
        id, reference, vin, make, model, year, color, mileage, engineType,
        licensePlate, qrStatus, status, ownerId, ownerName, ownerPhone,
        garageId, lotId, activatedAt, createdAt, expiresAt
      FROM Vehicle
      ${whereClause}
      ORDER BY createdAt DESC
    `;

    const vehicles = await db.$queryRawUnsafe<VehicleRow[]>(query, ...params);

    // Calculate stats
    const stats = {
      total: vehicles.length,
      active: vehicles.filter(v => v.qrStatus === 'ACTIVE').length,
      inactive: vehicles.filter(v => v.qrStatus === 'INACTIVE').length,
      blocked: vehicles.filter(v => v.qrStatus === 'BLOCKED').length,
    };

    // Return with backward compatible key name
    return NextResponse.json({
      baggages: vehicles, // backward compatible
      vehicles,
      stats
    });

  } catch (error) {
    console.error('Get garage vehicles error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      baggages: [],
      vehicles: [],
      stats: { total: 0, active: 0, inactive: 0, blocked: 0 }
    }, { status: 500 });
  }
}
