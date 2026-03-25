import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Get active advertisements
export async function GET() {
  try {
    const user = await getSession();

    const now = new Date();

    // Get all active advertisements
    const advertisements = await db.advertisement.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5
    });

    return NextResponse.json({ advertisements });

  } catch (error) {
    console.error('Error fetching active advertisements:', error);
    return NextResponse.json({ advertisements: [] });
  }
}
