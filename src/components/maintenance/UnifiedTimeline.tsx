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
  Award,
  Droplet,
  Settings,
  Car
} from 'lucide-react';
import {
  getInterventionType,
  INTERVENTION_TYPES,
  TIMELINE_FILTERS,
  InterventionType,
  MAJOR_ORGANS,
  PART_CONDITIONS,
  getOrganLabel,
  getPartConditionLabel,
  generateDistributionAlert,
  generateOrganReplacedMessage,
  MAJOR_REPAIR_THRESHOLDS
} from '@/types/maintenance';

interface TimelineRecord {
  id: string;
  category: string;
  description: string;
  mileage: number;
  totalCost: number;
  garageName: string;
  interventionDate: string;
  ownerValidation: string;
  source?: string;
  isVerified?: boolean;
  
  // Major repair fields
  isMajorRepair?: boolean;
  affectedOrgans?: string[];
  partCondition?: string;
  accidentRelated?: boolean;
  accidentDescription?: string;
  accidentSeverity?: string;
  impactZones?: string[];
  repairPhotos?: string[];
  
  // Maintenance details (for vidange)
  maintenanceDetails?: any;
}

interface UnifiedTimelineProps {
  vehicleId: string;
  currentMileage: number;
}

export default function UnifiedTimeline({
  vehicleId,
  currentMileage
}: UnifiedTimelineProps) {
  const [records, setRecords] = useState<TimelineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [vehicleId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/maintenance-records?vehicleId=${vehicleId}&limit=50`);
      const data = await response.json();
      
      if (data.records) {
        const processedRecords: TimelineRecord[] = data.records.map((r: any) => {
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
          
          // Parse maintenance details
          let maintenanceDetails = null;
          if (r.maintenanceDetails) {
            try {
              maintenanceDetails = typeof r.maintenanceDetails === 'string'
                ? JSON.parse(r.maintenanceDetails)
                : r.maintenanceDetails;
            } catch { maintenanceDetails = null; }
          }
          
          return {
            ...r,
            affectedOrgans,
            repairPhotos,
            impactZones,
            maintenanceDetails
          };
        });
        
        // Sort by date descending
        processedRecords.sort((a, b) => 
          new Date(b.interventionDate).getTime() - new Date(a.interventionDate).getTime()
        );
        
        setRecords(processedRecords);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter records based on active filter
  const filteredRecords = records.filter(record => {
    if (activeFilter === 'all') return true;
    const interventionType = getInterventionType(record.category);
    return interventionType === activeFilter;
  });

  // Calculate alerts
  const calculateAlerts = () => {
    const alerts: { type: string; severity: string; title: string; message: string; isPositive?: boolean }[] = [];
    
    // Distribution check
    const lastDistribution = records.find(r => 
      r.affectedOrgans?.includes('distribution') || r.category === 'distribution'
    );
    if (lastDistribution) {
      const yearsAgo = Math.floor(
        (Date.now() - new Date(lastDistribution.interventionDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      const kmAgo = currentMileage - (lastDistribution.mileage || 0);
      
      if (yearsAgo >= 5 || kmAgo >= 120000) {
        alerts.push({
          type: 'distribution',
          severity: 'critical',
          title: '⚠️ Distribution à vérifier impérativement',
          message: `La distribution a été changée il y a ${yearsAgo} ans ou ${kmAgo.toLocaleString()} km. Vérification recommandée.`,
        });
      } else if (yearsAgo >= 4 || kmAgo >= 100000) {
        alerts.push({
          type: 'distribution',
          severity: 'warning',
          title: '⏰ Distribution à prévoir',
          message: `La distribution a été changée il y a ${yearsAgo} ans ou ${kmAgo.toLocaleString()} km.`,
        });
      }
    }
    
    // Positive alerts for replaced organs
    const recentEngine = records.find(r => 
      r.affectedOrgans?.includes('moteur') &&
      Math.floor((Date.now() - new Date(r.interventionDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) <= 5
    );
    if (recentEngine && recentEngine.partCondition !== 'occasion') {
      alerts.push({
        type: 'organ_replaced',
        severity: 'positive',
        title: '✅ Moteur remplacé récemment',
        message: `Moteur remplacé - ${getPartConditionLabel(recentEngine.partCondition || '')}`,
        isPositive: true
      });
    }
    
    return alerts;
  };

  const alerts = calculateAlerts();
  const accidents = records.filter(r => r.accidentRelated);
  const positiveAlerts = alerts.filter(a => a.isPositive);
  const warningAlerts = alerts.filter(a => !a.isPositive);

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

  // Get time ago string
  const getTimeAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days < 30) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
    const years = Math.floor(days / 365);
    return `Il y a ${years} an${years > 1 ? 's' : ''}`;
  };

  // Render record based on intervention type
  const renderRecord = (record: TimelineRecord) => {
    const interventionType = getInterventionType(record.category);
    const typeConfig = INTERVENTION_TYPES[interventionType];
    const isExpanded = expandedRecord === record.id;
    
    return (
      <div 
        key={record.id} 
        className={`bg-white dark:bg-slate-900 rounded-xl border overflow-hidden transition-all ${
          interventionType === 'carrosserie_accident' 
            ? 'border-red-200 dark:border-red-800' 
            : interventionType === 'mecanique_majeure'
            ? 'border-orange-200 dark:border-orange-800'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Color indicator bar */}
        <div className={`h-1 ${
          interventionType === 'carrosserie_accident' 
            ? 'bg-red-500' 
            : interventionType === 'mecanique_majeure'
            ? 'bg-orange-500'
            : 'bg-emerald-500'
        }`} />
        
        {/* Main content */}
        <div 
          className={`p-4 cursor-pointer transition-colors ${
            interventionType === 'carrosserie_accident' 
              ? 'bg-red-50/50 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10' 
              : ''
          }`}
          onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Icon + Content */}
            <div className="flex gap-3 flex-1">
              {/* Type Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                interventionType === 'carrosserie_accident'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : interventionType === 'mecanique_majeure'
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : 'bg-emerald-100 dark:bg-emerald-900/30'
              }`}>
                {interventionType === 'carrosserie_accident' ? (
                  <Car className="w-5 h-5 text-red-600" />
                ) : interventionType === 'mecanique_majeure' ? (
                  <Settings className="w-5 h-5 text-orange-600" />
                ) : (
                  <Droplet className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Top row - Type badge + Category */}
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeConfig.badgeClass}`}>
                    {typeConfig.icon} {typeConfig.shortLabel}
                  </span>
                  
                  {/* Accident badge */}
                  {record.accidentRelated && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Incident déclaré
                    </span>
                  )}
                  
                  {/* Part condition badge for major repairs */}
                  {interventionType === 'mecanique_majeure' && record.partCondition && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      PART_CONDITIONS.find(c => c.value === record.partCondition)?.badge || ''
                    }`}>
                      {PART_CONDITIONS.find(c => c.value === record.partCondition)?.icon} {
                        record.partCondition === 'neuf_origine' ? 'Pièce Neuve' :
                        record.partCondition === 'neuf_adaptable' ? 'Adaptable' :
                        record.partCondition === 'reconditionne' ? 'Refait' : 'Occasion'
                      }
                    </span>
                  )}
                </div>
                
                {/* Affected organs (for major repairs) */}
                {interventionType === 'mecanique_majeure' && record.affectedOrgans && record.affectedOrgans.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1 mb-2">
                    {record.affectedOrgans.slice(0, 3).map(organ => {
                      const organInfo = MAJOR_ORGANS.find(o => o.value === organ);
                      return (
                        <span key={organ} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">
                          {organInfo?.icon} {organInfo?.label}
                        </span>
                      );
                    })}
                    {record.affectedOrgans.length > 3 && (
                      <span className="text-xs text-slate-500">+{record.affectedOrgans.length - 3}</span>
                    )}
                  </div>
                )}
                
                {/* Description */}
                <p className={`text-slate-800 dark:text-slate-200 ${
                  interventionType === 'mecanique_majeure' ? 'font-semibold' : ''
                }`}>
                  {record.description || getInterventionCategoryLabel(record.category)}
                </p>
                
                {/* Vidange details preview */}
                {interventionType === 'entretien_courant' && record.category === 'vidange' && record.maintenanceDetails && (
                  <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                    {record.maintenanceDetails.oilViscosity && (
                      <span className="inline-flex items-center gap-1">
                        <Droplet className="w-3 h-3" />
                        {record.maintenanceDetails.oilViscosity}
                      </span>
                    )}
                    {record.maintenanceDetails.oilBrand && (
                      <span>{record.maintenanceDetails.oilBrand}</span>
                    )}
                    {record.maintenanceDetails.oilFilterChanged && (
                      <span className="text-emerald-600">Filtre ✓</span>
                    )}
                  </div>
                )}
                
                {/* Date, Mileage, Garage */}
                <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(record.interventionDate)}
                    <span className="text-xs">({getTimeAgo(record.interventionDate)})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-4 h-4" />
                    {record.mileage?.toLocaleString()} km
                  </span>
                </div>
                
                {/* Garage */}
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {record.garageName || 'Garage inconnu'}
                  {record.isVerified && (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <Shield className="w-3 h-3" />
                      Certifié
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right side - Cost + Expand */}
            <div className="text-right flex-shrink-0">
              {record.totalCost > 0 && (
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatPrice(record.totalCost)}
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
          <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            {/* Accident Details */}
            {record.accidentRelated && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h5 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Détails de l&apos;incident
                </h5>
                {record.accidentDescription && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    {record.accidentDescription}
                  </p>
                )}
                {record.impactZones && record.impactZones.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-slate-500">Zones impactées:</span>
                    {record.impactZones.map(zone => (
                      <span key={zone} className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                        {zone.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Vidange Details */}
            {record.category === 'vidange' && record.maintenanceDetails && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <h5 className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-2">
                  <Droplet className="w-4 h-4" />
                  Détails vidange
                </h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {record.maintenanceDetails.oilViscosity && (
                    <div>
                      <span className="text-slate-500">Viscosité:</span>
                      <span className="ml-2 font-medium">{record.maintenanceDetails.oilViscosity}</span>
                    </div>
                  )}
                  {record.maintenanceDetails.oilBrand && (
                    <div>
                      <span className="text-slate-500">Marque:</span>
                      <span className="ml-2 font-medium">{record.maintenanceDetails.oilBrand}</span>
                    </div>
                  )}
                  {record.maintenanceDetails.oilQuantity && (
                    <div>
                      <span className="text-slate-500">Quantité:</span>
                      <span className="ml-2 font-medium">{record.maintenanceDetails.oilQuantity}L</span>
                    </div>
                  )}
                  {record.maintenanceDetails.oilFilterChanged && (
                    <div>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Filtre à huile changé
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Photos */}
            {record.repairPhotos && record.repairPhotos.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Photos ({record.repairPhotos.length})
                </h5>
                <div className="grid grid-cols-4 gap-2">
                  {record.repairPhotos.map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Next echeance for Distribution/Embrayage */}
            {(record.category === 'distribution' || record.affectedOrgans?.includes('distribution')) && (
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                  📅 Prochaine échéance estimée
                </h5>
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  Remplacement recommandé à {(record.mileage || 0) + 120000} km ou dans 5 ans
                </p>
              </div>
            )}
            
            {/* All organs for major repairs */}
            {interventionType === 'mecanique_majeure' && record.affectedOrgans && record.affectedOrgans.length > 3 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tous les organes touchés
                </h5>
                <div className="flex flex-wrap gap-2">
                  {record.affectedOrgans.map(organ => (
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
  };

  // Get category label
  const getInterventionCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      vidange: 'Vidange',
      freins: 'Freinage',
      pneus: 'Pneus',
      moteur: 'Moteur',
      electricite: 'Électricité',
      carrosserie: 'Carrosserie',
      distribution: 'Distribution',
      batterie: 'Batterie',
      climatisation: 'Climatisation',
      embrayage: 'Embrayage',
      autre: 'Autre',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
          <span className="ml-2 text-slate-500">Chargement de l&apos;historique...</span>
        </div>
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
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            )}
            <div>
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
            </div>
          </div>
        </div>
      ))}
      
      {/* Positive Alerts */}
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
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Historique d&apos;accident(s)
              </h4>
              <p className="text-sm text-red-600 dark:text-red-300">
                Ce véhicule a fait l&apos;objet de {accidents.length} réparation{accidents.length > 1 ? 's' : ''} suite à un accident.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {TIMELINE_FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === filter.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-orange-300'
            }`}
          >
            {filter.icon} {filter.label}
          </button>
        ))}
      </div>
      
      {/* Records count */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {filteredRecords.length} intervention{filteredRecords.length > 1 ? 's' : ''} 
          {activeFilter !== 'all' && ` (${TIMELINE_FILTERS.find(f => f.id === activeFilter)?.label})`}
        </span>
      </div>
      
      {/* Timeline */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {activeFilter === 'all' 
              ? 'Aucune intervention enregistrée'
              : `Aucune intervention de type "${TIMELINE_FILTERS.find(f => f.id === activeFilter)?.label}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(record => renderRecord(record))}
        </div>
      )}
    </div>
  );
}
