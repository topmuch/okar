import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ========================================
// API: QR CODES STATISTICS
// ========================================

function toNumber(value: any): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

export async function GET() {
  try {
    // Get total QR codes by status
    const statusCounts = await db.$queryRawUnsafe<any[]>(`
      SELECT
        status,
        COUNT(*) as count
      FROM QRCodeStock
      GROUP BY status
    `);

    // Calculate totals
    const stats = {
      total: 0,
      stock: 0,
      assigned: 0,
      active: 0,
      revoked: 0,
    };

    for (const row of statusCounts) {
      const count = toNumber(row.count);
      stats.total += count;
      if (row.status === 'STOCK') stats.stock = count;
      if (row.status === 'ASSIGNED') stats.assigned = count;
      if (row.status === 'ACTIVE') stats.active = count;
      if (row.status === 'REVOKED') stats.revoked = count;
    }

    // Get counts for garages (QR codes with assignedGarageId)
    const garageStats = await db.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activated
      FROM QRCodeStock
      WHERE assignedGarageId IS NOT NULL
    `);

    // Get counts for individuals (QR codes without assignedGarageId)
    const individualStats = await db.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activated
      FROM QRCodeStock
      WHERE assignedGarageId IS NULL
    `);

    // Get counts by garage
    const byGarage = await db.$queryRawUnsafe<any[]>(`
      SELECT
        g.id,
        g.name,
        COUNT(qs.id) as total,
        SUM(CASE WHEN qs.status = 'ACTIVE' THEN 1 ELSE 0 END) as activated
      FROM Garage g
      LEFT JOIN QRCodeStock qs ON qs.assignedGarageId = g.id
      GROUP BY g.id, g.name
      HAVING COUNT(qs.id) > 0
      ORDER BY total DESC
    `);

    return NextResponse.json({
      stats,
      garageTotal: toNumber(garageStats[0]?.total),
      garageActive: toNumber(garageStats[0]?.activated),
      individualTotal: toNumber(individualStats[0]?.total),
      individualActive: toNumber(individualStats[0]?.activated),
      byGarage: byGarage.map(g => ({
        ...g,
        total: toNumber(g.total),
        activated: toNumber(g.activated),
      })),
    });

  } catch (error) {
    console.error('Error fetching QR stats:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        stats: { total: 0, stock: 0, assigned: 0, active: 0, revoked: 0 },
        garageTotal: 0,
        garageActive: 0,
        individualTotal: 0,
        individualActive: 0,
      },
      { status: 500 }
    );
  }
}
