import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ========================================
// API: SCAN D'UN QR CODE
// ========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    // 1. Chercher le QR code par shortCode OU codeUnique
    let qrCode = await db.qRCodeStock.findUnique({
      where: { shortCode: reference },
      include: {
        QRCodeLot: {
          select: { prefix: true }
        },
        Vehicle: {
          include: {
            Garage: {
              select: { name: true, isCertified: true, logo: true }
            }
          }
        },
        Garage: {
          select: { name: true }
        }
      }
    });

    // Si pas trouvé par shortCode, essayer par codeUnique
    if (!qrCode) {
      qrCode = await db.qRCodeStock.findUnique({
        where: { codeUnique: reference },
        include: {
          QRCodeLot: {
            select: { prefix: true }
          },
          Vehicle: {
            include: {
              Garage: {
                select: { name: true, isCertified: true, logo: true }
              }
            }
          },
          Garage: {
            select: { name: true }
          }
        }
      });
    }

    // 2. Si non trouvé, chercher par référence véhicule
    if (!qrCode) {
      const vehicle = await db.vehicle.findUnique({
        where: { reference },
        include: {
          Garage: {
            select: { name: true, isCertified: true, logo: true }
          }
        }
      });

      if (!vehicle) {
        return NextResponse.json({
          success: false,
          status: 'not_found',
          qrStatus: 'NOT_FOUND',
          message: 'Ce code QR n\'existe pas dans le système'
        });
      }

      return buildVehicleResponse(vehicle, vehicle.Garage);
    }

    // 3. Vérifier le statut du QR code
    if (qrCode.status === 'STOCK' || qrCode.status === 'ASSIGNED') {
      return NextResponse.json({
        success: true,
        status: 'inactive',
        qrStatus: 'INACTIVE',
        message: 'Ce QR Code n\'est pas encore activé',
        vehicle: {
          id: null,
          reference: qrCode.shortCode,
          make: null,
          model: null,
          licensePlate: null,
          year: null,
          mileage: null,
          owner: null
        },
        info: {
          lotId: qrCode.lotId,
          lotPrefix: qrCode.QRCodeLot?.prefix,
          assignedGarageId: qrCode.assignedGarageId,
          assignedGarageName: qrCode.Garage?.name
        }
      });
    }

    if (qrCode.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        status: 'revoked',
        qrStatus: 'BLOCKED',
        message: 'Ce QR Code a été révoqué'
      });
    }

    // 4. Vérifier qu'on a un véhicule
    if (!qrCode.Vehicle) {
      return NextResponse.json({
        success: true,
        status: 'inactive',
        qrStatus: 'INACTIVE',
        message: 'Aucun véhicule associé à ce QR Code',
        vehicle: {
          id: null,
          reference: qrCode.shortCode,
          make: null,
          model: null,
          licensePlate: null,
          year: null,
          mileage: null,
          owner: null
        }
      });
    }

    return buildVehicleResponse(qrCode.Vehicle, qrCode.Vehicle.Garage);

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({
      success: false,
      status: 'error',
      qrStatus: 'NOT_FOUND',
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function buildVehicleResponse(vehicle: any, garage: any) {
  // Récupérer les interventions
  const maintenanceRecords = await db.maintenanceRecord.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { interventionDate: 'desc' },
    take: 50,
    include: {
      Garage: {
        select: { name: true, logo: true, isCertified: true }
      }
    }
  });

  // Filtrer pour affichage public: VALIDATED, PRE_OKAR_PAPER, ou PENDING (nouveau)
  const publicRecords = maintenanceRecords.filter((r) => 
    r.ownerValidation === 'VALIDATED' || 
    r.ownerValidation === 'PENDING' ||
    r.source === 'PRE_OKAR_PAPER'
  );

  return NextResponse.json({
    success: true,
    status: 'active',
    qrStatus: 'ACTIVE',
    vehicle: {
      id: vehicle.id,
      reference: vehicle.reference,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      qrStatus: vehicle.qrStatus,
      ownerId: vehicle.ownerId,
      ownerName: vehicle.ownerName,
      ownerPhone: vehicle.ownerPhone,
      ownerEmail: vehicle.ownerEmail,
      garageName: garage?.name,
      garageLogo: garage?.logo,
      garageCertified: garage?.isCertified || false,
      mileage: vehicle.currentMileage,
      currentMileage: vehicle.currentMileage,
      activatedAt: vehicle.activatedAt,
      vtStartDate: vehicle.vtStartDate,
      vtEndDate: vehicle.vtEndDate,
      vtCenter: vehicle.vtCenter,
      insuranceStartDate: vehicle.insuranceStartDate,
      insuranceEndDate: vehicle.insuranceEndDate,
      insuranceCompany: vehicle.insuranceCompany,
      insurancePolicyNum: vehicle.insurancePolicyNum,
      mainPhoto: vehicle.mainPhoto,
      engineType: vehicle.engineType,
      vin: vehicle.vin,
      photos: [],
      nextMaintenanceDueKm: vehicle.nextMaintenanceDueKm,
      nextMaintenanceDueDate: vehicle.nextMaintenanceDueDate,
      nextMaintenanceType: vehicle.nextMaintenanceType,
      okarScore: vehicle.okarScore || 0,
      okarBadge: vehicle.okarBadge || 'BRONZE',
    },
    maintenanceRecords: publicRecords.map((r) => {
      // Parse additional categories from subCategory
      let allCategories = [r.category];
      if (r.subCategory) {
        try {
          const additional = JSON.parse(r.subCategory);
          if (Array.isArray(additional)) {
            allCategories = [r.category, ...additional];
          }
        } catch {
          // subCategory might be a simple string, not JSON
          if (r.subCategory && r.subCategory !== r.category) {
            allCategories = [r.category, r.subCategory];
          }
        }
      }
      
      return {
        id: r.id,
        category: r.category,
        categories: allCategories,
        subCategory: r.subCategory,
        description: r.description,
        mileage: r.mileage,
        totalCost: r.totalCost,
        interventionDate: r.interventionDate,
        ownerValidation: r.ownerValidation,
        source: r.source,
        isVerified: r.isVerified,
        isLocked: r.isLocked === 1 || r.isLocked === true,
        garageName: r.Garage?.name,
        garageLogo: r.Garage?.logo,
        garageCertified: r.Garage?.isCertified === 1 || r.Garage?.isCertified === true,
      };
    }),
    okarRecords: publicRecords.filter((r) => r.source !== 'PRE_OKAR_PAPER'),
    paperRecords: publicRecords.filter((r) => r.source === 'PRE_OKAR_PAPER'),
    ownershipHistory: [],
    currentUser: null,
  });
}
