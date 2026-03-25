import { NextRequest, NextResponse } from 'next/server';
import { getFleetStats, getUserFleet } from '@/lib/fleet-service';
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

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur a accès à cette flotte
    const userFleet = await getUserFleet(session.user.id);
    if (!userFleet || userFleet.id !== id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const stats = await getFleetStats(id);

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error: any) {
    console.error('[Fleet Stats Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
