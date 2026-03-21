import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/broadcast - List broadcasts
export async function GET(request: NextRequest) {
  try {
    const broadcasts = await db.broadcastNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/broadcast - Create new broadcast
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type, targetScope, channels, scheduledAt, createdBy } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Titre et message requis' }, { status: 400 });
    }

    let totalRecipients = 0;
    if (targetScope === 'ALL' || targetScope === 'GARAGES') {
      totalRecipients += await db.garage.count({ where: { active: true } });
    }
    if (targetScope === 'ALL' || targetScope === 'DRIVERS') {
      totalRecipients += await db.user.count({ where: { role: 'driver' } });
    }

    const broadcast = await db.broadcastNotification.create({
      data: {
        title,
        message,
        type: type || 'INFO',
        targetScope: targetScope || 'ALL',
        channels: channels || '[]',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'SENT',
        sentAt: scheduledAt ? null : new Date(),
        totalRecipients,
        sentCount: scheduledAt ? 0 : totalRecipients,
        createdBy
      }
    });

    return NextResponse.json({ broadcast });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
