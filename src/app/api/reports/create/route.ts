import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReportData, generateReportHTML } from '@/lib/pdf/generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, transactionId } = body

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'ID du véhicule requis' },
        { status: 400 }
      )
    }

    // Vérifier que le paiement est validé
    if (transactionId) {
      const transaction = await db.transaction.findUnique({
        where: { id: transactionId }
      })

      if (!transaction || transaction.status !== 'SUCCESS') {
        return NextResponse.json(
          { success: false, error: 'Paiement non validé' },
          { status: 403 }
        )
      }
    }

    // Récupérer le rapport existant ou en créer un nouveau
    let report = await db.pdfReport.findFirst({
      where: { 
        vehicleId,
        certifiedAt: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Rapport non trouvé ou non certifié' },
        { status: 404 }
      )
    }

    // Générer les données du rapport
    const reportData = await generateReportData(vehicleId, report.verificationCode || 'UNKNOWN')
    
    if (!reportData) {
      return NextResponse.json(
        { success: false, error: 'Impossible de générer le rapport' },
        { status: 500 }
      )
    }

    // Générer le HTML
    const html = generateReportHTML(reportData)

    // Mettre à jour les statistiques du rapport
    await db.pdfReport.update({
      where: { id: report.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        verificationCode: report.verificationCode,
        html,
        generatedAt: reportData.generatedAt,
        vehicle: {
          make: reportData.vehicle.make,
          model: reportData.vehicle.model,
          year: reportData.vehicle.year,
          licensePlate: reportData.vehicle.licensePlate,
          score: reportData.score
        }
      }
    })

  } catch (error) {
    console.error('Erreur création rapport:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}
