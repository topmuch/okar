import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/garage/[slug]/ratings
 * Obtenir les évaluations d'un garage
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find garage by name since slug doesn't exist
    const garage = await db.garage.findFirst({
      where: { name: { contains: slug.replace(/-/g, ' ') } }
    });

    if (!garage) {
      return NextResponse.json({ ratings: [], averageRating: 0, totalRatings: 0 });
    }

    const ratings = await db.garageRating.findMany({
      where: { garageId: garage.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    return NextResponse.json({
      ratings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings
    });

  } catch (error: any) {
    console.error('[Garage Ratings Error]', error);
    return NextResponse.json({ ratings: [], averageRating: 0, totalRatings: 0 });
  }
}

/**
 * POST /api/garage/[slug]/ratings
 * Ajouter une évaluation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { userId, rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Note invalide (1-5 requis)' },
        { status: 400 }
      );
    }

    // Find garage by name
    const garage = await db.garage.findFirst({
      where: { name: { contains: slug.replace(/-/g, ' ') } }
    });

    if (!garage) {
      return NextResponse.json({ error: 'Garage non trouvé' }, { status: 404 });
    }

    const newRating = await db.garageRating.create({
      data: {
        garageId: garage.id,
        userId: userId || 'anonymous',
        rating,
        comment: comment || null
      }
    });

    return NextResponse.json({ success: true, rating: newRating });

  } catch (error: any) {
    console.error('[Create Rating Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}
