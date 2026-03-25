import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// GET /api/admin/reports - List all reports (placeholder - no report model in schema)
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !['superadmin', 'admin', 'agent'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Return empty array since report model doesn't exist
    return NextResponse.json({ reports: [] });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/admin/reports - Update report status (placeholder)
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Fonctionnalité non disponible' }, { status: 400 });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
