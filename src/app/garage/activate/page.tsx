'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Car,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
} from 'lucide-react';

function GarageActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [loading, setLoading] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [codeInfo, setCodeInfo] = useState<any>(null);

  const [form, setForm] = useState({
    shortCode: initialCode,
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    ownerName: '',
    ownerPhone: '',
    mileage: '',
  });

  useEffect(() => {
    if (form.shortCode.length >= 8) {
      checkQRCode(form.shortCode);
    }
  }, [form.shortCode]);

  const checkQRCode = async (code: string) => {
    setCheckingCode(true);
    setError('');
    setCodeInfo(null);

    try {
      const res = await fetch(`/api/garage/check-qr?code=${code}`);
      const data = await res.json();

      if (data.success) {
        setCodeInfo(data);
      } else {
        setError(data.message || 'Code QR non valide');
      }
    } catch (err) {
      setError('Erreur de vérification');
    } finally {
      setCheckingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/garage/activate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortCode: form.shortCode,
          vehicle: {
            make: form.make,
            model: form.model,
            year: form.year ? parseInt(form.year) : null,
            color: form.color,
            licensePlate: form.licensePlate.toUpperCase(),
          },
          owner: {
            name: form.ownerName,
            phone: form.ownerPhone,
          },
          mileage: form.mileage ? parseInt(form.mileage) : null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/garage/vehicules');
        }, 2000);
      } else {
        setError(data.error || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      setError('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation réussie !</h1>
          <p className="text-gray-600">Le véhicule a été enregistré et le QR Code est maintenant actif.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/garage/vehicules" className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">Activer un QR Code</h1>
            <p className="text-sm text-gray-500">Enregistrer un nouveau véhicule</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-500" />
              Code QR
            </h2>

            <div className="relative">
              <input
                type="text"
                value={form.shortCode}
                onChange={(e) => setForm({ ...form, shortCode: e.target.value.toUpperCase() })}
                placeholder="Entrez le code (ex: R7YVBHJJ)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={8}
              />
              {checkingCode && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
              )}
            </div>

            {codeInfo && (
              <div className={`mt-4 p-4 rounded-xl ${codeInfo.canActivate ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {codeInfo.canActivate ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-800">Code valide - Prêt à activer</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-red-800">{codeInfo.message}</span>
                    </>
                  )}
                </div>
                {codeInfo.garage && (
                  <p className="text-sm text-gray-600 mt-2">
                    Garage assigné: {codeInfo.garage.name}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-800">{error}</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-pink-500" />
              Informations du véhicule
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marque *</label>
                <input
                  type="text"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  placeholder="Toyota, Peugeot..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle *</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Corolla, 208..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="Blanc, Noir..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation *</label>
                <input
                  type="text"
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="AA-1234-BB"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl font-mono focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilométrage actuel</label>
                <input
                  type="number"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Propriétaire
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="Amadou Diallo"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.ownerPhone}
                  onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                  placeholder="+221 77 123 45 67"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !codeInfo?.canActivate}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Activation en cours...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Activer le QR Code
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function GarageActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <GarageActivateContent />
    </Suspense>
  );
}
