import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';
import { triggerScoreCalculation } from '@/lib/score';
import { getSession } from '@/lib/session';

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
      source: r.source,
      paperDocumentUrl: r.paperDocumentUrl,
      isVerified: r.isVerified === 1 || r.isVerified === true,
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
// Supports both OKAR certified records and PRE_OKAR_PAPER historical records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      garageId: bodyGarageId,
      mechanicName,
      category,
      categories, // Array of categories
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
      // Paper history fields
      source = 'OKAR',
      paperDocumentUrl,
      isVerified = false,
    } = body;

    // Get session for authentication
    const session = await getSession();
    
    // For OKAR records, require authentication and use session garageId
    let garageId = bodyGarageId;
    
    if (source === 'OKAR') {
      if (!session || !session.garageId) {
        return NextResponse.json({ 
          error: 'Session non valide. Veuillez vous reconnecter.' 
        }, { status: 401 });
      }
      garageId = session.garageId;
    }

    const id = generateCuid();
    const now = new Date().toISOString();

    // Handle categories - store primary in category, others in subCategory as JSON
    const primaryCategory = category || (categories && categories.length > 0 ? categories[0] : 'autre');
    const additionalCategories = categories && categories.length > 1 
      ? JSON.stringify(categories.slice(1)) 
      : null;

    // Check if this is a paper history record (no garage required)
    const isPaperHistory = source === 'PRE_OKAR_PAPER';
    let isCertifiedGarage = false;

    // For OKAR records, verify garage is certified
    if (!isPaperHistory && garageId) {
      const garages = await db.$queryRaw<any[]>`
        SELECT isCertified FROM Garage WHERE id = ${garageId} LIMIT 1
      `;

      if (!garages || garages.length === 0) {
        return NextResponse.json({ 
          error: 'Garage non trouvé' 
        }, { status: 404 });
      }

      // SQLite returns 1 or 0 for boolean
      isCertifiedGarage = garages[0].isCertified === 1 || garages[0].isCertified === true;
      
      if (!isCertifiedGarage) {
        return NextResponse.json({ 
          error: 'Seuls les garages certifiés peuvent créer des rapports d\'entretien' 
        }, { status: 403 });
      }
    }

    // Determine status based on source
    // OKAR records from certified garages are auto-validated and locked
    const recordStatus = isPaperHistory ? 'ARCHIVED' : 'COMPLETED';
    // Auto-validate and lock for certified garages
    const ownerValidation = isCertifiedGarage ? 'VALIDATED' : 'PENDING';
    const isLocked = isCertifiedGarage ? true : false;

    // Create record with source info
    await db.$executeRawUnsafe(`
      INSERT INTO MaintenanceRecord (
        id, vehicleId, garageId, mechanicName, category, subCategory, description,
        mileage, partsList, partsCost, laborCost, totalCost,
        invoicePhoto, invoiceNumber, mechanicSignature,
        ownerValidation, status, isLocked, interventionDate, createdAt, updatedAt,
        source, paperDocumentUrl, isVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      id, 
      vehicleId, 
      garageId || null, 
      mechanicName || null,
      primaryCategory, 
      additionalCategories, 
      description || null, 
      mileage || null,
      partsList || null, 
      partsCost || 0, 
      laborCost || 0, 
      totalCost || 0,
      invoicePhoto || null, 
      invoiceNumber || null, 
      mechanicSignature || null,
      ownerValidation, 
      recordStatus, 
      isLocked ? 1 : 0, 
      interventionDate || now, 
      now,
      now,
      source,
      paperDocumentUrl || null,
      isVerified ? 1 : 0
    );

    // Update vehicle mileage
    if (mileage) {
      await db.$executeRaw`
        UPDATE Vehicle SET currentMileage = ${mileage}, updatedAt = ${now}
        WHERE id = ${vehicleId}
      `;
    }

    // For OKAR records, notify vehicle owner
    if (!isPaperHistory) {
      const vehicles = await db.$queryRaw<any[]>`
        SELECT ownerId, ownerName FROM Vehicle WHERE id = ${vehicleId} LIMIT 1
      `;

      if (vehicles && vehicles.length > 0 && vehicles[0].ownerId) {
        const notificationId = generateCuid();
        await db.$executeRaw`
          INSERT INTO Notification (id, type, userId, vehicleId, message, createdAt, updatedAt)
          VALUES (
            ${notificationId}, 'validation_required', ${vehicles[0].ownerId},
            ${vehicleId}, 'Un nouveau rapport d''entretien est en attente de validation', ${now}, ${now}
          )
        `;
      }
    }

    // Trigger score calculation for paper history (if verified)
    if (isPaperHistory && isVerified) {
      try {
        await triggerScoreCalculation(vehicleId);
      } catch (scoreError) {
        console.error('Score calculation error:', scoreError);
        // Don't fail the request if score calculation fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      recordId: id,
      message: isPaperHistory 
        ? 'Historique papier ajouté avec succès' 
        : 'Rapport d\'entretien créé avec succès',
      source,
      isPaperHistory,
      categories: categories || [primaryCategory],
    });

  } catch (error) {
    console.error('Create maintenance record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
