import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/vehicles - List all vehicles with activated QR code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    // ═══════════════════════════════════════════════════════════════════
    // APPROACHE 1: Utiliser Prisma avec des requêtes séparées
    // ═══════════════════════════════════════════════════════════════════
    
    let vehicles = [];

    if (showAll) {
      // Afficher tous les véhicules
      vehicles = await db.vehicle.findMany({
        select: {
          id: true,
          reference: true,
          make: true,
          model: true,
          year: true,
          color: true,
          licensePlate: true,
          vin: true,
          currentMileage: true,
          vtEndDate: true,
          insuranceEndDate: true,
          qrStatus: true,
          status: true,
          okarScore: true,
          okarBadge: true,
          createdAt: true,
          lastScanDate: true,
          ownerId: true,
          proprietorId: true,
          garageId: true,
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          proprietor: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          garage: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          QRCodeStock: {
            select: {
              id: true,
              codeUnique: true,
              shortCode: true,
              status: true
            }
          },
          _count: {
            select: {
              MaintenanceRecord: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      });
    } else {
      // ═══════════════════════════════════════════════════════════════════
      // APPROACHE 2: Récupérer les véhicules avec QR actif
      // Utiliser 2 requêtes et combiner les résultats
      // ═══════════════════════════════════════════════════════════════════

      // 2.1. Véhicules avec QRCodeStock ACTIVE
      const vehiclesWithActiveQRStock = await db.vehicle.findMany({
        where: {
          QRCodeStock: {
            status: 'ACTIVE'
          }
        },
        select: {
          id: true,
          reference: true,
          make: true,
          model: true,
          year: true,
          color: true,
          licensePlate: true,
          vin: true,
          currentMileage: true,
          vtEndDate: true,
          insuranceEndDate: true,
          qrStatus: true,
          status: true,
          okarScore: true,
          okarBadge: true,
          createdAt: true,
          lastScanDate: true,
          ownerId: true,
          proprietorId: true,
          garageId: true,
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          proprietor: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          garage: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          QRCodeStock: {
            select: {
              id: true,
              codeUnique: true,
              shortCode: true,
              status: true
            }
          },
          _count: {
            select: {
              MaintenanceRecord: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      });

      // 2.2. Véhicules SANS QRCodeStock mais AVEC qrStatus = 'ACTIVE'
      const vehiclesWithActiveQrStatus = await db.vehicle.findMany({
        where: {
          QRCodeStock: null,
          qrStatus: 'ACTIVE'
        },
        select: {
          id: true,
          reference: true,
          make: true,
          model: true,
          year: true,
          color: true,
          licensePlate: true,
          vin: true,
          currentMileage: true,
          vtEndDate: true,
          insuranceEndDate: true,
          qrStatus: true,
          status: true,
          okarScore: true,
          okarBadge: true,
          createdAt: true,
          lastScanDate: true,
          ownerId: true,
          proprietorId: true,
          garageId: true,
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          proprietor: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          garage: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          QRCodeStock: {
            select: {
              id: true,
              codeUnique: true,
              shortCode: true,
              status: true
            }
          },
          _count: {
            select: {
              MaintenanceRecord: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      });

      // Combiner les deux listes en évitant les doublons
      const seenIds = new Set<string>();
      for (const v of vehiclesWithActiveQRStock) {
        if (!seenIds.has(v.id)) {
          seenIds.add(v.id);
          vehicles.push(v);
        }
      }
      for (const v of vehiclesWithActiveQrStatus) {
        if (!seenIds.has(v.id)) {
          seenIds.add(v.id);
          vehicles.push(v);
        }
      }
    }

    // Reformater les résultats pour correspondre au format attendu
    const formattedVehicles = vehicles.map(v => ({
      id: v.id,
      reference: v.reference,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      licensePlate: v.licensePlate,
      vin: v.vin,
      currentMileage: v.currentMileage || 0,
      vtEndDate: v.vtEndDate,
      insuranceEndDate: v.insuranceEndDate,
      qrStatus: v.qrStatus,
      status: v.status,
      okarScore: v.okarScore || 0,
      okarBadge: v.okarBadge,
      createdAt: v.createdAt,
      lastScanDate: v.lastScanDate,
      owner: v.owner,
      proprietor: v.proprietor,
      garage: v.garage,
      qrCode: v.QRCodeStock ? {
        id: v.QRCodeStock.id,
        codeUnique: v.QRCodeStock.codeUnique,
        shortCode: v.QRCodeStock.shortCode,
        status: v.QRCodeStock.status
      } : null,
      _count: {
        maintenanceRecords: v._count?.MaintenanceRecord || 0
      },
      maintenanceRecords: []
    }));

    console.log('[VEHICLES API] Found', formattedVehicles.length, 'vehicles (showAll:', showAll, ')');

    return NextResponse.json({ vehicles: formattedVehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
