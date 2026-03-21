import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Vehicle row type
interface VehicleRow {
  id: string;
  reference: string;
  qrStatus: string;
  status: string;
  make: string | null;
  model: string | null;
  garageId: string | null;
  ownerName: string | null;
  createdAt: string;
  activatedAt: string | null;
}

// Garage row type
interface GarageRow {
  id: string;
  name: string;
  isCertified: boolean;
}

// MaintenanceRecord row type
interface MaintenanceRecordRow {
  id: string;
  vehicleId: string;
  category: string;
  status: string;
  ownerValidation: string;
  totalCost: number | null;
  createdAt: string;
}

// GET - Fetch report statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garageId');
    const period = searchParams.get('period') || 'week'; // week, month, year

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const startDateStr = startDate.toISOString();

    // Build query for vehicles
    let whereClause = 'createdAt >= ?';
    const params: string[] = [startDateStr];

    if (garageId) {
      whereClause += ' AND garageId = ?';
      params.push(garageId);
    }

    // Fetch vehicles using raw SQL
    const vehicles = await db.$queryRawUnsafe<VehicleRow[]>(
      `SELECT
        id, reference, qrStatus, status, make, model, garageId,
        ownerName, createdAt, activatedAt
       FROM Vehicle
       WHERE ${whereClause}
       ORDER BY createdAt DESC`,
      ...params
    );

    // Get garages for name lookup
    const garagesRaw = await db.$queryRaw<GarageRow[]>`
      SELECT id, name, isCertified FROM Garage
    `;
    const garageMap = new Map<string, { name: string; isCertified: boolean }>();
    (garagesRaw || []).forEach(g => garageMap.set(g.id, { name: g.name, isCertified: g.isCertified }));

    // Get maintenance records
    let maintenanceRecords: MaintenanceRecordRow[] = [];
    if (garageId) {
      maintenanceRecords = await db.$queryRaw<MaintenanceRecordRow[]>`
        SELECT id, vehicleId, category, status, ownerValidation, totalCost, createdAt
        FROM MaintenanceRecord
        WHERE createdAt >= ${startDateStr}
        ORDER BY createdAt DESC
      `;
    } else {
      maintenanceRecords = await db.$queryRaw<MaintenanceRecordRow[]>`
        SELECT id, vehicleId, category, status, ownerValidation, totalCost, createdAt
        FROM MaintenanceRecord
        WHERE createdAt >= ${startDateStr}
        ORDER BY createdAt DESC
      `;
    }

    // Calculate statistics
    const vehiclesList = vehicles || [];
    const stats = {
      total: vehiclesList.length,
      active: vehiclesList.filter(v => v.qrStatus === 'ACTIVE').length,
      inactive: vehiclesList.filter(v => v.qrStatus === 'INACTIVE').length,
      blocked: vehiclesList.filter(v => v.qrStatus === 'BLOCKED').length,
      pendingActivation: vehiclesList.filter(v => v.status === 'pending_activation').length,
      // Maintenance stats
      totalInterventions: maintenanceRecords.length,
      pendingValidation: maintenanceRecords.filter(r => r.ownerValidation === 'PENDING').length,
      validated: maintenanceRecords.filter(r => r.ownerValidation === 'VALIDATED').length,
      rejected: maintenanceRecords.filter(r => r.ownerValidation === 'REJECTED').length,
      // Revenue (total cost of validated interventions)
      totalRevenue: maintenanceRecords
        .filter(r => r.ownerValidation === 'VALIDATED' && r.totalCost)
        .reduce((sum, r) => sum + (r.totalCost || 0), 0),
    };

    // Daily evolution (last 7 days)
    const dailyStats: { date: string; count: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = `${dateStr}T00:00:00.000Z`;
      const dayEnd = `${dateStr}T23:59:59.999Z`;

      let dayCount = 0;
      if (garageId) {
        const result = await db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM Vehicle
          WHERE createdAt >= ${dayStart} AND createdAt <= ${dayEnd} AND garageId = ${garageId}
        `;
        dayCount = result[0]?.count || 0;
      } else {
        const result = await db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM Vehicle
          WHERE createdAt >= ${dayStart} AND createdAt <= ${dayEnd}
        `;
        dayCount = result[0]?.count || 0;
      }

      dailyStats.push({
        date: dateStr,
        count: dayCount,
        label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      });
    }

    // Weekly evolution (last 4 weeks)
    const weeklyStats: { week: number; count: number; label: string }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStartStr = weekStart.toISOString();
      const weekEndStr = weekEnd.toISOString();

      let weekCount = 0;
      if (garageId) {
        const result = await db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM Vehicle
          WHERE createdAt >= ${weekStartStr} AND createdAt < ${weekEndStr} AND garageId = ${garageId}
        `;
        weekCount = result[0]?.count || 0;
      } else {
        const result = await db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM Vehicle
          WHERE createdAt >= ${weekStartStr} AND createdAt < ${weekEndStr}
        `;
        weekCount = result[0]?.count || 0;
      }

      weeklyStats.push({
        week: 4 - i,
        count: weekCount,
        label: `Semaine ${4 - i}`,
      });
    }

    // Interventions by category
    const categoryStats: Record<string, number> = {};
    for (const record of maintenanceRecords) {
      categoryStats[record.category] = (categoryStats[record.category] || 0) + 1;
    }

    return NextResponse.json({
      stats,
      dailyStats,
      weeklyStats,
      categoryStats,
      period,
      totalVehicles: vehiclesList.length,
      totalGarages: garagesRaw?.length || 0,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
