'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  CheckCircle, 
  Car,
  Shield,
  ExternalLink,
  Printer
} from 'lucide-react';

interface VehicleQRCardProps {
  vehicle: {
    id: string;
    reference: string;
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    licensePlate: string | null;
  };
  publicUrl: string;
}

export default function VehicleQRCard({ vehicle, publicUrl }: VehicleQRCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate QR code image
  useEffect(() => {
    generateQRCode();
  }, [publicUrl]);

  const generateQRCode = async () => {
    // Dynamic import of QR code library
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e293b', // Slate-800
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback: Use external API
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;
      setQrDataUrl(fallbackUrl);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `autopass-${vehicle.reference}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!cardRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AutoPass - ${vehicle.reference}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', system-ui, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f8fafc;
            }
            .card {
              width: 90mm;
              height: 55mm;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              padding: 8mm;
              display: flex;
              gap: 6mm;
            }
            .qr-section {
              flex-shrink: 0;
            }
            .qr-section img {
              width: 38mm;
              height: 38mm;
            }
            .info-section {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .logo {
              display: flex;
              align-items: center;
              gap: 2mm;
              margin-bottom: 3mm;
            }
            .logo-text {
              font-size: 14pt;
              font-weight: bold;
              color: #1e293b;
            }
            .logo-badge {
              font-size: 8pt;
              color: #059669;
              background: #d1fae5;
              padding: 1mm 2mm;
              border-radius: 2mm;
            }
            .reference {
              font-family: 'Courier New', monospace;
              font-size: 12pt;
              font-weight: bold;
              color: #ea580c;
              margin-bottom: 2mm;
            }
            .vehicle {
              font-size: 10pt;
              color: #475569;
              margin-bottom: 1mm;
            }
            .plate {
              font-family: 'Courier New', monospace;
              font-size: 11pt;
              font-weight: bold;
              background: #1e293b;
              color: white;
              padding: 1mm 3mm;
              border-radius: 2mm;
              display: inline-block;
            }
            .url {
              font-size: 7pt;
              color: #94a3b8;
              margin-top: 3mm;
            }
            @media print {
              body { background: none; }
              .card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="qr-section">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="info-section">
              <div class="logo">
                <span class="logo-text">AutoPass</span>
                <span class="logo-badge">CERTIFIÉ</span>
              </div>
              <div class="reference">${vehicle.reference}</div>
              <div class="vehicle">${vehicle.make || ''} ${vehicle.model || ''}</div>
              ${vehicle.licensePlate ? `<div class="plate">${vehicle.licensePlate}</div>` : ''}
              <div class="url">autopass.sn/v/${vehicle.reference}</div>
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Passeport AutoPass - ${vehicle.make} ${vehicle.model}`,
          text: `Consultez l'historique d'entretien de ce véhicule ${vehicle.make} ${vehicle.model}`,
          url: publicUrl,
        });
      } catch (error) {
        console.log('Share cancelled/error:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Card Preview */}
      <div 
        ref={cardRef}
        className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">AutoPass</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Certifié
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Passeport Véhicule</p>
            <p className="font-mono font-bold text-orange-500">{vehicle.reference}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {qrDataUrl ? (
              <>
                <img 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  className="w-48 h-48 rounded-xl shadow-lg"
                />
                {/* Center logo overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow">
                    <Car className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-48 h-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-400" />
              </div>
            )}
            
            {/* Border decoration */}
            <div className="absolute inset-0 border-4 border-orange-500/20 rounded-xl pointer-events-none" />
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-slate-800 dark:text-white">
            {vehicle.make || vehicle.model 
              ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim()
              : 'Véhicule'}
          </p>
          {vehicle.licensePlate && (
            <div className="inline-block bg-slate-800 dark:bg-slate-700 text-white px-4 py-1.5 rounded-lg font-mono font-bold">
              {vehicle.licensePlate}
            </div>
          )}
          {vehicle.year && (
            <p className="text-sm text-slate-500">Année: {vehicle.year}</p>
          )}
        </div>

        {/* URL */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400 font-mono truncate">
            autopass.sn/v/{vehicle.reference}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {copied ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <Copy className="w-5 h-5 text-slate-500" />
            )}
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {copied ? 'Copié!' : 'Copier'}
            </span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Share2 className="w-5 h-5 text-slate-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Partager</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-5 h-5 text-slate-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Télécharger</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-5 h-5 text-slate-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Imprimer</span>
          </button>
        </div>

        {/* Open Link Button */}
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl font-medium hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir la page publique
        </a>
      </div>

      {/* Security Notice */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          Ce QR code est unique et infalsifiable. Une fois activé, il est définitivement lié à ce véhicule.
        </p>
      </div>
    </div>
  );
}

/**
 * Mini QR Card for dashboard display
 */
export function VehicleQRMiniCard({ vehicle, publicUrl }: VehicleQRCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateMiniQR = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const dataUrl = await QRCode.toDataURL(publicUrl, {
          width: 100,
          margin: 1,
          color: { dark: '#1e293b', light: '#ffffff' },
        });
        setQrDataUrl(dataUrl);
      } catch {
        // Silently fail
      }
    };
    generateMiniQR();
  }, [publicUrl]);

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR" className="w-12 h-12 rounded-lg" />
      ) : (
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <QrCode className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-bold text-orange-500">{vehicle.reference}</p>
        <p className="text-xs text-slate-500 truncate">
          {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
        </p>
      </div>
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-slate-400" />
      </a>
    </div>
  );
}
