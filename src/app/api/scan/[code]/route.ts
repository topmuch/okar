import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ========================================
// API: SCAN D'UN QR CODE
// Logique de redirection intelligente
// ========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // 1. TROUVER LE QR CODE
    const qrCode = await db.$queryRawUnsafe<any[]>(
      `SELECT qs.*, v.id as vehicleId, v.reference, v.make, v.model, 
              v.licensePlate, v.ownerId, v.garageId, v.qrStatus,
              u.name as ownerName, u.phone as ownerPhone
       FROM QRCodeStock qs
       LEFT JOIN Vehicle v ON qs.linkedVehicleId = v.id
       LEFT JOIN User u ON v.ownerId = u.id
       WHERE qs.shortCode = ? OR qs.codeUnique = ?`,
      code, code
    );

    if (!qrCode || qrCode.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'QR_CODE_NOT_FOUND',
        message: 'Ce QR Code n\'existe pas dans notre système',
        redirectTo: '/qr-not-found'
      });
    }

    const qr = qrCode[0];

    // 2. METTRE À JOUR LES STATISTIQUES DE SCAN
    const now = new Date().toISOString();
    await db.$executeRawUnsafe(
      `UPDATE QRCodeStock SET updatedAt = ? WHERE id = ?`,
      now, qr.id
    );

    // Mettre à jour le véhicule si lié
    if (qr.vehicleId) {
      await db.$executeRawUnsafe(
        `UPDATE Vehicle SET lastScanDate = ? WHERE id = ?`,
        now, qr.vehicleId
      );
    }

    // 3. DÉTERMINER LA REDIRECTION SELON LE STATUT

    // CAS A: QR Code INACTIF (jamais activé)
    if (qr.status === 'STOCK' || qr.status === 'ASSIGNED') {
      return NextResponse.json({
        success: false,
        error: 'QR_NOT_ACTIVATED',
        message: 'Ce QR Code n\'est pas encore activé',
        status: 'inactive',
        info: {
          lotId: qr.lotId,
          assignedGarageId: qr.assignedGarageId,
        },
        redirectTo: '/qr-inactive'
      });
    }

    // CAS B: QR Code RÉVOQUÉ
    if (qr.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        error: 'QR_REVOKED',
        message: 'Ce QR Code a été révoqué pour des raisons de sécurité',
        status: 'revoked',
        redirectTo: '/qr-revoked'
      });
    }

    // CAS C: QR Code ACTIF - Retourner les infos du véhicule
    if (qr.status === 'ACTIVE' && qr.vehicleId) {
      // Récupérer l'historique des interventions certifiées
      const maintenanceRecords = await db.$queryRawUnsafe<any[]>(
        `SELECT id, category, description, mileage, interventionDate, 
                status, mechanicName, garageId
         FROM MaintenanceRecord 
         WHERE vehicleId = ? AND status = 'COMPLETED'
         ORDER BY interventionDate DESC
         LIMIT 50`,
        qr.vehicleId
      );

      // Récupérer les infos du garage
      const garage = await db.$queryRawUnsafe<any[]>(
        `SELECT id, name, slug, address, phone, isCertified, logo
         FROM Garage WHERE id = ?`,
        qr.garageId
      );

      return NextResponse.json({
        success: true,
        status: 'active',
        vehicle: {
          reference: qr.reference,
          make: qr.make,
          model: qr.model,
          licensePlate: qr.licensePlate,
          // Pas de données sensibles du propriétaire pour le public
        },
        garage: garage[0] || null,
        maintenanceHistory: maintenanceRecords.map(record => ({
          id: record.id,
          category: record.category,
          description: record.description,
          mileage: record.mileage,
          date: record.interventionDate,
          mechanic: record.mechanicName,
        })),
        totalRecords: maintenanceRecords.length,
        // URLs pour les différents profils
        urls: {
          public: `/v/${qr.shortCode}`,
          owner: '/driver/tableau-de-bord',
          garage: '/garage/vehicules',
        }
      });
    }

    // Cas par défaut
    return NextResponse.json({
      success: false,
      error: 'UNKNOWN_STATUS',
      message: 'Statut du QR Code non reconnu',
      redirectTo: '/'
    });

  } catch (error) {
    console.error('Scan QR error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'SERVER_ERROR',
        message: 'Erreur lors de la lecture du QR Code' 
      },
      { status: 500 }
    );
  }
}
