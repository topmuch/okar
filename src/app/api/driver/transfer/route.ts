import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// POST - Initiate ownership transfer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      currentOwnerId,
      newOwnerName,
      newOwnerPhone,
      newOwnerEmail,
      transferType,
      salePrice,
    } = body;

    // Validate inputs
    if (!vehicleId || !currentOwnerId || !newOwnerName || !newOwnerPhone) {
      return NextResponse.json({ 
        error: 'Informations manquantes' 
      }, { status: 400 });
    }

    // Verify vehicle ownership
    const vehicles = await db.$queryRaw<any[]>`
      SELECT id, ownerId, reference FROM Vehicle WHERE id = ${vehicleId} LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });
    }

    const vehicle = vehicles[0];

    if (vehicle.ownerId !== currentOwnerId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const transferId = generateCuid();

    // Create ownership history record
    await db.$executeRaw`
      INSERT INTO OwnershipHistory (
        id, vehicleId, previousOwnerId, newOwnerName, newOwnerPhone,
        transferType, transferPrice, createdAt
      ) VALUES (
        ${transferId}, ${vehicleId}, ${currentOwnerId}, ${newOwnerName},
        ${newOwnerPhone}, ${transferType || 'sale'}, ${salePrice || null}, ${now}
      )
    `;

    // In production, send SMS/WhatsApp to new owner here
    // For now, we'll simulate it
    console.log(`[SMS] Sending transfer confirmation to +221${newOwnerPhone}`);

    // Create notification for current owner
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, vehicleId, message, createdAt)
      VALUES (
        ${notificationId}, 'transfer_initiated', ${currentOwnerId}, ${vehicleId},
        'Transfert de propriété initié. En attente de confirmation.', ${now}
      )
    `;

    return NextResponse.json({
      success: true,
      transferId,
      message: 'Transfert initié avec succès',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });

  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Confirm ownership transfer (called by new owner)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transferId, newOwnerPhone } = body;

    // Get transfer record
    const transfers = await db.$queryRaw<any[]>`
      SELECT oh.*, v.id as vehicleId, v.reference
      FROM OwnershipHistory oh
      JOIN Vehicle v ON oh.vehicleId = v.id
      WHERE oh.id = ${transferId}
      LIMIT 1
    `;

    if (!transfers || transfers.length === 0) {
      return NextResponse.json({ error: 'Transfert non trouvé' }, { status: 404 });
    }

    const transfer = transfers[0];

    // Verify phone matches
    if (transfer.newOwnerPhone !== newOwnerPhone) {
      return NextResponse.json({ error: 'Numéro de téléphone incorrect' }, { status: 403 });
    }

    // Check if already confirmed
    if (transfer.transferDate) {
      return NextResponse.json({ error: 'Ce transfert a déjà été confirmé' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create or find new owner user
    let newOwnerId = generateCuid();
    
    // Check if user with this phone exists
    const existingUsers = await db.$queryRaw<any[]>`
      SELECT id FROM User WHERE phone = ${newOwnerPhone} LIMIT 1
    `;

    if (existingUsers && existingUsers.length > 0) {
      newOwnerId = existingUsers[0].id;
    } else {
      // Create new user
      await db.$executeRaw`
        INSERT INTO User (id, email, name, phone, role, createdAt)
        VALUES (${newOwnerId}, ${`${newOwnerPhone}@autopass.sn`}, ${transfer.newOwnerName}, ${newOwnerPhone}, 'driver', ${now})
      `;
    }

    // Update vehicle owner
    await db.$executeRaw`
      UPDATE Vehicle SET ownerId = ${newOwnerId}, updatedAt = ${now}
      WHERE id = ${transfer.vehicleId}
    `;

    // Update transfer record
    await db.$executeRaw`
      UPDATE OwnershipHistory SET transferDate = ${now}
      WHERE id = ${transferId}
    `;

    // Notify previous owner
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, vehicleId, message, createdAt)
      VALUES (
        ${notificationId}, 'transfer_completed', ${transfer.previousOwnerId},
        ${transfer.vehicleId}, 'Le transfert de propriété a été confirmé par le nouveau propriétaire.', ${now}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Transfert confirmé avec succès',
      vehicleReference: transfer.reference,
    });

  } catch (error) {
    console.error('Confirm transfer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
