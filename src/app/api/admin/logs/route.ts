import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - List all audit and login logs for superadmin
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getSession();
    if (!user || !['superadmin', 'admin', 'agent'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') || 'all'; // all, login, audit

    const result: {
      loginLogs: Array<{
        id: string;
        userId: string | null;
        email: string;
        success: boolean;
        failureReason: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        country: string | null;
        city: string | null;
        createdAt: Date;
      }>;
      auditLogs: Array<{
        id: string;
        action: string;
        entityType: string;
        entityId: string;
        userId: string | null;
        userEmail: string | null;
        details: string | null;
        ipAddress: string | null;
        createdAt: Date;
      }>;
      pagination: {
        loginTotal: number;
        auditTotal: number;
        limit: number;
        offset: number;
      };
    } = {
      loginLogs: [],
      auditLogs: [],
      pagination: {
        loginTotal: 0,
        auditTotal: 0,
        limit,
        offset,
      },
    };

    // Fetch login logs if requested
    if (type === 'all' || type === 'login') {
      const [logs, count] = await Promise.all([
        db.loginLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.loginLog.count(),
      ]);
      result.loginLogs = logs;
      result.pagination.loginTotal = count;
    }

    // Fetch audit logs if requested
    if (type === 'all' || type === 'audit') {
      const [logs, count] = await Promise.all([
        db.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.auditLog.count(),
      ]);
      result.auditLogs = logs;
      result.pagination.auditTotal = count;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
