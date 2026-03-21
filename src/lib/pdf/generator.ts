import { db } from '@/lib/db'
import { Vehicle, MaintenanceRecord, OwnershipHistory, Garage } from '@prisma/client'

interface VehicleWithRelations extends Vehicle {
  garage: Garage | null
  maintenanceRecords: MaintenanceRecord[]
  ownershipHistory: OwnershipHistory[]
}

export interface ReportData {
  vehicle: VehicleWithRelations
  verificationCode: string
  generatedAt: Date
  score: number
  alerts: string[]
  timeline: Array<{
    date: Date
    type: string
    description: string
    garage?: string
    mileage?: number
  }>
  summary: {
    totalInterventions: number
    totalSpent: number
    avgMileagePerYear: number
    lastMaintenance: Date | null
    ownershipCount: number
  }
}

export async function generateReportData(vehicleId: string, verificationCode: string): Promise<ReportData | null> {
  const vehicle = await db.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      garage: true,
      maintenanceRecords: {
        where: { status: 'VALIDATED' },
        orderBy: { interventionDate: 'desc' }
      },
      ownershipHistory: {
        orderBy: { transferDate: 'desc' }
      }
    }
  })

  if (!vehicle) return null

  // Calculer le score
  const score = vehicle.okarScore || calculateScore(vehicle.maintenanceRecords)

  // Générer les alertes
  const alerts = generateAlerts(vehicle)

  // Construire la timeline
  const timeline = vehicle.maintenanceRecords.map(record => ({
    date: record.interventionDate,
    type: record.category,
    description: record.description || `${record.category}`,
    garage: record.mechanicName || undefined,
    mileage: record.mileage || undefined
  }))

  // Calculer le résumé
  const totalSpent = vehicle.maintenanceRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0)
  const lastMaintenance = vehicle.maintenanceRecords[0]?.interventionDate || null
  
  // Calculer moyenne kilométrique annuelle
  const firstRecord = vehicle.maintenanceRecords[vehicle.maintenanceRecords.length - 1]
  const lastRecord = vehicle.maintenanceRecords[0]
  let avgMileagePerYear = 0
  if (firstRecord && lastRecord && vehicle.year) {
    const totalMileage = (lastRecord.mileage || 0) - (firstRecord.mileage || 0)
    const yearsDiff = (lastRecord.interventionDate.getTime() - firstRecord.interventionDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
    avgMileagePerYear = yearsDiff > 0 ? Math.round(totalMileage / yearsDiff) : 0
  }

  return {
    vehicle,
    verificationCode,
    generatedAt: new Date(),
    score,
    alerts,
    timeline,
    summary: {
      totalInterventions: vehicle.maintenanceRecords.length,
      totalSpent,
      avgMileagePerYear,
      lastMaintenance,
      ownershipCount: vehicle.ownershipHistory.length
    }
  }
}

function calculateScore(records: MaintenanceRecord[]): number {
  if (records.length === 0) return 0

  let score = 50 // Base score

  // Points pour chaque intervention validée
  score += Math.min(records.length * 5, 30) // Max 30 points

  // Points pour la régularité
  const categories = new Set(records.map(r => r.category))
  score += Math.min(categories.size * 3, 15) // Max 15 points

  // Pénalités pour les longues périodes sans entretien
  if (records.length >= 2) {
    const sortedDates = records.map(r => r.interventionDate.getTime()).sort((a, b) => b - a)
    const gapDays = (sortedDates[0] - sortedDates[1]) / (24 * 60 * 60 * 1000)
    if (gapDays > 365) score -= 10
    else if (gapDays > 180) score -= 5
  }

  return Math.max(0, Math.min(100, score))
}

function generateAlerts(vehicle: VehicleWithRelations): string[] {
  const alerts: string[] = []
  const now = new Date()

  // VT
  if (vehicle.vtEndDate) {
    const vtEnd = new Date(vehicle.vtEndDate)
    if (vtEnd < now) {
      alerts.push(`Visite technique expirée depuis le ${vtEnd.toLocaleDateString('fr-FR')}`)
    } else if (vtEnd < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      alerts.push(`Visite technique expire le ${vtEnd.toLocaleDateString('fr-FR')}`)
    }
  }

  // Assurance
  if (vehicle.insuranceEndDate) {
    const insEnd = new Date(vehicle.insuranceEndDate)
    if (insEnd < now) {
      alerts.push(`Assurance expirée depuis le ${insEnd.toLocaleDateString('fr-FR')}`)
    } else if (insEnd < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      alerts.push(`Assurance expire le ${insEnd.toLocaleDateString('fr-FR')}`)
    }
  }

  // Kilométrage suspect
  const records = vehicle.maintenanceRecords
  if (records.length >= 2) {
    const sorted = [...records].sort((a, b) => a.interventionDate.getTime() - b.interventionDate.getTime())
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].mileage && sorted[i-1].mileage && sorted[i].mileage! < sorted[i-1].mileage!) {
        alerts.push(`Incohérence de kilométrage détectée - investigation recommandée`)
        break
      }
    }
  }

  return alerts
}

// Générer le HTML du rapport pour conversion PDF
export function generateReportHTML(data: ReportData): string {
  const { vehicle, verificationCode, generatedAt, score, alerts, timeline, summary } = data

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport OKAR - ${vehicle.licensePlate || vehicle.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    
    .header { text-align: center; border-bottom: 3px solid #FF6600; padding-bottom: 30px; margin-bottom: 30px; }
    .logo { font-size: 36px; font-weight: bold; color: #FF6600; }
    .title { font-size: 24px; color: #333; margin-top: 10px; }
    
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    
    .score-section { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; }
    .score-circle { width: 120px; height: 120px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: bold; }
    .score-excellent { background: linear-gradient(135deg, #10b981, #059669); }
    .score-good { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .score-poor { background: linear-gradient(135deg, #ef4444, #dc2626); }
    
    .vehicle-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-card { background: #f8fafc; padding: 20px; border-radius: 12px; }
    .info-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
    .info-value { font-size: 18px; font-weight: 600; color: #1e293b; }
    
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    
    .timeline { border-left: 3px solid #FF6600; padding-left: 20px; }
    .timeline-item { position: relative; margin-bottom: 20px; }
    .timeline-item::before { content: ''; position: absolute; left: -26px; top: 5px; width: 12px; height: 12px; background: #FF6600; border-radius: 50%; }
    .timeline-date { font-size: 12px; color: #64748b; }
    .timeline-title { font-weight: 600; color: #1e293b; }
    .timeline-desc { color: #475569; font-size: 14px; }
    
    .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 10px; border-radius: 0 8px 8px 0; }
    
    .verification { background: #f0fdf4; border: 2px dashed #22c55e; padding: 20px; border-radius: 12px; text-align: center; margin-top: 40px; }
    .verification-code { font-size: 32px; font-weight: bold; color: #166534; letter-spacing: 4px; }
    
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e2e8f0; margin-top: 40px; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OKAR</div>
      <div class="title">Rapport d'Historique Véhicule</div>
      <p style="color: #64748b; margin-top: 10px;">Certifié et vérifié</p>
    </div>

    <div class="score-section">
      <div>
        <h2 style="font-size: 20px; margin-bottom: 10px;">Score de Santé OKAR</h2>
        <p style="color: #64748b;">Basé sur l'historique d'entretien et les interventions certifiées</p>
      </div>
      <div class="score-circle ${score >= 80 ? 'score-excellent' : score >= 60 ? 'score-good' : 'score-poor'}">
        <span style="font-size: 36px;">${score}</span>
        <span style="font-size: 14px;">/100</span>
      </div>
    </div>

    <div class="vehicle-info">
      <div class="info-card">
        <div class="info-label">Véhicule</div>
        <div class="info-value">${vehicle.make || ''} ${vehicle.model || ''}</div>
        ${vehicle.year ? `<p style="color: #64748b;">Année: ${vehicle.year}</p>` : ''}
      </div>
      <div class="info-card">
        <div class="info-label">Immatriculation</div>
        <div class="info-value">${vehicle.licensePlate || vehicle.reference}</div>
        ${vehicle.color ? `<p style="color: #64748b;">Couleur: ${vehicle.color}</p>` : ''}
      </div>
      <div class="info-card">
        <div class="info-label">Kilométrage actuel</div>
        <div class="info-value">${vehicle.currentMileage?.toLocaleString('fr-FR') || '-'} km</div>
      </div>
      <div class="info-card">
        <div class="info-label">Interventions</div>
        <div class="info-value">${summary.totalInterventions}</div>
        <p style="color: #64748b;">Total certifié</p>
      </div>
    </div>

    ${alerts.length > 0 ? `
    <div class="section">
      <h3 class="section-title">⚠️ Alertes</h3>
      ${alerts.map(alert => `<div class="alert">${alert}</div>`).join('')}
    </div>
    ` : ''}

    <div class="section">
      <h3 class="section-title">📊 Résumé</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${summary.totalInterventions}</div>
          <div style="color: #64748b; font-size: 12px;">Interventions</div>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${summary.totalSpent.toLocaleString('fr-FR')} FCFA</div>
          <div style="color: #64748b; font-size: 12px;">Total entretien</div>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${summary.ownershipCount}</div>
          <div style="color: #64748b; font-size: 12px;">Propriétaires</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">📅 Historique des interventions</h3>
      <div class="timeline">
        ${timeline.slice(0, 20).map(item => `
        <div class="timeline-item">
          <div class="timeline-date">${new Date(item.date).toLocaleDateString('fr-FR')}</div>
          <div class="timeline-title">${item.type}</div>
          <div class="timeline-desc">${item.description}${item.mileage ? ` • ${item.mileage.toLocaleString('fr-FR')} km` : ''}</div>
        </div>
        `).join('')}
      </div>
    </div>

    <div class="verification">
      <p style="color: #166534; margin-bottom: 10px;">Code de vérification</p>
      <div class="verification-code">${verificationCode}</div>
      <p style="color: #64748b; font-size: 12px; margin-top: 10px;">Vérifiez l'authenticité sur okar.sn/verifier</p>
    </div>

    <div class="footer">
      <p>Rapport généré le ${generatedAt.toLocaleDateString('fr-FR')} à ${generatedAt.toLocaleTimeString('fr-FR')}</p>
      <p style="margin-top: 5px;">OKAR - Passeport Numérique Automobile • Sénégal</p>
      <p style="margin-top: 10px;">Ce rapport est valide 30 jours à partir de sa génération.</p>
    </div>
  </div>
</body>
</html>
  `
}
