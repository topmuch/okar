'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Upload,
  CheckCircle,
  Loader2,
  Building2,
  Phone,
  FileText,
  Camera,
  User,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface GarageData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  managerName: string | null;
  managerPhone: string | null;
  businessRegistryNumber: string | null;
  agreementDocumentUrl: string | null;
  shopPhoto: string | null;
  idDocumentUrl: string | null;
  rejectionReason: string | null;
  validationStatus: string;
}

function CorrectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [garageData, setGarageData] = useState<GarageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    garageName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    managerName: '',
    managerPhone: '',
    businessRegistryNumber: '',
    agreementDocument: null as File | null,
    shopPhoto: null as File | null,
    idDocument: null as File | null,
    additionalNotes: '',
  });

  useEffect(() => {
    if (phoneParam) {
      fetchGarageByPhone(phoneParam);
    } else {
      setLoading(false);
    }
  }, [phoneParam]);

  const fetchGarageByPhone = async (phone: string) => {
    try {
      const res = await fetch(`/api/garage/check-status?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (res.ok && data.garage) {
        setGarageData(data.garage);
        setFormData({
          garageName: data.garage.name || '',
          email: data.garage.email || '',
          phone: data.garage.phone || '',
          whatsappNumber: data.garage.whatsappNumber || '',
          address: data.garage.address || '',
          managerName: data.garage.managerName || '',
          managerPhone: data.garage.managerPhone || '',
          businessRegistryNumber: data.garage.businessRegistryNumber || '',
          agreementDocument: null,
          shopPhoto: null,
          idDocument: null,
          additionalNotes: '',
        });
      } else {
        setError(data.error || 'Garage non trouvé');
      }
    } catch (err) {
      console.error('Error fetching garage:', err);
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!garageData) return;

    // Vérifier qu'au moins un document est mis à jour ou des informations sont modifiées
    if (!formData.agreementDocument && !formData.shopPhoto && !formData.idDocument && !formData.additionalNotes) {
      toast.error('Veuillez mettre à jour au moins un document ou ajouter des notes');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let uploadedFiles = {
        agreementDocumentUrl: garageData.agreementDocumentUrl,
        shopPhoto: garageData.shopPhoto,
        idDocumentUrl: garageData.idDocumentUrl,
      };

      // Upload nouveaux fichiers si présents
      if (formData.agreementDocument || formData.shopPhoto || formData.idDocument) {
        const uploadFormData = new FormData();
        if (formData.agreementDocument) {
          uploadFormData.append('agreementDocument', formData.agreementDocument);
        }
        if (formData.shopPhoto) {
          uploadFormData.append('shopPhoto', formData.shopPhoto);
        }
        if (formData.idDocument) {
          uploadFormData.append('idDocument', formData.idDocument);
        }

        const uploadRes = await fetch('/api/upload/garage-documents', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Erreur lors de l\'upload des documents');
        }

        if (formData.agreementDocument) uploadedFiles.agreementDocumentUrl = uploadData.agreementDocumentUrl;
        if (formData.shopPhoto) uploadedFiles.shopPhoto = uploadData.shopPhotoUrl;
        if (formData.idDocument) uploadedFiles.idDocumentUrl = uploadData.idDocumentUrl;
      }

      // Soumettre la correction
      const response = await fetch('/api/garage/resubmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garageId: garageData.id,
          ...uploadedFiles,
          additionalNotes: formData.additionalNotes,
          updatedInfo: {
            name: formData.garageName,
            email: formData.email || null,
            phone: formData.phone,
            whatsappNumber: formData.whatsappNumber,
            address: formData.address,
            managerName: formData.managerName,
            managerPhone: formData.managerPhone,
            businessRegistryNumber: formData.businessRegistryNumber,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      toast.success('Votre demande a été mise à jour avec succès !');
      router.push('/garage/correction/success');

    } catch (err: any) {
      console.error('Error submitting correction:', err);
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  // Page de recherche par téléphone
  if (!loading && !garageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Corriger ma demande
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Entrez votre numéro de téléphone pour retrouver votre demande
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (formData.phone) {
                fetchGarageByPhone(formData.phone);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+221 78 123 45 67"
                  className="pl-12"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              Rechercher ma demande
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/register/garage"
              className="text-sm text-orange-500 hover:underline"
            >
              Faire une nouvelle demande d'inscription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Formulaire de correction
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-3xl font-bold text-white">OKAR</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Corriger votre demande
          </h1>
          <p className="text-white/80">
            Mettez à jour vos informations et documents
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Alerte de rejet */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-red-400 mb-2">
                Votre demande a été rejetée
              </h2>
              <p className="text-red-300 mb-3">
                <strong>Motif:</strong> {garageData?.rejectionReason || 'Non spécifié'}
              </p>
              <p className="text-sm text-red-300/80">
                Veuillez corriger les éléments mentionnés et resoumettre votre demande. Notre équipe réexaminera votre dossier.
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Informations actuelles
          </h2>

          {/* Infos actuelles en lecture seule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-900 rounded-xl">
              <label className="block text-xs text-slate-500 mb-1">Nom du garage</label>
              <p className="text-white font-medium">{garageData?.name}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl">
              <label className="block text-xs text-slate-500 mb-1">Téléphone</label>
              <p className="text-white font-medium">{garageData?.phone}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl">
              <label className="block text-xs text-slate-500 mb-1">WhatsApp</label>
              <p className="text-white font-medium">{garageData?.whatsappNumber}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl">
              <label className="block text-xs text-slate-500 mb-1">Gérant</label>
              <p className="text-white font-medium">{garageData?.managerName}</p>
            </div>
          </div>

          {/* Documents actuels */}
          <h3 className="text-lg font-semibold text-white mb-4">
            Documents actuels
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Photo façade */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Photo Façade</p>
              {garageData?.shopPhoto ? (
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                  <img
                    src={garageData.shopPhoto}
                    alt="Photo façade"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-slate-600" />
                </div>
              )}
            </div>

            {/* Agrément */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Photo Agrément</p>
              {garageData?.agreementDocumentUrl ? (
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                  <img
                    src={garageData.agreementDocumentUrl}
                    alt="Photo agrément"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-slate-600" />
                </div>
              )}
            </div>

            {/* Pièce d'identité */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Pièce d'identité</p>
              {garageData?.idDocumentUrl ? (
                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                  <img
                    src={garageData.idDocumentUrl}
                    alt="Pièce d'identité"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-slate-600" />
                </div>
              )}
            </div>
          </div>

          {/* Section de mise à jour */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-500" />
              Mettre à jour vos documents
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Téléchargez les documents corrigés. Seuls les fichiers que vous téléchargez seront remplacés.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Nouveau document agrément */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nouvelle photo agrément
                </label>
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
                      <FileText className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-sm text-slate-400 text-center">
                        Remplacer
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Nouvelle photo façade */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nouvelle photo façade
                </label>
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
                        Remplacer
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Nouvelle pièce d'identité */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nouvelle pièce d'identité
                </label>
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
                        Remplacer
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Notes additionnelles */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes ou explications (optionnel)
              </label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Expliquez les corrections apportées..."
                rows={4}
                className="bg-slate-900 border-slate-600"
              />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 py-4 border border-slate-600 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                Annuler
              </Link>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Soumission...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Resoumettre ma demande
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GarageCorrectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    }>
      <CorrectionContent />
    </Suspense>
  );
}
