import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/reports - List all reports
export async function GET(request: NextRequest) {
  try {
    const reports = await db.report.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/admin/reports - Update report status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, status, adminNotes, resolution, resolvedBy } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updateData: any = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (resolution) updateData.resolution = resolution;
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = resolvedBy;
    }

    const report = await db.report.update({
      where: { id: reportId },
      data: updateData
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
