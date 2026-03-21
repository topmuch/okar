import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default coordinates for major Senegalese cities
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'dakar': { lat: 14.6928, lng: -17.4467 },
  'thiès': { lat: 14.7910, lng: -16.9359 },
  'thies': { lat: 14.7910, lng: -16.9359 },
  'saint-louis': { lat: 16.0326, lng: -16.4817 },
  'saint louis': { lat: 16.0326, lng: -16.4817 },
  'kaolack': { lat: 14.1648, lng: -16.0762 },
  'ziguinchor': { lat: 12.5833, lng: -16.2667 },
  'tambacounda': { lat: 13.7707, lng: -13.6693 },
  'diourbel': { lat: 14.6558, lng: -16.3894 },
  'louga': { lat: 15.6176, lng: -16.2244 },
  'matam': { lat: 15.6558, lng: -13.2544 },
  'kolda': { lat: 12.8833, lng: -14.9500 },
  'sédhiou': { lat: 12.7000, lng: -15.5500 },
  'sedhiou': { lat: 12.7000, lng: -15.5500 },
  'kédougou': { lat: 12.5600, lng: -12.1800 },
  'kedougou': { lat: 12.5600, lng: -12.1800 },
  'mbacké': { lat: 14.7900, lng: -15.9100 },
  'mbacke': { lat: 14.7900, lng: -15.9100 },
  'rufisque': { lat: 14.7167, lng: -17.2667 },
  'pikine': { lat: 14.7646, lng: -17.3937 },
  'guédiawaye': { lat: 14.7833, lng: -17.4000 },
  'guediawaye': { lat: 14.7833, lng: -17.4000 },
  'mbour': { lat: 14.4167, lng: -16.9667 },
  'saly': { lat: 14.3833, lng: -16.9000 },
};

// Function to get coordinates from address/city
function getCoordsFromLocation(address?: string | null, city?: string | null): { lat: number; lng: number } | null {
  const searchTerms = [city, address].filter(Boolean).join(' ').toLowerCase();

  if (!searchTerms) return null;

  // Try to match known cities
  for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
    if (searchTerms.includes(cityName)) {
      // Add small random offset to prevent overlapping markers
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.015,
        lng: coords.lng + (Math.random() - 0.5) * 0.015
      };
    }
  }

  return null;
}

// Extract city from address string
function extractCityFromAddress(address?: string | null): string | null {
  if (!address) return null;

  const addressLower = address.toLowerCase();

  for (const cityName of Object.keys(CITY_COORDS)) {
    if (addressLower.includes(cityName)) {
      // Capitalize properly
      return cityName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  return null;
}

// GET /api/admin/map - Get map data (garages and vehicles with coordinates)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const detailed = searchParams.get('detailed') === 'true';

    const points: any[] = [];

    // Get garages with coordinates
    if (type === 'all' || type === 'garage') {
      const garages = await db.garage.findMany({
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          address: true,
          phone: true,
          isCertified: true,
          accountStatus: true,
          validationStatus: true,
          createdAt: true,
          _count: { select: { vehicles: true } },
          GarageProfile: {
            select: {
              subscriptionTier: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      garages.forEach(g => {
        // Get city from address
        const city = extractCityFromAddress(g.address);

        // If no coordinates, try to derive from city
        let lat = g.latitude;
        let lng = g.longitude;

        if ((!lat || !lng) && g.address) {
          const derivedCoords = getCoordsFromLocation(g.address, city);
          if (derivedCoords) {
            lat = derivedCoords.lat;
            lng = derivedCoords.lng;
          }
        }

        points.push({
          id: g.id,
          type: 'garage',
          name: g.name,
          latitude: lat,
          longitude: lng,
          address: g.address,
          phone: g.phone,
          city: city,
          isCertified: g.isCertified,
          status: g.accountStatus,
          validationStatus: g.validationStatus,
          vehicleCount: g._count.vehicles,
          subscriptionTier: g.GarageProfile?.subscriptionTier || 'FREE'
        });
      });
    }

    // Get vehicles with their associated garage locations
    if (type === 'all' || type === 'vehicle') {
      const vehicles = await db.vehicle.findMany({
        where: {
          status: { not: 'pending_activation' }
        },
        select: {
          id: true,
          reference: true,
          make: true,
          model: true,
          licensePlate: true,
          status: true,
          activatedAt: true,
          createdAt: true,
          lastLocation: true,
          garage: {
            select: {
              id: true,
              name: true,
              latitude: true,
              longitude: true,
              address: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500 // Limit for performance
      });

      vehicles.forEach(v => {
        // Use garage location if available, otherwise try to derive from lastLocation
        let lat: number | null = null;
        let lng: number | null = null;
        let city: string | null = null;

        if (v.garage?.latitude && v.garage?.longitude) {
          // Add small offset to prevent exact overlap with garage marker
          lat = v.garage.latitude + (Math.random() - 0.5) * 0.005;
          lng = v.garage.longitude + (Math.random() - 0.5) * 0.005;
          city = extractCityFromAddress(v.garage.address);
        } else if (v.lastLocation) {
          const derivedCoords = getCoordsFromLocation(v.lastLocation);
          if (derivedCoords) {
            lat = derivedCoords.lat;
            lng = derivedCoords.lng;
          }
          city = extractCityFromAddress(v.lastLocation);
        }

        points.push({
          id: v.id,
          type: 'vehicle',
          name: `${v.make || 'Véhicule'} ${v.model || ''} - ${v.licensePlate || v.reference}`,
          latitude: lat,
          longitude: lng,
          status: v.status,
          licensePlate: v.licensePlate,
          make: v.make,
          model: v.model,
          activatedAt: v.activatedAt?.toISOString(),
          city: city,
          garageName: v.garage?.name
        });
      });
    }

    // Calculate stats
    const stats = {
      totalPoints: points.length,
      garages: points.filter(p => p.type === 'garage').length,
      vehicles: points.filter(p => p.type === 'vehicle').length,
      withLocation: points.filter(p => p.latitude && p.longitude).length,
      certified: points.filter(p => p.type === 'garage' && p.isCertified).length,
      suspended: points.filter(p => p.status === 'SUSPENDED').length,
      pending: points.filter(p => p.validationStatus === 'PENDING' || p.status === 'pending').length
    };

    return NextResponse.json({
      points,
      stats,
      defaultCenter: { lat: 14.4974, lng: -14.4524 }, // Senegal center
      cities: Object.keys(CITY_COORDS) // Available cities for autocomplete
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/map - Update coordinates for a garage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { garageId, latitude, longitude, updateMethod } = body;

    if (!garageId || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      );
    }

    // Validate coordinates are within Senegal bounds
    if (latitude < 12.0 || latitude > 17.0 || longitude < -18.0 || longitude > -11.0) {
      return NextResponse.json(
        { error: 'Coordonnées hors du territoire sénégalais' },
        { status: 400 }
      );
    }

    const garage = await db.garage.update({
      where: { id: garageId },
      data: {
        latitude,
        longitude,
        geoUpdatedAt: new Date()
      }
    });

    // Log the update
    console.log(`[MAP] Updated coordinates for garage ${garageId}: ${latitude}, ${longitude} via ${updateMethod || 'manual'}`);

    return NextResponse.json({
      success: true,
      garage: {
        id: garage.id,
        name: garage.name,
        latitude: garage.latitude,
        longitude: garage.longitude
      }
    });
  } catch (error) {
    console.error('Error updating coordinates:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des coordonnées' },
      { status: 500 }
    );
  }
}
