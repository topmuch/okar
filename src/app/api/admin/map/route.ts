import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// City coordinates for Senegal
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'dakar': { lat: 14.6928, lng: -17.4467 },
  'thiès': { lat: 14.7910, lng: -16.9359 },
  'thies': { lat: 14.7910, lng: -16.9359 },
  'saint-louis': { lat: 16.0326, lng: -16.4817 },
  'kaolack': { lat: 14.1648, lng: -16.0762 },
  'ziguinchor': { lat: 12.5833, lng: -16.2667 },
  'tambacounda': { lat: 13.7707, lng: -13.6693 },
  'diourbel': { lat: 14.6558, lng: -16.3894 },
  'louga': { lat: 15.6176, lng: -16.2244 },
  'matam': { lat: 15.6558, lng: -13.2544 },
  'kolda': { lat: 12.8833, lng: -14.9500 },
  'rufisque': { lat: 14.7167, lng: -17.2667 },
  'pikine': { lat: 14.7646, lng: -17.3937 },
  'mbour': { lat: 14.4167, lng: -16.9667 },
};

function getCoordsFromCity(city?: string | null): { lat: number; lng: number } | null {
  if (!city) return null;
  const cityLower = city.toLowerCase();
  for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
    if (cityLower.includes(cityName)) {
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.015,
        lng: coords.lng + (Math.random() - 0.5) * 0.015
      };
    }
  }
  return null;
}

interface MapPoint {
  id: string;
  type: 'garage' | 'vehicle';
  name: string;
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  phone?: string | null;
  city?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
}

// GET /api/admin/map - Récupérer les données de la carte
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const points: MapPoint[] = [];

    // Fetch garages
    if (type === 'all' || type === 'garage') {
      const garages = await db.garage.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          phone: true,
          isActive: true,
          isVerified: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      });

      garages.forEach(g => {
        const coords = getCoordsFromCity(g.city);
        points.push({
          id: g.id,
          type: 'garage',
          name: g.name,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
          address: g.address,
          phone: g.phone,
          city: g.city,
          isActive: g.isActive,
          isVerified: g.isVerified,
        });
      });
    }

    // Fetch vehicles
    if (type === 'all' || type === 'vehicle') {
      const vehicles = await db.vehicle.findMany({
        select: {
          id: true,
          make: true,
          model: true,
          licensePlate: true,
          status: true,
          garage: {
            select: {
              id: true,
              name: true,
              city: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      });

      vehicles.forEach(v => {
        const coords = getCoordsFromCity(v.garage?.city);
        points.push({
          id: v.id,
          type: 'vehicle',
          name: `${v.make || 'Véhicule'} ${v.model || ''} - ${v.licensePlate || ''}`,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
          city: v.garage?.city,
        });
      });
    }

    const stats = {
      totalPoints: points.length,
      garages: points.filter(p => p.type === 'garage').length,
      vehicles: points.filter(p => p.type === 'vehicle').length,
      withLocation: points.filter(p => p.latitude && p.longitude).length,
    };

    return NextResponse.json({
      points,
      stats,
      defaultCenter: { lat: 14.4974, lng: -14.4524 },
      cities: Object.keys(CITY_COORDS)
    });

  } catch (error: any) {
    console.error('[MAP API] Error:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        points: [],
        stats: { totalPoints: 0, garages: 0, vehicles: 0, withLocation: 0 }
      },
      { status: 500 }
    );
  }
}
