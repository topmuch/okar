import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/vehicles - List all vehicles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    const vehicles = await db.vehicle.findMany({
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        color: true,
        licensePlate: true,
        vin: true,
        mileage: true,
        status: true,
        fuelType: true,
        transmission: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        garage: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        _count: {
          select: {
            maintenanceRecords: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: showAll ? 500 : 100
    });

    // Format response
    const formattedVehicles = vehicles.map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      licensePlate: v.licensePlate,
      vin: v.vin,
      mileage: v.mileage || 0,
      status: v.status,
      fuelType: v.fuelType,
      transmission: v.transmission,
      createdAt: v.createdAt,
      owner: v.owner,
      garage: v.garage,
      maintenanceCount: v._count.maintenanceRecords
    }));

    console.log('[VEHICLES API] Found', formattedVehicles.length, 'vehicles');

    return NextResponse.json({ vehicles: formattedVehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
