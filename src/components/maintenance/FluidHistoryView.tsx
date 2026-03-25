'use client';

import { useState, useEffect } from 'react';
import {
  Droplet,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Gauge,
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  VidangeHistoryItem,
  MaintenanceAlert,
  generateOilChangeAlert,
  getOilTypeLabel,
  ALERT_THRESHOLDS
} from '@/types/maintenance';

interface FluidHistoryViewProps {
  vehicleId: string;
  currentMileage: number;
  onReproduce?: (details: VidangeHistoryItem) => void;
}

export default function FluidHistoryView({
  vehicleId,
  currentMileage,
  onReproduce
}: FluidHistoryViewProps) {
  const [oilChanges, setOilChanges] = useState<VidangeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [alert, setAlert] = useState<MaintenanceAlert | null>(null);

  useEffect(() => {
    fetchOilChangeHistory();
  }, [vehicleId]);

  useEffect(() => {
    if (oilChanges.length > 0 && currentMileage) {
      const alertResult = generateOilChangeAlert(oilChanges[0], currentMileage);
      setAlert(alertResult);
    }
  }, [oilChanges, currentMileage]);

  const fetchOilChangeHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/maintenance-records?vehicleId=${vehicleId}&category=vidange&limit=20`);
      const data = await response.json();
      
      if (data.records) {
        const vidangeRecords: VidangeHistoryItem[] = data.records
          .filter((r: any) => r.maintenanceDetails)
          .map((r: any) => {
            let details = r.maintenanceDetails;
            if (typeof details === 'string') {
              try {
                details = JSON.parse(details);
              } catch {
                return null;
              }
            }
            
            return {
              id: r.id,
              date: r.interventionDate,
              mileage: r.mileage || 0,
              oilViscosity: details?.oilViscosity || 'Non spécifié',
              oilBrand: details?.oilBrand || 'Non spécifié',
              oilType: details?.oilType || 'synthetic',
              oilQuantity: details?.oilQuantity || 0,
              filterChanged: details?.oilFilterChanged || false,
              filterReference: details?.oilFilterReference,
              garageName: r.garageName || 'Garage inconnu',
              garageCertified: r.garageCertified || false,
              totalCost: r.totalCost,
              source: r.source,
              isVerified: r.isVerified,
            };
          })
          .filter((r: VidangeHistoryItem | null): r is VidangeHistoryItem => r !== null);
        
        setOilChanges(vidangeRecords);
      }
    } catch (err) {
      console.error('Error fetching oil change history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
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

  // Calculate next oil change
  const lastOilChange = oilChanges[0];
  const nextChange = lastOilChange ? {
    km: lastOilChange.mileage + ALERT_THRESHOLDS.vidange.defaultIntervalKm,
    date: new Date(new Date(lastOilChange.date).getTime() + ALERT_THRESHOLDS.vidange.defaultIntervalDays * 24 * 60 * 60 * 1000)
  } : null;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-slate-500">Chargement de l&apos;historique...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {alert && (
        <div className={`rounded-xl p-4 border ${
          alert.severity === 'critical' 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : alert.severity === 'warning'
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-start gap-3">
            {alert.severity === 'critical' ? (
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            ) : alert.severity === 'warning' ? (
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            ) : (
              <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold ${
                alert.severity === 'critical' 
                  ? 'text-red-800 dark:text-red-200' 
                  : alert.severity === 'warning'
                  ? 'text-amber-800 dark:text-amber-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {alert.title}
              </h4>
              <p className={`text-sm mt-1 ${
                alert.severity === 'critical' 
                  ? 'text-red-600 dark:text-red-300' 
                  : alert.severity === 'warning'
                  ? 'text-amber-600 dark:text-amber-300'
                  : 'text-blue-600 dark:text-blue-300'
              }`}>
                {alert.message}
              </p>
              {alert.recommendedAction && (
                <p className="text-sm mt-2 font-medium">
                  💡 {alert.recommendedAction}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last Oil Change Card - Highlighted */}
      {lastOilChange && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-700 overflow-hidden">
          {/* Header */}
          <div className="bg-amber-100 dark:bg-amber-800/50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800 dark:text-amber-200">
                Dernière Vidange
              </span>
            </div>
            {lastOilChange.garageCertified && (
              <span className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Certifié OKAR
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Main Info */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-amber-800 dark:text-amber-200">
                  {lastOilChange.oilViscosity}
                </p>
                <p className="text-lg text-amber-600 dark:text-amber-300">
                  {lastOilChange.oilBrand}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Quantité</p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                  {lastOilChange.oilQuantity}L
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Calendar className="w-4 h-4" />
                  Date
                </div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(lastOilChange.date)}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Gauge className="w-4 h-4" />
                  Kilométrage
                </div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {lastOilChange.mileage.toLocaleString()} km
                </p>
              </div>
            </div>

            {/* Filter Info */}
            {lastOilChange.filterChanged && (
              <div className="flex items-center gap-2 mb-4 text-sm text-emerald-600 dark:text-emerald-400">
                <Filter className="w-4 h-4" />
                <span>Filtre à huile changé</span>
                {lastOilChange.filterReference && (
                  <span className="font-mono bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                    {lastOilChange.filterReference}
                  </span>
                )}
              </div>
            )}

            {/* Next Change Estimate */}
            {nextChange && (
              <div className="bg-amber-100/50 dark:bg-amber-800/30 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">
                  Prochaine échéance estimée
                </p>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm">
                    <Gauge className="w-4 h-4" />
                    {nextChange.km.toLocaleString()} km
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4" />
                    {formatDate(nextChange.date.toISOString())}
                  </span>
                </div>
              </div>
            )}

            {/* Garage Info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="w-4 h-4" />
                {lastOilChange.garageName}
              </div>
              {lastOilChange.totalCost > 0 && (
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatPrice(lastOilChange.totalCost)}
                </span>
              )}
            </div>

            {/* Reproduce Button */}
            {onReproduce && (
              <button
                onClick={() => onReproduce(lastOilChange)}
                className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reproduire cette intervention
              </button>
            )}
          </div>
        </div>
      )}

      {/* No Oil Changes Message */}
      {oilChanges.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Aucune vidange enregistrée
          </h3>
          <p className="text-sm text-slate-500">
            Les informations de vidange apparaîtront ici après l&apos;enregistrement d&apos;une intervention de type &quot;Vidange&quot; via OKAR.
          </p>
        </div>
      )}

      {/* History Table */}
      {oilChanges.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Historique des vidanges
              </span>
              <span className="text-sm text-slate-500">
                ({oilChanges.length - 1} précédente{oilChanges.length > 2 ? 's' : ''})
              </span>
            </div>
            {showAllHistory ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showAllHistory && (
            <div className="border-t border-slate-200 dark:border-slate-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium">KM</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium">Huile</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium">Marque</th>
                    <th className="px-4 py-3 text-center text-slate-500 font-medium">Filtre</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium">Garage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {oilChanges.slice(1).map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {record.mileage.toLocaleString()} km
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                          {record.oilViscosity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {record.oilBrand}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.filterChanged ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {record.garageName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
