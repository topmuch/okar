import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ========================================
// API: RECHERCHER LES GARAGES PROCHES
// ========================================
// Utilise la formule Haversine pour calculer la distance
// Retourne les garages avec accountStatus='ACTIVE', isCertified=true

interface GarageResult {
  id: string;
  name: string;
  phone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  distance: number;
}

/**
 * Formule Haversine pour calculer la distance entre deux points géographiques
 * @param lat1 Latitude du point de départ
 * @param lon1 Longitude du point de départ
 * @param lat2 Latitude du point d'arrivée
 * @param lon2 Longitude du point d'arrivée
 * @returns Distance en kilomètres
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');

    // Valider les paramètres
    if (!latParam || !lngParam) {
      return NextResponse.json({
        success: false,
        error: 'Les coordonnées (lat, lng) sont requises'
      }, { status: 400 });
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    const radius = radiusParam ? parseFloat(radiusParam) : 5; // 5km par défaut

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({
        success: false,
        error: 'Coordonnées invalides'
      }, { status: 400 });
    }

    // Récupérer tous les garages actifs et certifiés avec coordonnées
    const garages = await db.$queryRaw<any[]>`
      SELECT id, name, phone, whatsappNumber, address, latitude, longitude
      FROM Garage
      WHERE accountStatus = 'ACTIVE'
        AND isCertified = 1
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `;

    // Calculer la distance pour chaque garage et filtrer par rayon
    const garagesWithDistance: GarageResult[] = garages
      .map((garage) => {
        const distance = haversineDistance(
          lat,
          lng,
          garage.latitude,
          garage.longitude
        );
        return {
          id: garage.id,
          name: garage.name,
          phone: garage.phone,
          whatsappNumber: garage.whatsappNumber,
          address: garage.address,
          latitude: garage.latitude,
          longitude: garage.longitude,
          distance: Math.round(distance * 10) / 10, // Arrondir à 1 décimale
        };
      })
      .filter((garage) => garage.distance <= radius)
      .sort((a, b) => a.distance - b.distance); // Trier par distance croissante

    return NextResponse.json({
      success: true,
      count: garagesWithDistance.length,
      radius,
      userLocation: { lat, lng },
      garages: garagesWithDistance,
    });

  } catch (error) {
    console.error('Erreur recherche garages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur',
      details: errorMessage
    }, { status: 500 });
  }
}
