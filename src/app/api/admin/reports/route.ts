import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/admin/reports - List all reports
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getSession();
    if (!user || !['superadmin', 'admin', 'agent'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const reports = await db.report.findMany({
      where,
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
    // Check authentication
    const user = await getSession();
    if (!user || !['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, status, adminNotes, resolution } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (resolution) updateData.resolution = resolution;
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = user.id;
    }

    const report = await db.report.update({
      where: { id: reportId },
      data: updateData
    });

    // Log action
    await db.auditLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        action: 'REPORT_UPDATED',
        entityType: 'REPORT',
        entityId: reportId,
        userId: user.id,
        userEmail: user.email,
        details: JSON.stringify({ status, adminNotes, resolution }),
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
