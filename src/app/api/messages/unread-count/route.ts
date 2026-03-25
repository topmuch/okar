import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * GET /api/messages/unread-count
 * Get unread message count for current user
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const count = await db.message.count({
      where: {
        receiverId: session.id,
        isRead: false
      }
    });

    return NextResponse.json({ count });

  } catch (error) {
    console.error('Error getting unread count:', error);
    return NextResponse.json({ count: 0 });
  }
}
