'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Clock,
  MessageCircle,
  AlertTriangle,
  Navigation
} from 'lucide-react';
import GeolocationButton from '@/components/map/GeolocationButton';

export default function GarageRegistrationPage() {
  return <GarageRegistrationContent />;
}

function GarageRegistrationContent() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Infos garage
    garageName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    city: '',
    // Géolocalisation
    latitude: null as number | null,
    longitude: null as number | null,
    // Infos gérant
    managerName: '',
    managerPhone: '',
    // Documents
    businessRegistryNumber: '',
    agreementDocument: null as File | null,
    shopPhoto: null as File | null,
    idDocument: null as File | null,
    // Consentement
    acceptTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.garageName.trim()) {
      setError('Le nom du garage est obligatoire');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Le numéro de téléphone est obligatoire');
      return false;
    }
    if (!formData.whatsappNumber.trim()) {
      setError('Le numéro WhatsApp est obligatoire');
      return false;
    }
    if (!formData.address.trim()) {
      setError('L\'adresse est obligatoire');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.managerName.trim()) {
      setError('Le nom du gérant est obligatoire');
      return false;
    }
    if (!formData.managerPhone.trim()) {
      setError('Le téléphone du gérant est obligatoire');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (!formData.businessRegistryNumber.trim()) {
      setError('Le numéro d\'agrément/registre de commerce est obligatoire');
      return false;
    }
    if (!formData.agreementDocument) {
      setError('La photo de l\'agrément est obligatoire');
      return false;
    }
    if (!formData.shopPhoto) {
      setError('La photo de la façade est obligatoire');
      return false;
    }
    if (!formData.idDocument) {
      setError('La pièce d\'identité du gérant est obligatoire');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions pour continuer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload des fichiers d'abord
      const uploadFormData = new FormData();
      uploadFormData.append('agreementDocument', formData.agreementDocument!);
      uploadFormData.append('shopPhoto', formData.shopPhoto!);
      uploadFormData.append('idDocument', formData.idDocument!);

      const uploadRes = await fetch('/api/upload/garage-documents', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Erreur lors de l\'upload des documents');
      }

      // Création du garage
      const response = await fetch('/api/register/garage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.garageName,
          email: formData.email || null,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          address: `${formData.address}, ${formData.city}`,
          city: formData.city,
          managerName: formData.managerName,
          managerPhone: formData.managerPhone,
          businessRegistryNumber: formData.businessRegistryNumber,
          agreementDocumentUrl: uploadData.agreementDocumentUrl,
          shopPhoto: uploadData.shopPhotoUrl,
          idDocumentUrl: uploadData.idDocumentUrl,
          latitude: formData.latitude,
          longitude: formData.longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  // Page de succès
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
            Demande envoyée avec succès !
          </h1>

          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Votre demande d'inscription a été envoyée. Notre équipe va l'examiner dans les plus brefs délais.
          </p>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  Délai de traitement
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Vous recevrez vos identifiants de connexion par SMS/WhatsApp sous 24-48h ouvrées.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-blue-800 dark:text-blue-300">
                  Contact WhatsApp
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Pour toute question, contactez-nous au : <strong>+221 78 123 45 67</strong>
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
          >
            Retour à l'accueil
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-3xl font-bold text-white">OKAR</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Devenir Garage Certifié OKAR
          </h1>
          <p className="text-white/80">
            Rejoignez le réseau de garages de confiance au Sénégal
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-slate-800 py-4 border-b border-slate-700">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {[
              { num: 1, label: 'Garage' },
              { num: 2, label: 'Gérant' },
              { num: 3, label: 'Documents' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  step >= s.num
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {s.num}
                  </span>
                  <span className="hidden md:inline text-sm font-medium">{s.label}</span>
                </div>
                {i < 2 && (
                  <div className={`w-8 md:w-16 h-1 mx-1 rounded ${
                    step > s.num ? 'bg-orange-500' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Warning Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-300">
                Inscription sécurisée
              </p>
              <p className="text-sm text-amber-200/80">
                Votre inscription sera examinée par notre équipe. Vous recevrez vos accès par SMS/WhatsApp une fois validé.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Step 1: Garage Info */}
        {step === 1 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Informations du Garage
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom du Garage / Raison Sociale *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.garageName}
                    onChange={(e) => handleInputChange('garageName', e.target.value)}
                    placeholder="Ex: Garage Auto Plus"
                    className="w-full p-4 pl-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+221 33 123 45 67"
                      className="w-full p-4 pl-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    WhatsApp (obligatoire) *
                  </label>
                  <div className="relative">
                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                      placeholder="+221 78 123 45 67"
                      className="w-full p-4 pl-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email (optionnel)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@garage-auto.sn"
                    className="w-full p-4 pl-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Adresse complète *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Quartier, Rue, N°..."
                    rows={2}
                    className="w-full p-4 pl-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ville *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full p-4 bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Sélectionner une ville</option>
                  <option value="Dakar">Dakar</option>
                  <option value="Thiès">Thiès</option>
                  <option value="Saint-Louis">Saint-Louis</option>
                  <option value="Kaolack">Kaolack</option>
                  <option value="Ziguinchor">Ziguinchor</option>
                  <option value="Touba">Touba</option>
                  <option value="Rufisque">Rufisque</option>
                  <option value="Mbour">Mbour</option>
                  <option value="Diourbel">Diourbel</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {/* Géolocalisation */}
              <div className="p-4 bg-slate-900/50 border border-slate-600 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <Navigation className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">
                      Localisation GPS (optionnel)
                    </p>
                    <p className="text-sm text-slate-400">
                      Capturez votre position pour apparaître sur la carte OKAR
                    </p>
                  </div>
                </div>

                <GeolocationButton
                  onLocationCaptured={(lat, lng) => {
                    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-500 text-slate-300 hover:bg-slate-700"
                />

                {formData.latitude && formData.longitude && (
                  <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Coordonnées: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleNextStep}
              className="w-full mt-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              Continuer
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Manager Info */}
        {step === 2 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Informations du Gérant
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom complet du gérant *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => handleInputChange('managerName', e.target.value)}
                    placeholder="Ex: Amadou Diallo"
                    className="w-full p-4 pl-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Téléphone personnel du gérant *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => handleInputChange('managerPhone', e.target.value)}
                    placeholder="+221 78 123 45 67"
                    className="w-full p-4 pl-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Ce numéro sera utilisé pour les notifications importantes
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border border-slate-600 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Documents Justificatifs
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Tous les documents sont obligatoires
              </p>
            </div>

            <div className="space-y-6">
              {/* Business Registry Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Numéro d'agrément / Registre de commerce *
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.businessRegistryNumber}
                    onChange={(e) => handleInputChange('businessRegistryNumber', e.target.value)}
                    placeholder="Ex: SN-DKR-2024-12345"
                    className="w-full p-4 pl-12 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Agreement Document */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Photo de l'agrément *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('agreementDocument', e.target.files?.[0] || null)}
                      className="hidden"
                      id="agreementDocument"
                    />
                    <label
                      htmlFor="agreementDocument"
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        formData.agreementDocument
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600 hover:border-orange-500 bg-slate-900'
                      }`}
                    >
                      {formData.agreementDocument ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                          <span className="text-sm text-emerald-400 text-center">
                            {formData.agreementDocument.name.substring(0, 20)}...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-500 mb-2" />
                          <span className="text-sm text-slate-400 text-center">
                            Cliquez pour télécharger
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Shop Photo */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Photo façade garage *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('shopPhoto', e.target.files?.[0] || null)}
                      className="hidden"
                      id="shopPhoto"
                    />
                    <label
                      htmlFor="shopPhoto"
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        formData.shopPhoto
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600 hover:border-orange-500 bg-slate-900'
                      }`}
                    >
                      {formData.shopPhoto ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                          <span className="text-sm text-emerald-400 text-center">
                            {formData.shopPhoto.name.substring(0, 20)}...
                          </span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-slate-500 mb-2" />
                          <span className="text-sm text-slate-400 text-center">
                            Cliquez pour télécharger
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* ID Document */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Pièce d'identité gérant *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                      className="hidden"
                      id="idDocument"
                    />
                    <label
                      htmlFor="idDocument"
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        formData.idDocument
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600 hover:border-orange-500 bg-slate-900'
                      }`}
                    >
                      {formData.idDocument ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                          <span className="text-sm text-emerald-400 text-center">
                            {formData.idDocument.name.substring(0, 20)}...
                          </span>
                        </>
                      ) : (
                        <>
                          <User className="w-8 h-8 text-slate-500 mb-2" />
                          <span className="text-sm text-slate-400 text-center">
                            Cliquez pour télécharger
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Terms Acceptance */}
              <div className="p-4 bg-slate-900 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500 mt-0.5"
                  />
                  <div className="text-sm text-slate-300">
                    <span className="font-medium">
                      J'accepte les conditions d'utilisation et la politique de confidentialité
                    </span>
                    <p className="text-slate-500 mt-1">
                      En cochant cette case, je certifie que les informations fournies sont exactes et que je suis autorisé à représenter ce garage.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 border border-slate-600 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Soumettre la demande
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>
            Déjà inscrit ?{' '}
            <Link href="/garage/connexion" className="text-orange-500 hover:underline">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
