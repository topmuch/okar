import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/vehicles - List all vehicles with owner info
export async function GET(request: NextRequest) {
  try {
    const vehicles = await db.vehicle.findMany({
      include: {
        owner: {
          select: { id: true, name: true, phone: true, email: true }
        },
        proprietor: {
          select: { id: true, name: true, phone: true }
        },
        garage: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { maintenanceRecords: true }
        },
        maintenanceRecords: {
          take: 5,
          orderBy: { interventionDate: 'desc' },
          select: {
            id: true,
            category: true,
            description: true,
            interventionDate: true,
            status: true,
            source: true,
            garage: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
