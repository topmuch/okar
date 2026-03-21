'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
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
  Wifi,
  WifiOff,
  Keyboard,
  ScanLine
} from 'lucide-react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torch, setTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
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

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasPermission(true);
      setIsScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setError('Accès caméra refusé. Veuillez autoriser l\'accès.');
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Toggle torch
  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torch } as any]
          });
          setTorch(!torch);
        } catch (err) {
          console.error('Torch not supported');
        }
      }
    }
  };

  // Switch camera
  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Process scanned code
  const processCode = async (code: string) => {
    setLoading(true);
    setError(null);
    triggerHaptic([30, 50, 30]);

    try {
      const response = await fetch('/api/scan/' + code);
      const data = await response.json();
      
      if (data.success) {
        setScanResult({
          status: data.qrStatus,
          vehicle: data.vehicle,
          message: data.message
        });
        if (data.vehicle?.reference) {
          saveRecentScan(data.vehicle.reference, data.qrStatus);
        }
        triggerHaptic(100);
      } else {
        setError(data.error || 'Code invalide');
        triggerHaptic([100, 50, 100]);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setLoading(false);
    }
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

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

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
            <p className="text-xs text-zinc-400">Scannez le QR Code du véhicule</p>
          </div>
          <button
            onClick={() => setShowManual(!showManual)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              showManual ? 'bg-[#FF6600]' : 'bg-zinc-800/80 backdrop-blur-sm'
            }`}
          >
            <Keyboard className="w-6 h-6 text-white" />
          </button>
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
                onClick={startCamera}
                className="px-6 py-3 bg-[#FF6600] rounded-xl text-white font-semibold"
              >
                Autoriser l'accès
              </button>
            </div>
          </div>
        )}

        {isScanning && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 h-72">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#FF6600] rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#FF6600] rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#FF6600] rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#FF6600] rounded-br-2xl" />
                
                {/* Scanning animation */}
                <div className="absolute top-4 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-[#FF6600] to-transparent animate-pulse" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual Entry */}
      {showManual && (
        <div className="absolute inset-x-0 bottom-40 z-20 px-4">
          <form onSubmit={handleManualSubmit} className="max-w-lg mx-auto">
            <div className="bg-zinc-900/95 backdrop-blur-sm rounded-2xl p-4 border border-zinc-700">
              <label className="text-xs text-zinc-500 uppercase font-semibold mb-2 block">
                Entrer le code manuellement
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="OKAR-XXXXXX"
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-lg focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] outline-none"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || loading}
                  className="px-6 py-3 bg-[#FF6600] rounded-xl text-white font-semibold disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'OK'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Camera Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pb-8">
        <div className="flex items-center justify-center gap-6 max-w-lg mx-auto">
          <button
            onClick={toggleTorch}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
              torch ? 'bg-[#FF6600]' : 'bg-zinc-800'
            }`}
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
                onClick={() => {
                  setScanResult(null);
                  setManualCode('');
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
