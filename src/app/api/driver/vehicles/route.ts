import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get driver's vehicle(s)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId') || 'demo-driver-id';

    const vehicles = await db.$queryRaw<any[]>`
      SELECT 
        v.*,
        g.name as garageName
      FROM Vehicle v
      LEFT JOIN Garage g ON v.garageId = g.id
      WHERE v.ownerId = ${ownerId} AND v.qrStatus = 'ACTIVE'
      ORDER BY v.createdAt DESC
    `;

    return NextResponse.json({ vehicles });

  } catch (error) {
    console.error('Get driver vehicles error:', error);
    return NextResponse.json({ vehicles: [], error: 'Internal server error' }, { status: 500 });
  }
}
