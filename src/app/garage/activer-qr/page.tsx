'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  QrCode,
  Car,
  User,
  Phone,
  Mail,
  Calendar,
  Gauge,
  FileText,
  CheckCircle,
  Loader2,
  ChevronRight,
  Shield,
  AlertCircle,
  Camera,
  Sparkles,
  Wrench
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// OKAR Brand
const OKAR_ORANGE = '#FF6600';

// Vehicle makes popular in Senegal
const popularMakes = [
  'Toyota', 'Peugeot', 'Renault', 'Nissan', 'Mercedes', 'BMW',
  'Volkswagen', 'Hyundai', 'Kia', 'Ford', 'Isuzu', 'Mitsubishi',
  'Honda', 'Suzuki', 'Mazda', 'Citroën', 'Fiat', 'Autre'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

function ActiverPassOKARContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1: QR Code, 2: Vehicle, 3: Owner, 4: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR Code
  const [qrCode, setQrCode] = useState(searchParams.get('code') || '');
  
  // Vehicle Info
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    mileage: '',
    color: '',
    vin: '',
    engineType: ''
  });

  // Owner Info
  const [ownerData, setOwnerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // Available QR codes from stock
  const [availableQRCodes, setAvailableQRCodes] = useState<string[]>([]);

  // Fetch available QR codes from stock
  useEffect(() => {
    fetchAvailableQRCodes();
  }, [user?.garageId]);

  const fetchAvailableQRCodes = async () => {
    if (!user?.garageId) return;
    
    try {
      const res = await fetch(`/api/qr-lots?garageId=${user.garageId}`);
      const data = await res.json();
      
      // Get inactive QR codes from the lots
      if (data.lots) {
        const codes: string[] = [];
        data.lots.forEach((lot: { id: string; prefix: string; count: number; usedCount: number }) => {
          // Add some sample codes for demo
          for (let i = 0; i < lot.count - (lot.usedCount || 0); i++) {
            codes.push(`${lot.prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
          }
        });
        setAvailableQRCodes(codes.slice(0, 20)); // Limit for display
      }
    } catch (err) {
      console.error('Error fetching QR codes:', err);
    }
  };

  // Validate QR code
  const validateQRCode = async () => {
    if (!qrCode.trim()) {
      setError('Veuillez entrer un code QR');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/scan/${qrCode.trim().toUpperCase()}`);
      const data = await res.json();

      if (data.success && data.qrStatus === 'INACTIVE') {
        setStep(2);
      } else if (data.qrStatus === 'ACTIVE') {
        setError('Ce Pass OKAR est déjà activé pour un autre véhicule');
      } else {
        setError(data.error || 'Code QR invalide');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Handle vehicle form change
  const handleVehicleChange = (field: string, value: string) => {
    setVehicleData(prev => ({ ...prev, [field]: value }));
  };

  // Handle owner form change
  const handleOwnerChange = (field: string, value: string) => {
    setOwnerData(prev => ({ ...prev, [field]: value }));
  };

  // Submit activation
  const submitActivation = async () => {
    if (!user?.garageId) return;

    setLoading(true);
    setError(null);

    try {
      // Activate QR and create vehicle - Use secure garage API
      const res = await fetch('/api/garage/activate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortCode: qrCode.trim().toUpperCase(),
          vehicle: {
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year ? parseInt(vehicleData.year) : null,
            color: vehicleData.color || null,
            licensePlate: vehicleData.licensePlate.toUpperCase(),
          },
          owner: {
            name: ownerData.name || 'Propriétaire',
            phone: ownerData.phone || null,
          },
          mileage: vehicleData.mileage ? parseInt(vehicleData.mileage) : null
        })
      });

      const data = await res.json();

      if (data.success) {
        setStep(4);
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 100, 50]);
        }
      } else {
        setError(data.error || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Get step status
  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < step) return 'completed';
    if (stepNumber === step) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/garage/tableau-de-bord"
            className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Activer un Pass OKAR</h1>
            <p className="text-xs text-zinc-500">Lier un code vierge à un véhicule</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="max-w-lg mx-auto px-4 pb-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    getStepStatus(num) === 'completed'
                      ? 'bg-[#FF6600] text-white'
                      : getStepStatus(num) === 'current'
                      ? 'bg-zinc-800 text-[#FF6600] border-2 border-[#FF6600]'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {getStepStatus(num) === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    num
                  )}
                </div>
                {num < 4 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      getStepStatus(num) === 'completed' ? 'bg-[#FF6600]' : 'bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
            <span>QR Code</span>
            <span>Véhicule</span>
            <span>Propriétaire</span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1: QR Code */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#FF6600]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-10 h-10 text-[#FF6600]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Scannez ou entrez le code</h2>
              <p className="text-zinc-500">Le code OKAR se trouve sur l'autocollant fourni</p>
            </div>

            {/* Scan Button */}
            <Link
              href="/garage/scanner"
              className="w-full py-4 bg-gradient-to-r from-[#FF6600] to-[#FF8533] rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Scanner le QR Code
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-500 text-sm">ou entrer manuellement</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Manual Entry */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Code OKAR</label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                placeholder="OKAR-XXXXXX"
                className="w-full px-4 py-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-white font-mono text-xl text-center focus:border-[#FF6600] outline-none"
              />
            </div>

            {/* Available codes (demo) */}
            {availableQRCodes.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2">Codes disponibles dans votre stock</p>
                <div className="flex flex-wrap gap-2">
                  {availableQRCodes.slice(0, 5).map((code, i) => (
                    <button
                      key={i}
                      onClick={() => setQrCode(code)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-mono text-zinc-300 transition-colors"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={validateQRCode}
              disabled={!qrCode.trim() || loading}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl text-white font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  Continuer
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Vehicle Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#FF6600]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Car className="w-8 h-8 text-[#FF6600]" />
              </div>
              <h2 className="text-xl font-bold text-white">Informations du véhicule</h2>
              <p className="text-zinc-500 text-sm">Code: <span className="text-[#FF6600] font-mono">{qrCode}</span></p>
            </div>

            <div className="space-y-4">
              {/* Make */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Marque *</label>
                <select
                  value={vehicleData.make}
                  onChange={(e) => handleVehicleChange('make', e.target.value)}
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none appearance-none"
                >
                  <option value="">Sélectionner</option>
                  {popularMakes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Modèle</label>
                <input
                  type="text"
                  value={vehicleData.model}
                  onChange={(e) => handleVehicleChange('model', e.target.value)}
                  placeholder="Ex: Corolla, 208, Logan..."
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none"
                />
              </div>

              {/* Year & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Année</label>
                  <select
                    value={vehicleData.year}
                    onChange={(e) => handleVehicleChange('year', e.target.value)}
                    className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none appearance-none"
                  >
                    <option value="">—</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Couleur</label>
                  <input
                    type="text"
                    value={vehicleData.color}
                    onChange={(e) => handleVehicleChange('color', e.target.value)}
                    placeholder="Ex: Blanc"
                    className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none"
                  />
                </div>
              </div>

              {/* License Plate */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Immatriculation *</label>
                <input
                  type="text"
                  value={vehicleData.licensePlate}
                  onChange={(e) => handleVehicleChange('licensePlate', e.target.value.toUpperCase())}
                  placeholder="Ex: AA-123-BB"
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-lg focus:border-[#FF6600] outline-none"
                />
              </div>

              {/* Mileage */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Kilométrage actuel</label>
                <div className="relative">
                  <input
                    type="number"
                    value={vehicleData.mileage}
                    onChange={(e) => handleVehicleChange('mileage', e.target.value)}
                    placeholder="Ex: 85000"
                    className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">km</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-colors"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!vehicleData.make || !vehicleData.licensePlate}
                className="flex-1 py-4 bg-[#FF6600] hover:bg-[#FF8533] disabled:opacity-50 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
              >
                Continuer
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Owner Info */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#FF6600]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-[#FF6600]" />
              </div>
              <h2 className="text-xl font-bold text-white">Propriétaire</h2>
              <p className="text-zinc-500 text-sm">Informations du conducteur (optionnel)</p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={ownerData.name}
                    onChange={(e) => handleOwnerChange('name', e.target.value)}
                    placeholder="Ex: Amadou Diallo"
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Téléphone (WhatsApp)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="tel"
                    value={ownerData.phone}
                    onChange={(e) => handleOwnerChange('phone', e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    value={ownerData.email}
                    onChange={(e) => handleOwnerChange('email', e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Skip option */}
            <p className="text-center text-zinc-500 text-sm">
              Vous pouvez ajouter le propriétaire plus tard
            </p>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-colors"
              >
                Retour
              </button>
              <button
                onClick={submitActivation}
                disabled={loading}
                className="flex-1 py-4 bg-[#FF6600] hover:bg-[#FF8533] disabled:opacity-50 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activation...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Activer le Pass OKAR
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2">Pass OKAR Activé !</h2>
            <p className="text-zinc-400 mb-6">Le véhicule est maintenant enregistré dans le système OKAR</p>

            {/* Summary Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#FF6600]/10 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-[#FF6600]" />
                </div>
                <div>
                  <p className="text-white font-bold">{vehicleData.make} {vehicleData.model}</p>
                  <p className="text-zinc-500 text-sm font-mono">{vehicleData.licensePlate}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Référence OKAR</span>
                  <span className="text-[#FF6600] font-mono font-bold">{qrCode}</span>
                </div>
                {ownerData.name && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Propriétaire</span>
                    <span className="text-white">{ownerData.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href={`/garage/interventions/nouvelle?qrCode=${qrCode}`}
                className="w-full py-4 bg-[#FF6600] hover:bg-[#FF8533] rounded-xl text-white font-bold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <Wrench className="w-5 h-5" />
                Créer une première intervention
              </Link>
              
              <Link
                href="/garage/tableau-de-bord"
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-colors block"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#FF6600] animate-spin mx-auto mb-4" />
        <p className="text-zinc-500">Chargement...</p>
      </div>
    </div>
  );
}

export default function ActiverPassOKARPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ActiverPassOKARContent />
    </Suspense>
  );
}
