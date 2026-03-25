/**
 * QR Code PDF Generation Utility using jsPDF
 * Generates printable PDF documents with QR codes for SuperAdmin
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface QRCodeForPDF {
  shortCode: string;
  codeUnique: string;
  lotPrefix: string;
}

export interface LotPDFOptions {
  title?: string;
  codesPerPage?: number;
  includeActivationUrl?: boolean;
  notes?: string;
}

/**
 * Generate QR code as base64 image
 */
async function generateQRImage(data: string, size: number = 150): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: size,
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
  } catch (error) {
    console.error('Error generating QR image:', error);
    // Fallback to external API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  }
}

/**
 * Generate a PDF document with QR codes from a lot
 */
export async function generateQRCodeLotPDF(
  qrCodes: QRCodeForPDF[],
  lotId: string,
  options: LotPDFOptions = {}
): Promise<Blob> {
  const {
    title = 'OKAR - Lot de QR Codes',
    codesPerPage = 10,
    includeActivationUrl = true,
    notes
  } = options;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn';

  // Create PDF document (A4)
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const cols = 2;
  const rows = Math.ceil(codesPerPage / cols);
  const cellWidth = (pageWidth - margin * 2) / cols;
  const cellHeight = (pageHeight - margin * 2 - 25) / rows; // 25mm for header

  // Generate QR code images
  const qrImages: Map<string, string> = new Map();
  for (const qr of qrCodes) {
    const scanUrl = `${appUrl}/v/${qr.shortCode}`;
    const imageData = await generateQRImage(scanUrl, 150);
    qrImages.set(qr.shortCode, imageData);
  }

  // Generate pages
  const totalPages = Math.ceil(qrCodes.length / codesPerPage);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) {
      doc.addPage();
    }

    const startIndex = pageIndex * codesPerPage;
    const pageCodes = qrCodes.slice(startIndex, startIndex + codesPerPage);

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('OKAR - Passeport Automobile Digital', margin, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Lot: ${lotId} | Page ${pageIndex + 1}/${totalPages}`, margin, 22);

    if (notes && pageIndex === 0) {
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Notes: ${notes}`, margin, 27);
    }

    // QR codes grid
    pageCodes.forEach((qr, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = margin + col * cellWidth;
      const y = margin + (notes ? 32 : 25) + row * cellHeight;

      // Cell border
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.roundedRect(x + 2, y, cellWidth - 4, cellHeight - 4, 2, 2, 'S');

      // QR code image
      const imageData = qrImages.get(qr.shortCode);
      if (imageData) {
        const imgSize = 35;
        doc.addImage(
          imageData,
          'PNG',
          x + (cellWidth - imgSize) / 2,
          y + 5,
          imgSize,
          imgSize
        );
      }

      // Short code (formatted: XYZ-123)
      const formattedCode = qr.shortCode.length > 3
        ? `${qr.shortCode.slice(0, 3)}-${qr.shortCode.slice(3)}`
        : qr.shortCode;

      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(formattedCode, x + cellWidth / 2, y + 45, { align: 'center' });

      // Activation URL
      if (includeActivationUrl) {
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `${appUrl}/activate/${qr.shortCode}`,
          x + cellWidth / 2,
          y + 50,
          { align: 'center' }
        );
      }

      // Space for manual notes
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.1);
      doc.line(x + 8, y + cellHeight - 15, x + cellWidth - 8, y + cellHeight - 15);
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('Client:', x + 8, y + cellHeight - 10);
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `OKAR - Passeport Numérique Automobile | Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

/**
 * Generate a single QR code sticker PDF
 */
export async function generateSingleQRStickerPDF(
  shortCode: string,
  lotPrefix: string,
  vehicleInfo?: {
    make?: string;
    model?: string;
    licensePlate?: string;
  }
): Promise<Blob> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn';
  const scanUrl = `${appUrl}/v/${shortCode}`;

  // Generate QR image
  const qrImageData = await generateQRImage(scanUrl, 200);

  // Create PDF (sticker size: 90mm x 55mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [90, 55]
  });

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 90, 55, 'F');

  // QR Code
  if (qrImageData) {
    doc.addImage(qrImageData, 'PNG', 5, 5, 45, 45);
  }

  // Brand
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('OKAR', 55, 12);

  // Certified badge
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(55, 14, 25, 5, 1, 1, 'F');
  doc.text('CERTIFIE', 67.5, 18, { align: 'center' });

  // Code
  const formattedCode = shortCode.length > 3
    ? `${shortCode.slice(0, 3)}-${shortCode.slice(3)}`
    : shortCode;

  doc.setFontSize(14);
  doc.setTextColor(234, 88, 12); // orange-600
  doc.text(formattedCode, 55, 28);

  // Vehicle info
  if (vehicleInfo) {
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const vehicleText = `${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim();
    if (vehicleText) {
      doc.text(vehicleText, 55, 35);
    }

    if (vehicleInfo.licensePlate) {
      doc.setFontSize(10);
      doc.setFillColor(30, 41, 59);
      doc.setTextColor(255, 255, 255);
      doc.roundedRect(55, 38, 30, 6, 1, 1, 'F');
      doc.text(vehicleInfo.licensePlate, 70, 42.5, { align: 'center' });
    }
  }

  // URL
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`okar.sn/v/${shortCode}`, 55, 50);

  return doc.output('blob');
}

/**
 * Download a PDF blob
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open PDF in new window for printing
 */
export function openPDFForPrint(blob: Blob): Window | null {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  return printWindow;
}
