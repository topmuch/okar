import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activateQRCode, generateCuid, blockQRCode, revokeAndReplaceQR } from '@/lib/qr-system';

/**
 * POST - Activate a QR code for a vehicle
 * Only certified garages can perform this action
 * 
 * Flow:
 * 1. Verify garage is certified
 * 2. Verify QR exists and belongs to this garage
 * 3. Verify QR is not already active
 * 4. Create/update vehicle data
 * 5. Optionally create driver account
 * 6. Mark QR as ACTIVE
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reference,
      garageId,
      vehicleData,
      driverData,
    } = body;

    // Validate required fields
    if (!reference || !garageId) {
      return NextResponse.json({ 
        success: false,
        error: 'Référence QR et ID garage requis' 
      }, { status: 400 });
    }

    if (!vehicleData?.make || !vehicleData?.model || !vehicleData?.licensePlate) {
      return NextResponse.json({ 
        success: false,
        error: 'Marque, modèle et immatriculation sont obligatoires' 
      }, { status: 400 });
    }

    // Check if garage is certified
    const garage = await db.$queryRaw<any[]>`
      SELECT id, name, isCertified FROM Garage WHERE id = ${garageId} LIMIT 1
    `;

    if (!garage || garage.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Garage non trouvé' 
      }, { status: 404 });
    }

    if (!garage[0].isCertified) {
      return NextResponse.json({ 
        success: false,
        error: 'Seuls les garages certifiés AutoPass peuvent activer des QR codes' 
      }, { status: 403 });
    }

    // Find the QR code
    const qrCode = await db.$queryRaw<any[]>`
      SELECT 
        v.id, v.reference, v.garageId, v.qrStatus, v.lotId,
        l.prefix as lotPrefix
      FROM Vehicle v
      LEFT JOIN QRCodeLot l ON v.lotId = l.id
      WHERE v.reference = ${reference}
      LIMIT 1
    `;

    if (!qrCode || qrCode.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Code QR non trouvé dans le système' 
      }, { status: 404 });
    }

    const qr = qrCode[0];

    // Verify QR belongs to this garage
    if (qr.garageId !== garageId) {
      return NextResponse.json({ 
        success: false,
        error: 'Ce code QR n\'est pas assigné à votre garage' 
      }, { status: 403 });
    }

    // Check QR status
    if (qr.qrStatus === 'ACTIVE') {
      return NextResponse.json({ 
        success: false,
        error: 'Ce code QR est déjà activé' 
      }, { status: 400 });
    }

    if (qr.qrStatus === 'BLOCKED' || qr.qrStatus === 'REVOKED') {
      return NextResponse.json({ 
        success: false,
        error: 'Ce code QR a été bloqué ou révoqué' 
      }, { status: 400 });
    }

    // Check for license plate uniqueness
    const existingPlate = await db.$queryRaw<any[]>`
      SELECT id FROM Vehicle 
      WHERE licensePlate = ${vehicleData.licensePlate} AND id != ${qr.id}
      LIMIT 1
    `;

    if (existingPlate && existingPlate.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Un véhicule avec cette immatriculation existe déjà' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    let driverId: string | null = null;
    let driverPassword: string | null = null;

    // Create driver account if requested
    if (driverData && driverData.createAccount) {
      // Check if user exists with this phone
      const existingUser = await db.$queryRaw<any[]>`
        SELECT id, name FROM User WHERE phone = ${driverData.phone} LIMIT 1
      `;

      if (existingUser && existingUser.length > 0) {
        driverId = existingUser[0].id;
      } else {
        // Create new driver
        driverId = generateCuid();
        driverPassword = Math.random().toString(36).slice(-8).toUpperCase();
        
        await db.$executeRaw`
          INSERT INTO User (id, name, phone, email, password, role, createdAt)
          VALUES (
            ${driverId}, 
            ${driverData.name}, 
            ${driverData.phone},
            ${driverData.email || null}, 
            ${driverPassword}, 
            'driver', 
            ${now}
          )
        `;
      }
    }

    // Activate the vehicle
    await db.$executeRaw`
      UPDATE Vehicle SET
        qrStatus = 'ACTIVE',
        status = 'active',
        activatedAt = ${now},
        make = ${vehicleData.make},
        model = ${vehicleData.model},
        year = ${vehicleData.year || null},
        color = ${vehicleData.color || null},
        licensePlate = ${vehicleData.licensePlate},
        vin = ${vehicleData.vin || null},
        engineType = ${vehicleData.engineType || 'essence'},
        mileage = ${vehicleData.mileage || 0},
        ownerName = ${driverData?.name || null},
        ownerPhone = ${driverData?.phone || null},
        ownerId = ${driverId},
        updatedAt = ${now}
      WHERE id = ${qr.id}
    `;

    // Update lot status
    if (qr.lotId) {
      await updateLotStatus(qr.lotId);
    }

    // Log the activation
    const logId = generateCuid();
    // In production: Create audit log

    return NextResponse.json({
      success: true,
      vehicleId: qr.id,
      driverId: driverId || undefined,
      driverPassword: driverPassword || undefined,
      message: 'QR code activé avec succès'
    });

  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur lors de l\'activation' 
    }, { status: 500 });
  }
}

/**
 * PUT - Block or revoke a QR code
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, action, reason, garageId, requesterId } = body;

    if (action === 'block') {
      const result = await blockQRCode(reference, reason, requesterId);
      
      if (!result.success) {
        return NextResponse.json({ 
          success: false,
          error: result.error 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'QR code bloqué avec succès'
      });
    }

    if (action === 'replace') {
      const result = await revokeAndReplaceQR(reference, garageId, reason);
      
      if (!result.success) {
        return NextResponse.json({ 
          success: false,
          error: result.error 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        newReference: result.newReference,
        message: 'QR code remplacé avec succès'
      });
    }

    return NextResponse.json({ 
      success: false,
      error: 'Action non reconnue' 
    }, { status: 400 });

  } catch (error) {
    console.error('QR action error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur lors de l\'action' 
    }, { status: 500 });
  }
}

/**
 * GET - Check QR code status before activation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const garageId = searchParams.get('garageId');

    if (!reference) {
      return NextResponse.json({ 
        success: false,
        error: 'Référence QR requise' 
      }, { status: 400 });
    }

    const qrCode = await db.$queryRaw<any[]>`
      SELECT 
        v.id, v.reference, v.garageId, v.qrStatus, v.lotId,
        v.make, v.model, v.licensePlate,
        l.prefix as lotPrefix,
        g.name as garageName
      FROM Vehicle v
      LEFT JOIN QRCodeLot l ON v.lotId = l.id
      LEFT JOIN Garage g ON v.garageId = g.id
      WHERE v.reference = ${reference}
      LIMIT 1
    `;

    if (!qrCode || qrCode.length === 0) {
      return NextResponse.json({ 
        success: false,
        status: 'not_found',
        error: 'Code QR non trouvé' 
      }, { status: 404 });
    }

    const qr = qrCode[0];

    // Determine if this garage can activate
    let canActivate = false;
    let canActivateReason = '';

    if (qr.qrStatus === 'ACTIVE') {
      canActivate = false;
      canActivateReason = 'Ce QR est déjà activé';
    } else if (qr.qrStatus === 'BLOCKED' || qr.qrStatus === 'REVOKED') {
      canActivate = false;
      canActivateReason = 'Ce QR a été bloqué ou révoqué';
    } else if (garageId && qr.garageId !== garageId) {
      canActivate = false;
      canActivateReason = 'Ce QR n\'est pas assigné à votre garage';
    } else if (garageId && qr.garageId === garageId && qr.qrStatus === 'INACTIVE') {
      canActivate = true;
      canActivateReason = 'QR disponible pour activation';
    } else {
      canActivate = true;
      canActivateReason = 'QR disponible';
    }

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qr.id,
        reference: qr.reference,
        status: qr.qrStatus,
        lotPrefix: qr.lotPrefix,
        garageId: qr.garageId,
        garageName: qr.garageName,
        existingVehicle: qr.make ? {
          make: qr.make,
          model: qr.model,
          licensePlate: qr.licensePlate
        } : null
      },
      canActivate,
      canActivateReason
    });

  } catch (error) {
    console.error('Check QR error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur lors de la vérification' 
    }, { status: 500 });
  }
}

/**
 * Update lot status based on usage
 */
async function updateLotStatus(lotId: string): Promise<void> {
  try {
    const stats = await db.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN qrStatus = 'ACTIVE' THEN 1 ELSE 0 END) as activated
      FROM Vehicle WHERE lotId = ${lotId}
    `;

    if (stats && stats.length > 0) {
      const { total, activated } = stats[0];
      let status: string;

      if (activated === 0) {
        status = 'ASSIGNED';
      } else if (activated < total) {
        status = 'PARTIALLY_USED';
      } else {
        status = 'FULLY_USED';
      }

      await db.$executeRaw`
        UPDATE QRCodeLot SET status = ${status} WHERE id = ${lotId}
      `;
    }
  } catch (error) {
    console.error('Error updating lot status:', error);
  }
}
