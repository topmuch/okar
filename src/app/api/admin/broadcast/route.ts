import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// GET - List all broadcast notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const isAdmin = ['superadmin', 'admin'].includes(user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Return empty broadcasts for now
    return NextResponse.json({
      broadcasts: [],
      message: 'Broadcast feature coming soon'
    });

  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des diffusions' },
      { status: 500 }
    );
  }
}

// POST - Create new broadcast notification
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const isAdmin = ['superadmin', 'admin'].includes(user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, targetRole } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Titre et message requis' },
        { status: 400 }
      );
    }

    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Notification créée avec succès',
      broadcast: {
        id: 'temp-id',
        title,
        message,
        targetRole: targetRole || 'all',
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la diffusion' },
      { status: 500 }
    );
  }
}
