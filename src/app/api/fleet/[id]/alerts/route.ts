import { NextRequest, NextResponse } from 'next/server';
import { getFleetAlerts, getUserFleet } from '@/lib/fleet-service';
import { getSession } from '@/lib/session';

/**
 * GET /api/fleet/[id]/alerts
 * Obtenir les alertes d'une flotte
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

    const userFleet = await getUserFleet(session.user.id);
    if (!userFleet || userFleet.id !== id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const alerts = await getFleetAlerts(id);

    return NextResponse.json({
      success: true,
      alerts,
    });

  } catch (error: any) {
    console.error('[Fleet Alerts Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des alertes' },
      { status: 500 }
    );
  }
}
