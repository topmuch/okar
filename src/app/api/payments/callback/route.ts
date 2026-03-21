import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Webhook callback pour Orange Money et Wave
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Headers de validation (en production, vérifier la signature)
    const provider = request.headers.get('x-provider') || 'UNKNOWN'
    
    console.log(`Webhook reçu de ${provider}:`, body)

    // Extraire les informations du webhook
    // Format varie selon le provider
    let transactionRef: string | null = null
    let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING'
    let providerRef: string | null = null

    if (provider === 'ORANGE_MONEY') {
      // Format Orange Money
      transactionRef = body.order_id || body.transaction_id
      status = body.status === 'SUCCESS' ? 'SUCCESS' : body.status === 'FAILED' ? 'FAILED' : 'PENDING'
      providerRef = body.transaction_id
    } else if (provider === 'WAVE') {
      // Format Wave
      transactionRef = body.client_reference || body.reference
      status = body.status === 'succeeded' ? 'SUCCESS' : body.status === 'failed' ? 'FAILED' : 'PENDING'
      providerRef = body.id
    } else {
      // Format générique
      transactionRef = body.transactionRef || body.reference
      status = body.status === 'SUCCESS' ? 'SUCCESS' : body.status === 'FAILED' ? 'FAILED' : 'PENDING'
      providerRef = body.providerRef
    }

    if (!transactionRef) {
      return NextResponse.json(
        { success: false, error: 'Référence de transaction manquante' },
        { status: 400 }
      )
    }

    // Trouver la transaction
    const transaction = await db.transaction.findFirst({
      where: {
        OR: [
          { id: transactionRef },
          { providerRef: transactionRef }
        ]
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour la transaction
    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        status,
        providerRef,
        webhookReceived: true,
        webhookData: JSON.stringify(body),
        webhookAt: new Date(),
        completedAt: status === 'SUCCESS' ? new Date() : null
      }
    })

    // Si succès, certifier le rapport
    if (status === 'SUCCESS' && transaction.transactionId) {
      await db.pdfReport.updateMany({
        where: { transactionId: transaction.id },
        data: {
          certifiedAt: new Date()
        }
      })

      // Envoyer notification SMS/WhatsApp au client
      // (à implémenter avec le service WhatsApp/SMS)
    }

    return NextResponse.json({ success: true, status })

  } catch (error) {
    console.error('Erreur webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    )
  }
}

// Endpoint pour vérifier le statut d'une transaction
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'ID de transaction requis' },
        { status: 400 }
      )
    }

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        pdfReport: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      paid: transaction.status === 'SUCCESS',
      reportId: transaction.pdfReport?.id,
      verificationCode: transaction.pdfReport?.verificationCode,
      downloadUrl: transaction.status === 'SUCCESS' 
        ? `/rapport/${transaction.pdfReport?.verificationCode}` 
        : null
    })

  } catch (error) {
    console.error('Erreur vérification:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}
