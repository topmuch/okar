import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// POST - Transfer vehicle ownership
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newOwnerName, newOwnerPhone, transferPrice, transferType } = body;

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

    // Get the vehicle
    const vehicles = await db.$queryRaw<any[]>`
      SELECT * FROM Vehicle WHERE id = ${id} LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // Verify ownership
    if (vehicle.ownerId !== currentUser.id) {
      return NextResponse.json({ 
        error: 'Seul le propriétaire actuel peut transférer ce véhicule' 
      }, { status: 403 });
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

    return NextResponse.json({ 
      success: true, 
      message: 'Propriété transférée avec succès',
      transfer: {
        vehicleId: id,
        previousOwner: vehicle.ownerName,
        newOwner: newOwnerName,
        transferDate: now
      }
    });

  } catch (error) {
    console.error('Transfer ownership error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
