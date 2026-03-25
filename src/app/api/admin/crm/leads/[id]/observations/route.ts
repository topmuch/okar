import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// GET - List observations for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    const { id } = await params;

    if (!user || !['superadmin', 'admin', 'agent'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Return empty observations for now
    return NextResponse.json({
      observations: [],
      leadId: id
    });

  } catch (error) {
    console.error('Error fetching observations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des observations' },
      { status: 500 }
    );
  }
}

// POST - Create observation for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    const { id } = await params;

    if (!user || !['superadmin', 'admin', 'agent'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { content, type } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Contenu requis' },
        { status: 400 }
      );
    }

    // Return mock observation
    return NextResponse.json({
      success: true,
      observation: {
        id: `obs-${Date.now()}`,
        leadId: id,
        content,
        type: type || 'note',
        userId: user.id,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error creating observation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'observation' },
      { status: 500 }
    );
  }
}
