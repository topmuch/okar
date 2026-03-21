'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  QrCode,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  Download,
  Share2,
  Eye,
  Wrench,
  Gauge,
  Calendar,
  Shield,
  Sparkles
} from 'lucide-react';
import { useDriver } from '../layout';

interface Vehicle {
  id: string;
  reference: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  mileage: number;
  qrStatus: string;
  ownerName: string;
  garageName: string;
  activatedAt: string;
}

interface PendingValidation {
  id: string;
  category: string;
  description: string;
  mileage: number;
  totalCost: number;
  garageName: string;
  createdAt: string;
}

interface ValidatedRecord {
  id: string;
  category: string;
  description: string;
  mileage: number;
  totalCost: number;
  garageName: string;
  interventionDate: string;
}

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  vidange: 'Vidange',
  freins: 'Freins',
  pneus: 'Pneus',
  moteur: 'Moteur',
  electricite: 'Électricité',
  carrosserie: 'Carrosserie',
  autre: 'Autre',
};

// Time ago helper
function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return past.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// Format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-SN', {
    maximumFractionDigits: 0
  }).format(price) + ' FCFA';
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color,
  onClick
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

export default function DriverDashboardPage() {
  const { driverId, driverName, vehicle: contextVehicle } = useDriver();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [pendingValidations, setPendingValidations] = useState<PendingValidation[]>([]);
  const [validatedRecords, setValidatedRecords] = useState<ValidatedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch vehicle
      const vehicleRes = await fetch('/api/driver/vehicles');
      const vehicleData = await vehicleRes.json();
      if (vehicleData.vehicles && vehicleData.vehicles.length > 0) {
        setVehicle(vehicleData.vehicles[0]);
      }

      // Fetch pending validations
      const pendingRes = await fetch('/api/driver/validations?status=PENDING');
      const pendingData = await pendingRes.json();
      setPendingValidations(pendingData.records || []);

      // Fetch validated records
      const validatedRes = await fetch('/api/driver/validations?status=VALIDATED');
      const validatedData = await validatedRes.json();
      setValidatedRecords(validatedData.records || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const pendingCount = pendingValidations.length;
  const validatedCount = validatedRecords.length;
  const totalSpent = validatedRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // No vehicle state
  if (!vehicle) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Car className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Aucun véhicule enregistré
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Rendez-vous chez un garage partenaire AutoPass pour créer votre passeport véhicule.
        </p>
        <Link
          href="/garages"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
        >
          <Wrench className="w-5 h-5" />
          Trouver un garage partenaire
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          {getGreeting()}, <span className="text-orange-500">{driverName?.split(' ')[0] || 'Conducteur'}</span> 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Bienvenue sur votre passeport numérique véhicule
        </p>
      </div>

      {/* Vehicle Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 shadow-sm">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{vehicle.make} {vehicle.model}</h2>
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <span>{vehicle.year}</span>
                  {vehicle.color && <span>• {vehicle.color}</span>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-orange-400">
                {vehicle.licensePlate}
              </p>
              <p className="text-xs text-white/50 font-mono">{vehicle.reference}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* QR Code Section */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            <div className="w-32 h-32 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-inner">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-slate-800 mx-auto" />
                <p className="text-xs font-mono mt-1 text-slate-500">{vehicle.reference}</p>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
                Votre passeport véhicule
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Partagez ce QR code avec un acheteur potentiel pour lui montrer l'historique certifié.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Voir en grand
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
              <Gauge className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {vehicle.mileage?.toLocaleString() || '—'} km
              </p>
              <p className="text-xs text-slate-500">Kilométrage</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
              <Shield className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {vehicle.qrStatus === 'ACTIVE' ? 'Actif' : 'Inactif'}
              </p>
              <p className="text-xs text-slate-500">Statut QR</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
              <CheckCircle className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-800 dark:text-white">{validatedCount}</p>
              <p className="text-xs text-slate-500">Interventions</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
              <Calendar className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {vehicle.activatedAt ? new Date(vehicle.activatedAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—'}
              </p>
              <p className="text-xs text-slate-500">Activé le</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Interventions"
          value={validatedCount}
          subtitle="Validées au total"
          icon={<FileText className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-purple-500 to-violet-600"
        />
        <KPICard
          title="En attente"
          value={pendingCount}
          subtitle="À valider"
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-orange-500 to-amber-600"
        />
        <KPICard
          title="Total dépensé"
          value={formatPrice(totalSpent)}
          subtitle="Sur ce véhicule"
          icon={<Sparkles className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-emerald-500 to-green-600"
        />
        <KPICard
          title="Alertes"
          value={0}
          subtitle="Aucune alerte"
          icon={<AlertCircle className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
      </div>

      {/* Pending Validations */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            En attente de validation
          </h2>
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
              {pendingCount} en attente
            </span>
          )}
        </div>

        <div className="p-6">
          {pendingCount === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Tout est à jour !
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Aucune intervention en attente de validation.
              </p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm">
                Actualiser
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingValidations.slice(0, 3).map((validation) => (
                <div
                  key={validation.id}
                  className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">
                        {CATEGORY_LABELS[validation.category] || validation.category}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {validation.garageName} • {validation.mileage?.toLocaleString()} km
                      </p>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {formatPrice(validation.totalCost)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{timeAgo(validation.createdAt)}</span>
                    <Link
                      href={`/driver/validation/${validation.id}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Valider
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}

              {pendingCount > 3 && (
                <Link
                  href="/driver/validation"
                  className="block text-center py-3 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Voir les {pendingCount - 3} autres en attente →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validated History Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Historique validé
          </h2>
          <Link
            href="/driver/historique"
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Voir tout →
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {validatedRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Aucune intervention validée pour le moment.
            </div>
          ) : (
            validatedRecords.slice(0, 3).map((record) => (
              <div key={record.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-white">
                      {CATEGORY_LABELS[record.category] || record.category}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {new Date(record.interventionDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {' • '}{record.mileage?.toLocaleString()} km
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-800 dark:text-white">
                    {formatPrice(record.totalCost)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <Shield className="w-3 h-3" />
                    Certifié
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Mon QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <span className="text-slate-400 text-xl">×</span>
              </button>
            </div>
            <div className="w-48 h-48 bg-white border-2 border-slate-200 rounded-xl mx-auto flex items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-800" />
            </div>
            <p className="mt-4 text-slate-800 dark:text-white font-semibold">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="text-sm text-slate-500">{vehicle.licensePlate}</p>
            <p className="text-xs text-slate-400 font-mono mt-1">{vehicle.reference}</p>
            <div className="flex gap-2 mt-6">
              <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium">
                Télécharger
              </button>
              <button className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium">
                Partager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
