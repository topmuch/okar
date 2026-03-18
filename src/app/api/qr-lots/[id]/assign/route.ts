import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// PUT - Assign lot to garage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { garageId } = body;

    if (!garageId) {
      return NextResponse.json({ error: 'Garage ID requis' }, { status: 400 });
    }

    // Check if lot exists
    const lots = await db.$queryRaw<any[]>`
      SELECT * FROM QRCodeLot WHERE id = ${id} LIMIT 1
    `;

    if (!lots || lots.length === 0) {
      return NextResponse.json({ error: 'Lot non trouvé' }, { status: 404 });
    }

    // Check if garage exists
    const garages = await db.$queryRaw<any[]>`
      SELECT id FROM Garage WHERE id = ${garageId} LIMIT 1
    `;

    if (!garages || garages.length === 0) {
      return NextResponse.json({ error: 'Garage non trouvé' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update lot
    await db.$executeRaw`
      UPDATE QRCodeLot 
      SET assignedToId = ${garageId}, assignedAt = ${now}, status = 'ASSIGNED'
      WHERE id = ${id}
    `;

    // Update all vehicles in lot
    await db.$executeRaw`
      UPDATE Vehicle SET garageId = ${garageId}
      WHERE lotId = ${id}
    `;

    // Create notification for garage
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, garageId, message, createdAt)
      VALUES (
        ${notificationId}, 'qr_lot_assigned', ${garageId},
        'Un nouveau lot de QR codes vous a été assigné', ${now}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Lot assigné avec succès au garage' 
    });

  } catch (error) {
    console.error('Assign lot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
