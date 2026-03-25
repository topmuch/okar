import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// API: GET DRIVER VEHICLES
// Récupère tous les véhicules du propriétaire connecté
// ============================================

function toNumber(value: any): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    // TODO: Get user from session/token
    // For now, get the first driver user
    const users = await db.$queryRawUnsafe<any[]>(`
      SELECT id, name, email, phone FROM User WHERE role = 'driver' LIMIT 1
    `);
    
    if (!users || users.length === 0) {
      return NextResponse.json({ vehicles: [], error: 'No driver found' });
    }
    
    const userId = users[0].id;
    
    // Get all vehicles for this owner
    const vehicles = await db.$queryRawUnsafe<any[]>(`
      SELECT 
        v.id, v.reference, v.make, v.model, v.year, v.color,
        v.licensePlate, v.mainPhoto, v.currentMileage, v.status,
        v.vtEndDate, v.insuranceEndDate,
        v.nextMaintenanceDueKm, v.nextMaintenanceDueDate, v.nextMaintenanceType,
        v.lastMaintenanceDate, v.lastMaintenanceType,
        v.createdAt, v.activatedAt,
        qs.shortCode
      FROM Vehicle v
      LEFT JOIN QRCodeStock qs ON qs.linkedVehicleId = v.id
      WHERE v.ownerId = ? OR v.proprietorId = ?
      ORDER BY v.createdAt DESC
    `, userId, userId);
    
    // Process vehicles and calculate alerts
    const processedVehicles = vehicles.map(v => {
      const alerts: any[] = [];
      
      // Check VT expiration
      if (v.vtEndDate) {
        const daysLeft = daysUntil(v.vtEndDate);
        if (daysLeft !== null) {
          if (daysLeft <= 0) {
            alerts.push({
              type: 'VT',
              severity: 'HIGH',
              message: 'Visite Technique expirée',
              daysLeft
            });
          } else if (daysLeft <= 7) {
            alerts.push({
              type: 'VT',
              severity: 'HIGH',
              message: `VT expire dans ${daysLeft} jours`,
              daysLeft
            });
          } else if (daysLeft <= 30) {
            alerts.push({
              type: 'VT',
              severity: 'MEDIUM',
              message: `VT expire dans ${daysLeft} jours`,
              daysLeft
            });
          }
        }
      }
      
      // Check Insurance expiration
      if (v.insuranceEndDate) {
        const daysLeft = daysUntil(v.insuranceEndDate);
        if (daysLeft !== null) {
          if (daysLeft <= 0) {
            alerts.push({
              type: 'ASSURANCE',
              severity: 'HIGH',
              message: 'Assurance expirée',
              daysLeft
            });
          } else if (daysLeft <= 7) {
            alerts.push({
              type: 'ASSURANCE',
              severity: 'HIGH',
              message: `Assurance expire dans ${daysLeft} jours`,
              daysLeft
            });
          } else if (daysLeft <= 30) {
            alerts.push({
              type: 'ASSURANCE',
              severity: 'MEDIUM',
              message: `Assurance expire dans ${daysLeft} jours`,
              daysLeft
            });
          }
        }
      }
      
      // Check Maintenance due
      if (v.nextMaintenanceDueKm && v.currentMileage) {
        const kmLeft = toNumber(v.nextMaintenanceDueKm) - toNumber(v.currentMileage);
        if (kmLeft <= 0) {
          alerts.push({
            type: 'MAINTENANCE',
            severity: 'HIGH',
            message: `${v.nextMaintenanceType || 'Entretien'} en retard`,
            kmLeft
          });
        } else if (kmLeft <= 500) {
          alerts.push({
            type: 'MAINTENANCE',
            severity: 'MEDIUM',
            message: `${v.nextMaintenanceType || 'Entretien'} prévu à ${v.nextMaintenanceDueKm} km`,
            kmLeft
          });
        }
      }
      
      return {
        ...v,
        currentMileage: toNumber(v.currentMileage),
        nextMaintenanceDueKm: v.nextMaintenanceDueKm ? toNumber(v.nextMaintenanceDueKm) : null,
        hasAlerts: alerts.length > 0,
        alertCount: alerts.length,
        alerts
      };
    });
    
    return NextResponse.json({
      vehicles: processedVehicles,
      total: processedVehicles.length,
      userId
    });
    
  } catch (error) {
    console.error('Get vehicles error:', error);
    return NextResponse.json({
      vehicles: [],
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
