import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// GET - List maintenance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const garageId = searchParams.get('garageId');
    const status = searchParams.get('status');
    const ownerValidation = searchParams.get('ownerValidation');
    const limit = parseInt(searchParams.get('limit') || '100');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (vehicleId) {
      whereClause += ' AND m.vehicleId = ?';
      params.push(vehicleId);
    }

    if (garageId) {
      whereClause += ' AND m.garageId = ?';
      params.push(garageId);
    }

    if (status && status !== 'all') {
      whereClause += ' AND m.status = ?';
      params.push(status);
    }

    if (ownerValidation && ownerValidation !== 'all') {
      whereClause += ' AND m.ownerValidation = ?';
      params.push(ownerValidation);
    }

    const query = `
      SELECT 
        m.*,
        v.reference as vehicleReference,
        v.make as vehicleMake,
        v.model as vehicleModel,
        v.licensePlate as vehicleLicensePlate,
        v.ownerName as vehicleOwnerName,
        g.name as garageName,
        g.isCertified as garageCertified
      FROM MaintenanceRecord m
      LEFT JOIN Vehicle v ON m.vehicleId = v.id
      LEFT JOIN Garage g ON m.garageId = g.id
      ${whereClause}
      ORDER BY m.createdAt DESC
      LIMIT ?
    `;
    params.push(limit);

    const rawRecords = await db.$queryRawUnsafe<any[]>(query, ...params);

    // Transform records to match frontend format
    const records = rawRecords.map(r => ({
      id: r.id,
      vehicleId: r.vehicleId,
      vehicle: {
        reference: r.vehicleReference,
        make: r.vehicleMake,
        model: r.vehicleModel,
        licensePlate: r.vehicleLicensePlate,
        ownerName: r.vehicleOwnerName,
      },
      garageId: r.garageId,
      garageName: r.garageName,
      garageCertified: r.garageCertified === 1 || r.garageCertified === true,
      mechanicName: r.mechanicName,
      category: r.category,
      description: r.description,
      mileage: r.mileage,
      partsList: r.partsList,
      partsCost: r.partsCost,
      laborCost: r.laborCost,
      totalCost: r.totalCost,
      invoicePhoto: r.invoicePhoto,
      invoiceNumber: r.invoiceNumber,
      mechanicSignature: r.mechanicSignature,
      ownerValidation: r.ownerValidation,
      validationDate: r.validationDate,
      rejectionReason: r.rejectionReason,
      status: r.status,
      interventionDate: r.interventionDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // Calculate stats
    const stats = {
      total: records.length,
      pending: records.filter(r => r.ownerValidation === 'PENDING').length,
      validated: records.filter(r => r.ownerValidation === 'VALIDATED').length,
      rejected: records.filter(r => r.ownerValidation === 'REJECTED').length,
    };

    return NextResponse.json({
      records,
      stats
    });

  } catch (error) {
    console.error('Get maintenance records error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      records: [],
      stats: { total: 0, pending: 0, validated: 0, rejected: 0 }
    }, { status: 500 });
  }
}

// POST - Create new maintenance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      garageId,
      mechanicName,
      category,
      description,
      mileage,
      partsList,
      partsCost,
      laborCost,
      totalCost,
      invoicePhoto,
      invoiceNumber,
      mechanicSignature,
      interventionDate,
    } = body;

    const id = generateCuid();
    const now = new Date().toISOString();

    // Verify garage is certified
    const garages = await db.$queryRaw<any[]>`
      SELECT isCertified FROM Garage WHERE id = ${garageId} LIMIT 1
    `;

    if (!garages || garages.length === 0 || !garages[0].isCertified) {
      return NextResponse.json({ 
        error: 'Seuls les garages certifiés peuvent créer des rapports d\'entretien' 
      }, { status: 403 });
    }

    // Create record
    await db.$executeRaw`
      INSERT INTO MaintenanceRecord (
        id, vehicleId, garageId, mechanicName, category, description,
        mileage, partsList, partsCost, laborCost, totalCost,
        invoicePhoto, invoiceNumber, mechanicSignature,
        ownerValidation, status, interventionDate, createdAt
      ) VALUES (
        ${id}, ${vehicleId}, ${garageId}, ${mechanicName || null},
        ${category}, ${description || null}, ${mileage || null},
        ${partsList || null}, ${partsCost || 0}, ${laborCost || 0}, ${totalCost || 0},
        ${invoicePhoto || null}, ${invoiceNumber || null}, ${mechanicSignature || null},
        'PENDING', 'SUBMITTED', ${interventionDate || now}, ${now}
      )
    `;

    // Update vehicle mileage
    if (mileage) {
      await db.$executeRaw`
        UPDATE Vehicle SET mileage = ${mileage}, updatedAt = ${now}
        WHERE id = ${vehicleId}
      `;
    }

    // Create notification for vehicle owner
    const vehicles = await db.$queryRaw<any[]>`
      SELECT ownerId, ownerName FROM Vehicle WHERE id = ${vehicleId} LIMIT 1
    `;

    if (vehicles && vehicles.length > 0 && vehicles[0].ownerId) {
      const notificationId = generateCuid();
      await db.$executeRaw`
        INSERT INTO Notification (id, type, userId, vehicleId, message, createdAt)
        VALUES (
          ${notificationId}, 'validation_required', ${vehicles[0].ownerId},
          ${vehicleId}, 'Un nouveau rapport d''entretien est en attente de validation', ${now}
        )
      `;
    }

    return NextResponse.json({ 
      success: true, 
      recordId: id,
      message: 'Rapport d\'entretien créé avec succès'
    });

  } catch (error) {
    console.error('Create maintenance record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
