/**
 * ================================================
 * OKAR Access Ticket PDF Generator
 * ================================================
 * 
 * Génère des tickets d'accès client en PDF
 * Style ticket professionnel avec dégradé orange/noir
 */

export interface TicketData {
  id: string;
  driverName: string;
  driverPhone: string;
  driverEmail?: string | null;
  vehicleInfo: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  licensePlate?: string | null;
  qrReference: string;
  tempPassword: string;
  loginUrl: string;
  garageName?: string;
  generatedAt: Date;
}

/**
 * Génère le HTML du ticket d'accès pour impression
 */
export function generateTicketHtml(data: TicketData): string {
  const formattedDate = formatDate(data.generatedAt);
  const formattedTime = formatTime(data.generatedAt);
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket d'Accès OKAR - ${data.driverName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    @page {
      size: 80mm auto;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .ticket {
      width: 80mm;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .ticket-header {
      background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #f97316 100%);
      color: white;
      padding: 16px 12px;
      text-align: center;
      position: relative;
    }
    
    .ticket-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }
    
    .logo-icon {
      width: 32px;
      height: 32px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-icon svg {
      width: 20px;
      height: 20px;
    }
    
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2px;
    }
    
    .ticket-subtitle {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    
    .ticket-body {
      padding: 12px;
    }
    
    .section {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #e2e8f0;
    }
    
    .section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    .section-title {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .info-label {
      font-size: 10px;
      color: #64748b;
    }
    
    .info-value {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .vehicle-badge {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-radius: 6px;
      padding: 8px 10px;
      margin-top: 4px;
    }
    
    .vehicle-name {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 2px;
    }
    
    .vehicle-plate {
      display: inline-block;
      background: #1e293b;
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    
    .credentials-box {
      background: #f8fafc;
      border: 2px solid #f97316;
      border-radius: 8px;
      padding: 10px;
    }
    
    .login-url {
      background: #1e293b;
      color: white;
      font-size: 9px;
      padding: 6px 8px;
      border-radius: 4px;
      text-align: center;
      margin-bottom: 8px;
      word-break: break-all;
    }
    
    .credential-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .credential-label {
      font-size: 9px;
      color: #64748b;
      min-width: 40px;
    }
    
    .credential-value {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
      font-family: 'Courier New', monospace;
      background: white;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      flex: 1;
    }
    
    .password-warning {
      font-size: 8px;
      color: #dc2626;
      font-weight: 500;
      margin-top: 6px;
      text-align: center;
    }
    
    .qr-reference {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    
    .qr-label {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
    }
    
    .qr-value {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    
    .ticket-footer {
      background: #f8fafc;
      padding: 10px 12px;
      text-align: center;
    }
    
    .footer-date {
      font-size: 9px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .footer-garage {
      font-size: 9px;
      color: #1e293b;
      font-weight: 500;
    }
    
    .footer-brand {
      font-size: 8px;
      color: #94a3b8;
      margin-top: 6px;
    }
    
    .perforation {
      height: 8px;
      background-image: radial-gradient(circle, #e2e8f0 3px, transparent 3px);
      background-size: 16px 8px;
      background-position: center;
      margin: 0;
    }
    
    @media print {
      body {
        background: none;
        padding: 0;
      }
      
      .ticket {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <!-- Header -->
    <div class="ticket-header">
      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="logo-text">OKAR</span>
      </div>
      <div class="ticket-subtitle">Passeport Numérique Automobile</div>
    </div>
    
    <!-- Body -->
    <div class="ticket-body">
      <!-- Client Section -->
      <div class="section">
        <div class="section-title">👤 Client</div>
        <div class="info-row">
          <span class="info-label">Nom</span>
          <span class="info-value">${data.driverName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Téléphone</span>
          <span class="info-value">${data.driverPhone}</span>
        </div>
        ${data.driverEmail ? `
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${data.driverEmail}</span>
        </div>
        ` : ''}
      </div>
      
      <!-- Vehicle Section -->
      <div class="section">
        <div class="section-title">🚗 Véhicule</div>
        <div class="vehicle-badge">
          <div class="vehicle-name">${data.vehicleMake || ''} ${data.vehicleModel || ''}</div>
          ${data.licensePlate ? `<div class="vehicle-plate">${data.licensePlate}</div>` : ''}
        </div>
      </div>
      
      <!-- QR Reference -->
      <div class="section">
        <div class="qr-reference">
          <div class="qr-label">Référence QR</div>
          <div class="qr-value">${data.qrReference}</div>
        </div>
      </div>
      
      <!-- Credentials Section -->
      <div class="section">
        <div class="section-title">🔐 Vos Accès</div>
        <div class="credentials-box">
          <div class="login-url">${data.loginUrl}</div>
          <div class="credential-row">
            <span class="credential-label">Login</span>
            <div class="credential-value">${data.driverPhone}</div>
          </div>
          <div class="credential-row">
            <span class="credential-label">MDP</span>
            <div class="credential-value">${data.tempPassword}</div>
          </div>
          <div class="password-warning">⚠️ À changer à la première connexion</div>
        </div>
      </div>
    </div>
    
    <!-- Perforation -->
    <div class="perforation"></div>
    
    <!-- Footer -->
    <div class="ticket-footer">
      <div class="footer-date">Généré le ${formattedDate} à ${formattedTime}</div>
      ${data.garageName ? `<div class="footer-garage">Par ${data.garageName}</div>` : ''}
      <div class="footer-brand">OKAR.sn - Le passeport numérique automobile</div>
    </div>
  </div>
  
  <script>
    // Auto-print after load (optional)
    // setTimeout(() => window.print(), 500);
  </script>
</body>
</html>
  `;
}

/**
 * Génère un PDF du ticket et ouvre la fenêtre d'impression
 */
export function printTicketPDF(data: TicketData): Window | null {
  const html = generateTicketHtml(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
  
  return printWindow;
}

/**
 * Génère un HTML compact pour l'affichage dans l'interface
 */
export function generateTicketPreviewHtml(data: TicketData): string {
  const formattedDate = formatDate(data.generatedAt);
  
  return `
<div class="ticket-preview">
  <div class="ticket-header">
    <div class="logo">OKAR</div>
    <div class="subtitle">Ticket d'Accès Client</div>
  </div>
  <div class="ticket-content">
    <div class="field">
      <span class="label">Client</span>
      <span class="value">${data.driverName}</span>
    </div>
    <div class="field">
      <span class="label">Véhicule</span>
      <span class="value">${data.vehicleInfo}</span>
    </div>
    <div class="field">
      <span class="label">Immatriculation</span>
      <span class="value plate">${data.licensePlate || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="label">Référence QR</span>
      <span class="value qr">${data.qrReference}</span>
    </div>
    <div class="divider"></div>
    <div class="credentials">
      <div class="cred-label">Login</div>
      <div class="cred-value">${data.driverPhone}</div>
      <div class="cred-label">Mot de passe</div>
      <div class="cred-value password">${data.tempPassword}</div>
    </div>
  </div>
  <div class="ticket-footer">
    <span>${formattedDate}</span>
    <span class="link">${data.loginUrl}</span>
  </div>
</div>
  `;
}

/**
 * Génère les données du ticket à partir des données d'activation
 */
export function createTicketDataFromActivation(
  activationData: {
    vehicle: {
      id: string;
      reference: string;
      make: string;
      model: string;
      licensePlate: string;
    };
    owner: {
      id: string;
      name: string;
      phone: string | null;
      tempPassword: string | null;
    };
    qrCode: {
      shortCode: string;
      scanUrl: string;
    };
  },
  garageName?: string
): TicketData {
  return {
    id: `ticket-${Date.now()}`,
    driverName: activationData.owner.name,
    driverPhone: activationData.owner.phone || '',
    vehicleInfo: `${activationData.vehicle.make} ${activationData.vehicle.model}`,
    vehicleMake: activationData.vehicle.make,
    vehicleModel: activationData.vehicle.model,
    licensePlate: activationData.vehicle.licensePlate,
    qrReference: activationData.qrCode.shortCode,
    tempPassword: activationData.owner.tempPassword || 'Non disponible',
    loginUrl: 'https://okar.sn/driver/connexion',
    garageName,
    generatedAt: new Date(),
  };
}

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

const pdfTicketUtils = {
  generateTicketHtml,
  printTicketPDF,
  generateTicketPreviewHtml,
  createTicketDataFromActivation,
};

export default pdfTicketUtils;
