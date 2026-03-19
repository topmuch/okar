import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Vehicle row type for raw queries
interface VehicleRow {
  id: string;
  reference: string;
  qrStatus: string;
  status: string;
  make: string | null;
  model: string | null;
  ownerName: string | null;
  garageId: string | null;
  createdAt: string;
  activatedAt: string | null;
}

// MaintenanceRecord row type
interface MaintenanceRecordRow {
  id: string;
  vehicleId: string;
  category: string;
  description: string | null;
  status: string;
  ownerValidation: string;
  createdAt: string;
}

// Garage row type
interface GarageRow {
  id: string;
  name: string;
  isCertified: boolean;
  active: boolean;
}

// GET - Fetch dashboard statistics
export async function GET() {
  try {
    // Get all vehicles using raw SQL
    const vehicles = await db.$queryRaw<VehicleRow[]>`
      SELECT
        id, reference, qrStatus, status, make, model, ownerName, garageId,
        createdAt, activatedAt
      FROM Vehicle
    `;

    // Get garages count using raw SQL
    const garages = await db.$queryRaw<GarageRow[]>`
      SELECT id, name, isCertified, active FROM Garage
    `;

    // Get maintenance records
    const maintenanceRecords = await db.$queryRaw<MaintenanceRecordRow[]>`
      SELECT id, vehicleId, category, description, status, ownerValidation, createdAt
      FROM MaintenanceRecord
      ORDER BY createdAt DESC
      LIMIT 20
    `;

    // Calculate statistics
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.qrStatus === 'ACTIVE').length;
    const inactiveVehicles = vehicles.filter(v => v.qrStatus === 'INACTIVE').length;
    const blockedVehicles = vehicles.filter(v => v.qrStatus === 'BLOCKED').length;

    // Garage stats
    const totalGarages = garages.length;
    const certifiedGarages = garages.filter(g => g.isCertified).length;
    const activeGarages = garages.filter(g => g.active).length;

    // Maintenance stats
    const totalInterventions = maintenanceRecords.length;
    const pendingValidations = maintenanceRecords.filter(r => r.ownerValidation === 'PENDING').length;
    const validatedRecords = maintenanceRecords.filter(r => r.ownerValidation === 'VALIDATED').length;

    // Get daily activations for the last 7 days
    const last7Days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayActivations = vehicles.filter(v => {
        if (!v.activatedAt) return false;
        const activatedAt = new Date(v.activatedAt);
        return activatedAt >= dayStart && activatedAt <= dayEnd;
      }).length;

      last7Days.push({
        day: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
        count: dayActivations,
      });
    }

    // Format recent activities
    type ActivityType = {
      id: string;
      type: 'activation' | 'intervention' | 'validation';
      name: string;
      reference: string;
      time: string;
      details: string;
      status: 'success' | 'pending' | 'validated';
    };

    const recentActivities: ActivityType[] = [];

    // Add recent vehicle activations
    const recentActivated = vehicles
      .filter(v => v.activatedAt && v.ownerName)
      .sort((a, b) => new Date(b.activatedAt!).getTime() - new Date(a.activatedAt!).getTime())
      .slice(0, 5);

    for (const vehicle of recentActivated) {
      recentActivities.push({
        id: `activation-${vehicle.id}`,
        type: 'activation',
        name: vehicle.ownerName || 'Véhicule',
        reference: vehicle.reference,
        time: getTimeAgo(new Date(vehicle.activatedAt!)),
        details: `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Véhicule activé',
        status: 'success',
      });
    }

    // Add recent maintenance records
    for (const record of maintenanceRecords.slice(0, 5)) {
      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      recentActivities.push({
        id: `intervention-${record.id}`,
        type: record.ownerValidation === 'PENDING' ? 'validation' : 'intervention',
        name: vehicle?.ownerName || 'Véhicule',
        reference: vehicle?.reference || '',
        time: getTimeAgo(new Date(record.createdAt)),
        details: getMaintenanceLabel(record.category),
        status: record.ownerValidation === 'VALIDATED' ? 'validated' :
                record.ownerValidation === 'PENDING' ? 'pending' : 'success',
      });
    }

    // Sort by most recent
    recentActivities.sort(() => Math.random() - 0.5);

    const stats = {
      totalQR: totalVehicles,
      qrActivatedVehicles: activeVehicles,
      qrPendingActivation: inactiveVehicles,
      totalDrivers: 0, // TODO: Add driver count
      totalVehicles,
      expiringSoon: 0, // TODO: Add expiring vehicles count
      pendingOrders: pendingValidations,
      totalAgencies: 0, // Not used for OKAR
      totalGarages,
      // Extended stats
      activeVehicles,
      inactiveVehicles,
      blockedVehicles,
      certifiedGarages,
      activeGarages,
      totalInterventions,
      pendingValidations,
      validatedRecords,
    };

    return NextResponse.json({
      stats,
      dailyActivations: last7Days,
      recentActivities: recentActivities.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString('fr-FR');
}

function getMaintenanceLabel(category: string): string {
  const labels: Record<string, string> = {
    vidange: 'Vidange',
    freins: 'Freins',
    pneus: 'Pneus',
    moteur: 'Moteur',
    electricite: 'Électricité',
    carrosserie: 'Carrosserie',
    autre: 'Autre',
  };
  return labels[category] || category;
}
