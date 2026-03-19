import { NextRequest, NextResponse } from 'next/server';
import { getTransactionStatus } from '@/lib/payment-service';

/**
 * GET /api/payment/status/[id]
 * Obtenir le statut d'une transaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de transaction requis' },
        { status: 400 }
      );
    }

    const status = await getTransactionStatus(id);

    if (!status) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: status,
    });

  } catch (error: any) {
    console.error('[Payment Status Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du statut' },
      { status: 500 }
    );
  }
}
