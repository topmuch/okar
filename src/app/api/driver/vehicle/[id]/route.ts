import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// API: GET VEHICLE DETAILS
// Récupère les détails complets d'un véhicule
// ============================================

function toNumber(value: any): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get vehicle details
    const vehicle = await db.$queryRawUnsafe<any[]>(`
      SELECT 
        v.*,
        g.name as garageName,
        u.name as ownerName,
        u.phone as ownerPhone,
        u.email as ownerEmail
      FROM Vehicle v
      LEFT JOIN Garage g ON v.garageId = g.id
      LEFT JOIN User u ON v.ownerId = u.id
      WHERE v.id = ?
    `, id);
    
    if (!vehicle || vehicle.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Véhicule non trouvé'
      }, { status: 404 });
    }
    
    const v = vehicle[0];
    
    // Get maintenance records
    const maintenanceRecords = await db.$queryRawUnsafe<any[]>(`
      SELECT 
        mr.id, mr.category, mr.subCategory, mr.description, mr.mileage,
        mr.interventionDate, mr.status, mr.ownerValidation, mr.isLocked,
        mr.mechanicName, mr.invoicePhoto, mr.workPhotos, mr.correctionOfId,
        mr.createdAt,
        g.name as garageName
      FROM MaintenanceRecord mr
      LEFT JOIN Garage g ON mr.garageId = g.id
      WHERE mr.vehicleId = ?
      ORDER BY mr.interventionDate DESC, mr.createdAt DESC
    `, id);
    
    // Process records
    const processedRecords = maintenanceRecords.map(r => ({
      ...r,
      mileage: r.mileage ? toNumber(r.mileage) : null,
      isLocked: r.isLocked === 1 || r.isLocked === true,
    }));
    
    return NextResponse.json({
      success: true,
      vehicle: {
        ...v,
        currentMileage: toNumber(v.currentMileage),
        nextMaintenanceDueKm: v.nextMaintenanceDueKm ? toNumber(v.nextMaintenanceDueKm) : null,
        lastMaintenanceKm: v.lastMaintenanceKm ? toNumber(v.lastMaintenanceKm) : null,
        maintenanceRecords: processedRecords,
      }
    });
    
  } catch (error) {
    console.error('Get vehicle error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
