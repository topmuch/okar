'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flashlight,
  SwitchCamera,
  X,
  QrCode,
  Car,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// OKAR Brand
const OKAR_ORANGE = '#FF6600';

interface ScanResult {
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'NOT_FOUND';
  vehicle?: {
    id: string;
    reference: string;
    make: string | null;
    model: string | null;
    licensePlate: string | null;
    year: number | null;
    mileage: number | null;
    owner?: {
      id: string;
      name: string | null;
      phone: string | null;
    } | null;
  };
  message?: string;
}

export default function OKARScannerPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<{ reference: string; status: string; timestamp: number }[]>([]);

  // Load recent scans from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('okar_recent_scans');
    if (saved) {
      try {
        setRecentScans(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save recent scans to localStorage
  const saveRecentScan = (reference: string, status: string) => {
    const updated = [
      { reference, status, timestamp: Date.now() },
      ...recentScans.filter(s => s.reference !== reference)
    ].slice(0, 10);
    setRecentScans(updated);
    localStorage.setItem('okar_recent_scans', JSON.stringify(updated));
  };

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Process scanned code - extract shortCode from URL or use direct code
  const extractCode = (scannedText: string): string | null => {
    const text = scannedText.trim().toUpperCase();
    
    // If it's a URL like https://okar.sn/v/OKAR001 or /v/OKAR001
    const urlMatch = text.match(/\/v\/([A-Z0-9]+)/i);
    if (urlMatch) {
      return urlMatch[1].toUpperCase();
    }
    
    // If it's a code with OKAR prefix like OKAR001, OKAR002, etc.
    const okarMatch = text.match(/^(OKAR\d{3})$/);
    if (okarMatch) {
      return okarMatch[1];
    }
    
    // If it's a full codeUnique format like OKAR001-A06JKV
    const uniqueMatch = text.match(/^(OKAR\d{3}-[A-Z0-9]+)$/);
    if (uniqueMatch) {
      return uniqueMatch[1];
    }
    
    // If it contains OKAR reference anywhere
    const refMatch = text.match(/OKAR(\d{3})/);
    if (refMatch) {
      return 'OKAR' + refMatch[1];
    }
    
    // If it's a direct short code (6-10 chars alphanumeric)
    const shortCodeMatch = text.match(/^[A-Z0-9]{6,10}$/);
    if (shortCodeMatch) {
      return text;
    }
    
    return null;
  };

  // Process scanned code
  const processCode = async (code: string) => {
    setLoading(true);
    setError(null);
    triggerHaptic([30, 50, 30]);

    try {
      // Stop scanner while processing
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.pause();
      }

      const response = await fetch('/api/scan/' + code);
      const data = await response.json();
      
      // Handle both API response formats
      const isSuccess = data.success === true || data.status === 'active' || data.status === 'inactive';
      const qrStatus = data.qrStatus || (data.status === 'active' ? 'ACTIVE' : data.status === 'inactive' ? 'INACTIVE' : data.status?.toUpperCase());
      
      if (isSuccess && qrStatus) {
        setScanResult({
          status: qrStatus as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'NOT_FOUND',
          vehicle: data.vehicle,
          message: data.message
        });
        if (data.vehicle?.reference) {
          saveRecentScan(data.vehicle.reference, qrStatus);
        }
        triggerHaptic(100);
      } else {
        setError(data.message || data.error || 'Code non reconnu');
        triggerHaptic([100, 50, 100]);
        // Resume scanning after error
        if (scannerRef.current && scannerRef.current.isScanning) {
          await scannerRef.current.resume();
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Erreur de connexion. Vérifiez votre réseau.');
      // Resume scanning after error
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.resume();
      }
    } finally {
      setLoading(false);
    }
  };

  // Start QR scanner with html5-qrcode
  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      // Create scanner instance
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: facingMode },
        config,
        (decodedText) => {
          // Success callback - QR code detected
          console.log('QR Code detected:', decodedText);
          const code = extractCode(decodedText);
          
          if (code) {
            processCode(code);
          } else {
            setError('Format de QR code non reconnu');
            triggerHaptic([100, 50, 100]);
          }
        },
        (errorMessage) => {
          // Ignore scan errors (no QR found in frame)
          // console.warn('Scan error:', errorMessage);
        }
      );

      setHasPermission(true);
      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner start error:', err);
      setHasPermission(false);
      setError('Accès caméra refusé. Veuillez autoriser l\'accès.');
    }
  }, [facingMode]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  }, []);

  // Switch camera
  const switchCamera = async () => {
    await stopScanner();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Toggle torch (flash)
  const toggleTorch = async () => {
    // html5-qrcode doesn't have built-in torch support
    // This would require direct MediaStream access
    console.log('Torch toggle not implemented in this version');
  };

  // Manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processCode(manualCode.trim().toUpperCase());
    }
  };

  // Handle scan result action
  const handleResultAction = () => {
    if (!scanResult) return;

    if (scanResult.status === 'INACTIVE') {
      // Redirect to activation page
      router.push(`/garage/activer-qr?code=${scanResult.vehicle?.reference}`);
    } else if (scanResult.status === 'ACTIVE' && scanResult.vehicle) {
      // Redirect to new intervention with vehicle pre-filled
      router.push(`/garage/interventions/nouvelle?vehicleId=${scanResult.vehicle.id}`);
    }
  };

  // Get status message and color
  const getStatusInfo = () => {
    if (!scanResult) return null;

    switch (scanResult.status) {
      case 'ACTIVE':
        return {
          icon: CheckCircle,
          title: 'Pass OKAR Actif',
          subtitle: 'Véhicule identifié',
          color: 'emerald',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-400',
          action: 'Créer une intervention',
          actionIcon: ChevronRight
        };
      case 'INACTIVE':
        return {
          icon: QrCode,
          title: 'Pass OKAR Inactif',
          subtitle: 'Code vierge détecté',
          color: 'amber',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          textColor: 'text-amber-400',
          action: 'Activer ce Pass OKAR',
          actionIcon: ChevronRight
        };
      case 'BLOCKED':
        return {
          icon: AlertCircle,
          title: 'Pass OKAR Bloqué',
          subtitle: 'Contactez le support',
          color: 'red',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          action: null
        };
      default:
        return null;
    }
  };

  // Start scanner on mount
  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black via-black/80 to-transparent p-4 pt-12 lg:pt-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link
            href="/garage/tableau-de-bord"
            className="w-12 h-12 bg-zinc-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-black text-white">SCANNER OKAR</h1>
            <p className="text-xs text-zinc-400">Scannez ou tapez le code</p>
          </div>
          <div className="w-12 h-12" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Accès caméra requis</h2>
              <p className="text-zinc-400 mb-6">
                OKAR a besoin de votre caméra pour scanner les QR codes
              </p>
              <button
                onClick={startScanner}
                className="px-6 py-3 bg-[#FF6600] rounded-xl text-white font-semibold"
              >
                Autoriser l'accès
              </button>
            </div>
          </div>
        )}

        {/* QR Scanner Container */}
        <div 
          id="qr-reader"
          ref={containerRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            opacity: isScanning ? 1 : 0,
          }}
        />
      </div>

      {/* Manual Entry - Always visible */}
      <div className="absolute inset-x-0 bottom-28 z-20 px-4">
        <form onSubmit={handleManualSubmit} className="max-w-lg mx-auto">
          <div className="bg-zinc-900/95 backdrop-blur-sm rounded-2xl p-4 border border-zinc-700">
            <label className="text-xs text-zinc-500 uppercase font-semibold mb-2 block">
              Saisie manuelle du code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="OKAR001, OKAR002..."
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-lg focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] outline-none"
              />
              <button
                type="submit"
                disabled={!manualCode.trim() || loading}
                className="px-6 py-3 bg-[#FF6600] rounded-xl text-white font-semibold disabled:opacity-50 disabled:bg-zinc-600"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'OK'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Camera Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pb-6">
        <div className="flex items-center justify-center gap-6 max-w-lg mx-auto">
          <button
            onClick={toggleTorch}
            className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center"
            title="Flash non disponible"
          >
            <Flashlight className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={switchCamera}
            className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center"
          >
            <SwitchCamera className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Recent Scans */}
        {recentScans.length > 0 && !scanResult && (
          <div className="mt-4 max-w-lg mx-auto">
            <p className="text-xs text-zinc-500 uppercase font-semibold mb-2">Scans récents</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {recentScans.slice(0, 5).map((scan, i) => (
                <button
                  key={i}
                  onClick={() => processCode(scan.reference)}
                  className="flex-shrink-0 px-4 py-2 bg-zinc-800 rounded-xl text-sm font-mono text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  {scan.reference}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {scanResult && statusInfo && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-700">
            {/* Status Header */}
            <div className={`p-6 ${statusInfo.bgColor} border-b border-zinc-800`}>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-2xl flex items-center justify-center`}>
                  <statusInfo.icon className={`w-8 h-8 ${statusInfo.textColor}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{statusInfo.title}</h2>
                  <p className={statusInfo.textColor}>{statusInfo.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            {scanResult.vehicle && (
              <div className="p-6 space-y-4">
                {/* Reference */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Référence OKAR</span>
                  <span className="font-mono text-[#FF6600] font-bold">{scanResult.vehicle.reference}</span>
                </div>

                {/* Vehicle details */}
                {scanResult.status === 'ACTIVE' && (
                  <>
                    <div className="h-px bg-zinc-800" />
                    
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center">
                        <Car className="w-7 h-7 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">
                          {scanResult.vehicle.make || ''} {scanResult.vehicle.model || ''}
                        </p>
                        {scanResult.vehicle.licensePlate && (
                          <p className="text-zinc-400 font-mono">{scanResult.vehicle.licensePlate}</p>
                        )}
                      </div>
                    </div>

                    {scanResult.vehicle.owner && (
                      <div className="bg-zinc-800/50 rounded-xl p-4">
                        <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Propriétaire</p>
                        <p className="text-white font-medium">{scanResult.vehicle.owner.name || 'Non renseigné'}</p>
                        {scanResult.vehicle.owner.phone && (
                          <p className="text-zinc-400 text-sm">{scanResult.vehicle.owner.phone}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="p-6 pt-0 space-y-3">
              {statusInfo.action && (
                <button
                  onClick={handleResultAction}
                  className="w-full py-4 bg-[#FF6600] hover:bg-[#FF8533] rounded-xl text-white font-bold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  {statusInfo.action}
                  <statusInfo.actionIcon className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={async () => {
                  setScanResult(null);
                  setManualCode('');
                  // Resume scanning
                  if (scannerRef.current && scannerRef.current.isScanning) {
                    await scannerRef.current.resume();
                  }
                }}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-colors"
              >
                Scanner un autre code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-25 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-zinc-700 border-t-[#FF6600] rounded-full animate-spin mx-auto" />
            <p className="text-white mt-4 text-lg">Vérification du code...</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute top-32 left-4 right-4 z-30">
          <div className="max-w-lg mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
