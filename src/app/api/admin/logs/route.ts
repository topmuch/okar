import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - List all login logs for superadmin
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !['superadmin', 'admin', 'agent'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch login logs only (auditLog model doesn't exist)
    const [logs, count] = await Promise.all([
      db.loginLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.loginLog.count(),
    ]);

    return NextResponse.json({
      loginLogs: logs,
      auditLogs: [], // No audit logs in this version
      pagination: {
        loginTotal: count,
        auditTotal: 0,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
