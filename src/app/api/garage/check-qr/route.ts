import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ========================================
// API: CHECK QR CODE STATUS
// Vérifie si un QR code peut être activé
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({
        success: false,
        message: 'Code QR requis'
      });
    }

    // Find QR code by shortCode
    const qrCode = await db.$queryRawUnsafe<any[]>(
      `SELECT qs.*, g.name as garageName, g.id as garageId
       FROM QRCodeStock qs
       LEFT JOIN Garage g ON qs.assignedGarageId = g.id
       WHERE qs.shortCode = ?`,
      code
    );

    if (!qrCode || qrCode.length === 0) {
      return NextResponse.json({
        success: false,
        canActivate: false,
        message: 'Ce code QR n\'existe pas dans le système'
      });
    }

    const qr = qrCode[0];

    // Check status
    if (qr.status === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        canActivate: false,
        message: 'Ce QR Code est déjà activé',
        status: 'active'
      });
    }

    if (qr.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        canActivate: false,
        message: 'Ce QR Code a été révoqué',
        status: 'revoked'
      });
    }

    // QR Code is in STOCK or ASSIGNED status - can be activated
    return NextResponse.json({
      success: true,
      canActivate: true,
      status: qr.status,
      qrId: qr.id,
      codeUnique: qr.codeUnique,
      lotId: qr.lotId,
      garage: qr.garageId ? {
        id: qr.garageId,
        name: qr.garageName
      } : null
    });

  } catch (error) {
    console.error('Check QR error:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur'
    }, { status: 500 });
  }
}
