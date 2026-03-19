import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ========================================
// API: PUBLIC CHECK QR CODE
// Vérifie si un QR code peut être activé par un particulier
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
      `SELECT qs.*, g.name as garageName
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

    // Check if already active
    if (qr.status === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        canActivate: false,
        message: 'Ce QR Code est déjà activé',
        status: 'active'
      });
    }

    // Check if revoked
    if (qr.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        canActivate: false,
        message: 'Ce QR Code a été révoqué',
        status: 'revoked'
      });
    }

    // Check if assigned to a garage (garage QR, not individual)
    if (qr.assignedGarageId) {
      return NextResponse.json({
        success: false,
        canActivate: false,
        message: 'Ce QR Code est assigné à un garage. Veuillez vous rendre chez le garage partenaire pour l\'activation.',
        status: 'assigned',
        garage: {
          name: qr.garageName
        }
      });
    }

    // QR Code is available for individual activation
    return NextResponse.json({
      success: true,
      canActivate: true,
      status: qr.status,
      qrId: qr.id,
      codeUnique: qr.codeUnique,
      lotId: qr.lotId,
      message: 'QR Code valide pour activation'
    });

  } catch (error) {
    console.error('Check QR error:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur'
    }, { status: 500 });
  }
}
