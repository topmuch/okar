'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  FileCheck,
  Wrench,
  Calendar,
  Gauge,
} from 'lucide-react';

// Types
export type VehicleHealthStatus = 'GOOD' | 'WARNING' | 'URGENT';

export interface VehicleHealthData {
  status: VehicleHealthStatus;
  score: number;
  documents: {
    vt: {
      valid: boolean;
      expiresAt: Date | null;
      daysRemaining: number | null;
    };
    insurance: {
      valid: boolean;
      expiresAt: Date | null;
      daysRemaining: number | null;
    };
  };
  maintenance: {
    lastDate: Date | null;
    lastMileage: number | null;
    nextDue: {
      mileage: number | null;
      date: Date | null;
    };
    overdue: boolean;
  };
  alerts: {
    type: 'document' | 'maintenance' | 'mileage';
    severity: 'warning' | 'urgent';
    message: string;
  }[];
}

interface VehicleHealthStatusProps {
  data: VehicleHealthData;
  compact?: boolean;
  showDetails?: boolean;
}

// Status configurations
const statusConfig = {
  GOOD: {
    label: 'BON ÉTAT',
    emoji: '🟢',
    color: 'emerald',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500',
    lightBgClass: 'bg-emerald-500/10',
    description: 'Tous les documents sont valides et la maintenance est à jour.',
  },
  WARNING: {
    label: 'À SURVEILLER',
    emoji: '🟠',
    color: 'amber',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500',
    lightBgClass: 'bg-amber-500/10',
    description: 'Certains documents ou maintenances nécessitent votre attention.',
  },
  URGENT: {
    label: 'URGENT',
    emoji: '🔴',
    color: 'red',
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
    borderClass: 'border-red-500',
    lightBgClass: 'bg-red-500/10',
    description: 'Action immédiate requise ! Documents expirés ou maintenance en retard.',
  },
};

// Animated pulse component
function AnimatedPulse({ color }: { color: 'emerald' | 'amber' | 'red' }) {
  const colorClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <span className="relative flex h-3 w-3">
      <motion.span
        className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClasses[color]}`}
        animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClasses[color]}`} />
    </span>
  );
}

// Animated vibrate component for urgent status
function AnimatedVibrate({ color }: { color: 'emerald' | 'amber' | 'red' }) {
  const colorClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <motion.div
      className={`w-4 h-4 rounded-full ${colorClasses[color]}`}
      animate={{ 
        x: [0, -2, 2, -2, 2, 0],
        scale: [1, 1.1, 1, 1.1, 1]
      }}
      transition={{ 
        duration: 0.5, 
        repeat: Infinity, 
        repeatDelay: 1,
        ease: 'easeInOut' 
      }}
    />
  );
}

// Document status badge
function DocumentBadge({ 
  label, 
  valid, 
  daysRemaining,
  expiresAt 
}: { 
  label: string; 
  valid: boolean; 
  daysRemaining: number | null;
  expiresAt: Date | null;
}) {
  const isUrgent = daysRemaining !== null && daysRemaining <= 7;
  const isWarning = daysRemaining !== null && daysRemaining > 7 && daysRemaining <= 30;
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
      valid 
        ? isUrgent 
          ? 'bg-red-500/5 border-red-500/30' 
          : isWarning 
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'bg-emerald-500/5 border-emerald-500/30'
        : 'bg-red-500/5 border-red-500/30'
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        valid 
          ? isUrgent 
            ? 'bg-red-500/10' 
            : isWarning 
              ? 'bg-amber-500/10'
              : 'bg-emerald-500/10'
          : 'bg-red-500/10'
      }`}>
        <FileCheck className={`w-5 h-5 ${
          valid 
            ? isUrgent 
              ? 'text-red-500' 
              : isWarning 
                ? 'text-amber-500'
                : 'text-emerald-500'
            : 'text-red-500'
        }`} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-white text-sm">{label}</p>
        <p className={`text-xs ${
          valid 
            ? isUrgent 
              ? 'text-red-400' 
              : isWarning 
                ? 'text-amber-400'
                : 'text-emerald-400'
            : 'text-red-400'
        }`}>
          {valid 
            ? daysRemaining !== null
              ? `Expire dans ${daysRemaining} jours`
              : 'Valide'
            : 'Expiré'
          }
        </p>
      </div>
      {valid ? (
        isUrgent || isWarning ? (
          <AlertTriangle className={`w-5 h-5 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
        ) : (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        )
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      )}
    </div>
  );
}

// Main component
export function VehicleHealthStatus({ 
  data, 
  compact = false,
  showDetails = true 
}: VehicleHealthStatusProps) {
  const config = statusConfig[data.status];
  
  // Compact version (just the status indicator)
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.lightBgClass} border ${config.borderClass}/30`}>
        {data.status === 'GOOD' && <AnimatedPulse color={config.color} />}
        {data.status === 'WARNING' && <AnimatedPulse color={config.color} />}
        {data.status === 'URGENT' && <AnimatedVibrate color={config.color} />}
        <span className={`text-sm font-medium ${config.textClass}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <motion.div
        className={`relative overflow-hidden rounded-3xl border-2 ${config.borderClass}/30 bg-zinc-900`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className={`absolute inset-0 ${config.bgClass}`}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {data.status === 'GOOD' && (
                <motion.div
                  className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </motion.div>
              )}
              {data.status === 'WARNING' && (
                <motion.div
                  className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </motion.div>
              )}
              {data.status === 'URGENT' && (
                <motion.div
                  className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                >
                  <XCircle className="w-7 h-7 text-red-500" />
                </motion.div>
              )}
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{config.emoji}</span>
                  <h3 className={`text-xl font-bold ${config.textClass}`}>
                    {config.label}
                  </h3>
                </div>
                <p className="text-zinc-500 text-sm mt-1">
                  Score santé: {data.score}/100
                </p>
              </div>
            </div>
            
            {/* Score Ring */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-zinc-800"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={config.textClass}
                  initial={{ strokeDasharray: '0 176' }}
                  animate={{ strokeDasharray: `${(data.score / 100) * 176} 176` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{data.score}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-zinc-400 text-sm">
            {config.description}
          </p>
        </div>
      </motion.div>

      {/* Details Section */}
      {showDetails && (
        <div className="grid gap-4">
          {/* Documents */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Documents
            </h4>
            <div className="space-y-2">
              <DocumentBadge
                label="Visite Technique"
                valid={data.documents.vt.valid}
                daysRemaining={data.documents.vt.daysRemaining}
                expiresAt={data.documents.vt.expiresAt}
              />
              <DocumentBadge
                label="Assurance"
                valid={data.documents.insurance.valid}
                daysRemaining={data.documents.insurance.daysRemaining}
                expiresAt={data.documents.insurance.expiresAt}
              />
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Maintenance
            </h4>
            
            <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/50">
              <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                <Gauge className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                {data.maintenance.lastMileage && (
                  <p className="text-white text-sm font-medium">
                    Dernière: {data.maintenance.lastMileage.toLocaleString()} km
                  </p>
                )}
                {data.maintenance.nextDue.mileage && (
                  <p className="text-zinc-500 text-xs">
                    Prochaine: {data.maintenance.nextDue.mileage.toLocaleString()} km
                  </p>
                )}
              </div>
              {data.maintenance.overdue && (
                <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">
                  En retard
                </span>
              )}
            </div>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alertes
              </h4>
              <div className="space-y-2">
                {data.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      alert.severity === 'urgent' 
                        ? 'bg-red-500/5 border border-red-500/20' 
                        : 'bg-amber-500/5 border border-amber-500/20'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 ${
                      alert.severity === 'urgent' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <span className={`text-sm ${
                      alert.severity === 'urgent' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {alert.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to calculate vehicle health
export function calculateVehicleHealth(vehicle: {
  vtEndDate?: Date | null;
  insuranceEndDate?: Date | null;
  currentMileage?: number | null;
  nextMaintenanceDueKm?: number | null;
  nextMaintenanceDueDate?: Date | null;
  lastMaintenanceKm?: number | null;
  lastMaintenanceDate?: Date | null;
}): VehicleHealthData {
  const now = new Date();
  const alerts: VehicleHealthData['alerts'] = [];
  
  // Calculate document status
  const vtValid = vehicle.vtEndDate ? new Date(vehicle.vtEndDate) > now : false;
  const vtDaysRemaining = vehicle.vtEndDate 
    ? Math.ceil((new Date(vehicle.vtEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const insuranceValid = vehicle.insuranceEndDate ? new Date(vehicle.insuranceEndDate) > now : false;
  const insuranceDaysRemaining = vehicle.insuranceEndDate
    ? Math.ceil((new Date(vehicle.insuranceEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Check for document alerts
  if (!vtValid) {
    alerts.push({
      type: 'document',
      severity: 'urgent',
      message: 'La visite technique a expiré',
    });
  } else if (vtDaysRemaining !== null && vtDaysRemaining <= 30) {
    alerts.push({
      type: 'document',
      severity: vtDaysRemaining <= 7 ? 'urgent' : 'warning',
      message: `VT expire dans ${vtDaysRemaining} jours`,
    });
  }
  
  if (!insuranceValid) {
    alerts.push({
      type: 'document',
      severity: 'urgent',
      message: 'L\'assurance a expiré',
    });
  } else if (insuranceDaysRemaining !== null && insuranceDaysRemaining <= 30) {
    alerts.push({
      type: 'document',
      severity: insuranceDaysRemaining <= 7 ? 'urgent' : 'warning',
      message: `Assurance expire dans ${insuranceDaysRemaining} jours`,
    });
  }
  
  // Calculate maintenance status
  const maintenanceOverdue = vehicle.nextMaintenanceDueKm && vehicle.currentMileage
    ? vehicle.currentMileage >= vehicle.nextMaintenanceDueKm
    : false;
  
  if (maintenanceOverdue) {
    alerts.push({
      type: 'maintenance',
      severity: 'urgent',
      message: 'Maintenance en retard',
    });
  }
  
  // Calculate overall status
  let status: VehicleHealthStatus = 'GOOD';
  let score = 100;
  
  if (!vtValid || !insuranceValid || maintenanceOverdue) {
    status = 'URGENT';
    score = 30;
  } else if (alerts.length > 0) {
    status = 'WARNING';
    score = 70;
  } else {
    // Adjust score based on days remaining
    if (vtDaysRemaining !== null && vtDaysRemaining <= 30) {
      score -= (30 - vtDaysRemaining);
    }
    if (insuranceDaysRemaining !== null && insuranceDaysRemaining <= 30) {
      score -= (30 - insuranceDaysRemaining);
    }
  }
  
  return {
    status,
    score: Math.max(0, Math.min(100, score)),
    documents: {
      vt: {
        valid: vtValid,
        expiresAt: vehicle.vtEndDate ? new Date(vehicle.vtEndDate) : null,
        daysRemaining: vtDaysRemaining,
      },
      insurance: {
        valid: insuranceValid,
        expiresAt: vehicle.insuranceEndDate ? new Date(vehicle.insuranceEndDate) : null,
        daysRemaining: insuranceDaysRemaining,
      },
    },
    maintenance: {
      lastDate: vehicle.lastMaintenanceDate ? new Date(vehicle.lastMaintenanceDate) : null,
      lastMileage: vehicle.lastMaintenanceKm || null,
      nextDue: {
        mileage: vehicle.nextMaintenanceDueKm || null,
        date: vehicle.nextMaintenanceDueDate ? new Date(vehicle.nextMaintenanceDueDate) : null,
      },
      overdue: maintenanceOverdue,
    },
    alerts,
  };
}

export default VehicleHealthStatus;
