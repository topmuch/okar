import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single vehicle details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vehicles = await db.$queryRaw<any[]>`
      SELECT 
        v.*,
        g.name as garageName,
        g.isCertified as garageCertified,
        l.prefix as lotPrefix,
        l.status as lotStatus
      FROM Vehicle v
      LEFT JOIN Garage g ON v.garageId = g.id
      LEFT JOIN QRCodeLot l ON v.lotId = l.id
      WHERE v.id = ${id}
      LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // Get maintenance records
    const maintenanceRecords = await db.$queryRaw<any[]>`
      SELECT 
        m.*,
        g.name as garageName
      FROM MaintenanceRecord m
      LEFT JOIN Garage g ON m.garageId = g.id
      WHERE m.vehicleId = ${id}
      ORDER BY m.createdAt DESC
    `;

    // Get ownership history
    const ownershipHistory = await db.$queryRaw<any[]>`
      SELECT * FROM OwnershipHistory
      WHERE vehicleId = ${id}
      ORDER BY createdAt DESC
    `;

    return NextResponse.json({
      vehicle,
      maintenanceRecords,
      ownershipHistory
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete vehicle (only if INACTIVE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if vehicle is inactive
    const vehicles = await db.$queryRaw<any[]>`
      SELECT qrStatus FROM Vehicle WHERE id = ${id} LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });
    }

    if (vehicles[0].qrStatus === 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Impossible de supprimer un véhicule avec QR actif' 
      }, { status: 400 });
    }

    // Delete vehicle
    await db.$executeRaw`DELETE FROM Vehicle WHERE id = ${id}`;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      make,
      model,
      year,
      color,
      mileage,
      engineType,
      licensePlate,
      vin,
      ownerName,
      ownerPhone,
      ownerId,
    } = body;

    const now = new Date().toISOString();

    await db.$executeRaw`
      UPDATE Vehicle SET
        make = ${make || null},
        model = ${model || null},
        year = ${year || null},
        color = ${color || null},
        mileage = ${mileage || null},
        engineType = ${engineType || 'essence'},
        licensePlate = ${licensePlate || null},
        vin = ${vin || null},
        ownerName = ${ownerName || null},
        ownerPhone = ${ownerPhone || null},
        ownerId = ${ownerId || null},
        updatedAt = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update vehicle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
