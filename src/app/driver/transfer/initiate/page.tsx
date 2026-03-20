'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  Tag,
  Clock,
  Copy,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  QrCode
} from 'lucide-react';
import { useDriver } from '@/app/driver/layout';

interface Vehicle {
  id: string;
  reference: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  mileage: number;
  mainPhoto: string | null;
}

interface TransferInfo {
  id: string;
  code: string;
  vehicle: {
    id: string;
    reference: string;
    make: string;
    model: string;
    licensePlate: string;
  };
  expiresAt: string;
  expiresIn: string;
}

export default function InitiateTransferPage() {
  const router = useRouter();
  const { driverId } = useDriver();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Timer for expiration
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (transferInfo) {
      const interval = setInterval(() => {
        const expires = new Date(transferInfo.expiresAt).getTime();
        const now = Date.now();
        const diff = expires - now;

        if (diff <= 0) {
          setTimeRemaining('Expiré');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [transferInfo]);

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

  const handleInitiateTransfer = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/transfer/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicle.id })
      });

      const data = await response.json();

      if (data.success) {
        setTransferInfo(data.transfer);
      } else {
        setError(data.error || 'Erreur lors de la création du code');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (transferInfo?.code) {
      await navigator.clipboard.writeText(transferInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewTransfer = () => {
    setSelectedVehicle(null);
    setTransferInfo(null);
    setError(null);
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
          onClick={() => router.push('/driver/transfert')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Tag className="w-7 h-7 text-orange-500" />
          Vendre mon véhicule
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Générez un code de transfert sécurisé pour le nouveau propriétaire.
        </p>
      </div>

      {/* Transfer Code Generated */}
      {transferInfo && (
        <div className="space-y-6">
          {/* Success Card */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Code de transfert généré</h2>
            </div>

            {/* Code Display */}
            <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-center mb-4">
              <p className="text-sm text-white/80 mb-2">Code à 6 chiffres</p>
              <p className="text-4xl font-mono font-bold tracking-widest">
                {transferInfo.code}
              </p>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyCode}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-orange-500 
                rounded-xl font-semibold hover:bg-orange-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Code copié !
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copier le code
                </>
              )}
            </button>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="font-medium text-slate-500 text-sm mb-3">Véhicule concerné</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Car className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-lg">
                  {transferInfo.vehicle.make} {transferInfo.vehicle.model}
                </p>
                <p className="text-slate-500">{transferInfo.vehicle.licensePlate}</p>
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Temps restant avant expiration
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                  {timeRemaining}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5">
            <h4 className="font-medium text-slate-800 dark:text-white mb-3">
              Instructions pour le transfert
            </h4>
            <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                <span>Communiquez le code <strong>{transferInfo.code}</strong> à l&apos;acheteur</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                <span>L&apos;acheteur saisit le code dans l&apos;application OKAR</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                <span>Vous recevez une notification pour confirmer le transfert</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                <span>Le passeport numérique est transféré au nouveau propriétaire</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleNewTransfer}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 
                dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Nouveau transfert
            </button>
            <button
              onClick={() => router.push('/driver/transfer/pending')}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl 
                font-semibold transition-colors"
            >
              Voir les transferts en attente
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Selection */}
      {!transferInfo && (
        <>
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Vehicles List */}
          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">Aucun véhicule enregistré</p>
              </div>
            ) : (
              vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                    rounded-2xl p-5 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                        {vehicle.mainPhoto ? (
                          <img 
                            src={vehicle.mainPhoto} 
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Car className="w-8 h-8 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-lg">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-slate-500">
                          {vehicle.licensePlate} • {vehicle.mileage?.toLocaleString()} km
                        </p>
                        {vehicle.year && (
                          <p className="text-sm text-slate-400">{vehicle.year}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleInitiateTransfer(vehicle)}
                      disabled={submitting && selectedVehicle?.id === vehicle.id}
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white 
                        rounded-xl font-semibold transition-colors disabled:opacity-50 
                        flex items-center gap-2"
                    >
                      {submitting && selectedVehicle?.id === vehicle.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          Vendre
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
