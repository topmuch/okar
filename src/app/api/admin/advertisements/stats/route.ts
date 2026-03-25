import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Get advertisement statistics (SuperAdmin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const advertisementId = searchParams.get('id');

    // If specific advertisement, get detailed stats
    if (advertisementId) {
      const ad = await db.advertisement.findUnique({
        where: { id: advertisementId }
      });

      if (!ad) {
        return NextResponse.json(
          { error: 'Publicité non trouvée' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        advertisement: ad,
        summary: {
          totalViews: ad.views,
          totalClicks: ad.clicks,
          ctr: ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(2) : '0.00'
        }
      });
    }

    // Get overview stats for all advertisements
    const allAds = await db.advertisement.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        views: true,
        clicks: true,
        createdAt: true
      }
    });

    // Calculate totals
    const totalViews = allAds.reduce((sum, ad) => sum + ad.views, 0);
    const totalClicks = allAds.reduce((sum, ad) => sum + ad.clicks, 0);
    const activeAds = allAds.filter(ad => ad.status === 'active').length;

    // Top 3 by clicks
    const topAds = [...allAds]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 3)
      .map(ad => ({
        ...ad,
        ctr: ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(2) : '0.00'
      }));

    return NextResponse.json({
      summary: {
        totalAds: allAds.length,
        activeAds,
        totalViews,
        totalClicks,
        avgCtr: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00'
      },
      topAds
    });

  } catch (error) {
    console.error('Error fetching advertisement stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
