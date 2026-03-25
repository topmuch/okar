import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * GET - Récupérer les statistiques de revenus du garage
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'garage' || !session.garageId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get maintenance records for the garage
    const records = await db.maintenanceRecord.findMany({
      where: { garageId: session.garageId },
      select: {
        cost: true,
        createdAt: true,
        type: true
      }
    });

    // Calculate stats
    const totalRevenue = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = records
      .filter(r => r.createdAt >= thisMonth)
      .reduce((sum, r) => sum + (r.cost || 0), 0);

    const recordCount = records.length;

    return NextResponse.json({
      stats: {
        totalRevenue,
        monthlyRevenue,
        recordCount,
        averagePerRecord: recordCount > 0 ? totalRevenue / recordCount : 0
      }
    });

  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
