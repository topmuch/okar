import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/admin/qrcodes/list
 * Liste des QR codes individuels avec toutes leurs relations
 * 
 * Query params:
 * - page: numéro de page (default: 1)
 * - limit: nombre d'éléments par page (default: 50)
 * - status: filtre par statut (STOCK, ACTIVE, REVOKED, LOST, all)
 * - garageId: filtre par garage
 * - lotId: filtre par lot
 * - search: recherche par code, plaque ou propriétaire
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const status = searchParams.get('status');
    const garageId = searchParams.get('garageId');
    const lotId = searchParams.get('lotId');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereConditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (status && status !== 'all') {
      whereConditions.push('q.status = ?');
      params.push(status);
    }

    if (garageId && garageId !== 'all') {
      whereConditions.push('q.assignedGarageId = ?');
      params.push(garageId);
    }

    if (lotId && lotId !== 'all') {
      whereConditions.push('q.lotId = ?');
      params.push(lotId);
    }

    if (search && search.trim()) {
      whereConditions.push(
        '(q.shortCode LIKE ? OR v.licensePlate LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)'
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.join(' AND ');

    // Main query with all relations
    const query = `
      SELECT 
        q.id, 
        q.codeUnique, 
        q.shortCode, 
        q.status, 
        q.lotId, 
        q.assignedGarageId, 
        q.linkedVehicleId, 
        q.activationDate, 
        q.createdAt,
        q.updatedAt,
        l.prefix as lotPrefix,
        g.name as garageName,
        v.id as vehicleId, 
        v.reference as vehicleReference, 
        v.make, 
        v.model, 
        v.year, 
        v.color, 
        v.licensePlate, 
        v.mainPhoto, 
        v.currentMileage, 
        v.okarScore, 
        v.okarBadge,
        v.vtEndDate, 
        v.insuranceEndDate,
        u.id as ownerId, 
        u.name as ownerName, 
        u.phone as ownerPhone, 
        u.email as ownerEmail,
        (SELECT COUNT(*) FROM MaintenanceRecord mr WHERE mr.vehicleId = v.id) as maintenanceCount
      FROM QRCodeStock q
      LEFT JOIN QRCodeLot l ON q.lotId = l.id
      LEFT JOIN Garage g ON q.assignedGarageId = g.id
      LEFT JOIN Vehicle v ON q.linkedVehicleId = v.id
      LEFT JOIN User u ON v.ownerId = u.id
      WHERE ${whereClause}
      ORDER BY q.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const qrCodes = await db.$queryRawUnsafe<any[]>(query, ...params);

    // Count total for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM QRCodeStock q
      LEFT JOIN Vehicle v ON q.linkedVehicleId = v.id
      LEFT JOIN User u ON v.ownerId = u.id
      WHERE ${whereClause}
    `;
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await db.$queryRawUnsafe<any[]>(countQuery, ...countParams);
    
    // Handle BigInt conversion
    const total = Number(countResult[0]?.total || 0);

    // Format results
    const formattedQRCodes = qrCodes.map(qr => ({
      id: qr.id,
      codeUnique: qr.codeUnique,
      shortCode: qr.shortCode,
      status: qr.status,
      lotId: qr.lotId,
      lotPrefix: qr.lotPrefix || '',
      assignedGarageId: qr.assignedGarageId,
      assignedGarageName: qr.garageName,
      linkedVehicleId: qr.linkedVehicleId,
      activationDate: qr.activationDate,
      createdAt: qr.createdAt,
      vehicle: qr.vehicleId ? {
        id: qr.vehicleId,
        reference: qr.vehicleReference,
        make: qr.make,
        model: qr.model,
        year: qr.year,
        color: qr.color,
        licensePlate: qr.licensePlate,
        mainPhoto: qr.mainPhoto,
        currentMileage: qr.currentMileage,
        okarScore: qr.okarScore,
        okarBadge: qr.okarBadge,
        vtEndDate: qr.vtEndDate,
        insuranceEndDate: qr.insuranceEndDate,
        maintenanceCount: qr.maintenanceCount ? Number(qr.maintenanceCount) : 0,
        owner: qr.ownerId ? {
          id: qr.ownerId,
          name: qr.ownerName,
          phone: qr.ownerPhone,
          email: qr.ownerEmail
        } : undefined
      } : undefined
    }));

    return NextResponse.json({
      success: true,
      qrCodes: formattedQRCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la récupération des QR codes',
        qrCodes: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
      },
      { status: 500 }
    );
  }
}
