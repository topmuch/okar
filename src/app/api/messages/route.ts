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
    const { type, garageId, subject, content, senderName, senderEmail, senderPhone } = body;

    const id = generateCuid();
    const now = new Date().toISOString();

    await db.$executeRaw`
      INSERT INTO Message (id, type, status, garageId, subject, content, senderName, senderEmail, senderPhone, createdAt)
      VALUES (
        ${id}, ${type}, 'non_lu', ${garageId || null},
        ${subject || null}, ${content},
        ${senderName || null}, ${senderEmail || null}, ${senderPhone || null}, ${now}
      )
    `;

    // Create notification for superadmin
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, message, createdAt)
      VALUES (${notificationId}, ${type}, 'Nouveau message d''un garage', ${now})
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
