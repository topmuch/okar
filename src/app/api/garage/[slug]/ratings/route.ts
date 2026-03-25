import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Get ratings for a garage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Find garage by slug
    const garage = await db.garage.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!garage) {
      return NextResponse.json({ error: 'Garage non trouvé' }, { status: 404 });
    }

    // Get ratings with stats
    const [ratings, stats] = await Promise.all([
      db.garageRating.findMany({
        where: { garageId: garage.id },
        select: {
          id: true,
          rating: true,
          comment: true,
          reply: true,
          replyAt: true,
          isVerified: true,
          helpfulCount: true,
          createdAt: true,
          Vehicle: {
            select: {
              make: true,
              model: true,
              year: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.garageRating.aggregate({
        where: { garageId: garage.id },
        _count: { id: true },
        _avg: { rating: true },
      }),
    ]);

    // Calculate rating distribution
    const distribution = await db.garageRating.groupBy({
      by: ['rating'],
      where: { garageId: garage.id },
      _count: { rating: true },
    });

    const distributionMap = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    distribution.forEach((d) => {
      distributionMap[d.rating as keyof typeof distributionMap] = d._count.rating;
    });

    return NextResponse.json({
      ratings,
      stats: {
        total: stats._count.id,
        average: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
        distribution: distributionMap,
      },
    });
  } catch (error) {
    console.error('Error fetching garage ratings:', error);
    return NextResponse.json({ ratings: [], stats: { total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } });
  }
}

// POST - Create a new rating
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleId, maintenanceId, rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Note invalide (1-5 requis)' }, { status: 400 });
    }

    // Find garage
    const garage = await db.garage.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!garage) {
      return NextResponse.json({ error: 'Garage non trouvé' }, { status: 404 });
    }

    // Check if this is a verified purchase (vehicle was serviced by this garage)
    let isVerified = false;
    if (vehicleId && maintenanceId) {
      const maintenance = await db.maintenanceRecord.findFirst({
        where: {
          id: maintenanceId,
          vehicleId,
          garageId: garage.id,
          ownerValidation: 'VALIDATED',
        },
      });
      isVerified = !!maintenance;
    }

    // Create rating
    const newRating = await db.garageRating.create({
      data: {
        id: crypto.randomUUID(),
        garageId: garage.id,
        vehicleId: vehicleId || crypto.randomUUID(),
        maintenanceId,
        rating,
        comment,
        isVerified,
      },
    });

    return NextResponse.json({ success: true, rating: newRating });
  } catch (error) {
    console.error('Error creating rating:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'avis' }, { status: 500 });
  }
}
