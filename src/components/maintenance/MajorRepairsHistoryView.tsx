'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Calendar,
  Gauge,
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  RefreshCw,
  Wrench,
  Camera,
  Info,
  Award
} from 'lucide-react';
import {
  MajorRepairHistoryItem,
  MajorRepairAlert,
  MAJOR_ORGANS,
  PART_CONDITIONS,
  getOrganLabel,
  getPartConditionLabel,
  generateDistributionAlert,
  generateOrganReplacedMessage,
  MAJOR_REPAIR_THRESHOLDS
} from '@/types/maintenance';

interface MajorRepairsHistoryViewProps {
  vehicleId: string;
  currentMileage: number;
}

export default function MajorRepairsHistoryView({
  vehicleId,
  currentMileage
}: MajorRepairsHistoryViewProps) {
  const [majorRepairs, setMajorRepairs] = useState<MajorRepairHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [alerts, setAlerts] = useState<MajorRepairAlert[]>([]);
  const [expandedRepair, setExpandedRepair] = useState<string | null>(null);

  useEffect(() => {
    fetchMajorRepairs();
  }, [vehicleId]);

  useEffect(() => {
    if (majorRepairs.length > 0) {
      generateAlerts();
    }
  }, [majorRepairs, currentMileage]);

  const fetchMajorRepairs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/maintenance-records?vehicleId=${vehicleId}&isMajorRepair=true&limit=20`);
      const data = await response.json();
      
      if (data.records) {
        const repairs: MajorRepairHistoryItem[] = data.records
          .filter((r: any) => r.isMajorRepair)
          .map((r: any) => {
            // Parse affected organs
            let affectedOrgans: string[] = [];
            if (r.affectedOrgans) {
              try {
                affectedOrgans = typeof r.affectedOrgans === 'string' 
                  ? JSON.parse(r.affectedOrgans) 
                  : r.affectedOrgans;
              } catch { affectedOrgans = []; }
            }
            
            // Parse repair photos
            let repairPhotos: string[] = [];
            if (r.repairPhotos) {
              try {
                repairPhotos = typeof r.repairPhotos === 'string'
                  ? JSON.parse(r.repairPhotos)
                  : r.repairPhotos;
              } catch { repairPhotos = []; }
            }
            
            // Parse impact zones
            let impactZones: string[] = [];
            if (r.impactZones) {
              try {
                impactZones = typeof r.impactZones === 'string'
                  ? JSON.parse(r.impactZones)
                  : r.impactZones;
              } catch { impactZones = []; }
            }
            
            const yearsAgo = Math.floor(
              (Date.now() - new Date(r.interventionDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
            );
            const kmAgo = currentMileage - (r.mileage || 0);
            
            return {
              id: r.id,
              date: r.interventionDate,
              mileage: r.mileage || 0,
              category: r.category,
              affectedOrgans,
              partCondition: r.partCondition || 'neuf_adaptable',
              accidentRelated: r.accidentRelated || false,
              accidentDescription: r.accidentDescription,
              accidentSeverity: r.accidentSeverity,
              impactZones,
              repairPhotos,
              garageName: r.garageName || 'Garage inconnu',
              garageCertified: r.garageCertified || false,
              totalCost: r.totalCost,
              source: r.source,
              isVerified: r.isVerified,
              yearsAgo,
              kmAgo,
              warrantyValid: false,
            };
          });
        
        setMajorRepairs(repairs);
      }
    } catch (err) {
      console.error('Error fetching major repairs:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = () => {
    const newAlerts: MajorRepairAlert[] = [];
    
    // Distribution check alert
    const lastDistribution = majorRepairs.find(r => 
      r.affectedOrgans.includes('distribution')
    );
    if (lastDistribution) {
      const alert = generateDistributionAlert(lastDistribution, currentMileage);
      if (alert) newAlerts.push(alert);
    }
    
    // Positive alerts for replaced organs (moteur, boite)
    const recentOrgans = ['moteur', 'boite'];
    recentOrgans.forEach(organ => {
      const repair = majorRepairs.find(r => 
        r.affectedOrgans.includes(organ) &&
        r.yearsAgo <= MAJOR_REPAIR_THRESHOLDS[organ as keyof typeof MAJOR_REPAIR_THRESHOLDS]?.positiveYears
      );
      if (repair && repair.partCondition !== 'occasion') {
        newAlerts.push(generateOrganReplacedMessage(repair));
      }
    });
    
    setAlerts(newAlerts);
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

  const accidents = majorRepairs.filter(r => r.accidentRelated);
  const positiveAlerts = alerts.filter(a => a.isPositive);
  const warningAlerts = alerts.filter(a => !a.isPositive);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
          <span className="ml-2 text-slate-500">Chargement de l&apos;historique structurel...</span>
        </div>
      </div>
    );
  }

  if (majorRepairs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Aucune réparation majeure enregistrée
        </h3>
        <p className="text-sm text-slate-500">
          L&apos;historique des grosses réparations apparaîtra ici après chaque intervention majeure.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning Alerts */}
      {warningAlerts.map((alert, index) => (
        <div key={index} className={`rounded-xl p-4 border ${
          alert.severity === 'critical' 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-start gap-3">
            {alert.severity === 'critical' ? (
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            ) : (
              <Clock className="w-6 h-6 text-amber-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold ${
                alert.severity === 'critical' 
                  ? 'text-red-800 dark:text-red-200' 
                  : 'text-amber-800 dark:text-amber-200'
              }`}>
                {alert.title}
              </h4>
              <p className={`text-sm mt-1 ${
                alert.severity === 'critical' 
                  ? 'text-red-600 dark:text-red-300' 
                  : 'text-amber-600 dark:text-amber-300'
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
      ))}

      {/* Positive Alerts - Good for resale */}
      {positiveAlerts.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-emerald-800 dark:text-emerald-200">
              Points positifs pour la revente
            </span>
          </div>
          <div className="space-y-2">
            {positiveAlerts.map((alert, index) => (
              <div key={index} className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accident History Warning */}
      {accidents.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <div>
              <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                Historique d&apos;accident(s)
              </h4>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                Ce véhicule a fait l&apos;objet de {accidents.length} réparation{accidents.length > 1 ? 's' : ''} suite à un accident.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-red-100 dark:bg-red-900/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800 dark:text-red-200">
              🔴 Historique Structurel & Grosses Réparations
            </span>
          </div>
          <span className="text-sm text-red-600 dark:text-red-300">
            {majorRepairs.length} intervention{majorRepairs.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Major Repairs List */}
      <div className="space-y-3">
        {majorRepairs.slice(0, showAllHistory ? undefined : 3).map((repair) => {
          const isExpanded = expandedRepair === repair.id;
          const conditionBadge = PART_CONDITIONS.find(c => c.value === repair.partCondition);
          
          return (
            <div key={repair.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Main Row */}
              <div 
                className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setExpandedRepair(isExpanded ? null : repair.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Organs + Badge */}
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      {repair.accidentRelated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Accident
                        </span>
                      )}
                      {repair.affectedOrgans.slice(0, 3).map((organ) => {
                        const organInfo = MAJOR_ORGANS.find(o => o.value === organ);
                        return (
                          <span key={organ} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                            {organInfo?.icon} {organInfo?.label}
                          </span>
                        );
                      })}
                      {repair.affectedOrgans.length > 3 && (
                        <span className="text-xs text-slate-500">
                          +{repair.affectedOrgans.length - 3} autres
                        </span>
                      )}
                    </div>

                    {/* Condition */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${conditionBadge?.badge}`}>
                        {conditionBadge?.icon} {conditionBadge?.label}
                      </span>
                    </div>

                    {/* Date & Mileage */}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(repair.date)} ({repair.yearsAgo} an{repair.yearsAgo > 1 ? 's' : ''})
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        {repair.mileage.toLocaleString()} km
                      </span>
                    </div>

                    {/* Garage */}
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4" />
                      {repair.garageName}
                      {repair.garageCertified && (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Shield className="w-3 h-3" />
                          Certifié
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cost & Expand */}
                  <div className="text-right">
                    {repair.totalCost && repair.totalCost > 0 && (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatPrice(repair.totalCost)}
                      </p>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 ml-auto mt-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 ml-auto mt-2" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Accident Details */}
                  {repair.accidentRelated && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <h5 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                        Détails de l&apos;accident
                      </h5>
                      {repair.accidentDescription && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                          {repair.accidentDescription}
                        </p>
                      )}
                      {repair.impactZones && repair.impactZones.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-slate-500">Zones impactées:</span>
                          {repair.impactZones.map(zone => (
                            <span key={zone} className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                              {zone.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Photos */}
                  {repair.repairPhotos && repair.repairPhotos.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Photos ({repair.repairPhotos.length})
                      </h5>
                      <div className="grid grid-cols-4 gap-2">
                        {repair.repairPhotos.map((photo, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All organs */}
                  {repair.affectedOrgans.length > 3 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Tous les organes touchés
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {repair.affectedOrgans.map(organ => (
                          <span key={organ} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs">
                            {getOrganLabel(organ)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More Button */}
      {majorRepairs.length > 3 && (
        <button
          onClick={() => setShowAllHistory(!showAllHistory)}
          className="w-full py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          {showAllHistory ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Afficher moins
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Voir tout l&apos;historique ({majorRepairs.length - 3} de plus)
            </>
          )}
        </button>
      )}
    </div>
  );
}
