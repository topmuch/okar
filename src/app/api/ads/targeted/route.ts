import { NextRequest, NextResponse } from 'next/server';
import { getTargetedAds } from '@/lib/ad-engine';

/**
 * POST /api/ads/targeted
 * Obtenir les publicités ciblées pour un contexte donné
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, limit = 3 } = body;

    const ads = await getTargetedAds(context, limit);

    return NextResponse.json({
      success: true,
      ads,
    });

  } catch (error: any) {
    console.error('[Targeted Ads Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des publicités' },
      { status: 500 }
    );
  }
}
