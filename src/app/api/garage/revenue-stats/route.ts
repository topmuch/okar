import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Get revenue statistics for garage dashboard
export async function GET() {
  try {
    const user = await getSession();
    
    if (!user || !user.garageId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const garageId = user.garageId;
    const now = new Date();
    
    // Calculer les 6 derniers mois
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({
        label: date.toLocaleDateString('fr-FR', { month: 'short' }),
        year: date.getFullYear(),
        month: date.getMonth(),
        start: date,
        end: monthEnd,
      });
    }

    // Récupérer les interventions validées pour chaque mois
    const maintenanceRecords = await db.maintenanceRecord.findMany({
      where: {
        garageId,
        ownerValidation: 'VALIDATED',
        createdAt: {
          gte: months[0].start,
          lte: now,
        },
      },
      select: {
        id: true,
        totalCost: true,
        createdAt: true,
        vehicleId: true,
        category: true,
      },
    });

    // Calculer les revenus par mois
    const monthlyRevenue = months.map((m) => {
      const monthRecords = maintenanceRecords.filter((r) => {
        const recordDate = new Date(r.createdAt);
        return recordDate >= m.start && recordDate <= m.end;
      });
      
      const revenue = monthRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
      const uniqueVehicles = new Set(monthRecords.map((r) => r.vehicleId)).size;
      
      return {
        month: m.label,
        year: m.year,
        revenue,
        interventions: monthRecords.length,
        uniqueClients: uniqueVehicles,
      };
    });

    // Calculer les totaux
    const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
    const totalInterventions = maintenanceRecords.length;
    const totalClients = new Set(maintenanceRecords.map((r) => r.vehicleId)).size;

    // Statistiques par catégorie
    const categoryStats = await db.maintenanceRecord.groupBy({
      by: ['category'],
      where: {
        garageId,
        ownerValidation: 'VALIDATED',
        createdAt: {
          gte: months[0].start,
        },
      },
      _count: { id: true },
      _sum: { totalCost: true },
    });

    // Évolution vs mois précédent
    const thisMonthRevenue = monthlyRevenue[5].revenue;
    const lastMonthRevenue = monthlyRevenue[4].revenue;
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Stats du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = maintenanceRecords.filter((r) => {
      const recordDate = new Date(r.createdAt);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    const todayRevenue = todayRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);

    // Vues de profil (de GarageProfile)
    const garageProfile = await db.garageProfile.findUnique({
      where: { garageId },
      select: {
        profileViews: true,
        qrScans: true,
        contactClicks: true,
      },
    });

    return NextResponse.json({
      monthlyRevenue,
      totals: {
        revenue: totalRevenue,
        interventions: totalInterventions,
        clients: totalClients,
      },
      today: {
        revenue: todayRevenue,
        interventions: todayRecords.length,
      },
      thisMonth: {
        revenue: thisMonthRevenue,
        growth: Math.round(revenueGrowth * 10) / 10,
        interventions: monthlyRevenue[5].interventions,
        clients: monthlyRevenue[5].uniqueClients,
      },
      categoryStats: categoryStats.map((c) => ({
        category: c.category,
        count: c._count.id,
        revenue: c._sum.totalCost || 0,
      })),
      profileViews: garageProfile?.profileViews || 0,
      qrScans: garageProfile?.qrScans || 0,
      contactClicks: garageProfile?.contactClicks || 0,
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    return NextResponse.json({ 
      monthlyRevenue: [],
      totals: { revenue: 0, interventions: 0, clients: 0 },
      today: { revenue: 0, interventions: 0 },
      thisMonth: { revenue: 0, growth: 0, interventions: 0, clients: 0 },
      categoryStats: [],
      profileViews: 0,
      qrScans: 0,
      contactClicks: 0,
    });
  }
}
