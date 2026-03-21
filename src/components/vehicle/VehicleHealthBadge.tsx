'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Car,
  Shield,
  Wrench,
  Droplets,
  Battery,
  Thermometer,
  Gauge
} from 'lucide-react';

interface HealthItem {
  key: string;
  label: string;
  status: 'good' | 'warning' | 'critical';
  message: string;
  icon: React.ElementType;
  value?: string;
}

interface VehicleHealthBadgeProps {
  vtStatus: 'valid' | 'expiring_soon' | 'expired' | 'unknown';
  insuranceStatus: 'valid' | 'expiring_soon' | 'expired' | 'unknown';
  maintenanceStatus: 'up_to_date' | 'due_soon' | 'overdue' | 'unknown';
  mileageStatus?: 'normal' | 'high' | 'very_high';
  okarScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const STATUS_CONFIG = {
  good: {
    color: 'emerald',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    icon: CheckCircle2,
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  warning: {
    color: 'amber',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    icon: AlertTriangle,
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  critical: {
    color: 'red',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    icon: XCircle,
    glowColor: 'rgba(239, 68, 68, 0.5)',
  },
};

export function VehicleHealthBadge({
  vtStatus,
  insuranceStatus,
  maintenanceStatus,
  mileageStatus = 'normal',
  okarScore = 0,
  size = 'md',
  showDetails = true,
}: VehicleHealthBadgeProps) {
  // Calcul de l'état global
  const items: HealthItem[] = [
    {
      key: 'vt',
      label: 'CT',
      status: vtStatus === 'valid' ? 'good' : vtStatus === 'expiring_soon' ? 'warning' : vtStatus === 'expired' ? 'critical' : 'warning',
      message: vtStatus === 'valid' ? 'À jour' : vtStatus === 'expiring_soon' ? 'Expire bientôt' : vtStatus === 'expired' ? 'Expiré' : 'Inconnu',
      icon: Shield,
    },
    {
      key: 'insurance',
      label: 'Assurance',
      status: insuranceStatus === 'valid' ? 'good' : insuranceStatus === 'expiring_soon' ? 'warning' : insuranceStatus === 'expired' ? 'critical' : 'warning',
      message: insuranceStatus === 'valid' ? 'À jour' : insuranceStatus === 'expiring_soon' ? 'Expire bientôt' : insuranceStatus === 'expired' ? 'Expirée' : 'Inconnue',
      icon: Shield,
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      status: maintenanceStatus === 'up_to_date' ? 'good' : maintenanceStatus === 'due_soon' ? 'warning' : maintenanceStatus === 'overdue' ? 'critical' : 'warning',
      message: maintenanceStatus === 'up_to_date' ? 'À jour' : maintenanceStatus === 'due_soon' ? 'À planifier' : maintenanceStatus === 'overdue' ? 'En retard' : 'Inconnue',
      icon: Wrench,
    },
    {
      key: 'mileage',
      label: 'Kilométrage',
      status: mileageStatus === 'normal' ? 'good' : mileageStatus === 'high' ? 'warning' : 'critical',
      message: mileageStatus === 'normal' ? 'Normal' : mileageStatus === 'high' ? 'Élevé' : 'Très élevé',
      icon: Gauge,
    },
  ];

  // Déterminer l'état global (le plus critique)
  const overallStatus = items.some(i => i.status === 'critical')
    ? 'critical'
    : items.some(i => i.status === 'warning')
    ? 'warning'
    : 'good';

  const config = STATUS_CONFIG[overallStatus];
  const Icon = config.icon;

  // Tailles
  const sizeClasses = {
    sm: { badge: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs' },
    md: { badge: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-sm' },
    lg: { badge: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-base' },
  };

  return (
    <div className="inline-flex items-center gap-3">
      {/* Badge principal */}
      <motion.div
        className={`${sizeClasses[size].badge} rounded-xl ${config.bgClass} border ${config.borderClass} flex items-center justify-center relative`}
        animate={overallStatus === 'critical' ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{ duration: 0.5, repeat: overallStatus === 'critical' ? Infinity : 0 }}
        style={{
          boxShadow: overallStatus === 'critical' ? `0 0 20px ${config.glowColor}` : undefined,
        }}
      >
        <Icon className={`${sizeClasses[size].icon} ${config.textClass}`} />
      </motion.div>

      {/* Score OKAR */}
      {size !== 'sm' && (
        <div className="flex flex-col">
          <span className={`${sizeClasses[size].text} text-[#B0B0B0]`}>Score</span>
          <span className={`font-bold ${config.textClass}`}>
            {okarScore}/100
          </span>
        </div>
      )}

      {/* Détails si demandé */}
      {showDetails && size === 'lg' && (
        <div className="flex gap-2 ml-2">
          {items.map((item) => {
            const itemConfig = STATUS_CONFIG[item.status];
            const ItemIcon = item.icon;
            return (
              <motion.div
                key={item.key}
                className={`w-10 h-10 rounded-lg ${itemConfig.bgClass} border ${itemConfig.borderClass} flex items-center justify-center`}
                whileHover={{ scale: 1.1 }}
                title={`${item.label}: ${item.message}`}
              >
                <ItemIcon className="w-5 h-5 text-white" />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Composant compact pour liste de véhicules
export function VehicleHealthMini({ 
  vtStatus, 
  insuranceStatus, 
  maintenanceStatus 
}: Pick<VehicleHealthBadgeProps, 'vtStatus' | 'insuranceStatus' | 'maintenanceStatus'>) {
  const status = 
    (vtStatus === 'expired' || insuranceStatus === 'expired' || maintenanceStatus === 'overdue') 
      ? 'critical' 
    : (vtStatus === 'expiring_soon' || insuranceStatus === 'expiring_soon' || maintenanceStatus === 'due_soon') 
      ? 'warning' 
      : 'good';

  const config = STATUS_CONFIG[status];

  return (
    <div 
      className={`w-3 h-3 rounded-full ${config.bgClass} border ${config.borderClass}`}
      style={{
        boxShadow: status === 'critical' ? `0 0 8px ${config.glowColor}` : undefined,
      }}
    />
  );
}

// Feu tricolore complet pour dashboard
export function VehicleHealthTrafficLight({
  vtStatus,
  insuranceStatus,
  maintenanceStatus,
  vehicleName,
  onClick,
}: VehicleHealthBadgeProps & { 
  vehicleName?: string;
  onClick?: () => void;
}) {
  const status = 
    (vtStatus === 'expired' || insuranceStatus === 'expired' || maintenanceStatus === 'overdue') 
      ? 'critical' 
    : (vtStatus === 'expiring_soon' || insuranceStatus === 'expiring_soon' || maintenanceStatus === 'due_soon') 
      ? 'warning' 
      : 'good';

  const config = STATUS_CONFIG[status];

  const statusLabels = {
    good: { title: 'Bon état', subtitle: 'Tout est à jour', emoji: '🟢' },
    warning: { title: 'À surveiller', subtitle: 'Des attentions requises', emoji: '🟠' },
    critical: { title: 'Urgent', subtitle: 'Action immédiate requise', emoji: '🔴' },
  };

  return (
    <motion.div
      className={`rounded-2xl p-4 cursor-pointer transition-all border`}
      style={{ 
        backgroundColor: '#1E1E24', 
        borderColor: config.color === 'emerald' ? 'rgba(16, 185, 129, 0.3)' : config.color === 'amber' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.4)'
      }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Indicateur rond */}
        <motion.div
          className={`w-14 h-14 rounded-xl ${config.bgClass} flex items-center justify-center`}
          animate={status === 'critical' ? {
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1],
          } : {}}
          transition={{ duration: 1, repeat: status === 'critical' ? Infinity : 0 }}
        >
          <span className="text-2xl">{statusLabels[status].emoji}</span>
        </motion.div>

        {/* Texte */}
        <div className="flex-1">
          {vehicleName && (
            <p className="font-semibold text-white mb-1">{vehicleName}</p>
          )}
          <p className={`font-bold ${config.textClass}`}>
            {statusLabels[status].title}
          </p>
          <p className="text-sm text-[#B0B0B0]">
            {statusLabels[status].subtitle}
          </p>
        </div>

        {/* Score */}
        <div className="text-right">
          <p className="text-xs text-[#6B6B75]">Score</p>
          <p className="text-2xl font-black text-white">--</p>
        </div>
      </div>
    </motion.div>
  );
}

export default VehicleHealthBadge;
