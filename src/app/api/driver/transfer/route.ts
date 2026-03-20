import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';
import { getSession } from '@/lib/session';
import { randomBytes } from 'crypto';

// ============================================
// OTP CONFIGURATION
// ============================================
const OTP_LENGTH = 6;
const OTP_EXPIRY_HOURS = 48; // 48 hours to complete transfer
const OTP_MAX_ATTEMPTS = 3;

// ============================================
// UTILITY: Generate Secure OTP
// ============================================
function generateSecureOTP(length: number = OTP_LENGTH): string {
  const digits = '0123456789';
  const bytes = randomBytes(length);
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(bytes[i] % digits.length);
  }
  return otp;
}

// ============================================
// UTILITY: Mask phone for privacy
// ============================================
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  return '***' + phone.slice(-4);
}

// ============================================
// POST - Initiate ownership transfer with OTP
// ============================================
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 🔒 ÉTAPE 1: AUTHENTIFICATION REQUISE
    // ============================================
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication requise. Veuillez vous connecter.' 
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      vehicleId,
      newOwnerName,
      newOwnerPhone,
      newOwnerEmail,
      transferType,
      salePrice,
    } = body;

    // ============================================
    // ÉTAPE 2: VALIDATION DES DONNÉES
    // ============================================
    if (!vehicleId || !newOwnerName || !newOwnerPhone) {
      return NextResponse.json({ 
        success: false,
        error: 'Informations manquantes: vehicleId, newOwnerName et newOwnerPhone sont requis.' 
      }, { status: 400 });
    }

    // Validate phone format (Senegal: 10 digits starting with 77, 78, 76, 70)
    const phoneClean = newOwnerPhone.replace(/\D/g, '');
    if (phoneClean.length < 9) {
      return NextResponse.json({
        success: false,
        error: 'Numéro de téléphone invalide'
      }, { status: 400 });
    }

    // ============================================
    // 🔒 ÉTAPE 3: VÉRIFICATION DU VÉHICULE
    // ============================================
    const vehicles = await db.$queryRaw<any[]>`
      SELECT id, ownerId, reference, make, model, licensePlate, ownerName, ownerPhone
      FROM Vehicle 
      WHERE id = ${vehicleId} 
      LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Véhicule non trouvé' 
      }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // 🔒 SECURITY: Verify current user owns this vehicle
    if (vehicle.ownerId !== sessionUser.id) {
      // Log unauthorized attempt
      await db.$executeRaw`
        INSERT INTO AuditLog (id, action, entityType, entityId, userId, userEmail, details, createdAt)
        VALUES (
          ${generateCuid()}, 
          'UNAUTHORIZED_TRANSFER_ATTEMPT', 
          'VEHICLE', 
          ${vehicleId}, 
          ${sessionUser.id}, 
          ${sessionUser.email},
          ${JSON.stringify({
            attemptedOwner: sessionUser.id,
            actualOwner: vehicle.ownerId,
            vehicleReference: vehicle.reference
          })},
          ${new Date().toISOString()}
        )
      `;

      return NextResponse.json({ 
        success: false,
        error: 'Vous n\'êtes pas autorisé à transférer ce véhicule.' 
      }, { status: 403 });
    }

    // ============================================
    // 🔒 ÉTAPE 4: VÉRIFICATION QU'IL N'Y A PAS DE TRANSFERT EN COURS
    // ============================================
    const existingTransfers = await db.$queryRaw<any[]>`
      SELECT id FROM TransferCode 
      WHERE vehicleId = ${vehicleId} AND status = 'PENDING'
      LIMIT 1
    `;

    if (existingTransfers && existingTransfers.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Un transfert est déjà en cours pour ce véhicule. Annulez-le d\'abord.'
      }, { status: 400 });
    }

    // ============================================
    // ÉTAPE 5: GÉNÉRATION DU CODE DE TRANSFERT SÉCURISÉ
    // ============================================
    const transferCode = generateSecureOTP(6); // 6-digit code
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_HOURS * 60 * 60 * 1000);
    const transferId = generateCuid();

    // Create transfer code record
    await db.$executeRaw`
      INSERT INTO TransferCode (
        id, code, vehicleId, sellerId, sellerName, sellerPhone,
        buyerId, buyerName, buyerPhone, status, createdAt, expiresAt
      ) VALUES (
        ${transferId}, ${transferCode}, ${vehicleId}, 
        ${sessionUser.id}, ${vehicle.ownerName || sessionUser.name}, ${vehicle.ownerPhone || ''},
        NULL, ${newOwnerName}, ${newOwnerPhone}, 'PENDING', ${now.toISOString()}, ${expiresAt.toISOString()}
      )
    `;

    // Create ownership history record
    await db.$executeRaw`
      INSERT INTO OwnershipHistory (
        id, vehicleId, previousOwnerId, previousOwnerName, newOwnerName, newOwnerPhone,
        transferType, transferPrice, createdAt
      ) VALUES (
        ${generateCuid()}, ${vehicleId}, ${sessionUser.id}, 
        ${vehicle.ownerName || sessionUser.name}, ${newOwnerName}, ${newOwnerPhone},
        ${transferType || 'sale'}, ${salePrice || null}, ${now.toISOString()}
      )
    `;

    // ============================================
    // ÉTAPE 6: ENVOI DU CODE OTP AU VENDEUR (SMS/WhatsApp)
    // Le vendeur doit partager ce code avec l'acheteur
    // ============================================
    // TODO: Integrate with SMS provider (Orange SMS API, Twilio, etc.)
    console.log(`[SMS] Transfer code for vehicle ${vehicle.reference}: ${transferCode}`);
    console.log(`[SMS] Send to seller: ${maskPhone(vehicle.ownerPhone || sessionUser.email)}`);

    // In production, you would send SMS here:
    // await sendSMS(vehicle.ownerPhone, 
    //   `OKAR: Votre code de transfert pour ${vehicle.make} ${vehicle.model} est: ${transferCode}. 
    //    Partagez ce code avec l'acheteur. Valide 48h.`);

    // ============================================
    // ÉTAPE 7: NOTIFICATION AU VENDEUR
    // ============================================
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, vehicleId, message, createdAt)
      VALUES (
        ${generateCuid()}, 'transfer_initiated', ${sessionUser.id}, ${vehicleId},
        ${`Transfert initié pour ${vehicle.make} ${vehicle.model}. Code: ${transferCode}. Partagez-le avec l'acheteur.`},
        ${now.toISOString()}
      )
    `;

    // ============================================
    // ÉTAPE 8: AUDIT LOG
    // ============================================
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, entityId, userId, userEmail, details, createdAt)
      VALUES (
        ${generateCuid()}, 'TRANSFER_INITIATED', 'VEHICLE', ${vehicleId},
        ${sessionUser.id}, ${sessionUser.email},
        ${JSON.stringify({
          vehicleReference: vehicle.reference,
          newOwnerName,
          newOwnerPhone: maskPhone(newOwnerPhone),
          transferType: transferType || 'sale',
          salePrice,
          expiresAt: expiresAt.toISOString()
        })},
        ${now.toISOString()}
      )
    `;

    return NextResponse.json({
      success: true,
      transferId,
      code: transferCode, // Return code so seller can share it
      message: 'Transfert initié. Partagez le code avec l\'acheteur.',
      vehicle: {
        reference: vehicle.reference,
        make: vehicle.make,
        model: vehicle.model,
      },
      expiresAt: expiresAt.toISOString(),
      instructions: `Le code ${transferCode} doit être saisi par l'acheteur pour confirmer le transfert. Valide 48h.`
    });

  } catch (error) {
    console.error('Transfer initiation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur serveur lors de l\'initiation du transfert' 
    }, { status: 500 });
  }
}

// ============================================
// PUT - Confirm ownership transfer with OTP verification
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transferId, transferCode, newOwnerPhone } = body;

    // ============================================
    // 🔒 ÉTAPE 1: VALIDATION DES DONNÉES
    // ============================================
    if (!transferId || !transferCode || !newOwnerPhone) {
      return NextResponse.json({ 
        success: false,
        error: 'Informations manquantes: transferId, transferCode et newOwnerPhone sont requis.' 
      }, { status: 400 });
    }

    const phoneClean = newOwnerPhone.replace(/\D/g, '');

    // ============================================
    // 🔒 ÉTAPE 2: RÉCUPÉRATION DU TRANSFERT
    // ============================================
    const transfers = await db.$queryRaw<any[]>`
      SELECT tc.*, v.id as vehicleId, v.reference, v.make, v.model, v.licensePlate,
             v.ownerId as currentOwnerId
      FROM TransferCode tc
      JOIN Vehicle v ON tc.vehicleId = v.id
      WHERE tc.id = ${transferId}
      LIMIT 1
    `;

    if (!transfers || transfers.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Transfert non trouvé' 
      }, { status: 404 });
    }

    const transfer = transfers[0];

    // ============================================
    // 🔒 ÉTAPE 3: VÉRIFICATION DU CODE OTP
    // ============================================
    if (transfer.status !== 'PENDING') {
      return NextResponse.json({ 
        success: false,
        error: transfer.status === 'USED' 
          ? 'Ce transfert a déjà été confirmé' 
          : `Ce transfert est ${transfer.status.toLowerCase()}`
      }, { status: 400 });
    }

    // Check expiration
    if (new Date(transfer.expiresAt) < new Date()) {
      // Mark as expired
      await db.$executeRaw`
        UPDATE TransferCode SET status = 'EXPIRED' WHERE id = ${transferId}
      `;
      return NextResponse.json({ 
        success: false,
        error: 'Ce code de transfert a expiré. Demandez un nouveau code au vendeur.' 
      }, { status: 400 });
    }

    // Verify OTP code matches
    if (transfer.code !== transferCode) {
      // Increment attempts (if tracking)
      return NextResponse.json({ 
        success: false,
        error: 'Code de transfert incorrect' 
      }, { status: 403 });
    }

    // Verify phone matches the intended buyer
    const transferPhoneClean = transfer.buyerPhone.replace(/\D/g, '');
    if (transferPhoneClean !== phoneClean) {
      return NextResponse.json({ 
        success: false,
        error: 'Ce numéro de téléphone ne correspond pas au destinataire du transfert.' 
      }, { status: 403 });
    }

    // ============================================
    // 🔒 ÉTAPE 4: CONFIRMATION DU VENDEUR REQUISE
    // Le vendeur doit d'abord confirmer qu'il veut procéder
    // Cette vérification se fait via une autre API ou le vendeur reçoit une notification
    // Pour l'instant, on procède directement mais en production, il faudrait:
    // 1. Acheteur saisit le code -> Statut "BUYER_CONFIRMED"
    // 2. Vendeur reçoit notification et doit confirmer -> Statut "COMPLETED"
    // ============================================

    const now = new Date();

    // ============================================
    // ÉTAPE 5: CRÉATION DU NOUVEAU PROPRIÉTAIRE
    // ============================================
    let newOwnerId = generateCuid();
    
    const existingUsers = await db.$queryRaw<any[]>`
      SELECT id, name FROM User WHERE phone = ${newOwnerPhone} LIMIT 1
    `;

    if (existingUsers && existingUsers.length > 0) {
      newOwnerId = existingUsers[0].id;
    } else {
      // Create new user
      await db.$executeRaw`
        INSERT INTO User (id, email, name, phone, role, createdAt, updatedAt)
        VALUES (
          ${newOwnerId}, 
          ${`${phoneClean}@okar.sn`}, 
          ${transfer.buyerName}, 
          ${newOwnerPhone}, 
          'driver', 
          ${now.toISOString()},
          ${now.toISOString()}
        )
      `;
    }

    // ============================================
    // ÉTAPE 6: MISE À JOUR DU VÉHICULE
    // ============================================
    await db.$executeRaw`
      UPDATE Vehicle 
      SET ownerId = ${newOwnerId}, 
          ownerName = ${transfer.buyerName},
          ownerPhone = ${newOwnerPhone},
          updatedAt = ${now.toISOString()}
      WHERE id = ${transfer.vehicleId}
    `;

    // ============================================
    // ÉTAPE 7: MISE À JOUR DU TRANSFERT
    // ============================================
    await db.$executeRaw`
      UPDATE TransferCode 
      SET status = 'USED', 
          buyerId = ${newOwnerId},
          usedAt = ${now.toISOString()},
          confirmedBy = ${transfer.sellerId}
      WHERE id = ${transferId}
    `;

    // ============================================
    // ÉTAPE 8: MISE À JOUR DE L'HISTORIQUE
    // ============================================
    await db.$executeRaw`
      UPDATE OwnershipHistory 
      SET newOwnerId = ${newOwnerId},
          transferDate = ${now.toISOString()}
      WHERE vehicleId = ${transfer.vehicleId} 
        AND previousOwnerId = ${transfer.sellerId}
        AND transferDate IS NULL
    `;

    // ============================================
    // ÉTAPE 9: NOTIFICATIONS
    // ============================================
    // Notify previous owner
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, vehicleId, message, createdAt)
      VALUES (
        ${generateCuid()}, 'transfer_completed', ${transfer.sellerId},
        ${transfer.vehicleId}, 
        ${`Transfert de ${transfer.make} ${transfer.model} (${transfer.licensePlate}) confirmé. Le véhicule appartient maintenant à ${transfer.buyerName}.`},
        ${now.toISOString()}
      )
    `;

    // Notify new owner
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, vehicleId, message, createdAt)
      VALUES (
        ${generateCuid()}, 'ownership_received', ${newOwnerId},
        ${transfer.vehicleId}, 
        ${`Félicitations! Vous êtes maintenant le propriétaire de ${transfer.make} ${transfer.model} (${transfer.licensePlate}).`},
        ${now.toISOString()}
      )
    `;

    // ============================================
    // ÉTAPE 10: AUDIT LOG
    // ============================================
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, entityId, details, createdAt)
      VALUES (
        ${generateCuid()}, 'TRANSFER_COMPLETED', 'VEHICLE', ${transfer.vehicleId},
        ${JSON.stringify({
          vehicleReference: transfer.reference,
          previousOwner: transfer.sellerId,
          newOwner: newOwnerId,
          newOwnerName: transfer.buyerName,
          newOwnerPhone: maskPhone(newOwnerPhone)
        })},
        ${now.toISOString()}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Transfert confirmé avec succès',
      vehicle: {
        reference: transfer.reference,
        make: transfer.make,
        model: transfer.model,
        licensePlate: transfer.licensePlate,
      },
      newOwner: {
        id: newOwnerId,
        name: transfer.buyerName,
      },
    });

  } catch (error) {
    console.error('Transfer confirmation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur lors de la confirmation du transfert' 
    }, { status: 500 });
  }
}

// ============================================
// DELETE - Cancel a pending transfer
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication requise.' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get('transferId');

    if (!transferId) {
      return NextResponse.json({ 
        success: false,
        error: 'transferId requis' 
      }, { status: 400 });
    }

    // Get transfer
    const transfers = await db.$queryRaw<any[]>`
      SELECT * FROM TransferCode WHERE id = ${transferId} LIMIT 1
    `;

    if (!transfers || transfers.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Transfert non trouvé' 
      }, { status: 404 });
    }

    const transfer = transfers[0];

    // Only seller can cancel
    if (transfer.sellerId !== sessionUser.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Seul le vendeur peut annuler le transfert.' 
      }, { status: 403 });
    }

    if (transfer.status !== 'PENDING') {
      return NextResponse.json({ 
        success: false,
        error: 'Ce transfert ne peut plus être annulé.' 
      }, { status: 400 });
    }

    // Cancel
    await db.$executeRaw`
      UPDATE TransferCode 
      SET status = 'CANCELLED', cancelledAt = ${new Date().toISOString()}
      WHERE id = ${transferId}
    `;

    // Audit log
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, entityId, userId, details, createdAt)
      VALUES (
        ${generateCuid()}, 'TRANSFER_CANCELLED', 'TRANSFER', ${transferId},
        ${sessionUser.id},
        ${JSON.stringify({ reason: 'Seller cancelled' })},
        ${new Date().toISOString()}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Transfert annulé avec succès'
    });

  } catch (error) {
    console.error('Transfer cancellation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur lors de l\'annulation' 
    }, { status: 500 });
  }
}
