import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// PUT - Validate or reject a maintenance record (owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { ownerId, action, rejectionReason } = body;

    // action: 'validate' or 'reject'

    // Get the record
    const records = await db.$queryRaw<any[]>`
      SELECT m.*, v.ownerId as vehicleOwnerId
      FROM MaintenanceRecord m
      LEFT JOIN Vehicle v ON m.vehicleId = v.id
      WHERE m.id = ${id}
      LIMIT 1
    `;

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 });
    }

    const record = records[0];

    // Verify owner
    if (record.vehicleOwnerId !== ownerId) {
      return NextResponse.json({ 
        error: 'Seul le propriétaire du véhicule peut valider ce rapport' 
      }, { status: 403 });
    }

    // Check if already validated/rejected
    if (record.ownerValidation !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Ce rapport a déjà été traité' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'validate') {
      // Validate the record
      await db.$executeRaw`
        UPDATE MaintenanceRecord SET
          ownerValidation = 'VALIDATED',
          status = 'VALIDATED',
          validationDate = ${now},
          updatedAt = ${now}
        WHERE id = ${id}
      `;

      // Notify garage
      const notificationId = generateCuid();
      await db.$executeRaw`
        INSERT INTO Notification (id, type, garageId, message, createdAt)
        VALUES (
          ${notificationId}, 'report_validated', ${record.garageId},
          'Le rapport d''entretien a été validé par le propriétaire', ${now}
        )
      `;

      return NextResponse.json({ 
        success: true, 
        message: 'Rapport validé avec succès' 
      });

    } else if (action === 'reject') {
      // Reject the record
      await db.$executeRaw`
        UPDATE MaintenanceRecord SET
          ownerValidation = 'REJECTED',
          status = 'REJECTED',
          rejectionReason = ${rejectionReason || null},
          validationDate = ${now},
          updatedAt = ${now}
        WHERE id = ${id}
      `;

      // Notify garage
      const notificationId = generateCuid();
      const rejectMessage = `Le rapport d'entretien a été rejeté. Motif: ${rejectionReason || 'Non précisé'}`;
      await db.$executeRaw`
        INSERT INTO Notification (id, type, garageId, message, createdAt)
        VALUES (
          ${notificationId}, 'report_rejected', ${record.garageId},
          ${rejectMessage}, ${now}
        )
      `;

      return NextResponse.json({ 
        success: true, 
        message: 'Rapport rejeté' 
      });

    } else {
      return NextResponse.json({ 
        error: 'Action invalide. Utilisez "validate" ou "reject"' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Validate maintenance record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
