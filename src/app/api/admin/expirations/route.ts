import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/expirations - List vehicles with expiring VT/Insurance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const vehicles = await db.vehicle.findMany({
      where: {
        OR: [
          { vtEndDate: { gte: now, lte: futureDate } },
          { insuranceEndDate: { gte: now, lte: futureDate } },
          { vtEndDate: { lt: now } },
          { insuranceEndDate: { lt: now } }
        ]
      },
      include: {
        owner: { select: { name: true, phone: true } },
        proprietor: { select: { name: true, phone: true } },
        garage: { select: { name: true } }
      },
      orderBy: { vtEndDate: 'asc' },
      take: 200
    });

    const vehiclesWithDays = vehicles.map(v => {
      const daysUntilVtExpiry = v.vtEndDate 
        ? Math.ceil((new Date(v.vtEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const daysUntilInsuranceExpiry = v.insuranceEndDate
        ? Math.ceil((new Date(v.insuranceEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return { ...v, daysUntilVtExpiry, daysUntilInsuranceExpiry };
    });

    return NextResponse.json({ vehicles: vehiclesWithDays });
  } catch (error) {
    console.error('Error fetching expirations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
