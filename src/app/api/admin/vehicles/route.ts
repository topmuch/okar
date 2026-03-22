import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/vehicles - List all vehicles with activated QR code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    // Utiliser une requête raw pour faire la jointure correctement
    // Afficher les véhicules qui ont un QR code ACTIF dans QRCodeStock
    // OU qui ont un qrStatus = 'ACTIVE' dans Vehicle (pour compatibilité)
    const vehicles = await db.$queryRaw<any[]>`
      SELECT 
        v.id, v.reference, v.make, v.model, v.year, v.color, v.licensePlate, v.vin,
        v.currentMileage, v.vtEndDate, v.insuranceEndDate, v.qrStatus, v.status,
        v.okarScore, v.okarBadge, v.createdAt, v.lastScanDate,
        v.ownerId, v.proprietorId, v.garageId,
        qs.id as qrCodeId, qs.codeUnique, qs.shortCode, qs.status as qrStockStatus,
        o.id as ownerId, o.name as ownerName, o.phone as ownerPhone, o.email as ownerEmail,
        p.id as proprietorId, p.name as proprietorName, p.phone as proprietorPhone,
        g.id as garageId, g.name as garageName, g.slug as garageSlug,
        (SELECT COUNT(*) FROM MaintenanceRecord WHERE vehicleId = v.id) as maintenanceCount
      FROM Vehicle v
      LEFT JOIN QRCodeStock qs ON qs.linkedVehicleId = v.id
      LEFT JOIN User o ON v.ownerId = o.id
      LEFT JOIN User p ON v.proprietorId = p.id
      LEFT JOIN Garage g ON v.garageId = g.id
      WHERE ${
        showAll 
          ? '1=1' 
          : "(qs.status = 'ACTIVE' OR (qs.status IS NULL AND v.qrStatus = 'ACTIVE'))"
      }
      ORDER BY v.createdAt DESC
      LIMIT 500
    `;

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
      owner: v.ownerId ? {
        id: v.ownerId,
        name: v.ownerName,
        phone: v.ownerPhone,
        email: v.ownerEmail
      } : null,
      proprietor: v.proprietorId ? {
        id: v.proprietorId,
        name: v.proprietorName,
        phone: v.proprietorPhone
      } : null,
      garage: v.garageId ? {
        id: v.garageId,
        name: v.garageName,
        slug: v.garageSlug
      } : null,
      qrCode: v.qrCodeId ? {
        id: v.qrCodeId,
        codeUnique: v.codeUnique,
        shortCode: v.shortCode,
        status: v.qrStockStatus
      } : null,
      _count: {
        maintenanceRecords: v.maintenanceCount || 0
      },
      maintenanceRecords: []
    }));

    return NextResponse.json({ vehicles: formattedVehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
