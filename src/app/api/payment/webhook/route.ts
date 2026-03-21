import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentWebhook, type PaymentProvider } from '@/lib/payment-service';

/**
 * POST /api/payment/webhook
 * Webhook pour les callbacks de paiement (Orange Money, Wave, CinetPay, Free Money)
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer le provider depuis les headers ou query params
    const provider = request.headers.get('x-provider') as PaymentProvider || 
                     request.nextUrl.searchParams.get('provider') as PaymentProvider || 
                     'CINETPAY';

    // Récupérer la signature
    const signature = request.headers.get('x-signature') || 
                      request.headers.get('signature') || 
                      undefined;

    // Parser le body
    const body = await request.json();

    // Adapter le payload selon le provider
    let payload;
    
    switch (provider) {
      case 'ORANGE_MONEY':
        payload = {
          transactionId: body.order_id || body.transaction_id,
          providerRef: body.transaction_id || body.pay_token,
          status: body.status === 'SUCCESS' ? 'SUCCESS' : 
                  body.status === 'FAILED' ? 'FAILED' : 'CANCELLED',
          amount: parseFloat(body.amount) || 0,
          phone: body.customer_phone,
          timestamp: body.timestamp || new Date().toISOString(),
          signature: body.signature,
        };
        break;

      case 'WAVE':
        payload = {
          transactionId: body.client_reference || body.id,
          providerRef: body.id || body.wave_transaction_id,
          status: body.status === 'succeeded' ? 'SUCCESS' :
                  body.status === 'failed' ? 'FAILED' : 'CANCELLED',
          amount: parseFloat(body.amount) || 0,
          phone: body.customer_phone,
          timestamp: body.timestamp || new Date().toISOString(),
          signature: body.signature,
        };
        break;

      case 'CINETPAY':
        payload = {
          transactionId: body.transaction_id || body.cpm_trans_id,
          providerRef: body.cpm_trans_id || body.transaction_id,
          status: body.cpm_result === '00' ? 'SUCCESS' :
                  body.cpm_result === 'FAILED' ? 'FAILED' : 'CANCELLED',
          amount: parseFloat(body.cpm_amount) || 0,
          phone: body.cpm_phone_number,
          timestamp: body.cpm_payid || new Date().toISOString(),
          signature: body.signature,
        };
        break;

      case 'FREE_MONEY':
        payload = {
          transactionId: body.orderId || body.transactionId,
          providerRef: body.ref || body.transactionId,
          status: body.status === 'SUCCESS' ? 'SUCCESS' :
                  body.status === 'FAILED' ? 'FAILED' : 'CANCELLED',
          amount: parseFloat(body.amount) || 0,
          phone: body.customerMsisdn,
          timestamp: body.timestamp || new Date().toISOString(),
          signature: body.signature,
        };
        break;

      default:
        // Format générique
        payload = {
          transactionId: body.transactionId || body.transaction_id,
          providerRef: body.providerRef || body.ref,
          status: body.status || 'SUCCESS',
          amount: parseFloat(body.amount) || 0,
          phone: body.phone,
          timestamp: body.timestamp || new Date().toISOString(),
          signature: body.signature,
        };
    }

    console.log(`[Webhook ${provider}]`, JSON.stringify(payload, null, 2));

    // Traiter le webhook
    const result = await handlePaymentWebhook(payload, provider, signature);

    if (result.success) {
      return NextResponse.json({ 
        received: true, 
        message: result.message 
      });
    } else {
      return NextResponse.json(
        { received: false, error: result.message },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Payment Webhook Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du traitement du webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/webhook
 * Pour vérification de l'endpoint (certains providers font un GET)
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  
  if (challenge) {
    // CinetPay et d'autres peuvent envoyer un challenge
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook endpoint actif' 
  });
}
