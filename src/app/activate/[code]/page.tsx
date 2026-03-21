'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Car,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  ArrowLeft,
  Calendar,
  Hash
} from 'lucide-react';

export default function ActivateQRPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrInfo, setQrInfo] = useState<any>(null);

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    mileage: '',
  });

  useEffect(() => {
    if (code) {
      checkQRCode();
    }
  }, [code]);

  const checkQRCode = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/public/check-qr?code=${code}`);
      const data = await res.json();

      if (data.success) {
        setQrInfo(data);
      } else {
        setError(data.message || 'Ce QR Code n\'est pas valide');
      }
    } catch (err) {
      setError('Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public/activate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortCode: code,
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
            email: form.ownerEmail || null,
          },
          mileage: form.mileage ? parseInt(form.mileage) : null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/v/${code}`);
        }, 3000);
      } else {
        setError(data.error || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      setError('Erreur serveur');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Vérification du QR Code...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation réussie !</h1>
          <p className="text-gray-600 mb-4">
            Votre passeport automobile OKAR est maintenant actif.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers votre passeport...
          </p>
        </div>
      </div>
    );
  }

  // Error state - invalid QR
  if (!qrInfo?.canActivate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code non valide</h1>
          <p className="text-gray-600 mb-6">{error || 'Ce QR Code ne peut pas être activé.'}</p>
          <Link href="/" className="text-orange-600 font-medium hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">Activer mon Passeport</h1>
            <p className="text-sm text-gray-500">OKAR - AutoPass Numérique</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* QR Code Info */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-bold text-xl">QR Code Particulier</h2>
              <p className="text-white/80">Code: {code}</p>
              <p className="text-sm text-white/70 mt-1">
                ✓ Valide • Prêt à activer
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-orange-500" />
              Informations du véhicule
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marque *
                </label>
                <input
                  type="text"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  placeholder="Toyota, Peugeot..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modèle *
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Corolla, 208..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Année
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="Blanc, Noir..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Immatriculation *
                </label>
                <input
                  type="text"
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="AA-1234-BB"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilométrage actuel
                </label>
                <input
                  type="number"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  placeholder="50000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              Vos informations
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="Amadou Diallo"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={form.ownerPhone}
                  onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                  placeholder="+221 77 123 45 67"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  placeholder="amadou@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Activation en cours...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Activer mon Passeport
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 bg-slate-900 text-white rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-white mb-1">Comment ça marche ?</p>
              <ul className="text-slate-300 space-y-1">
                <li>• Remplissez les informations de votre véhicule</li>
                <li>• Votre passeport numérique sera créé instantanément</li>
                <li>• Les garages certifiés pourront y ajouter vos interventions</li>
                <li>• Historique infalsifiable consultable à tout moment</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
