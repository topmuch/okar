'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, AlertTriangle, CheckCircle, Clock, 
  FileText, Wrench, Droplets, Gauge,
  ChevronRight, ExternalLink, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

// Types
interface VehicleHealth {
  overallScore: number
  status: 'good' | 'warning' | 'critical'
  documents: {
    vt: { valid: boolean; expiryDate?: string; daysRemaining?: number }
    insurance: { valid: boolean; expiryDate?: string; daysRemaining?: number }
  }
  maintenance: {
    lastService?: string
    daysSinceService?: number
    nextDue?: string
    overdueServices: string[]
  }
  alerts: Array<{
    type: 'critical' | 'warning' | 'info'
    message: string
    action?: string
    actionUrl?: string
  }>
}

interface VehicleHealthIndicatorProps {
  vehicleId: string
  vehicleData?: {
    make?: string | null
    model?: string | null
    licensePlate?: string | null
    vtEndDate?: string | null
    insuranceEndDate?: string | null
    lastMaintenanceDate?: string | null
    currentMileage?: number
  }
  compact?: boolean
}

// Status colors
const statusConfig = {
  good: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    label: 'BON ÉTAT',
    animation: 'animate-pulse'
  },
  warning: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    label: 'À SURVEILLER',
    animation: 'animate-bounce'
  },
  critical: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    label: 'URGENT',
    animation: 'animate-ping'
  }
}

export function VehicleHealthIndicator({ 
  vehicleId, 
  vehicleData, 
  compact = false 
}: VehicleHealthIndicatorProps) {
  const [health, setHealth] = useState<VehicleHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateHealth()
  }, [vehicleData])

  const calculateHealth = async () => {
    setLoading(true)
    
    try {
      const now = new Date()
      const alerts: VehicleHealth['alerts'] = []
      let score = 100
      
      // Document checks
      const vtValid = vehicleData?.vtEndDate 
        ? new Date(vehicleData.vtEndDate) > now 
        : false
      const vtDaysRemaining = vehicleData?.vtEndDate
        ? Math.ceil((new Date(vehicleData.vtEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null

      const insuranceValid = vehicleData?.insuranceEndDate 
        ? new Date(vehicleData.insuranceEndDate) > now 
        : false
      const insuranceDaysRemaining = vehicleData?.insuranceEndDate
        ? Math.ceil((new Date(vehicleData.insuranceEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null

      // VT alerts
      if (!vtValid) {
        score -= 30
        alerts.push({
          type: 'critical',
          message: 'Visite technique expirée',
          action: 'Renouveler',
          actionUrl: '#'
        })
      } else if (vtDaysRemaining && vtDaysRemaining <= 30) {
        score -= 10
        alerts.push({
          type: 'warning',
          message: `VT expire dans ${vtDaysRemaining} jours`,
          action: 'Planifier',
          actionUrl: '#'
        })
      }

      // Insurance alerts
      if (!insuranceValid) {
        score -= 30
        alerts.push({
          type: 'critical',
          message: 'Assurance expirée',
          action: 'Renouveler',
          actionUrl: '#'
        })
      } else if (insuranceDaysRemaining && insuranceDaysRemaining <= 30) {
        score -= 10
        alerts.push({
          type: 'warning',
          message: `Assurance expire dans ${insuranceDaysRemaining} jours`,
          action: 'Planifier',
          actionUrl: '#'
        })
      }

      // Maintenance checks
      const daysSinceService = vehicleData?.lastMaintenanceDate
        ? Math.floor((now.getTime() - new Date(vehicleData.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24))
        : null

      const overdueServices: string[] = []
      if (daysSinceService && daysSinceService > 180) {
        score -= 15
        overdueServices.push('Vidange')
        alerts.push({
          type: 'warning',
          message: `Dernier entretien il y a ${daysSinceService} jours`,
          action: 'Planifier',
          actionUrl: '/garage/interventions/nouvelle'
        })
      }

      // Determine status
      let status: VehicleHealth['status'] = 'good'
      if (score < 50) status = 'critical'
      else if (score < 80) status = 'warning'

      setHealth({
        overallScore: Math.max(0, score),
        status,
        documents: {
          vt: { valid: vtValid, expiryDate: vehicleData?.vtEndDate || undefined, daysRemaining: vtDaysRemaining || undefined },
          insurance: { valid: insuranceValid, expiryDate: vehicleData?.insuranceEndDate || undefined, daysRemaining: insuranceDaysRemaining || undefined }
        },
        maintenance: {
          lastService: vehicleData?.lastMaintenanceDate || undefined,
          daysSinceService: daysSinceService || undefined,
          overdueServices
        },
        alerts
      })
    } catch (error) {
      console.error('Error calculating health:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-6'} bg-zinc-900 rounded-2xl border border-zinc-800 animate-pulse`}>
        <div className="h-20 bg-zinc-800 rounded-xl" />
      </div>
    )
  }

  if (!health) return null

  const config = statusConfig[health.status]

  // Compact version for lists
  if (compact) {
    return (
      <div className={`relative flex items-center gap-3 p-3 rounded-xl ${config.bgLight} border ${config.border}`}>
        {/* Pulsing indicator */}
        <div className={`relative w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
          <div className={`absolute inset-0 rounded-full ${config.bg} ${config.animation}`} 
               style={{ opacity: 0.4 }} />
          {health.status === 'good' ? (
            <CheckCircle className="w-5 h-5 text-white relative z-10" />
          ) : health.status === 'warning' ? (
            <Clock className="w-5 h-5 text-white relative z-10" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-white relative z-10" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`font-bold ${config.text}`}>{config.label}</p>
          <p className="text-xs text-zinc-500">{health.alerts.length} alerte{health.alerts.length > 1 ? 's' : ''}</p>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-black text-white">{health.overallScore}</p>
          <p className="text-xs text-zinc-500">Score</p>
        </div>
      </div>
    )
  }

  // Full version
  return (
    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
      {/* Header with animated background */}
      <div className={`relative p-6 ${config.bgLight} border-b border-zinc-800`}>
        {/* Animated circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full ${config.bg} opacity-10 ${config.animation}`} />
          <div className={`absolute -left-5 -bottom-10 w-32 h-32 rounded-full ${config.bg} opacity-10 ${config.animation}`} 
               style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative flex items-center gap-6">
          {/* Main indicator */}
          <div className="relative">
            <div className={`w-20 h-20 rounded-full ${config.bg} flex items-center justify-center shadow-lg`}>
              <div className={`absolute inset-0 rounded-full ${config.bg} ${config.animation}`} 
                   style={{ opacity: 0.3 }} />
              {health.status === 'good' ? (
                <Shield className="w-10 h-10 text-white relative z-10" />
              ) : health.status === 'warning' ? (
                <Clock className="w-10 h-10 text-white relative z-10" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-white relative z-10" />
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.bg} text-white`}>
                {config.label}
              </span>
              <button 
                onClick={calculateHealth}
                className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <p className="text-zinc-400 text-sm">
              Score de santé: <span className="text-white font-bold">{health.overallScore}/100</span>
            </p>
          </div>
        </div>
      </div>

      {/* Alerts section */}
      {health.alerts.length > 0 && (
        <div className="p-4 border-b border-zinc-800">
          <p className="text-sm text-zinc-500 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alertes actives
          </p>
          <div className="space-y-2">
            {health.alerts.map((alert, i) => (
              <div 
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  alert.type === 'critical' 
                    ? 'bg-red-500/10 border border-red-500/30' 
                    : alert.type === 'warning'
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-blue-500/10 border border-blue-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {alert.type === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : alert.type === 'warning' ? (
                    <Clock className="w-5 h-5 text-amber-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    alert.type === 'critical' ? 'text-red-300' : 
                    alert.type === 'warning' ? 'text-amber-300' : 'text-blue-300'
                  }`}>
                    {alert.message}
                  </span>
                </div>
                {alert.action && alert.actionUrl && (
                  <Link 
                    href={alert.actionUrl}
                    className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm text-white font-medium transition-colors flex items-center gap-1"
                  >
                    {alert.action}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents status */}
      <div className="p-4 border-b border-zinc-800">
        <p className="text-sm text-zinc-500 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documents
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* VT */}
          <div className={`p-4 rounded-xl border ${
            health.documents.vt.valid 
              ? 'bg-emerald-500/5 border-emerald-500/30' 
              : 'bg-red-500/5 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {health.documents.vt.valid ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-medium text-white">Visite Technique</span>
            </div>
            {health.documents.vt.valid ? (
              <p className="text-xs text-zinc-500">
                Expire dans {health.documents.vt.daysRemaining} jours
              </p>
            ) : (
              <p className="text-xs text-red-400">Expiré</p>
            )}
          </div>

          {/* Insurance */}
          <div className={`p-4 rounded-xl border ${
            health.documents.insurance.valid 
              ? 'bg-emerald-500/5 border-emerald-500/30' 
              : 'bg-red-500/5 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {health.documents.insurance.valid ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-medium text-white">Assurance</span>
            </div>
            {health.documents.insurance.valid ? (
              <p className="text-xs text-zinc-500">
                Expire dans {health.documents.insurance.daysRemaining} jours
              </p>
            ) : (
              <p className="text-xs text-red-400">Expiré</p>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance status */}
      <div className="p-4">
        <p className="text-sm text-zinc-500 mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Entretien
        </p>
        <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Gauge className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {health.maintenance.daysSinceService 
                  ? `Dernier entretien il y a ${health.maintenance.daysSinceService} jours`
                  : 'Aucun entretien enregistré'}
              </p>
              {health.maintenance.overdueServices.length > 0 && (
                <p className="text-xs text-amber-400">
                  En retard: {health.maintenance.overdueServices.join(', ')}
                </p>
              )}
            </div>
          </div>
          <Link 
            href={`/garage/interventions/nouvelle?vehicleId=${vehicleId}`}
            className="px-4 py-2 bg-[#FF6600] hover:bg-[#FF8533] rounded-xl text-sm text-white font-medium transition-colors"
          >
            Ajouter
          </Link>
        </div>
      </div>
    </div>
  )
}

// Export a simpler function to calculate just the score
export function calculateHealthScore(data: {
  vtEndDate?: string | null
  insuranceEndDate?: string | null
  lastMaintenanceDate?: string | null
  maintenanceCount?: number
}): { score: number; status: 'good' | 'warning' | 'critical' } {
  const now = new Date()
  let score = 100

  // VT check
  if (data.vtEndDate) {
    const vtEnd = new Date(data.vtEndDate)
    if (vtEnd < now) score -= 30
    else if ((vtEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30) score -= 10
  } else {
    score -= 15 // No VT recorded
  }

  // Insurance check
  if (data.insuranceEndDate) {
    const insEnd = new Date(data.insuranceEndDate)
    if (insEnd < now) score -= 30
    else if ((insEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30) score -= 10
  } else {
    score -= 15 // No insurance recorded
  }

  // Maintenance check
  if (data.lastMaintenanceDate) {
    const lastService = new Date(data.lastMaintenanceDate)
    const daysSince = (now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 365) score -= 20
    else if (daysSince > 180) score -= 10
  } else if (!data.maintenanceCount || data.maintenanceCount === 0) {
    score -= 20 // No maintenance recorded
  }

  score = Math.max(0, Math.min(100, score))

  let status: 'good' | 'warning' | 'critical' = 'good'
  if (score < 50) status = 'critical'
  else if (score < 80) status = 'warning'

  return { score, status }
}
