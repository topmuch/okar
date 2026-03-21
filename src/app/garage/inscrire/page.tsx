'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus,
  User,
  Phone,
  Mail,
  Car,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function InscrireConducteurPage() {
  return <InscrireConducteurContent />;
}

function InscrireConducteurContent() {
  const router = useRouter();
  
  // Form state
  const [step, setStep] = useState(1); // 1: Driver Info, 2: Vehicle Info, 3: QR Activation, 4: Success
  const [driverData, setDriverData] = useState({
    name: '',
    phone: '',
    email: '',
    sendWelcomeSMS: true,
  });
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    vin: '',
    engineType: 'essence',
    mileage: '',
  });
  const [qrReference, setQrReference] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);
  const [createdDriverId, setCreatedDriverId] = useState<string | null>(null);

  // Garage ID (would come from auth)
  const garageId = 'demo-garage-id';

  const handleNextStep = () => {
    if (step === 1) {
      // Validate driver data
      if (!driverData.name.trim()) {
        setError('Le nom du conducteur est obligatoire');
        return;
      }
      if (!driverData.phone.trim()) {
        setError('Le numéro de téléphone est obligatoire');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      // Validate vehicle data
      if (!vehicleData.make.trim() || !vehicleData.model.trim() || !vehicleData.licensePlate.trim()) {
        setError('La marque, le modèle et l\'immatriculation sont obligatoires');
        return;
      }
      setError(null);
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!qrReference.trim()) {
      setError('Veuillez scanner ou saisir un code QR');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, create the driver account if needed
      let driverId = null;
      
      // Create vehicle with driver
      const response = await fetch('/api/activate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: qrReference,
          garageId,
          vehicleData: {
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year ? parseInt(vehicleData.year) : null,
            color: vehicleData.color,
            licensePlate: vehicleData.licensePlate,
            vin: vehicleData.vin,
            engineType: vehicleData.engineType,
            mileage: vehicleData.mileage ? parseInt(vehicleData.mileage) : null,
            ownerName: driverData.name,
            ownerPhone: driverData.phone,
          },
          driverData: {
            name: driverData.name,
            phone: driverData.phone,
            email: driverData.email || null,
            sendWelcomeSMS: driverData.sendWelcomeSMS,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Erreur lors de l\'inscription');
        return;
      }

      setCreatedVehicleId(data.vehicleId);
      setCreatedDriverId(data.driverId);
      setStep(4);

    } catch (err) {
      setError('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setDriverData({ name: '', phone: '', email: '', sendWelcomeSMS: true });
    setVehicleData({
      make: '', model: '', year: '', color: '',
      licensePlate: '', vin: '', engineType: 'essence', mileage: '',
    });
    setQrReference('');
    setError(null);
    setCreatedVehicleId(null);
    setCreatedDriverId(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-orange-500" />
          Inscrire un Conducteur
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Créez un compte conducteur et enregistrez son véhicule en même temps
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
              step >= s
                ? 'bg-orange-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div className={`w-12 h-1 mx-2 rounded ${
                step > s ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Step 1: Driver Info */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Informations du conducteur
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nom complet *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={driverData.name}
                  onChange={(e) => setDriverData({ ...driverData, name: e.target.value })}
                  placeholder="Amadou Diallo"
                  className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Téléphone WhatsApp *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={driverData.phone}
                  onChange={(e) => setDriverData({ ...driverData, phone: e.target.value })}
                  placeholder="+221 78 123 45 67"
                  className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email (optionnel)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={driverData.email}
                  onChange={(e) => setDriverData({ ...driverData, email: e.target.value })}
                  placeholder="amadou@email.com"
                  className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={driverData.sendWelcomeSMS}
                  onChange={(e) => setDriverData({ ...driverData, sendWelcomeSMS: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    Envoyer un SMS de bienvenue
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Le conducteur recevra un lien pour définir son mot de passe
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleNextStep}
            className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Continuer
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Vehicle Info */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Informations du véhicule
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Marque *
              </label>
              <input
                type="text"
                value={vehicleData.make}
                onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                placeholder="Toyota"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Modèle *
              </label>
              <input
                type="text"
                value={vehicleData.model}
                onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                placeholder="Corolla"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Immatriculation *
              </label>
              <input
                type="text"
                value={vehicleData.licensePlate}
                onChange={(e) => setVehicleData({ ...vehicleData, licensePlate: e.target.value.toUpperCase() })}
                placeholder="AA-1234-BB"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Année
              </label>
              <input
                type="number"
                value={vehicleData.year}
                onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                placeholder="2020"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Couleur
              </label>
              <input
                type="text"
                value={vehicleData.color}
                onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                placeholder="Blanc"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kilométrage
              </label>
              <input
                type="number"
                value={vehicleData.mileage}
                onChange={(e) => setVehicleData({ ...vehicleData, mileage: e.target.value })}
                placeholder="50000"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
            <button
              onClick={handleNextStep}
              className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Continuer
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: QR Activation */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Activation du QR Code
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Scannez ou saisissez le code QR à activer
            </p>
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Conducteur</p>
                <p className="font-medium text-slate-800 dark:text-white">{driverData.name}</p>
                <p className="text-slate-500">{driverData.phone}</p>
              </div>
              <div>
                <p className="text-slate-500">Véhicule</p>
                <p className="font-medium text-slate-800 dark:text-white">
                  {vehicleData.make} {vehicleData.model}
                </p>
                <p className="text-slate-500 font-mono">{vehicleData.licensePlate}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Référence QR
            </label>
            <input
              type="text"
              value={qrReference}
              onChange={(e) => setQrReference(e.target.value.toUpperCase())}
              placeholder="AUTO24-XXXXXX"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-mono text-lg placeholder-slate-400"
            />
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !qrReference.trim()}
              className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Inscrire
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Inscription réussie !
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Le conducteur et son véhicule ont été enregistrés avec succès.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Conducteur</p>
                  <p className="font-medium text-slate-800 dark:text-white">{driverData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Véhicule</p>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {vehicleData.make} {vehicleData.model} - {vehicleData.licensePlate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">QR Code</p>
                  <p className="font-mono font-bold text-orange-500">{qrReference}</p>
                </div>
              </div>
            </div>
          </div>

          {driverData.sendWelcomeSMS && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-sm text-emerald-700 dark:text-emerald-400 mb-6">
              Un SMS a été envoyé à {driverData.phone} avec les instructions de connexion.
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={resetForm}
              className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Inscrire un autre
            </button>
            <button
              onClick={() => router.push('/garage/tableau-de-bord')}
              className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
