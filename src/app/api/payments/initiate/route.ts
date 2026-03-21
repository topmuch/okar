import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, paymentMethod, phoneNumber, amount = 1000 } = body

    if (!vehicleId || !paymentMethod || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Informations manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que le véhicule existe
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        garage: true,
        maintenanceRecords: {
          where: { status: 'VALIDATED' },
          orderBy: { interventionDate: 'desc' }
        }
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    // Créer la transaction
    const internalRef = `OKAR-${nanoid(12).toUpperCase()}`
    
    const transaction = await db.transaction.create({
      data: {
        type: 'REPORT_PURCHASE',
        amount: amount,
        currency: 'XOF',
        provider: paymentMethod,
        payerPhone: phoneNumber,
        status: 'PENDING',
        metadata: JSON.stringify({
          vehicleId,
          vehiclePlate: vehicle.licensePlate,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model
        })
      }
    })

    // Créer le rapport PDF (en attente de paiement)
    const verificationCode = nanoid(8).toUpperCase()
    const report = await db.pdfReport.create({
      data: {
        vehicleId,
        transactionId: transaction.id,
        reportType: 'VEHICLE_HISTORY',
        fileName: `rapport-${vehicle.licensePlate || vehicle.reference}-${Date.now()}.pdf`,
        fileUrl: '', // Sera mis à jour après génération
        verificationCode,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      }
    })

    // Mettre à jour la transaction avec les métadonnées
    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        metadata: JSON.stringify({
          vehicleId,
          reportId: report.id,
          verificationCode
        })
      }
    })

    // Simulation de l'initiation du paiement
    // En production, c'est ici qu'on appellerait l'API Orange Money ou Wave
    
    let paymentResponse = {
      success: true,
      transactionId: transaction.id,
      internalRef,
      verificationCode,
      // En production, ces URLs seraient fournies par l'API de paiement
      paymentUrl: null as string | null,
      ussdCode: null as string | null
    }

    if (paymentMethod === 'ORANGE_MONEY') {
      // Simuler l'appel API Orange Money
      // En production: appel à l'API Orange Money
      paymentResponse.ussdCode = `#144*82*${phoneNumber}*${amount}#`
      
      // Pour la démo, on simule un succès immédiat
      // En production, attendre le webhook
      if (process.env.NODE_ENV === 'development') {
        // Auto-confirmer en développement
        await db.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SUCCESS',
            completedAt: new Date()
          }
        })
        
        await db.pdfReport.update({
          where: { id: report.id },
          data: {
            certifiedAt: new Date()
          }
        })
        
        paymentResponse.success = true
      }
    } else if (paymentMethod === 'WAVE') {
      // Simuler l'appel API Wave
      paymentResponse.paymentUrl = `https://wave.com/pay/${internalRef}`
      
      // Pour la démo
      if (process.env.NODE_ENV === 'development') {
        await db.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SUCCESS',
            completedAt: new Date()
          }
        })
        
        await db.pdfReport.update({
          where: { id: report.id },
          data: {
            certifiedAt: new Date()
          }
        })
      }
    }

    return NextResponse.json(paymentResponse)

  } catch (error) {
    console.error('Erreur paiement:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'initialisation du paiement' },
      { status: 500 }
    )
  }
}
