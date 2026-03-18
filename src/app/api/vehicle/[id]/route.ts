import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// Vehicle row type (using new Vehicle table)
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

// Garage row type
interface GarageRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
}

// PUT - Update a vehicle by ID (backward compatible with baggage naming)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if vehicle exists using raw SQL
    const existingVehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT id, reference, qrStatus, status, ownerName, ownerPhone
      FROM Vehicle WHERE id = ${id} LIMIT 1
    `;

    if (!existingVehicles || existingVehicles.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Build UPDATE query dynamically for Vehicle fields
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    // Map old field names to new ones
    if (body.travelerFirstName !== undefined || body.travelerLastName !== undefined) {
      const ownerName = [body.travelerFirstName, body.travelerLastName].filter(Boolean).join(' ') || body.ownerName;
      updates.push('ownerName = ?');
      values.push(ownerName || null);
    }
    if (body.ownerName !== undefined) {
      updates.push('ownerName = ?');
      values.push(body.ownerName || null);
    }
    if (body.whatsappOwner !== undefined || body.ownerPhone !== undefined) {
      updates.push('ownerPhone = ?');
      values.push(body.whatsappOwner || body.ownerPhone || null);
    }
    if (body.make !== undefined) {
      updates.push('make = ?');
      values.push(body.make || null);
    }
    if (body.model !== undefined) {
      updates.push('model = ?');
      values.push(body.model || null);
    }
    if (body.year !== undefined) {
      updates.push('year = ?');
      values.push(body.year || null);
    }
    if (body.color !== undefined) {
      updates.push('color = ?');
      values.push(body.color || null);
    }
    if (body.licensePlate !== undefined) {
      updates.push('licensePlate = ?');
      values.push(body.licensePlate || null);
    }
    if (body.vin !== undefined) {
      updates.push('vin = ?');
      values.push(body.vin || null);
    }
    if (body.mileage !== undefined) {
      updates.push('mileage = ?');
      values.push(body.mileage || null);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.qrStatus !== undefined) {
      updates.push('qrStatus = ?');
      values.push(body.qrStatus);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id);
      await db.$executeRawUnsafe(
        `UPDATE Vehicle SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      );
    }

    // Fetch updated vehicle
    const updatedVehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT id, reference, ownerName, ownerPhone, status, qrStatus, make, model, licensePlate
      FROM Vehicle WHERE id = ${id} LIMIT 1
    `;

    const updatedVehicle = updatedVehicles[0];

    // Return with backward compatible key name
    return NextResponse.json({
      success: true,
      baggage: updatedVehicle, // backward compatible
      vehicle: updatedVehicle
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a vehicle by ID (only if INACTIVE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if vehicle exists and is inactive
    const existingVehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT id, qrStatus FROM Vehicle WHERE id = ${id} LIMIT 1
    `;

    if (!existingVehicles || existingVehicles.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Only allow deleting INACTIVE vehicles
    if (existingVehicles[0].qrStatus === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot delete a vehicle with active QR code' },
        { status: 400 }
      );
    }

    // Delete related maintenance records first
    await db.$executeRaw`DELETE FROM MaintenanceRecord WHERE vehicleId = ${id}`;

    // Delete ownership history
    await db.$executeRaw`DELETE FROM OwnershipHistory WHERE vehicleId = ${id}`;

    // Delete the vehicle
    await db.$executeRaw`DELETE FROM Vehicle WHERE id = ${id}`;

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get a single vehicle by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT
        id, reference, vin, make, model, year, color, mileage, engineType,
        licensePlate, qrStatus, status, ownerId, ownerName, ownerPhone,
        garageId, lotId, activatedAt, createdAt, expiresAt
      FROM Vehicle WHERE id = ${id} LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const vehicle = vehicles[0];

    // Get garage info if exists
    let garage: GarageRow | null = null;
    if (vehicle.garageId) {
      const garages = await db.$queryRaw<GarageRow[]>`
        SELECT id, name, slug, email, phone, address, logo
        FROM Garage WHERE id = ${vehicle.garageId} LIMIT 1
      `;
      garage = garages && garages.length > 0 ? garages[0] : null;
    }

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

    // Return with backward compatible key names
    return NextResponse.json({
      id: vehicle.id,
      reference: vehicle.reference,
      ownerName: vehicle.ownerName,
      ownerPhone: vehicle.ownerPhone,
      status: vehicle.status,
      qrStatus: vehicle.qrStatus,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
      mileage: vehicle.mileage,
      engineType: vehicle.engineType,
      garageId: vehicle.garageId,
      garage: garage ? {
        id: garage.id,
        name: garage.name,
        email: garage.email,
        phone: garage.phone,
      } : null,
      agencyId: vehicle.garageId, // backward compatible
      agency: garage ? { // backward compatible
        id: garage.id,
        name: garage.name,
        email: garage.email,
        phone: garage.phone,
      } : null,
      createdAt: vehicle.createdAt,
      expiresAt: vehicle.expiresAt,
      activatedAt: vehicle.activatedAt,
      maintenanceRecords,
      vehicle,
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
