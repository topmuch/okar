/**
 * QR Code PDF Generation Utility
 * Generates printable PDF sheets with QR codes for SuperAdmin
 */

// Note: In production, you would use jspdf or pdfmake
// This is a simplified version that generates a printable HTML

export interface QRCodeForPDF {
  reference: string;
  securityHash?: string;
  lotPrefix: string;
}

export interface PDFOptions {
  title: string;
  lotPrefix: string;
  count: number;
  generatedBy: string;
  generatedAt: Date;
  notes?: string;
}

/**
 * Generate a printable HTML page with QR codes
 * Opens in new window for printing
 */
export function generateQRCodePrintSheet(
  qrCodes: QRCodeForPDF[],
  options: PDFOptions
): string {
  const qrPerPage = 12; // 3x4 grid
  const pages: string[][] = [];
  
  // Split into pages
  for (let i = 0; i < qrCodes.length; i += qrPerPage) {
    pages.push(qrCodes.slice(i, i + qrPerPage));
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>AutoPass - Lots QR Codes</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: white;
    }
    
    .page {
      page-break-after: always;
      padding: 5mm;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .header {
      text-align: center;
      padding-bottom: 5mm;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 5mm;
    }
    
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3mm;
      margin-bottom: 3mm;
    }
    
    .logo-icon {
      width: 12mm;
      height: 12mm;
      background: linear-gradient(135deg, #f97316, #f59e0b);
      border-radius: 3mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-icon::after {
      content: "🚗";
      font-size: 7mm;
    }
    
    .logo-text {
      font-size: 18pt;
      font-weight: bold;
      color: #1e293b;
    }
    
    .header-info {
      font-size: 9pt;
      color: #64748b;
    }
    
    .lot-info {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #64748b;
      margin-top: 2mm;
    }
    
    .qr-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5mm;
    }
    
    .qr-card {
      border: 1px solid #e2e8f0;
      border-radius: 3mm;
      padding: 4mm;
      display: flex;
      gap: 3mm;
      background: #fafafa;
    }
    
    .qr-image {
      width: 25mm;
      height: 25mm;
      flex-shrink: 0;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6pt;
      color: #94a3b8;
    }
    
    .qr-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .reference {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      font-weight: bold;
      color: #ea580c;
      margin-bottom: 1mm;
    }
    
    .hash {
      font-family: 'Courier New', monospace;
      font-size: 6pt;
      color: #94a3b8;
    }
    
    .url {
      font-size: 6pt;
      color: #64748b;
      margin-top: 1mm;
    }
    
    .cut-line {
      border-top: 1px dashed #cbd5e1;
      margin-top: 3mm;
      padding-top: 2mm;
      text-align: center;
      font-size: 6pt;
      color: #94a3b8;
    }
    
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 3mm 10mm;
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      background: white;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .qr-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  ${pages.map((pageQrs, pageIndex) => `
    <div class="page">
      <div class="header">
        <div class="logo">
          <div class="logo-icon"></div>
          <span class="logo-text">AutoPass</span>
        </div>
        <div class="header-info">
          <strong>${options.title}</strong> - Lot: ${options.lotPrefix}
        </div>
        <div class="lot-info">
          <span>Généré le: ${formatDate(options.generatedAt)}</span>
          <span>Par: ${options.generatedBy}</span>
          <span>Page ${pageIndex + 1}/${pages.length}</span>
        </div>
      </div>
      
      <div class="qr-grid">
        ${pageQrs.map(qr => `
          <div class="qr-card">
            <div class="qr-image">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://autopass.sn/v/${qr.reference}" 
                alt="QR" 
                style="width: 100%; height: 100%;"
                onerror="this.style.display='none'; this.parentElement.innerText='QR';"
              />
            </div>
            <div class="qr-info">
              <div class="reference">${qr.reference}</div>
              ${qr.securityHash ? `<div class="hash">SEC: ${qr.securityHash}</div>` : ''}
              <div class="url">autopass.sn/v/${qr.reference}</div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${pageIndex === 0 && options.notes ? `
        <div class="cut-line">
          <strong>Notes:</strong> ${options.notes}
        </div>
      ` : ''}
    </div>
  `).join('')}
  
  <script>
    // Auto-print after load
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 1000);
    };
  </script>
</body>
</html>
  `;

  return html;
}

/**
 * Open print window with QR codes
 */
export function printQRCodes(
  qrCodes: QRCodeForPDF[],
  options: PDFOptions
): Window | null {
  const html = generateQRCodePrintSheet(qrCodes, options);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
  
  return printWindow;
}

/**
 * Generate QR code data URL for embedding
 */
export async function generateQRDataUrl(
  data: string,
  size: number = 200
): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(data, {
      width: size,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });
  } catch (error) {
    // Fallback to external API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  }
}

/**
 * Generate a single sticker HTML for a vehicle
 */
export function generateVehicleSticker(
  reference: string,
  vehicle?: { make?: string; model?: string; licensePlate?: string }
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Sticker AutoPass - ${reference}</title>
  <style>
    @page { size: 90mm 55mm; margin: 0; }
    body { 
      margin: 0; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      min-height: 100vh;
      background: #f0f0f0;
    }
    .sticker {
      width: 85mm;
      height: 50mm;
      background: white;
      border-radius: 3mm;
      box-shadow: 0 2mm 5mm rgba(0,0,0,0.1);
      display: flex;
      padding: 3mm;
      gap: 3mm;
    }
    .qr-section {
      width: 44mm;
      height: 44mm;
      flex-shrink: 0;
    }
    .qr-section img {
      width: 100%;
      height: 100%;
    }
    .info-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-family: 'Segoe UI', sans-serif;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 2mm;
      margin-bottom: 2mm;
    }
    .brand-name {
      font-size: 14pt;
      font-weight: bold;
      color: #1e293b;
    }
    .certified {
      font-size: 7pt;
      color: #059669;
      background: #d1fae5;
      padding: 1mm 2mm;
      border-radius: 1mm;
    }
    .ref {
      font-family: 'Courier New', monospace;
      font-size: 12pt;
      font-weight: bold;
      color: #ea580c;
      margin-bottom: 1mm;
    }
    .vehicle {
      font-size: 9pt;
      color: #475569;
      margin-bottom: 1mm;
    }
    .plate {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      font-weight: bold;
      background: #1e293b;
      color: white;
      padding: 1mm 2mm;
      border-radius: 1mm;
      display: inline-block;
    }
    .url {
      font-size: 6pt;
      color: #94a3b8;
      margin-top: 2mm;
    }
    @media print {
      body { background: none; }
      .sticker { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="qr-section">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://autopass.sn/v/${reference}" alt="QR" />
    </div>
    <div class="info-section">
      <div class="brand">
        <span class="brand-name">AutoPass</span>
        <span class="certified">CERTIFIÉ</span>
      </div>
      <div class="ref">${reference}</div>
      ${vehicle ? `
        <div class="vehicle">${vehicle.make || ''} ${vehicle.model || ''}</div>
        ${vehicle.licensePlate ? `<div class="plate">${vehicle.licensePlate}</div>` : ''}
      ` : ''}
      <div class="url">autopass.sn/v/${reference}</div>
    </div>
  </div>
  <script>setTimeout(() => window.print(), 500);</script>
</body>
</html>
  `;
}

/**
 * Open single vehicle sticker for printing
 */
export function printVehicleSticker(
  reference: string,
  vehicle?: { make?: string; model?: string; licensePlate?: string }
): Window | null {
  const html = generateVehicleSticker(reference, vehicle);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
  
  return printWindow;
}
