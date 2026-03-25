import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Vehicle row type
interface VehicleRow {
  id: string;
  reference: string;
  qrStatus: string;
  status: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  licensePlate: string | null;
  vin: string | null;
  mileage: number | null;
  engineType: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  garageId: string | null;
  activatedAt: string | null;
  createdAt: string;
}

// Garage row type
interface GarageRow {
  id: string;
  name: string;
  isCertified: boolean;
}

// GET - Export vehicles to CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garageId');
    const status = searchParams.get('status');
    const qrStatus = searchParams.get('qrStatus');

    // Build query conditions
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (garageId) {
      conditions.push('garageId = ?');
      params.push(garageId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (qrStatus) {
      conditions.push('qrStatus = ?');
      params.push(qrStatus);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch vehicles using raw SQL
    const vehicles = await db.$queryRawUnsafe<VehicleRow[]>(
      `SELECT
        id, reference, qrStatus, status, make, model, year, color,
        licensePlate, vin, mileage, engineType,
        ownerName, ownerPhone, garageId,
        activatedAt, createdAt
       FROM Vehicle
       ${whereClause}
       ORDER BY createdAt DESC`,
      ...params
    );

    // Get garages for name lookup
    const garages = await db.$queryRaw<GarageRow[]>`SELECT id, name, isCertified FROM Garage`;
    const garageMap = new Map<string, string>();
    (garages || []).forEach(g => garageMap.set(g.id, g.name));

    // CSV Headers
    const headers = [
      'Référence',
      'Statut QR',
      'Statut',
      'Marque',
      'Modèle',
      'Année',
      'Couleur',
      'Immatriculation',
      'VIN',
      'Kilométrage',
      'Carburant',
      'Propriétaire',
      'Téléphone',
      'Garage',
      'Date Activation',
      'Date Création',
    ];

    // CSV Rows
    const rows = (vehicles || []).map(v => [
      v.reference,
      getQRStatusLabel(v.qrStatus),
      getStatusLabel(v.status),
      v.make || '-',
      v.model || '-',
      v.year?.toString() || '-',
      v.color || '-',
      v.licensePlate || '-',
      v.vin || '-',
      v.mileage?.toString() || '-',
      getEngineTypeLabel(v.engineType),
      v.ownerName || '-',
      v.ownerPhone || '-',
      v.garageId ? (garageMap.get(v.garageId) || '-') : '-',
      v.activatedAt ? new Date(v.activatedAt).toLocaleDateString('fr-FR') : '-',
      new Date(v.createdAt).toLocaleDateString('fr-FR'),
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
    ].join('\n');

    // Create response with CSV file
    const filename = `okar-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getQRStatusLabel(qrStatus: string): string {
  const labels: Record<string, string> = {
    INACTIVE: 'Inactif',
    ACTIVE: 'Actif',
    BLOCKED: 'Bloqué',
  };
  return labels[qrStatus] || qrStatus;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_activation: 'En attente',
    active: 'Actif',
    blocked: 'Bloqué',
  };
  return labels[status] || status;
}

function getEngineTypeLabel(engineType: string | null): string {
  const labels: Record<string, string> = {
    essence: 'Essence',
    diesel: 'Diesel',
    hybride: 'Hybride',
    electrique: 'Électrique',
  };
  return engineType ? (labels[engineType] || engineType) : '-';
}
