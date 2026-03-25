import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// GET - List daily reports
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !['superadmin', 'admin', 'agent'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Return empty reports for now
    return NextResponse.json({
      reports: [],
      message: 'Daily reports feature coming soon'
    });

  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rapports' },
      { status: 500 }
    );
  }
}

// POST - Create or update daily report
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !['superadmin', 'admin', 'agent'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { notes, leadsContacted, appointments, conversions } = body;

    // Return mock response for now
    return NextResponse.json({
      success: true,
      report: {
        id: `report-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        userId: user.id,
        notes: notes || '',
        leadsContacted: leadsContacted || 0,
        appointments: appointments || 0,
        conversions: conversions || 0,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error creating daily report:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du rapport' },
      { status: 500 }
    );
  }
}
