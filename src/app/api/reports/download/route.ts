import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReportData, generateReportHTML } from '@/lib/pdf/generator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const verificationCode = searchParams.get('code')
    const token = searchParams.get('token')

    if (!verificationCode && !token) {
      return NextResponse.json(
        { success: false, error: 'Code de vérification requis' },
        { status: 400 }
      )
    }

    // Trouver le rapport par code de vérification
    const report = await db.pdfReport.findFirst({
      where: {
        OR: [
          { verificationCode: verificationCode || '' },
          { id: token || '' }
        ]
      },
      include: {
        vehicle: true
      }
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Rapport non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si le rapport n'est pas expiré
    if (report.expiresAt && new Date(report.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Ce rapport a expiré' },
        { status: 410 }
      )
    }

    // Vérifier le nombre de téléchargements
    if (report.accessCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Limite de téléchargements atteinte (5 max)' },
        { status: 403 }
      )
    }

    // Générer les données du rapport
    const reportData = await generateReportData(report.vehicleId, report.verificationCode || 'UNKNOWN')
    
    if (!reportData) {
      return NextResponse.json(
        { success: false, error: 'Impossible de générer le rapport' },
        { status: 500 }
      )
    }

    // Générer le HTML pour PDF
    const html = generateReportHTML(reportData)

    // Mettre à jour les statistiques
    await db.pdfReport.update({
      where: { id: report.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    })

    // Retourner le HTML pour impression/conversion PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error) {
    console.error('Erreur téléchargement:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du téléchargement' },
      { status: 500 }
    )
  }
}
