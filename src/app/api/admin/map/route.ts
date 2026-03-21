import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/map - Get map data (garages and vehicles with coordinates)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const points: any[] = [];

    // Get garages with coordinates
    if (type === 'all' || type === 'garage') {
      const garages = await db.garage.findMany({
        where: { latitude: { not: null }, longitude: { not: null } },
        select: {
          id: true, name: true, latitude: true, longitude: true,
          address: true, phone: true, isCertified: true, accountStatus: true,
          _count: { select: { vehicles: true } }
        }
      });

      points.push(...garages.map(g => ({
        id: g.id, type: 'garage', name: g.name,
        latitude: g.latitude, longitude: g.longitude,
        address: g.address, phone: g.phone,
        status: g.accountStatus, count: g._count.vehicles
      })));
    }

    // Get vehicles (without real coordinates for now)
    if (type === 'all' || type === 'vehicle') {
      const vehicles = await db.vehicle.findMany({
        select: {
          id: true, reference: true, make: true, model: true,
          licensePlate: true, lastLocation: true, status: true,
          owner: { select: { name: true, phone: true } },
          proprietor: { select: { name: true, phone: true } }
        },
        take: 100
      });

      points.push(...vehicles.map(v => ({
        id: v.id, type: 'vehicle',
        name: `${v.make || ''} ${v.model || ''} - ${v.licensePlate || v.reference}`,
        latitude: null, longitude: null, status: v.status
      })));
    }

    return NextResponse.json({ points });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
