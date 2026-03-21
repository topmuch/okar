'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Eye,
  Download,
  Share2,
  Gauge,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  ChevronRight,
  Wrench,
  Car,
  FileText,
  ExternalLink,
  Copy,
  MessageCircle,
  Mail
} from 'lucide-react';
import { useDriver } from '../layout';

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

const CATEGORY_COLORS: Record<string, string> = {
  vidange: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  freins: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  pneus: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  moteur: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  electricite: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  carrosserie: 'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  autre: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
};

export default function DriverHistoryPage() {
  const { vehicle, driverName } = useDriver();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/driver/validations?status=VALIDATED');
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      maximumFractionDigits: 0
    }).format(price) + ' FCFA';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalSpent = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const publicUrl = vehicle ? `autopass.sn/v/${vehicle.reference}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestMileage = records[0]?.mileage || vehicle?.mileage || 0;
  const nextOilChange = latestMileage + 7000; // Average oil change interval

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <History className="w-7 h-7 text-purple-500" />
            Mon Historique
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Historique certifié de votre véhicule
          </p>
        </div>
        <button
          onClick={() => setShowPublicPreview(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-xl font-medium hover:bg-purple-200 dark:hover:bg-purple-500/20 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Vue Acheteur
        </button>
      </div>

      {/* Vehicle Summary */}
      {vehicle && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {vehicle.make} {vehicle.model}
                </h2>
                <p className="text-white/60">{vehicle.licensePlate} • {vehicle.year}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{records.length}</p>
              <p className="text-white/60 text-sm">interventions</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Gauge className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {latestMileage.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">km actuels</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {records.length > 0 ? formatDate(records[0].interventionDate) : '—'}
              </p>
              <p className="text-sm text-slate-500">Dernière intervention</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {formatPrice(totalSpent)}
              </p>
              <p className="text-sm text-slate-500">Total dépensé</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Service Reminder */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Prochaine vidange estimée
              </h3>
              <p className="text-amber-600 dark:text-amber-300 text-sm">
                Vers {nextOilChange.toLocaleString()} km (dans ~{(7000).toLocaleString()} km)
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors">
            Prendre RDV
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Interventions validées
          </h3>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucune intervention validée</p>
            <p className="text-sm text-slate-400 mt-1">
              Les interventions validées apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((record, index) => (
              <div key={record.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {records.length - index}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${CATEGORY_COLORS[record.category] || CATEGORY_COLORS.autre}`}>
                          {CATEGORY_LABELS[record.category] || record.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <Shield className="w-3 h-3" />
                          Certifié
                        </div>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {record.description || CATEGORY_LABELS[record.category]}
                      </p>
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
                      <p className="text-sm text-orange-600 mt-1">
                        {record.garageName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 dark:text-white">
                      {formatPrice(record.totalCost)}
                    </p>
                    <p className="text-xs text-slate-400">Coût total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Preview Modal */}
      {showPublicPreview && vehicle && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-800 dark:bg-slate-900 p-4 rounded-t-2xl border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">Vue Acheteur Potentiel</span>
              </div>
              <button
                onClick={() => setShowPublicPreview(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-6">
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  ℹ️ C'est ce que verrait un acheteur potentiel en scannant votre QR code.
                </p>
              </div>

              {/* Vehicle Card */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {vehicle.make} {vehicle.model}
                    </h2>
                    <p className="text-white/80">{vehicle.year} • {vehicle.color}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <Car className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-lg">{vehicle.licensePlate}</p>
                  <p className="text-sm text-white/60">{vehicle.reference}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                  <Gauge className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="font-bold text-slate-800 dark:text-white">{latestMileage.toLocaleString()} km</p>
                  <p className="text-xs text-slate-500">Kilométrage</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="font-bold text-slate-800 dark:text-white">{records.length}</p>
                  <p className="text-xs text-slate-500">Interventions certifiées</p>
                </div>
              </div>

              {/* Verified History */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <h4 className="font-medium text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Historique certifié
                </h4>
                <div className="space-y-2">
                  {records.slice(0, 4).map((record) => (
                    <div key={record.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {formatDate(record.interventionDate)} - {CATEGORY_LABELS[record.category]}
                        </span>
                      </div>
                      <span className="text-slate-400">{record.mileage?.toLocaleString()} km</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Historique infalsifiable AutoPass
                </p>
              </div>

              {/* Share Actions */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-sm font-medium text-slate-800 dark:text-white mb-2">
                  Partager ce lien avec un acheteur
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300">
                    {publicUrl}
                  </code>
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      copied 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {copied ? 'Copié !' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              Partager le passeport
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Partagez l'historique certifié de votre véhicule avec un acheteur potentiel.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <button className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-500/10 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">WhatsApp</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                <Mail className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Email</span>
              </button>
              <button 
                onClick={handleCopy}
                className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Copy className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Copier</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
