/**
 * ================================================
 * OKAR PDF Report Generator - Rapports Premium
 * ================================================
 * 
 * Génère des rapports PDF certifiés avec:
 * - Historique d'entretien complet
 * - Graphiques d'évolution du kilométrage
 * - Photos HD
 * - Cote estimée
 * - Filigrane de certification
 */

import prisma from './prisma';
import { v4 as uuidv4 } from 'uuid';

// Types
export type ReportType = 'BASIC' | 'PREMIUM' | 'CERTIFIED';

export interface ReportData {
  vehicle: any;
  maintenanceHistory: any[];
  mileageData: { date: Date; mileage: number }[];
  photos: string[];
  qrCode: string;
  verificationCode: string;
  generatedAt: Date;
  expiresAt: Date;
}

export interface ChartData {
  labels: string[];
  values: number[];
  title: string;
}

/**
 * Générer les données du rapport
 */
export async function prepareReportData(vehicleId: string): Promise<ReportData> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      maintenanceRecords: {
        where: { 
          OR: [
            { status: 'VALIDATED' },
            { isLocked: true }
          ]
        },
        orderBy: { interventionDate: 'desc' },
        take: 100,
        include: {
          garage: {
            select: { name: true, address: true, phone: true }
          }
        }
      },
      photos: {
        orderBy: { isMain: 'desc' }
      },
      qrCode: true,
      owner: {
        select: { name: true, phone: true, email: true }
      }
    }
  });

  if (!vehicle) {
    throw new Error('Véhicule non trouvé');
  }

  // Extraire les données de kilométrage
  const mileageData = vehicle.maintenanceRecords
    .filter((r: any) => r.mileage)
    .map((r: any) => ({
      date: r.interventionDate,
      mileage: r.mileage
    }))
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

  const verificationCode = `OKAR-${uuidv4().split('-')[0].toUpperCase()}`;

  return {
    vehicle,
    maintenanceHistory: vehicle.maintenanceRecords,
    mileageData,
    photos: vehicle.photos.map((p: any) => p.url),
    qrCode: vehicle.qrCode?.codeUnique || '',
    verificationCode,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
  };
}

/**
 * Générer le HTML du rapport
 */
export function generateReportHtml(data: ReportData, reportType: ReportType = 'PREMIUM'): string {
  const { vehicle, maintenanceHistory, mileageData, photos, verificationCode, generatedAt, expiresAt } = data;

  // Calculer les statistiques
  const totalInterventions = maintenanceHistory.length;
  const avgMileagePerMonth = calculateAvgMileagePerMonth(mileageData);
  const estimatedValue = calculateEstimatedValue(vehicle, maintenanceHistory);

  // Générer le graphique de kilométrage (SVG simple)
  const mileageChart = generateMileageChartSvg(mileageData);

  // Catégories d'intervention avec couleurs
  const categoryColors: Record<string, string> = {
    vidange: '#3B82F6',
    freins: '#EF4444',
    pneus: '#F59E0B',
    moteur: '#10B981',
    electricite: '#8B5CF6',
    carrosserie: '#EC4899',
    autre: '#6B7280'
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport OKAR - ${vehicle.reference}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #1e40af;
      margin-bottom: 30px;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-text {
      font-size: 28px;
      font-weight: 700;
      color: #1e40af;
    }
    
    .logo-subtitle {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .badge {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-premium {
      background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
    }
    
    .vehicle-header {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
    }
    
    .vehicle-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .vehicle-subtitle {
      font-size: 16px;
      opacity: 0.8;
      margin-bottom: 20px;
    }
    
    .vehicle-details {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    
    .detail-item {
      text-align: center;
    }
    
    .detail-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.7;
      margin-bottom: 4px;
    }
    
    .detail-value {
      font-size: 18px;
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-title::before {
      content: '';
      width: 4px;
      height: 24px;
      background: #1e40af;
      border-radius: 2px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e40af;
    }
    
    .stat-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    .history-table th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .history-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    
    .history-table tr:hover {
      background: #f8fafc;
    }
    
    .category-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: white;
    }
    
    .chart-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 16px;
    }
    
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .photo-item {
      aspect-ratio: 4/3;
      background: #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .photo-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .admin-status {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #86efac;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .admin-status-title {
      font-weight: 600;
      color: #166534;
      margin-bottom: 12px;
    }
    
    .admin-status-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .admin-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .admin-label {
      color: #4b5563;
    }
    
    .admin-value {
      font-weight: 600;
    }
    
    .admin-value.valid {
      color: #059669;
    }
    
    .admin-value.invalid {
      color: #dc2626;
    }
    
    .admin-value.pending {
      color: #d97706;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .verification-code {
      background: #1e293b;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 16px;
      letter-spacing: 2px;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      font-weight: 700;
      color: rgba(30, 64, 175, 0.05);
      white-space: nowrap;
      pointer-events: none;
      z-index: -1;
    }
    
    .validity-info {
      font-size: 12px;
      color: #64748b;
      text-align: right;
    }
    
    @media print {
      body {
        background: white;
      }
      
      .page {
        box-shadow: none;
        padding: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="watermark">OKAR CERTIFIÉ</div>
  
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <div class="logo-text">OKAR</div>
          <div class="logo-subtitle">Passeport Numérique Automobile</div>
        </div>
      </div>
      <div class="badge badge-premium">Rapport ${reportType}</div>
    </div>
    
    <!-- Vehicle Header -->
    <div class="vehicle-header">
      <div class="vehicle-title">${vehicle.make || 'Marque'} ${vehicle.model || 'Modèle'}</div>
      <div class="vehicle-subtitle">Référence OKAR: ${vehicle.reference} | Immatriculation: ${vehicle.licensePlate || 'N/A'}</div>
      <div class="vehicle-details">
        <div class="detail-item">
          <div class="detail-label">Année</div>
          <div class="detail-value">${vehicle.year || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Kilométrage</div>
          <div class="detail-value">${formatMileage(vehicle.currentMileage)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Carburant</div>
          <div class="detail-value">${vehicle.engineType || 'N/A'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Couleur</div>
          <div class="detail-value">${vehicle.color || 'N/A'}</div>
        </div>
      </div>
    </div>
    
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${totalInterventions}</div>
        <div class="stat-label">Interventions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgMileagePerMonth.toLocaleString()}</div>
        <div class="stat-label">Km/mois (moy.)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatCurrency(estimatedValue)}</div>
        <div class="stat-label">Cote estimée</div>
      </div>
    </div>
    
    <!-- Administrative Status -->
    <div class="admin-status">
      <div class="admin-status-title">État Administratif</div>
      <div class="admin-status-grid">
        <div class="admin-item">
          <span class="admin-label">Visite Technique</span>
          <span class="admin-value ${getExpiryClass(vehicle.vtEndDate)}">${formatExpiry(vehicle.vtEndDate, 'VT')}</span>
        </div>
        <div class="admin-item">
          <span class="admin-label">Assurance</span>
          <span class="admin-value ${getExpiryClass(vehicle.insuranceEndDate)}">${formatExpiry(vehicle.insuranceEndDate, 'Assurance')}</span>
        </div>
        <div class="admin-item">
          <span class="admin-label">Centre VT</span>
          <span class="admin-value">${vehicle.vtCenter || 'Non renseigné'}</span>
        </div>
        <div class="admin-item">
          <span class="admin-label">Assureur</span>
          <span class="admin-value">${vehicle.insuranceCompany || 'Non renseigné'}</span>
        </div>
      </div>
    </div>
    
    <!-- Mileage Chart -->
    ${mileageData.length > 1 ? `
    <div class="section">
      <div class="section-title">Évolution du Kilométrage</div>
      <div class="chart-container">
        <div class="chart-title">Progression sur ${mileageData.length} relevés</div>
        ${mileageChart}
      </div>
    </div>
    ` : ''}
    
    <!-- Maintenance History -->
    <div class="section">
      <div class="section-title">Historique d'Entretien (${maintenanceHistory.length} interventions)</div>
      <table class="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Catégorie</th>
            <th>Description</th>
            <th>Kilométrage</th>
            <th>Garage</th>
          </tr>
        </thead>
        <tbody>
          ${maintenanceHistory.slice(0, 20).map((record: any) => `
            <tr>
              <td>${formatDate(record.interventionDate)}</td>
              <td><span class="category-badge" style="background: ${categoryColors[record.category] || '#6B7280'}">${record.category}</span></td>
              <td>${record.description || '-'}</td>
              <td>${record.mileage ? formatMileage(record.mileage) : '-'}</td>
              <td>${record.garage?.name || 'Particulier'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${maintenanceHistory.length > 20 ? `<p style="text-align: center; color: #64748b; margin-top: 12px;">... et ${maintenanceHistory.length - 20} interventions supplémentaires</p>` : ''}
    </div>
    
    <!-- Photos -->
    ${photos.length > 0 ? `
    <div class="section">
      <div class="section-title">Photos du Véhicule (${photos.length})</div>
      <div class="photos-grid">
        ${photos.slice(0, 6).map((url: string) => `
          <div class="photo-item">
            <img src="${url}" alt="Photo véhicule" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%23e2e8f0%22 width=%22400%22 height=%22300%22/><text x=%22200%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22>Photo non disponible</text></svg>'">
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <div>
        <div class="verification-code">${verificationCode}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Code de vérification: okar.sn/verifier/${verificationCode}</div>
      </div>
      <div class="validity-info">
        <div><strong>Généré le:</strong> ${formatDate(generatedAt)}</div>
        <div><strong>Valide jusqu'au:</strong> ${formatDate(expiresAt)}</div>
        <div style="margin-top: 8px; color: #94a3b8;">Document certifié par OKAR</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Générer un graphique SVG simple du kilométrage
 */
function generateMileageChartSvg(data: { date: Date; mileage: number }[]): string {
  if (data.length < 2) return '';

  const width = 600;
  const height = 200;
  const padding = 40;

  const mileages = data.map(d => d.mileage);
  const minMileage = Math.min(...mileages);
  const maxMileage = Math.max(...mileages);
  const range = maxMileage - minMileage || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.mileage - minMileage) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- Grid lines -->
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#e2e8f0" stroke-width="1"/>
      
      <!-- Area fill -->
      <polygon points="${padding},${height - padding} ${points} ${width - padding},${height - padding}" fill="url(#gradient)" opacity="0.3"/>
      
      <!-- Line -->
      <polyline points="${points}" fill="none" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      
      <!-- Points -->
      ${data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((d.mileage - minMileage) / range) * (height - 2 * padding);
        return `<circle cx="${x}" cy="${y}" r="4" fill="#1e40af"/>`;
      }).join('')}
      
      <!-- Y axis labels -->
      <text x="${padding - 5}" y="${height - padding}" text-anchor="end" font-size="11" fill="#64748b">${formatMileage(minMileage)}</text>
      <text x="${padding - 5}" y="${padding + 5}" text-anchor="end" font-size="11" fill="#64748b">${formatMileage(maxMileage)}</text>
      
      <!-- Gradient -->
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0" />
        </linearGradient>
      </defs>
    </svg>
  `;
}

/**
 * Calculer la moyenne de kilométrage par mois
 */
function calculateAvgMileagePerMonth(data: { date: Date; mileage: number }[]): number {
  if (data.length < 2) return 0;

  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const monthsDiff = (last.date.getTime() - first.date.getTime()) / (30 * 24 * 60 * 60 * 1000);
  if (monthsDiff < 1) return 0;

  const mileageDiff = last.mileage - first.mileage;
  return Math.round(mileageDiff / monthsDiff);
}

/**
 * Estimer la valeur du véhicule (simplifié)
 */
function calculateEstimatedValue(vehicle: any, maintenanceHistory: any[]): number {
  // Cette fonction est une estimation très simplifiée
  // En production, utiliser un algorithme plus sophistiqué
  
  const baseValues: Record<string, number> = {
    'Toyota': 5000000,
    'Peugeot': 4000000,
    'Renault': 3500000,
    'Hyundai': 4000000,
    'Kia': 3800000,
    'Nissan': 4200000,
    'Ford': 4500000,
    'Mercedes': 12000000,
    'BMW': 10000000,
    'default': 3000000
  };

  let baseValue = baseValues[vehicle.make] || baseValues['default'];

  // Ajuster selon l'année
  const currentYear = new Date().getFullYear();
  const age = currentYear - (vehicle.year || currentYear);
  const depreciation = Math.min(age * 0.08, 0.7); // Max 70% de dépréciation

  // Ajuster selon le kilométrage
  const mileage = vehicle.currentMileage || 0;
  const mileageDepreciation = Math.min(mileage / 500000, 0.3); // Max 30% pour kilométrage

  // Bonus pour bon historique d'entretien
  const maintenanceBonus = Math.min(maintenanceHistory.length * 0.01, 0.1); // Max 10% bonus

  let estimatedValue = baseValue * (1 - depreciation - mileageDepreciation + maintenanceBonus);

  return Math.max(Math.round(estimatedValue / 50000) * 50000, 500000); // Arrondir à 50k, min 500k
}

// Helper functions
function formatMileage(mileage: number | null | undefined): string {
  if (!mileage) return 'N/A';
  return mileage.toLocaleString('fr-FR') + ' km';
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatExpiry(date: Date | string | null | undefined, type: string): string {
  if (!date) return `Non renseignée`;
  
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return `Expiré (${Math.abs(days)} jours)`;
  if (days === 0) return `Expire aujourd'hui`;
  if (days <= 30) return `Expire dans ${days} jours`;
  
  return `Valide jusqu'au ${formatDate(date)}`;
}

function getExpiryClass(date: Date | string | null | undefined): string {
  if (!date) return 'pending';
  
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return 'invalid';
  if (days <= 30) return 'pending';
  return 'valid';
}

/**
 * Créer un rapport PDF en base de données
 */
export async function createPdfReport(
  vehicleId: string,
  transactionId?: string,
  reportType: ReportType = 'PREMIUM'
): Promise<any> {
  const data = await prepareReportData(vehicleId);
  
  const report = await prisma.pdfReport.create({
    data: {
      vehicleId,
      transactionId,
      reportType,
      fileName: `rapport-${data.vehicle.reference}-${Date.now()}.pdf`,
      fileUrl: `/api/reports/download/${data.verificationCode}`,
      verificationCode: data.verificationCode,
      certifiedAt: new Date(),
      expiresAt: data.expiresAt,
      includePhotos: true,
      includeCharts: true,
    },
  });

  return {
    report,
    html: generateReportHtml(data, reportType),
    verificationCode: data.verificationCode,
  };
}
