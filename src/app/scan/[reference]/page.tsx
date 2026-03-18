'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Car,
  MapPin,
  AlertCircle,
  Clock,
  Shield,
  CheckCircle,
  Wrench,
  History,
  QrCode,
  Calendar,
  Gauge,
  FileText,
  AlertTriangle,
  Globe,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";

interface VehicleData {
  status: string;
  message?: string;
  vehicle?: {
    reference: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    qrStatus: string;
    ownerName: string;
    ownerPhone: string;
    garageName: string;
    mileage: number;
    activatedAt: string;
  };
  maintenanceRecords?: MaintenanceRecord[];
}

interface MaintenanceRecord {
  id: string;
  category: string;
  description: string;
  mileage: number;
  totalCost: number;
  garageName: string;
  interventionDate: string;
  ownerValidation: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vidange: 'Vidange',
  freins: 'Freins',
  pneus: 'Pneus',
  moteur: 'Moteur',
  electricite: 'Électricité',
  carrosserie: 'Carrosserie',
  autre: 'Autre',
};

export default function VehicleScanPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.reference as string;

  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(`/api/scan/${reference}`);
        const data = await response.json();
        setVehicleData(data);
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        setVehicleData({ status: 'error', message: 'Erreur serveur' });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [reference]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-500 to-amber-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4" />
          <p>Chargement du passeport véhicule...</p>
        </div>
      </main>
    );
  }

  // Error states
  if (vehicleData?.status === 'not_found') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Code QR non valide</h1>
          <p className="text-slate-500 mb-6">Ce code QR n'est pas reconnu dans le système AutoPass.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium"
          >
            Retour à l'accueil
          </button>
        </div>
      </main>
    );
  }

  if (vehicleData?.status === 'inactive') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-500 to-amber-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">QR Code non activé</h1>
          <p className="text-slate-500 mb-6">Ce passeport véhicule n'a pas encore été activé par un garage partenaire.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium"
          >
            Retour à l'accueil
          </button>
        </div>
      </main>
    );
  }

  const vehicle = vehicleData?.vehicle;
  const records = vehicleData?.maintenanceRecords || [];

  // Only show validated records to public
  const publicRecords = records.filter(r => r.ownerValidation === 'VALIDATED');

  // Main render
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-500 to-amber-600">
      <div className="max-w-lg mx-auto p-4 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
          {/* Title */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Passeport Véhicule</h1>
                  <p className="text-white/70 text-sm">AutoPass Numérique</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 rounded-full">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300">Certifié</span>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          {vehicle && (
            <div className="p-6">
              {/* Vehicle Identity */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {vehicle.make} {vehicle.model}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {vehicle.year && (
                      <span className="text-slate-500">{vehicle.year}</span>
                    )}
                    {vehicle.color && (
                      <span className="text-slate-500">{vehicle.color}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-orange-500">
                    {vehicle.licensePlate}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{reference}</p>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Gauge className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '—'}
                  </p>
                  <p className="text-xs text-slate-500">Kilométrage</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Calendar className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">
                    {vehicle.activatedAt ? formatDate(vehicle.activatedAt).split(' ')[0] : '—'}
                  </p>
                  <p className="text-xs text-slate-500">Activé le</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Wrench className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{publicRecords.length}</p>
                  <p className="text-xs text-slate-500">Interventions</p>
                </div>
              </div>

              {/* Owner Info */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                <p className="text-xs text-slate-500 mb-1">Propriétaire</p>
                <p className="font-semibold text-slate-800">{vehicle.ownerName || 'Non renseigné'}</p>
                {vehicle.garageName && (
                  <p className="text-sm text-slate-500 mt-1">
                    Garage: <span className="text-orange-600">{vehicle.garageName}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Maintenance History */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <History className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800">Historique des interventions</p>
                <p className="text-sm text-slate-500">{publicRecords.length} intervention(s) validée(s)</p>
              </div>
            </div>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showHistory && (
            <div className="border-t border-slate-100">
              {publicRecords.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Aucune intervention enregistrée</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {publicRecords.map((record, index) => (
                    <div key={record.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium mb-2">
                            {CATEGORY_LABELS[record.category] || record.category}
                          </span>
                          <p className="text-slate-800 font-medium">{record.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Gauge className="w-4 h-4" />
                              {record.mileage?.toLocaleString()} km
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(record.interventionDate)}
                            </span>
                          </div>
                          {record.garageName && (
                            <p className="text-sm text-orange-600 mt-1">
                              {record.garageName}
                            </p>
                          )}
                        </div>
                        {record.totalCost > 0 && (
                          <div className="text-right">
                            <p className="font-semibold text-slate-800">
                              {formatPrice(record.totalCost)}
                            </p>
                            <p className="text-xs text-slate-400">Coût total</p>
                          </div>
                        )}
                      </div>
                      {index === 0 && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Dernière intervention</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-white/70 text-sm">
          <Shield className="w-4 h-4 inline mr-1" />
          Historique infalsifiable certifié par AutoPass
          <br />
          © {new Date().getFullYear()} AutoPass Sénégal
        </div>
      </div>
    </main>
  );
}
