import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/reports/public - Create a public report (from QR scan)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      type,
      description,
      reporterName,
      reporterPhone,
      reporterEmail,
    } = body;

    // Validation
    if (!vehicleId || !type || !description) {
      return NextResponse.json(
        { error: 'Véhicule, type et description sont obligatoires' },
        { status: 400 }
      );
    }

    // Get vehicle info
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, make: true, model: true, licensePlate: true, reference: true }
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      );
    }

    // Determine report type mapping
    const reportTypeMap: Record<string, string> = {
      'info_incorrect': 'OTHER',
      'fake_record': 'FAKE_INTERVENTION',
      'odometer_rollback': 'FRAUD',
      'other': 'OTHER',
    };

    const reportType = reportTypeMap[type] || 'OTHER';

    // Create the report
    const report = await db.report.create({
      data: {
        id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        type: reportType,
        status: 'PENDING',
        priority: 'NORMAL',
        reporterName: reporterName || null,
        reporterPhone: reporterPhone || null,
        reporterEmail: reporterEmail || null,
        reporterRole: 'public',
        reportedType: 'VEHICLE',
        reportedId: vehicleId,
        reportedName: `${vehicle.make} ${vehicle.model} - ${vehicle.licensePlate}`,
        title: `Signalement: ${type === 'fake_record' ? 'Intervention suspecte' : type === 'odometer_rollback' ? 'Kilométrage frauduleux' : type === 'info_incorrect' ? 'Informations incorrectes' : 'Autre'}`,
        description,
        vehicleId: vehicleId,
        updatedAt: new Date(),
      },
    });

    // Create notification for superadmin
    await db.notification.create({
      data: {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        type: 'REPORT_CREATED',
        message: `Nouveau signalement: ${report.title}`,
        vehicleId: vehicleId,
        data: JSON.stringify({
          reportId: report.id,
          vehicleRef: vehicle.reference,
          type: reportType,
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Signalement créé avec succès'
    });

  } catch (error) {
    console.error('Error creating public report:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du signalement' },
      { status: 500 }
    );
  }
}
