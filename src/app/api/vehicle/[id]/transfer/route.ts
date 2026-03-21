import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// POST - Transfer vehicle ownership with OTP verification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { transferCode, newOwnerName, newOwnerPhone, transferPrice, transferType } = body;

    // Get current user from session
    const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: { cookie: request.headers.get('cookie') || '' }
    });
    
    let currentUser = null;
    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();
      currentUser = sessionData.user;
    }

    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Vous devez être connecté pour effectuer cette action' 
      }, { status: 401 });
    }

    // Validate transfer code is provided
    if (!transferCode) {
      return NextResponse.json({ 
        error: 'Le code de transfert est requis. Demandez au vendeur de vous fournir le code à 6 chiffres.' 
      }, { status: 400 });
    }

    // Get the vehicle
    const vehicles = await db.$queryRaw<any[]>`
      SELECT * FROM Vehicle WHERE id = ${id} LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // Verify the transfer code
    const transferCodes = await db.$queryRaw<any[]>`
      SELECT * FROM TransferCode 
      WHERE vehicleId = ${id} 
        AND code = ${transferCode}
        AND status = 'PENDING'
      LIMIT 1
    `;

    if (!transferCodes || transferCodes.length === 0) {
      // Check if code exists but is used/expired
      const usedCodes = await db.$queryRaw<any[]>`
        SELECT * FROM TransferCode 
        WHERE vehicleId = ${id} AND code = ${transferCode}
        LIMIT 1
      `;

      if (usedCodes && usedCodes.length > 0) {
        const codeStatus = usedCodes[0].status;
        if (codeStatus === 'USED') {
          return NextResponse.json({ 
            error: 'Ce code de transfert a déjà été utilisé' 
          }, { status: 400 });
        }
        if (codeStatus === 'EXPIRED' || new Date(usedCodes[0].expiresAt) < new Date()) {
          return NextResponse.json({ 
            error: 'Ce code de transfert a expiré. Demandez au vendeur d\'en générer un nouveau.' 
          }, { status: 400 });
        }
        if (codeStatus === 'CANCELLED') {
          return NextResponse.json({ 
            error: 'Ce code de transfert a été annulé par le vendeur' 
          }, { status: 400 });
        }
      }

      return NextResponse.json({ 
        error: 'Code de transfert invalide. Vérifiez le code à 6 chiffres fourni par le vendeur.' 
      }, { status: 400 });
    }

    const transferRecord = transferCodes[0];

    // Verify the code hasn't expired
    if (new Date(transferRecord.expiresAt) < new Date()) {
      await db.$executeRaw`
        UPDATE TransferCode SET status = 'EXPIRED' WHERE id = ${transferRecord.id}
      `;
      return NextResponse.json({ 
        error: 'Ce code de transfert a expiré. Demandez au vendeur d\'en générer un nouveau.' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!newOwnerName || !newOwnerPhone) {
      return NextResponse.json({ 
        error: 'Le nom et le téléphone du nouveau propriétaire sont requis' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const historyId = generateCuid();

    // End current ownership in history
    await db.$executeRaw`
      UPDATE OwnershipHistory 
      SET endDate = ${now}
      WHERE vehicleId = ${id} AND isCurrent = 1
    `;

    // Create new ownership history entry
    await db.$executeRaw`
      INSERT INTO OwnershipHistory (id, vehicleId, previousOwnerId, previousOwnerName, newOwnerName, transferType, transferDate, transferPrice, isCurrent)
      VALUES (${historyId}, ${id}, ${currentUser.id}, ${vehicle.ownerName}, ${newOwnerName}, ${transferType || 'sale'}, ${now}, ${transferPrice || null}, 1)
    `;

    // Update vehicle with new owner info (keep ownerId as null until new owner claims)
    await db.$executeRaw`
      UPDATE Vehicle SET
        ownerId = null,
        ownerName = ${newOwnerName},
        ownerPhone = ${newOwnerPhone},
        ownerEmail = null,
        updatedAt = ${now}
      WHERE id = ${id}
    `;

    // Mark transfer code as used
    await db.$executeRaw`
      UPDATE TransferCode SET
        status = 'USED',
        buyerId = ${currentUser.id},
        buyerName = ${newOwnerName},
        buyerPhone = ${newOwnerPhone},
        usedAt = ${now}
      WHERE id = ${transferRecord.id}
    `;

    // Create notification for the seller
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, vehicleId, message, createdAt)
      VALUES (
        ${notificationId}, 'TRANSFER_COMPLETED', ${transferRecord.sellerId}, ${id},
        ${`Transfert confirmé ! ${newOwnerName} est maintenant le nouveau propriétaire de votre véhicule.`},
        ${now}
      )
    `;

    // Create audit log
    const auditId = generateCuid();
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, entityId, userId, userEmail, details, createdAt)
      VALUES (
        ${auditId}, 'VEHICLE_TRANSFER', 'VEHICLE', ${id}, ${currentUser.id}, ${currentUser.email || null},
        ${JSON.stringify({
          previousOwner: vehicle.ownerName,
          newOwner: newOwnerName,
          transferCode: transferRecord.code,
          transferType: transferType || 'sale',
          transferPrice: transferPrice || null
        })},
        ${now}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Propriété transférée avec succès',
      transfer: {
        vehicleId: id,
        previousOwner: vehicle.ownerName,
        newOwner: newOwnerName,
        transferDate: now,
        transferCode: transferRecord.code
      }
    });

  } catch (error) {
    console.error('Transfer ownership error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Check transfer status for a vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if there's an active transfer code for this vehicle
    const transferCodes = await db.$queryRaw<any[]>`
      SELECT tc.*, v.make, v.model, v.licensePlate, v.reference
      FROM TransferCode tc
      JOIN Vehicle v ON tc.vehicleId = v.id
      WHERE tc.vehicleId = ${id}
        AND tc.status = 'PENDING'
        AND tc.expiresAt > ${new Date().toISOString()}
      ORDER BY tc.createdAt DESC
      LIMIT 1
    `;

    if (!transferCodes || transferCodes.length === 0) {
      return NextResponse.json({
        hasActiveTransfer: false,
        message: 'Aucun transfert en cours pour ce véhicule'
      });
    }

    const transfer = transferCodes[0];

    return NextResponse.json({
      hasActiveTransfer: true,
      transfer: {
        code: transfer.code, // Only show to owner
        expiresAt: transfer.expiresAt,
        sellerName: transfer.sellerName,
        vehicle: {
          make: transfer.make,
          model: transfer.model,
          licensePlate: transfer.licensePlate,
          reference: transfer.reference
        }
      }
    });

  } catch (error) {
    console.error('Check transfer status error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
