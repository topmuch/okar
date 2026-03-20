import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';
import { triggerScoreCalculation } from '@/lib/score';

// POST - Validate or reject a maintenance record (owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approve, rejectionReason } = body;

    // Get current user from session
    const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: { cookie: request.headers.get('cookie') || '' }
    });
    let currentUser = null;
    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();
      currentUser = sessionData.user;
    }

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
    if (record.vehicleOwnerId !== currentUser?.id) {
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

    if (approve) {
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

      // Trigger score calculation
      try {
        await triggerScoreCalculation(record.vehicleId);
      } catch (scoreError) {
        console.error('Score calculation error:', scoreError);
        // Don't fail the request if score calculation fails
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Rapport validé avec succès' 
      });

    } else {
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
    }

  } catch (error) {
    console.error('Validate maintenance record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
