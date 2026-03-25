import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * GET /api/fleet/[id]/stats
 * Obtenir les statistiques d'une flotte
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Placeholder - return empty stats
    return NextResponse.json({
      success: true,
      stats: {
        totalVehicles: 0,
        activeVehicles: 0,
        pendingMaintenance: 0,
        completedMaintenance: 0,
      },
    });

  } catch (error: any) {
    console.error('[Fleet Stats Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
