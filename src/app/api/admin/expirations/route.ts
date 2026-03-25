import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/expirations - List vehicles (simplified - no expiration fields in schema yet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Note: The Vehicle model doesn't have vtEndDate/insuranceEndDate fields yet
    // Return empty array for now - these fields should be added to the schema if needed
    const vehicles = await db.vehicle.findMany({
      include: {
        owner: { select: { name: true, phone: true } },
        garage: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    // Add placeholder expiration data
    const vehiclesWithDays = vehicles.map(v => ({
      ...v,
      daysUntilVtExpiry: null,
      daysUntilInsuranceExpiry: null,
      vtEndDate: null,
      insuranceEndDate: null
    }));

    return NextResponse.json({ vehicles: vehiclesWithDays });
  } catch (error) {
    console.error('Error fetching expirations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
