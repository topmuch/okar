import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// GET - Get validation records for driver
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId') || 'demo-driver-id';
    const status = searchParams.get('status'); // PENDING, VALIDATED, REJECTED
    const count = searchParams.get('count');

    // If count requested, just return the count
    if (count === 'true') {
      const result = await db.$queryRaw<any[]>`
        SELECT COUNT(*) as count
        FROM MaintenanceRecord m
        JOIN Vehicle v ON m.vehicleId = v.id
        WHERE v.ownerId = ${ownerId} AND m.ownerValidation = 'PENDING'
      `;
      return NextResponse.json({ count: result?.[0]?.count || 0 });
    }

    // Build query
    let whereClause = "WHERE v.ownerId = ?";
    const params: string[] = [ownerId];

    if (status) {
      whereClause += " AND m.ownerValidation = ?";
      params.push(status);
    }

    const query = `
      SELECT 
        m.*,
        v.make as vehicleMake,
        v.model as vehicleModel,
        v.licensePlate as vehicleLicensePlate,
        v.reference as vehicleReference,
        g.name as garageName,
        g.isCertified as garageCertified
      FROM MaintenanceRecord m
      JOIN Vehicle v ON m.vehicleId = v.id
      LEFT JOIN Garage g ON m.garageId = g.id
      ${whereClause}
      ORDER BY m.createdAt DESC
    `;

    const records = await db.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json({ records });

  } catch (error) {
    console.error('Get validations error:', error);
    return NextResponse.json({ records: [], error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Validate or reject a record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, ownerId, action, rejectionReason } = body;

    // Verify ownership
    const records = await db.$queryRaw<any[]>`
      SELECT m.*, v.ownerId as vehicleOwnerId
      FROM MaintenanceRecord m
      JOIN Vehicle v ON m.vehicleId = v.id
      WHERE m.id = ${recordId}
      LIMIT 1
    `;

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 });
    }

    const record = records[0];

    if (record.vehicleOwnerId !== ownerId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (record.ownerValidation !== 'PENDING') {
      return NextResponse.json({ error: 'Ce rapport a déjà été traité' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'validate') {
      await db.$executeRaw`
        UPDATE MaintenanceRecord SET
          ownerValidation = 'VALIDED',
          status = 'VALIDED',
          validationDate = ${now},
          updatedAt = ${now}
        WHERE id = ${recordId}
      `;

      // Notify garage
      const notificationId = generateCuid();
      await db.$executeRaw`
        INSERT INTO Notification (id, type, garageId, vehicleId, message, createdAt)
        VALUES (
          ${notificationId}, 'report_validated', ${record.garageId}, ${record.vehicleId},
          'Le rapport d''entretien a été validé par le propriétaire', ${now}
        )
      `;

      return NextResponse.json({ success: true, message: 'Intervention validée' });

    } else if (action === 'reject') {
      await db.$executeRaw`
        UPDATE MaintenanceRecord SET
          ownerValidation = 'REJECTED',
          status = 'REJECTED',
          rejectionReason = ${rejectionReason || null},
          validationDate = ${now},
          updatedAt = ${now}
        WHERE id = ${recordId}
      `;

      // Notify garage
      const notificationId = generateCuid();
      await db.$executeRaw`
        INSERT INTO Notification (id, type, garageId, vehicleId, message, createdAt)
        VALUES (
          ${notificationId}, 'report_rejected', ${record.garageId}, ${record.vehicleId},
          ${'Rapport rejeté. Motif: ' + (rejectionReason || 'Non précisé')}, ${now}
        )
      `;

      return NextResponse.json({ success: true, message: 'Intervention rejetée' });

    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

  } catch (error) {
    console.error('Validate record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
