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
  History,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Calendar,
  Wrench,
  Gauge,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Types for anterior history
interface AnteriorHistoryEntry {
  id: string;
  photos: File[];
  photoUrls: string[];
  interventionDate: string;
  interventionType: string;
  mileage: string;
  notes: string;
  garageOrigin: string;
}

const INTERVENTION_TYPES = [
  { value: 'vidange', label: 'Vidange' },
  { value: 'freins', label: 'Freins' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'pneus', label: 'Pneus' },
  { value: 'batterie', label: 'Batterie' },
  { value: 'amortisseurs', label: 'Amortisseurs' },
  { value: 'embrayage', label: 'Embrayage' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'controle_technique', label: 'Contrôle Technique' },
  { value: 'autre', label: 'Autre' },
];

function GarageActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [loading, setLoading] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [error, setError] = useState('');
  const [codeInfo, setCodeInfo] = useState<any>(null);
  const [showAnteriorHistory, setShowAnteriorHistory] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

  const [anteriorHistory, setAnteriorHistory] = useState<AnteriorHistoryEntry[]>([]);

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

  // Add a new anterior history entry
  const addAnteriorHistoryEntry = () => {
    const newEntry: AnteriorHistoryEntry = {
      id: `history-${Date.now()}`,
      photos: [],
      photoUrls: [],
      interventionDate: '',
      interventionType: '',
      mileage: '',
      notes: '',
      garageOrigin: '',
    };
    setAnteriorHistory([...anteriorHistory, newEntry]);
  };

  // Remove an anterior history entry
  const removeAnteriorHistoryEntry = (id: string) => {
    setAnteriorHistory(anteriorHistory.filter(entry => entry.id !== id));
  };

  // Update an anterior history entry
  const updateAnteriorHistoryEntry = (id: string, field: keyof AnteriorHistoryEntry, value: any) => {
    setAnteriorHistory(anteriorHistory.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Handle photo upload for an entry
  const handlePhotoUpload = async (entryId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const entry = anteriorHistory.find(e => e.id === entryId);
    if (!entry) return;

    // Limit to 5 photos per entry
    const remainingSlots = 5 - entry.photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      alert('Maximum 5 photos par intervention');
      return;
    }

    // Create preview URLs
    const newUrls = filesToAdd.map(file => URL.createObjectURL(file));

    setAnteriorHistory(anteriorHistory.map(e => 
      e.id === entryId 
        ? { 
            ...e, 
            photos: [...e.photos, ...filesToAdd],
            photoUrls: [...e.photoUrls, ...newUrls]
          } 
        : e
    ));
  };

  // Remove a photo from an entry
  const removePhoto = (entryId: string, photoIndex: number) => {
    setAnteriorHistory(anteriorHistory.map(e => {
      if (e.id !== entryId) return e;
      
      const newPhotos = e.photos.filter((_, i) => i !== photoIndex);
      const newUrls = e.photoUrls.filter((_, i) => i !== photoIndex);
      
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(e.photoUrls[photoIndex]);
      
      return { ...e, photos: newPhotos, photoUrls: newUrls };
    }));
  };

  // Upload photos to server and return URLs
  const uploadPhotosToServer = async (photos: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const formData = new FormData();
      formData.append('file', photo);
      formData.append('type', 'paper-document');
      
      try {
        const res = await fetch('/api/upload/garage-documents', {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            uploadedUrls.push(data.url);
          }
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    
    return uploadedUrls;
  };

  // Create anterior history records after activation
  const createAnteriorHistoryRecords = async (vehicleId: string) => {
    for (const entry of anteriorHistory) {
      // Upload photos if any
      let documentUrls: string[] = [];
      if (entry.photos.length > 0) {
        setUploadingPhotos(true);
        documentUrls = await uploadPhotosToServer(entry.photos);
        setUploadingPhotos(false);
      }

      // Create the maintenance record
      await fetch('/api/maintenance-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          category: entry.interventionType || 'autre',
          description: entry.notes || `Historique antérieur - ${INTERVENTION_TYPES.find(t => t.value === entry.interventionType)?.label || 'Intervention'}`,
          mileage: entry.mileage ? parseInt(entry.mileage) : null,
          interventionDate: entry.interventionDate || new Date().toISOString(),
          source: 'PRE_OKAR_PAPER',
          paperDocumentUrl: documentUrls.join(','),
          isVerified: false,
        }),
      });
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
        // Create anterior history records if any
        if (anteriorHistory.length > 0) {
          await createAnteriorHistoryRecords(data.vehicle.id);
        }

        // Store ticket data in localStorage for the success page
        const ticketData = {
          id: `ticket-${Date.now()}`,
          driverName: data.owner.name,
          driverPhone: data.owner.phone || '',
          vehicleInfo: `${data.vehicle.make} ${data.vehicle.model}`,
          vehicleMake: data.vehicle.make,
          vehicleModel: data.vehicle.model,
          licensePlate: data.vehicle.licensePlate,
          qrReference: data.qrCode.shortCode,
          tempPassword: data.owner.tempPassword,
          loginUrl: 'https://okar.sn/driver/connexion',
          generatedAt: new Date().toISOString(),
          anteriorHistoryCount: anteriorHistory.length,
        };
        localStorage.setItem('activationTicket', JSON.stringify(ticketData));
        
        // Redirect to activation success page
        router.push('/garage/activation-success');
      } else {
        setError(data.error || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      setError('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

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
          {/* QR Code Section */}
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

          {/* Vehicle Info Section */}
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

          {/* Owner Section */}
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

          {/* Anterior History Section (Optional) */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAnteriorHistory(!showAnteriorHistory)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <History className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Historique Antérieur (Optionnel)</p>
                  <p className="text-sm text-gray-500">
                    {anteriorHistory.length > 0 
                      ? `${anteriorHistory.length} intervention(s) ajoutée(s)` 
                      : 'Ajouter les interventions passées du véhicule'}
                  </p>
                </div>
              </div>
              {showAnteriorHistory ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showAnteriorHistory && (
              <div className="border-t border-gray-100 p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                  <p className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Ces interventions ont été déclarées par le propriétaire et n'ont pas été certifiées 
                      numériquement par un garage OKAR. Elles apparaitront avec un badge "Historique papier vérifié visuellement".
                    </span>
                  </p>
                </div>

                {/* List of anterior history entries */}
                {anteriorHistory.map((entry, index) => (
                  <div key={entry.id} className="border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Intervention {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeAnteriorHistoryEntry(entry.id)}
                        className="p-1 hover:bg-red-100 rounded-lg text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Intervention Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type d'intervention
                        </label>
                        <select
                          value={entry.interventionType}
                          onChange={(e) => updateAnteriorHistoryEntry(entry.id, 'interventionType', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Sélectionner...</option>
                          {INTERVENTION_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date approximative
                        </label>
                        <input
                          type="date"
                          value={entry.interventionDate}
                          onChange={(e) => updateAnteriorHistoryEntry(entry.id, 'interventionDate', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Mileage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kilométrage approximatif
                        </label>
                        <input
                          type="number"
                          value={entry.mileage}
                          onChange={(e) => updateAnteriorHistoryEntry(entry.id, 'mileage', e.target.value)}
                          placeholder="45000"
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Garage Origin */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Garage d'origine
                        </label>
                        <input
                          type="text"
                          value={entry.garageOrigin}
                          onChange={(e) => updateAnteriorHistoryEntry(entry.id, 'garageOrigin', e.target.value)}
                          placeholder="Nom du garage"
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Notes */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes / Détails
                        </label>
                        <textarea
                          value={entry.notes}
                          onChange={(e) => updateAnteriorHistoryEntry(entry.id, 'notes', e.target.value)}
                          placeholder="Détails supplémentaires sur l'intervention..."
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Photo Upload */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Photos (carnet papier, factures) - Max 5
                        </label>
                        
                        {/* Photo previews */}
                        {entry.photoUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {entry.photoUrls.map((url, i) => (
                              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(entry.id, i)}
                                  className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl-lg"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${
                          entry.photos.length >= 5 ? 'border-gray-200 opacity-50 cursor-not-allowed' : 'border-gray-300'
                        }`}>
                          {entry.photos.length >= 5 ? (
                            <span className="text-sm text-gray-400">Maximum atteint</span>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-gray-400 mb-1" />
                              <span className="text-sm text-gray-500">
                                {entry.photos.length === 0 ? 'Ajouter des photos' : `Ajouter (${5 - entry.photos.length} restantes)`}
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={entry.photos.length >= 5}
                            onChange={(e) => handlePhotoUpload(entry.id, e.target.files)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add button */}
                <button
                  type="button"
                  onClick={addAnteriorHistoryEntry}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une intervention antérieure
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingPhotos || !codeInfo?.canActivate}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading || uploadingPhotos ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadingPhotos ? 'Upload des photos...' : 'Activation en cours...'}
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Activer le QR Code
                {anteriorHistory.length > 0 && ` (${anteriorHistory.length} historique(s))`}
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
