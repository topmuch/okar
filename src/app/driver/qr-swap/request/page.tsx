'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  QrCode,
  AlertTriangle,
  Car,
  CheckCircle,
  Loader2,
  Clock,
  Info,
  RefreshCw,
  XCircle,
  FileText
} from 'lucide-react';
import { useDriver } from '@/app/driver/layout';

interface Vehicle {
  id: string;
  reference: string;
  make: string;
  model: string;
  licensePlate: string;
  qrStatus: string;
  qrCodeId?: string;
}

interface SwapRequest {
  id: string;
  vehicle: {
    id: string;
    reference: string;
    make: string;
    model: string;
    licensePlate: string;
  };
  reason: string;
  status: string;
  createdAt: string;
}

const REASON_OPTIONS = [
  {
    id: 'ENDOMMAGE',
    label: 'QR Code endommagé',
    description: 'Le QR code est abîmé mais encore partiellement visible',
    icon: '🔧'
  },
  {
    id: 'PERDU',
    label: 'QR Code perdu',
    description: 'Le QR code a été perdu ou volé',
    icon: '🔍'
  },
  {
    id: 'ILLISIBLE',
    label: 'QR Code illisible',
    description: 'Le QR code ne peut plus être scanné',
    icon: '❌'
  }
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'En attente', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-500/10' },
  APPROVED: { label: 'Approuvé', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-500/10' },
  COMPLETED: { label: 'Complété', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-500/10' },
  REJECTED: { label: 'Refusé', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-500/10' }
};

export default function QRSwapRequestPage() {
  const router = useRouter();
  const { driverId } = useDriver();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [swapRequest, setSwapRequest] = useState<SwapRequest | null>(null);
  const [existingRequests, setExistingRequests] = useState<SwapRequest[]>([]);

  useEffect(() => {
    fetchVehicles();
    fetchExistingRequests();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/driver/vehicles');
      const data = await response.json();
      if (data.vehicles) {
        setVehicles(data.vehicles);
      }
    } catch (err) {
      setError('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRequests = async () => {
    // In a real app, this would fetch from an API
    // For demo, we'll use mock data
    const mockRequests: SwapRequest[] = [
      {
        id: 'sr1',
        vehicle: {
          id: 'v1',
          reference: 'OKAR-ABC123',
          make: 'Toyota',
          model: 'Corolla',
          licensePlate: 'AA-1234-BB'
        },
        reason: 'ENDOMMAGE',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    setExistingRequests(mockRequests);
  };

  const handleSubmitRequest = async () => {
    if (!selectedVehicle || !selectedReason) {
      setError('Veuillez sélectionner un véhicule et une raison');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/qr-swap/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          reason: selectedReason,
          description
        })
      });

      const data = await response.json();

      if (data.success) {
        setSwapRequest(data.swapRequest);
        setSuccess(true);
        fetchExistingRequests();
      } else {
        setError(data.error || 'Erreur lors de la demande');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedVehicle(null);
    setSelectedReason(null);
    setDescription('');
    setError(null);
    setSuccess(false);
    setSwapRequest(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/driver/tableau-de-bord')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <QrCode className="w-7 h-7 text-orange-500" />
          Remplacement QR Code
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Signalez un QR code défectueux et demandez un remplacement.
        </p>
      </div>

      {/* Success State */}
      {success && swapRequest ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Demande envoyée</h2>
            </div>
            <p className="text-white/80">
              Votre demande de remplacement a été enregistrée. Vous serez notifié dès qu&apos;un nouveau QR code sera disponible.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="font-medium text-slate-500 text-sm mb-3">Détails de la demande</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Véhicule</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {swapRequest.vehicle.make} {swapRequest.vehicle.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Raison</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {REASON_OPTIONS.find(r => r.id === swapRequest.reason)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[swapRequest.status]?.bgColor} ${STATUS_CONFIG[swapRequest.status]?.color}`}>
                  {STATUS_CONFIG[swapRequest.status]?.label}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
          >
            Faire une autre demande
          </button>
        </div>
      ) : (
        <>
          {/* Existing Requests */}
          {existingRequests.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Demandes en cours
              </h3>
              <div className="space-y-3">
                {existingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white text-sm">
                          {request.vehicle.make} {request.vehicle.model}
                        </p>
                        <p className="text-xs text-slate-500">{request.vehicle.licensePlate}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[request.status]?.bgColor} ${STATUS_CONFIG[request.status]?.color}`}>
                      {STATUS_CONFIG[request.status]?.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Avant de continuer
                </h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  Assurez-vous que le QR code est vraiment défectueux. Un nouveau QR code sera généré et l&apos;ancien sera désactivé.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Vehicle Selection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
              Sélectionnez le véhicule
            </h3>

            {vehicles.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Aucun véhicule enregistré</p>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                      selectedVehicle?.id === vehicle.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                        <Car className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-slate-500">{vehicle.licensePlate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400">{vehicle.qrStatus || 'N/A'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reason Selection */}
          {selectedVehicle && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
                Raison du remplacement
              </h3>

              <div className="space-y-3">
                {REASON_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedReason(option.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                      selectedReason === option.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {option.label}
                        </p>
                        <p className="text-sm text-slate-500">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Additional Description */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description additionnelle (optionnel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le problème rencontré..."
                  rows={3}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 
                    dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                />
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Comment ça marche ?
                </p>
                <ul className="text-sm text-blue-600 dark:text-blue-300 mt-2 space-y-1">
                  <li>• Votre demande sera examinée par l&apos;équipe OKAR</li>
                  <li>• Un nouveau QR code sera généré si la demande est approuvée</li>
                  <li>• Vous pourrez récupérer le nouveau QR code dans un garage partenaire</li>
                  <li>• L&apos;ancien QR code sera immédiatement désactivé</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitRequest}
            disabled={!selectedVehicle || !selectedReason || submitting}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl 
              font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Demander un remplacement
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
