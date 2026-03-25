'use client';

import { useState, useEffect, useRef } from 'react';
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
  Hash,
  Camera,
  Upload,
  X,
  FileText,
  Building
} from 'lucide-react';

export default function ActivateQRPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrInfo, setQrInfo] = useState<any>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
    // Visite technique
    vtStartDate: '',
    vtEndDate: '',
    // Assurance
    insuranceStartDate: '',
    insuranceEndDate: '',
    insuranceCompany: '',
    insurancePolicyNum: '',
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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'vehicle');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setPhotoPreview(data.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingPhoto(false);
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
            mainPhoto: photoPreview,
          },
          owner: {
            name: form.ownerName,
            phone: form.ownerPhone,
            email: form.ownerEmail || null,
          },
          mileage: form.mileage ? parseInt(form.mileage) : null,
          // Visite technique
          vtStartDate: form.vtStartDate || null,
          vtEndDate: form.vtEndDate || null,
          // Assurance
          insuranceStartDate: form.insuranceStartDate || null,
          insuranceEndDate: form.insuranceEndDate || null,
          insuranceCompany: form.insuranceCompany || null,
          insurancePolicyNum: form.insurancePolicyNum || null,
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-slate-300">Vérification du QR Code...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl shadow-xl p-8 text-center border border-slate-700">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Activation réussie !</h1>
          <p className="text-slate-300 mb-4">
            Votre passeport automobile OKAR est maintenant actif.
          </p>
          <p className="text-sm text-slate-400">
            Redirection vers votre passeport...
          </p>
        </div>
      </div>
    );
  }

  // Error state - invalid QR
  if (!qrInfo?.canActivate) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl shadow-xl p-8 text-center border border-slate-700">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">QR Code non valide</h1>
          <p className="text-slate-300 mb-6">{error || 'Ce QR Code ne peut pas être activé.'}</p>
          <Link href="/" className="text-orange-400 font-medium hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-700 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <h1 className="font-bold text-white">Activer mon Passeport</h1>
            <p className="text-sm text-slate-400">OKAR - AutoPass Numérique</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* QR Code Info */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-orange-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-bold text-xl">QR Code Particulier</h2>
              <p className="text-white/90 font-mono">{code}</p>
              <p className="text-sm text-white/80 mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Valide • Prêt à activer
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo du véhicule */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-cyan-400" />
              </div>
              Photo du véhicule
              <span className="text-sm font-normal text-slate-400">(couverture)</span>
            </h2>

            <div className="flex flex-col items-center">
              {photoPreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-slate-600">
                  <img
                    src={photoPreview}
                    alt="Photo du véhicule"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-600 hover:border-orange-500 transition-colors cursor-pointer flex flex-col items-center justify-center bg-slate-900/50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-2" />
                      <p className="text-slate-400 text-sm">Chargement...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-500 mb-2" />
                      <p className="text-slate-400 text-sm text-center px-4">
                        Appuyez pour prendre ou sélectionner une photo
                      </p>
                      <p className="text-slate-500 text-xs mt-1">PNG, JPG jusqu'à 5 Mo</p>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-orange-400" />
              </div>
              Informations du véhicule
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Marque <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  placeholder="Toyota, Peugeot..."
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Modèle <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Corolla, 208..."
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Année
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Couleur
                </label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="Blanc, Noir..."
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Immatriculation <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="AA-1234-BB"
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors font-mono tracking-wider"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kilométrage actuel
                </label>
                <input
                  type="number"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  placeholder="50000"
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Visite Technique */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              Visite Technique
              <span className="text-sm font-normal text-slate-400">(optionnel)</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={form.vtStartDate}
                  onChange={(e) => setForm({ ...form, vtStartDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date de fin (expiration)
                </label>
                <input
                  type="date"
                  value={form.vtEndDate}
                  onChange={(e) => setForm({ ...form, vtEndDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Assurance */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              Assurance
              <span className="text-sm font-normal text-slate-400">(optionnel)</span>
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Compagnie d'assurance
                  </label>
                  <input
                    type="text"
                    value={form.insuranceCompany}
                    onChange={(e) => setForm({ ...form, insuranceCompany: e.target.value })}
                    placeholder="AXA, NSIA..."
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    N° Police
                  </label>
                  <input
                    type="text"
                    value={form.insurancePolicyNum}
                    onChange={(e) => setForm({ ...form, insurancePolicyNum: e.target.value })}
                    placeholder="AT/2024/..."
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={form.insuranceStartDate}
                    onChange={(e) => setForm({ ...form, insuranceStartDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date de fin (expiration)
                  </label>
                  <input
                    type="date"
                    value={form.insuranceEndDate}
                    onChange={(e) => setForm({ ...form, insuranceEndDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              Vos informations
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom complet <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="Amadou Diallo"
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Téléphone <span className="text-orange-400">*</span>
                </label>
                <input
                  type="tel"
                  value={form.ownerPhone}
                  onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                  placeholder="+221 77 123 45 67"
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email <span className="text-slate-500">(optionnel)</span>
                </label>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  placeholder="amadou@email.com"
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
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
        <div className="mt-6 bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-white mb-2">Comment ça marche ?</p>
              <ul className="text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  Remplissez les informations de votre véhicule
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  Votre passeport numérique sera créé instantanément
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  Les garages certifiés pourront y ajouter vos interventions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  Historique infalsifiable consultable à tout moment
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
