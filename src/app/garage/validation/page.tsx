'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  Gauge,
  FileText,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// Category labels
const categoryLabels: Record<string, string> = {
  vidange: 'Vidange',
  freins: 'Freins',
  pneus: 'Pneus',
  moteur: 'Moteur',
  electricite: 'Électricité',
  carrosserie: 'Carrosserie',
  climatisation: 'Climatisation',
  suspension: 'Suspension',
  transmission: 'Transmission',
  autre: 'Autre',
};

interface MaintenanceRecord {
  id: string;
  category: string;
  description: string | null;
  totalCost: number | null;
  mileage: number | null;
  ownerValidation: string;
  createdAt: string;
  interventionDate: string;
  vehicle: {
    id: string;
    reference: string;
    make: string | null;
    model: string | null;
    licensePlate: string | null;
  };
}

interface Stats {
  pending: number;
  validated: number;
  rejected: number;
}

export default function GarageValidationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, validated: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'VALIDATED' | 'REJECTED'>('all');

  const garageId = user?.garageId;

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !garageId) {
      if (!authLoading) {
        router.push('/garage/connexion');
      }
      return;
    }
    
    fetchRecords();
  }, [user, authLoading, garageId, router]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch maintenance records for this garage
      const response = await fetch(`/api/maintenance-records?garageId=${garageId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      const allRecords = data.records || [];
      
      // Calculate stats
      const pending = allRecords.filter((r: MaintenanceRecord) => r.ownerValidation === 'PENDING').length;
      const validated = allRecords.filter((r: MaintenanceRecord) => r.ownerValidation === 'VALIDATED').length;
      const rejected = allRecords.filter((r: MaintenanceRecord) => r.ownerValidation === 'REJECTED').length;
      
      setStats({ pending, validated, rejected });
      
      // Filter records
      const filteredRecords = filter === 'all' 
        ? allRecords 
        : allRecords.filter((r: MaintenanceRecord) => r.ownerValidation === filter);
      
      setRecords(filteredRecords);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (garageId) {
      fetchRecords();
    }
  }, [filter, garageId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  };

  const getValidationBadge = (validation: string) => {
    switch (validation) {
      case 'PENDING':
        return { 
          label: 'En attente', 
          className: 'bg-amber-500/10 text-amber-500 border border-amber-500/30',
          icon: Clock
        };
      case 'VALIDATED':
        return { 
          label: 'Validé', 
          className: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30',
          icon: CheckCircle
        };
      case 'REJECTED':
        return { 
          label: 'Rejeté', 
          className: 'bg-red-500/10 text-red-500 border border-red-500/30',
          icon: XCircle
        };
      default:
        return { 
          label: validation, 
          className: 'bg-slate-500/10 text-slate-500 border border-slate-500/30',
          icon: AlertCircle
        };
    }
  };

  // Auth loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-[#FF6600] rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 mt-6 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || !garageId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Accès non autorisé</h2>
          <p className="text-zinc-400 mb-6">Vous devez être connecté en tant que garage pour accéder à cette page.</p>
          <Link href="/garage/connexion" className="px-6 py-3 bg-[#FF6600] text-white rounded-xl font-medium">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6600]/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#FF6600]" />
          </div>
          Validation des rapports
        </h1>
        <p className="text-zinc-500 mt-2">
          Suivez l&apos;état de validation de vos rapports d&apos;entretien par les propriétaires
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter(filter === 'PENDING' ? 'all' : 'PENDING')}
          className={`p-5 rounded-2xl border-2 transition-all ${
            filter === 'PENDING' 
              ? 'bg-amber-500/5 border-amber-500/50' 
              : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
          }`}
        >
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.pending}</p>
          <p className="text-sm text-zinc-500">En attente</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'VALIDATED' ? 'all' : 'VALIDATED')}
          className={`p-5 rounded-2xl border-2 transition-all ${
            filter === 'VALIDATED' 
              ? 'bg-emerald-500/5 border-emerald-500/50' 
              : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
          }`}
        >
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.validated}</p>
          <p className="text-sm text-zinc-500">Validés</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'REJECTED' ? 'all' : 'REJECTED')}
          className={`p-5 rounded-2xl border-2 transition-all ${
            filter === 'REJECTED' 
              ? 'bg-red-500/5 border-red-500/50' 
              : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
          }`}
        >
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-3">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.rejected}</p>
          <p className="text-sm text-zinc-500">Rejetés</p>
        </button>
      </div>

      {/* Filter indicator */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Filtre actif:</span>
          <button
            onClick={() => setFilter('all')}
            className="px-3 py-1 bg-[#FF6600]/10 text-[#FF6600] rounded-full text-sm font-medium flex items-center gap-1"
          >
            {filter === 'PENDING' ? 'En attente' : filter === 'VALIDATED' ? 'Validés' : 'Rejetés'}
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Records List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white">
            Rapports {filter === 'all' ? '' : filter === 'PENDING' ? 'en attente' : filter === 'VALIDATED' ? 'validés' : 'rejetés'}
          </h3>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-lg">Aucun rapport trouvé</p>
            <p className="text-zinc-600 text-sm mt-2">
              {filter === 'all' 
                ? 'Vos rapports d\'entretien apparaîtront ici'
                : 'Aucun rapport avec ce statut'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {records.map((record) => {
              const badge = getValidationBadge(record.ownerValidation);
              const BadgeIcon = badge.icon;
              
              return (
                <div
                  key={record.id}
                  className="p-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-7 h-7 text-zinc-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[#FF6600] font-semibold">
                          {record.vehicle.reference}
                        </span>
                        <span className="text-xs text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">{formatDate(record.createdAt)}</span>
                      </div>
                      <p className="text-white font-semibold truncate">
                        {record.vehicle.make} {record.vehicle.model}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-zinc-400">
                          {categoryLabels[record.category] || record.category}
                        </span>
                        {record.vehicle.licensePlate && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-sm font-mono text-zinc-500">
                              {record.vehicle.licensePlate}
                            </span>
                          </>
                        )}
                        {record.mileage && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-sm text-zinc-500 flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              {record.mileage.toLocaleString()} km
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-white mb-1">
                        {record.totalCost ? formatCurrency(record.totalCost) : '—'}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${badge.className}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info message */}
      {stats.pending > 0 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium">
                {stats.pending} rapport{stats.pending > 1 ? 's' : ''} en attente de validation
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                Les propriétaires des véhicules doivent valider ces rapports pour qu&apos;ils soient certifiés OKAR.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
