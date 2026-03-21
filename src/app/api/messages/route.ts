import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// GET - List messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garageId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    // Filter by garage (messages sent by or to this garage)
    if (garageId) {
      whereClause += ' AND (garageId = ? OR recipientGarageId = ?)';
      params.push(garageId, garageId);
    }

    // Filter by type
    if (type && type !== 'all') {
      if (type === 'inbox') {
        whereClause += ' AND (type = ? OR type = ?)';
        params.push('reponse_assistance', 'message_superadmin');
      } else if (type === 'sent') {
        whereClause += ' AND (type = ? OR type = ?)';
        params.push('assistance_garage', 'commande_garage');
      }
    }

    const query = `
      SELECT * FROM Message
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ?
    `;
    params.push(limit);

    const messages = await db.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error', messages: [] }, { status: 500 });
  }
}

// POST - Create new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, garageId, subject, content, senderName, senderEmail, senderPhone, recipientGarageId } = body;

    const id = generateCuid();
    const now = new Date().toISOString();

    await db.$executeRaw`
      INSERT INTO Message (id, type, status, garageId, recipientGarageId, subject, content, senderName, senderEmail, senderPhone, createdAt)
      VALUES (
        ${id}, ${type}, 'non_lu', ${garageId || null}, ${recipientGarageId || null},
        ${subject || null}, ${content},
        ${senderName || null}, ${senderEmail || null}, ${senderPhone || null}, ${now}
      )
    `;

    // Create notification for superadmin
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, message, createdAt)
      VALUES (${notificationId}, ${type}, 'Nouveau message reçu', ${now})
    `;

    return NextResponse.json({ 
      success: true, 
      messageId: id,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update message status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const now = new Date().toISOString();

    await db.$executeRaw`
      UPDATE Message 
      SET status = ${status}, updatedAt = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Message mis à jour'
    });

  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await db.$executeRaw`
      DELETE FROM Message WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Message supprimé'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
