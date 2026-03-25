import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment, type PaymentProvider, type TransactionType } from '@/lib/payment-service';
import { getSession } from '@/lib/session';

/**
 * POST /api/payment/initiate
 * Initier un paiement mobile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    const {
      type,
      amount,
      phone,
      provider,
      metadata,
      promoCode,
      garageId,
    } = body;

    // Validation
    if (!type || !amount || !phone || !provider) {
      return NextResponse.json(
        { error: 'Paramètres manquants: type, amount, phone, provider requis' },
        { status: 400 }
      );
    }

    // Validation du type
    const validTypes: TransactionType[] = ['REPORT', 'SUB_GARAGE', 'BOOST', 'VERIFICATION', 'FLEET', 'LEAD'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type invalide. Types valides: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation du provider
    const validProviders: PaymentProvider[] = ['ORANGE_MONEY', 'WAVE', 'CINETPAY', 'FREE_MONEY'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Provider invalide. Providers valides: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation du numéro de téléphone sénégalais
    const phoneRegex = /^(\+221|221)?[37][0-9]{8}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide. Format attendu: +221 77 XXX XX XX' },
        { status: 400 }
      );
    }

    // Normaliser le numéro
    const normalizedPhone = cleanPhone.startsWith('+221') 
      ? cleanPhone 
      : cleanPhone.startsWith('221')
        ? `+${cleanPhone}`
        : `+221${cleanPhone}`;

    // Initier le paiement
    const result = await initiatePayment({
      type,
      amount: parseFloat(amount),
      phone: normalizedPhone,
      provider,
      userId: session?.id || undefined,
      garageId: garageId || session?.garageId || undefined,
      metadata,
      promoCode,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        transaction: {
          id: result.transactionId,
          status: result.status,
          message: result.message,
          providerRef: result.providerRef,
          ussdCode: result.ussdCode,
        },
      });
    } else {
      return NextResponse.json(
        { error: result.message, transactionId: result.transactionId },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Payment Initiate Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'initiation du paiement' },
      { status: 500 }
    );
  }
}
