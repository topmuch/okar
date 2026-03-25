import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Fetch messages for agency/garage
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === 'true';

    const where: Record<string, unknown> = {
      receiverId: user.id
    };

    if (type) {
      where.type = type;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    // If just requesting unread count
    if (searchParams.get('count') === 'true') {
      const unreadCount = await db.message.count({
        where: { receiverId: user.id, isRead: false }
      });
      return NextResponse.json({ unreadCount });
    }

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const unreadCount = await db.message.count({
      where: { receiverId: user.id, isRead: false }
    });

    return NextResponse.json({ messages, unreadCount });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

// POST - Create a new message
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { type, subject, content, receiverId } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Contenu requis' },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        type: type || 'general',
        senderId: user.id,
        receiverId: receiverId || null,
        subject: subject || null,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du message' },
      { status: 500 }
    );
  }
}

// PUT - Update message status (mark as read)
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isRead } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      );
    }

    const message = await db.message.update({
      where: { id },
      data: { isRead: isRead ?? true, readAt: new Date() },
    });

    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
