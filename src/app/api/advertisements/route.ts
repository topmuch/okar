import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Get active advertisements for current user/garage
export async function GET() {
  try {
    // Check authentication using the session module
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ advertisements: [] });
    }

    const now = new Date();

    // Get all active advertisements and filter in JS for simplicity
    const allAds = await db.advertisement.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });

    // Filter by date and targeting
    const advertisements = allAds.filter(ad => {
      // Check end date
      if (ad.endDate && new Date(ad.endDate) < now) {
        return false;
      }

      // Check targeting
      if (ad.targetScope === 'all') {
        return true;
      }
      
      // Agency targeting (legacy)
      if (ad.targetScope === 'agency' && user.agencyId && ad.agencyId === user.agencyId) {
        return true;
      }
      
      // Garage targeting
      if (ad.targetScope === 'garage' && user.garageId && ad.garageId === user.garageId) {
        return true;
      }

      // Agents targeting
      if (ad.targetScope === 'agents' && user.role === 'agent') {
        return true;
      }

      // Garages targeting (all garages)
      if (ad.targetScope === 'garages' && user.role === 'garage') {
        return true;
      }

      return false;
    }).slice(0, 5);

    return NextResponse.json({ advertisements });

  } catch (error) {
    console.error('Error fetching active advertisements:', error);
    return NextResponse.json({ advertisements: [] });
  }
}
