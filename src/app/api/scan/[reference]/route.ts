import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ========================================
// API: SCAN D'UN QR CODE (Format Reference)
// Compatible avec /scan/[reference] page
// ========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    
    // Get current user if authenticated
    let currentUser: { id: string; role: string; garageId?: string } | null = null;
    const authHeader = request.headers.get('cookie');
    if (authHeader) {
      try {
        const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
          headers: { cookie: authHeader }
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          currentUser = sessionData.user;
        }
      } catch (e) {
        // Ignore auth errors for public access
      }
    }
    
    const isGarage = currentUser?.role === 'garage';
    const isOwner = currentUser?.id !== undefined;

    // 1. CHERCHER LE QR CODE PAR SHORTCODE
    const qrCode = await db.$queryRawUnsafe<any[]>(
      `SELECT qs.*, v.id as vehicleId, v.reference, v.make, v.model,
              v.year, v.color, v.licensePlate, v.ownerId, v.garageId, v.qrStatus,
              v.mileage, v.activatedAt, v.okarScore, v.okarBadge,
              u.name as ownerName, u.phone as ownerPhone
       FROM QRCodeStock qs
       LEFT JOIN Vehicle v ON qs.linkedVehicleId = v.id
       LEFT JOIN User u ON v.ownerId = u.id
       WHERE qs.shortCode = ?`,
      reference
    );

    // 2. SI NON TROUVÉ, CHERCHER PAR RÉFÉRENCE VÉHICULE
    let qr = qrCode?.[0];
    let vehicleData: any = null;

    if (!qr) {
      // Chercher directement par référence véhicule
      const vehicle = await db.$queryRawUnsafe<any[]>(
        `SELECT v.*, u.name as ownerName, u.phone as ownerPhone
         FROM Vehicle v
         LEFT JOIN User u ON v.ownerId = u.id
         WHERE v.reference = ?`,
        reference
      );

      if (vehicle && vehicle.length > 0) {
        vehicleData = vehicle[0];
      } else {
        return NextResponse.json({
          status: 'not_found',
          message: 'Ce code QR n\'existe pas dans le système'
        });
      }
    } else {
      vehicleData = qr;
    }

    // 3. VÉRIFIER LE STATUT DU QR CODE
    if (qr && (qr.status === 'STOCK' || qr.status === 'ASSIGNED')) {
      return NextResponse.json({
        status: 'inactive',
        message: 'Ce QR Code n\'est pas encore activé',
        info: {
          lotId: qr.lotId,
          assignedGarageId: qr.assignedGarageId,
        }
      });
    }

    if (qr && qr.status === 'REVOKED') {
      return NextResponse.json({
        status: 'revoked',
        message: 'Ce QR Code a été révoqué'
      });
    }

    // 4. RÉCUPÉRER LES INFOS COMPLÈTES DU VÉHICULE
    const vehicleId = vehicleData?.vehicleId || vehicleData?.id;

    if (!vehicleId) {
      return NextResponse.json({
        status: 'inactive',
        message: 'Aucun véhicule associé à ce QR Code'
      });
    }

    // Récupérer le garage
    const garage = await db.$queryRawUnsafe<any[]>(
      `SELECT id, name, isCertified FROM Garage WHERE id = ?`,
      vehicleData.garageId
    );

    // Récupérer l'historique des interventions
    const maintenanceRecords = await db.$queryRawUnsafe<any[]>(
      `SELECT mr.id, mr.category, mr.description, mr.mileage, mr.totalCost,
              mr.interventionDate, mr.ownerValidation, mr.source, mr.isVerified,
              g.name as garageName
       FROM MaintenanceRecord mr
       LEFT JOIN Garage g ON mr.garageId = g.id
       WHERE mr.vehicleId = ?
       ORDER BY mr.interventionDate DESC`,
      vehicleId
    );

    // 5. RETOURNER LES DONNÉES
    // For garage, include owner contact info
    // For owner, include all records including pending
    // For public, only validated records
    
    const shouldShowOwnerContact = isGarage;
    const shouldShowAllRecords = isGarage || (isOwner && vehicleData.ownerId === currentUser?.id);
    
    const records = maintenanceRecords || [];
    const displayRecords = shouldShowAllRecords 
      ? records 
      : records.filter((r: any) => r.ownerValidation === 'VALIDATED' || r.source === 'PRE_OKAR_PAPER');
    
    // Separate OKAR certified records and paper history records
    const okarRecords = displayRecords.filter((r: any) => r.source !== 'PRE_OKAR_PAPER');
    const paperRecords = displayRecords.filter((r: any) => r.source === 'PRE_OKAR_PAPER');
    
    return NextResponse.json({
      status: 'active',
      vehicle: {
        id: vehicleId,
        reference: vehicleData.reference,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        licensePlate: vehicleData.licensePlate,
        qrStatus: vehicleData.qrStatus,
        ownerId: vehicleData.ownerId,
        ownerName: vehicleData.ownerName,
        // Only show phone/email for garage users
        ownerPhone: shouldShowOwnerContact ? vehicleData.ownerPhone : null,
        ownerEmail: shouldShowOwnerContact ? vehicleData.ownerEmail : null,
        garageName: garage?.[0]?.name,
        garageCertified: garage?.[0]?.isCertified === 1,
        mileage: vehicleData.mileage,
        activatedAt: vehicleData.activatedAt,
        vtEndDate: vehicleData.vtEndDate,
        insuranceEndDate: vehicleData.insuranceEndDate,
        insuranceCompany: vehicleData.insuranceCompany,
        currentMileage: vehicleData.mileage,
        mainPhoto: vehicleData.mainPhoto,
        nextMaintenanceDueKm: vehicleData.nextMaintenanceDueKm,
        nextMaintenanceType: vehicleData.nextMaintenanceType,
        forSale: vehicleData.forSale === 1,
        salePrice: vehicleData.salePrice,
        saleContact: vehicleData.saleContact,
        // OKAR Score
        okarScore: vehicleData.okarScore || 0,
        okarBadge: vehicleData.okarBadge || 'BRONZE',
      },
      maintenanceRecords: displayRecords,
      okarRecords,
      paperRecords,
      ownershipHistory: [],
      // Current user context
      currentUser: currentUser ? { id: currentUser.id, role: currentUser.role } : null,
    });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Erreur serveur'
    }, { status: 500 });
  }
}
