'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Wrench,
  Shield,
  Car,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

// Types
interface HealthItem {
  id: string;
  type: 'VT' | 'INSURANCE' | 'MAINTENANCE' | 'MILEAGE';
  label: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  message: string;
  dueDate?: Date | null;
  dueKm?: number | null;
  icon: React.ElementType;
}

interface VehicleHealthIndicatorProps {
  vehicle: {
    id: string;
    make: string | null;
    model: string | null;
    year: number | null;
    licensePlate: string | null;
    okarScore: number;
    vtEndDate: Date | null;
    insuranceEndDate: Date | null;
    currentMileage: number;
    nextMaintenanceDueKm: number | null;
    nextMaintenanceDueDate: Date | null;
    lastMaintenanceDate: Date | null;
  };
  garageId?: string;
}

// Couleurs du feu tricolore
const HEALTH_COLORS = {
  OK: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/50',
    gradient: 'from-emerald-400 to-emerald-600',
    pulse: 'animate-pulse',
  },
  WARNING: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/50',
    gradient: 'from-amber-400 to-orange-600',
    pulse: '',
  },
  CRITICAL: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-400',
    glow: 'shadow-red-500/50',
    gradient: 'from-red-400 to-red-600',
    pulse: 'animate-pulse',
  },
};

// Icônes par type
const TYPE_ICONS = {
  VT: Shield,
  INSURANCE: Shield,
  MAINTENANCE: Wrench,
  MILEAGE: Car,
};

export function VehicleHealthIndicator({ vehicle, garageId }: VehicleHealthIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calcul de l'état de santé
  const healthItems: HealthItem[] = [];
  const now = new Date();
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 1. Contrôle Technique
  if (vehicle.vtEndDate) {
    const vtDate = new Date(vehicle.vtEndDate);
    if (vtDate < now) {
      healthItems.push({
        id: 'vt',
        type: 'VT',
        label: 'Contrôle Technique',
        status: 'CRITICAL',
        message: 'Expiré - Renouvellement urgent',
        dueDate: vtDate,
        icon: Shield,
      });
    } else if (vtDate < in15Days) {
      healthItems.push({
        id: 'vt',
        type: 'VT',
        label: 'Contrôle Technique',
        status: 'WARNING',
        message: `Expire dans ${Math.ceil((vtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} jours`,
        dueDate: vtDate,
        icon: Shield,
      });
    } else {
      healthItems.push({
        id: 'vt',
        type: 'VT',
        label: 'Contrôle Technique',
        status: 'OK',
        message: 'À jour',
        dueDate: vtDate,
        icon: Shield,
      });
    }
  } else {
    healthItems.push({
      id: 'vt',
      type: 'VT',
      label: 'Contrôle Technique',
      status: 'WARNING',
      message: 'Non renseigné',
      icon: Shield,
    });
  }

  // 2. Assurance
  if (vehicle.insuranceEndDate) {
    const insDate = new Date(vehicle.insuranceEndDate);
    if (insDate < now) {
      healthItems.push({
        id: 'insurance',
        type: 'INSURANCE',
        label: 'Assurance',
        status: 'CRITICAL',
        message: 'Expirée - Conduite interdite',
        dueDate: insDate,
        icon: Shield,
      });
    } else if (insDate < in15Days) {
      healthItems.push({
        id: 'insurance',
        type: 'INSURANCE',
        label: 'Assurance',
        status: 'WARNING',
        message: `Expire dans ${Math.ceil((insDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} jours`,
        dueDate: insDate,
        icon: Shield,
      });
    } else {
      healthItems.push({
        id: 'insurance',
        type: 'INSURANCE',
        label: 'Assurance',
        status: 'OK',
        message: 'À jour',
        dueDate: insDate,
        icon: Shield,
      });
    }
  } else {
    healthItems.push({
      id: 'insurance',
      type: 'INSURANCE',
      label: 'Assurance',
      status: 'WARNING',
      message: 'Non renseignée',
      icon: Shield,
    });
  }

  // 3. Maintenance
  const lastMaintenance = vehicle.lastMaintenanceDate ? new Date(vehicle.lastMaintenanceDate) : null;
  const nextMaintenance = vehicle.nextMaintenanceDueDate ? new Date(vehicle.nextMaintenanceDueDate) : null;
  
  if (nextMaintenance && nextMaintenance < now) {
    healthItems.push({
      id: 'maintenance',
      type: 'MAINTENANCE',
      label: 'Maintenance',
      status: 'CRITICAL',
      message: 'En retard - Planifiez une révision',
      dueDate: nextMaintenance,
      icon: Wrench,
    });
  } else if (nextMaintenance && nextMaintenance < in30Days) {
    healthItems.push({
      id: 'maintenance',
      type: 'MAINTENANCE',
      label: 'Maintenance',
      status: 'WARNING',
      message: `Prochaine révision: ${nextMaintenance.toLocaleDateString('fr-FR')}`,
      dueDate: nextMaintenance,
      icon: Wrench,
    });
  } else if (!lastMaintenance) {
    healthItems.push({
      id: 'maintenance',
      type: 'MAINTENANCE',
      label: 'Maintenance',
      status: 'WARNING',
      message: 'Aucune intervention enregistrée',
      icon: Wrench,
    });
  } else {
    healthItems.push({
      id: 'maintenance',
      type: 'MAINTENANCE',
      label: 'Maintenance',
      status: 'OK',
      message: 'À jour',
      dueDate: nextMaintenance,
      icon: Wrench,
    });
  }

  // Calcul de l'état global (le plus critique)
  const overallStatus = healthItems.some(h => h.status === 'CRITICAL') 
    ? 'CRITICAL' 
    : healthItems.some(h => h.status === 'WARNING') 
      ? 'WARNING' 
      : 'OK';

  const colors = HEALTH_COLORS[overallStatus];

  // Messages selon l'état
  const statusMessages = {
    OK: {
      title: 'Bon état',
      subtitle: 'Roulez en toute confiance !',
      emoji: '🎉',
    },
    WARNING: {
      title: 'À surveiller',
      subtitle: 'Quelques attentions nécessaires',
      emoji: '⚡',
    },
    CRITICAL: {
      title: 'Urgent',
      subtitle: 'Action requise immédiatement',
      emoji: '🚨',
    },
  };

  const criticalItems = healthItems.filter(h => h.status === 'CRITICAL');
  const warningItems = healthItems.filter(h => h.status === 'WARNING');

  return (
    <div className="rounded-3xl p-6 relative overflow-hidden" style={{ backgroundColor: '#1E1E24', border: '1px solid #2A2A35' }}>
      {/* Effet de brillance */}
      <div 
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20`}
        style={{ backgroundColor: overallStatus === 'OK' ? '#10B981' : overallStatus === 'WARNING' ? '#F59E0B' : '#EF4444' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5" />
              Santé du Véhicule
            </h3>
            {vehicle.licensePlate && (
              <p className="text-sm text-[#B0B0B0] font-mono mt-1">{vehicle.licensePlate}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-[#B0B0B0]">Score OKAR</div>
            <div className="text-2xl font-black text-white">{vehicle.okarScore}/100</div>
          </div>
        </div>

        {/* Indicateur principal - Feu tricolore */}
        <div className="flex items-center justify-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            {/* Cercle principal */}
            <motion.div
              className={`w-40 h-40 rounded-full flex items-center justify-center relative ${overallStatus === 'CRITICAL' ? 'animate-pulse' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${overallStatus === 'OK' ? '#10B981, #059669' : overallStatus === 'WARNING' ? '#F59E0B, #D97706' : '#EF4444, #DC2626'})`,
                boxShadow: `0 0 60px ${overallStatus === 'OK' ? 'rgba(16, 185, 129, 0.5)' : overallStatus === 'WARNING' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.6)'}`,
              }}
              animate={overallStatus === 'CRITICAL' ? {
                boxShadow: [
                  '0 0 60px rgba(239, 68, 68, 0.6)',
                  '0 0 100px rgba(239, 68, 68, 0.8)',
                  '0 0 60px rgba(239, 68, 68, 0.6)',
                ],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {/* Effet liquide */}
              <motion.div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${overallStatus === 'OK' ? 'rgba(255,255,255,0.3)' : overallStatus === 'WARNING' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'}, transparent)`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div className="text-center text-white relative z-10">
                <span className="text-4xl">{statusMessages[overallStatus].emoji}</span>
                <p className="text-xl font-black mt-1">{statusMessages[overallStatus].title}</p>
              </div>
            </motion.div>

            {/* Anneau extérieur */}
            <div 
              className="absolute -inset-3 rounded-full border-4 opacity-30"
              style={{ borderColor: overallStatus === 'OK' ? '#10B981' : overallStatus === 'WARNING' ? '#F59E0B' : '#EF4444' }}
            />
          </motion.div>
        </div>

        {/* Message d'état */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-lg font-semibold mb-4"
          style={{ color: overallStatus === 'OK' ? '#10B981' : overallStatus === 'WARNING' ? '#F59E0B' : '#EF4444' }}
        >
          {statusMessages[overallStatus].subtitle}
        </motion.p>

        {/* Résumé rapide */}
        <div className="flex justify-center gap-4 mb-6">
          {criticalItems.length > 0 && (
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              {criticalItems.length} urgent{criticalItems.length > 1 ? 's' : ''}
            </span>
          )}
          {warningItems.length > 0 && (
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {warningItems.length} à surveiller
            </span>
          )}
          {overallStatus === 'OK' && (
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ✅ Tout va bien
            </span>
          )}
        </div>

        {/* Bouton d'expansion */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-colors"
          style={{ backgroundColor: '#121214' }}
        >
          <span className="text-[#B0B0B0] font-medium">Voir les détails</span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#FF6600]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#FF6600]" />
          )}
        </button>

        {/* Détails expandables */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="pt-4 space-y-3">
            {healthItems.map((item) => {
              const ItemIcon = item.icon;
              const itemColors = HEALTH_COLORS[item.status];
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl transition-colors"
                  style={{ backgroundColor: '#121214', border: `1px solid #2A2A35` }}
                >
                  {/* Icône */}
                  <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${itemColors.bgLight}`}
                  >
                    <ItemIcon className={`w-6 h-6 ${itemColors.text}`} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{item.label}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${itemColors.bgLight} ${itemColors.text}`}>
                        {item.status === 'OK' ? '✅' : item.status === 'WARNING' ? '⚠️' : '🚨'}
                      </span>
                    </div>
                    <p className="text-sm text-[#B0B0B0] mt-0.5">{item.message}</p>
                    {item.dueDate && (
                      <p className="text-xs text-[#6B6B75] mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.dueDate.toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  {item.status !== 'OK' && garageId && (
                    <Link
                      href={`/garage/rdv?vehicle=${vehicle.id}&type=${item.type}`}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}
                    >
                      RDV
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CTA Prendre RDV */}
          {(criticalItems.length > 0 || warningItems.length > 0) && garageId && (
            <Link
              href={`/garage/${garageId}`}
              className="mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}
            >
              <Wrench className="w-5 h-5" />
              Prendre RDV chez mon garage OKAR
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
