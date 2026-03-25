'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Car,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Calendar,
  Euro,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// OKAR Brand
const OKAR_ORANGE = '#FF6600';

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicle: {
    reference: string;
    make: string | null;
    model: string | null;
    licensePlate: string | null;
    owner?: { name: string | null } | null;
  };
  category: string;
  description: string | null;
  totalCost: number | null;
  ownerValidation: string;
  createdAt: string;
  photos?: string[];
}

interface Stats {
  total: number;
  pending: number;
  validated: number;
  rejected: number;
}

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

// Category colors
const categoryColors: Record<string, string> = {
  vidange: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  freins: 'bg-red-500/10 text-red-400 border-red-500/30',
  pneus: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  moteur: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  electricite: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  carrosserie: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  climatisation: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  suspension: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  transmission: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  autre: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
};

export default function ChantiersOKARPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, validated: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('all');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const garageId = user?.garageId || '';

  useEffect(() => {
    if (garageId) {
      fetchRecords();
    }
  }, [garageId]);

  // Check for success param from redirect
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setShowSuccessToast(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowSuccessToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/maintenance-records?garageId=${garageId}`);
      const data = await res.json();
      setRecords(data.records || []);
      setStats(data.stats || { total: 0, pending: 0, validated: 0, rejected: 0 });
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return formatDate(dateString);
  };

  // Validation status badge
  const getValidationBadge = (validation: string) => {
    switch (validation) {
      case 'PENDING':
        return {
          label: '⏳ En attente',
          className: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
          dot: 'bg-amber-500 animate-pulse'
        };
      case 'VALIDATED':
        return {
          label: '✅ Validé OKAR',
          className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
          dot: 'bg-emerald-500'
        };
      case 'REJECTED':
        return {
          label: '❌ Rejeté',
          className: 'bg-red-500/10 text-red-400 border border-red-500/30',
          dot: 'bg-red-500'
        };
      default:
        return {
          label: validation,
          className: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30',
          dot: 'bg-zinc-500'
        };
    }
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    // Status filter
    if (filter !== 'all' && record.ownerValidation.toLowerCase() !== filter) {
      return false;
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const vehicleStr = `${record.vehicle.reference} ${record.vehicle.make || ''} ${record.vehicle.model || ''} ${record.vehicle.licensePlate || ''}`.toLowerCase();
      return vehicleStr.includes(searchLower);
    }
    
    return true;
  });

  // Calculate totals
  const totalRevenue = records
    .filter(r => r.ownerValidation === 'VALIDATED')
    .reduce((sum, r) => sum + (r.totalCost || 0), 0);

  const pendingRevenue = records
    .filter(r => r.ownerValidation === 'PENDING')
    .reduce((sum, r) => sum + (r.totalCost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-[#FF6600] rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 mt-6">Chargement des chantiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 animate-bounce">
          <Sparkles className="w-6 h-6" />
          <span className="font-semibold">Intervention enregistrée avec succès !</span>
          <button 
            onClick={() => setShowSuccessToast(false)}
            className="ml-2 hover:bg-emerald-600 p-1 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Mes Chantiers OKAR</h1>
          <p className="text-zinc-500">Suivi des interventions et validations</p>
        </div>
        <Link
          href="/garage/scanner"
          className="flex items-center gap-2 px-5 py-3 bg-[#FF6600] hover:bg-[#FF8533] rounded-xl text-white font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-2xl transition-all ${filter === 'all' ? 'bg-[#FF6600]/10 border-2 border-[#FF6600]' : 'bg-zinc-900 border border-zinc-800'}`}
        >
          <p className="text-2xl font-black text-white">{stats.total}</p>
          <p className="text-xs text-zinc-500">Total</p>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-2xl transition-all ${filter === 'pending' ? 'bg-amber-500/10 border-2 border-amber-500' : 'bg-zinc-900 border border-zinc-800'}`}
        >
          <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
          <p className="text-xs text-zinc-500">En attente</p>
        </button>
        <button
          onClick={() => setFilter('validated')}
          className={`p-4 rounded-2xl transition-all ${filter === 'validated' ? 'bg-emerald-500/10 border-2 border-emerald-500' : 'bg-zinc-900 border border-zinc-800'}`}
        >
          <p className="text-2xl font-black text-emerald-400">{stats.validated}</p>
          <p className="text-xs text-zinc-500">Validés</p>
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`p-4 rounded-2xl transition-all ${filter === 'rejected' ? 'bg-red-500/10 border-2 border-red-500' : 'bg-zinc-900 border border-zinc-800'}`}
        >
          <p className="text-2xl font-black text-red-400">{stats.rejected}</p>
          <p className="text-xs text-zinc-500">Rejetés</p>
        </button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">CA Validé</span>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm">En attente validation</span>
          </div>
          <p className="text-2xl font-black text-amber-400">{formatCurrency(pendingRevenue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par immatriculation, référence, modèle..."
          className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:border-[#FF6600] outline-none"
        />
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-lg mb-2">Aucune intervention trouvée</p>
            <p className="text-zinc-600 text-sm mb-6">
              {search || filter !== 'all' 
                ? 'Modifiez vos filtres pour voir plus de résultats'
                : 'Scannez un véhicule pour créer votre première intervention'}
            </p>
            {!search && filter === 'all' && (
              <Link
                href="/garage/scanner"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6600] rounded-xl text-white font-semibold"
              >
                <Plus className="w-5 h-5" />
                Créer une intervention
              </Link>
            )}
          </div>
        ) : (
          filteredRecords.map((record) => {
            const badge = getValidationBadge(record.ownerValidation);
            const vehicleName = `${record.vehicle.make || ''} ${record.vehicle.model || ''}`.trim() || 'Véhicule';
            
            return (
              <div
                key={record.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Vehicle Photo/Icon */}
                  <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {record.photos?.[0] ? (
                      <img src={record.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Reference + Date */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-[#FF6600] font-semibold">{record.vehicle.reference}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">{formatRelativeDate(record.createdAt)}</span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Vehicle Name */}
                    <p className="text-white font-semibold text-lg truncate mb-1">{vehicleName}</p>

                    {/* Details Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Category Badge */}
                      <span className={`text-xs px-2 py-1 rounded-lg border ${categoryColors[record.category] || categoryColors.autre}`}>
                        {categoryLabels[record.category] || record.category}
                      </span>

                      {/* License Plate */}
                      {record.vehicle.licensePlate && (
                        <span className="text-xs font-mono text-zinc-500">{record.vehicle.licensePlate}</span>
                      )}

                      {/* Owner */}
                      {record.vehicle.owner?.name && (
                        <span className="text-xs text-zinc-600">• {record.vehicle.owner.name}</span>
                      )}

                      {/* Has Photo */}
                      {record.photos && record.photos.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-zinc-600">
                          <ImageIcon className="w-3 h-3" />
                          {record.photos.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-white">
                      {record.totalCost ? formatCurrency(record.totalCost) : '—'}
                    </p>
                    {record.ownerValidation === 'PENDING' && (
                      <ChevronRight className="w-5 h-5 text-zinc-500 mt-2 ml-auto" />
                    )}
                  </div>
                </div>

                {/* Description Preview */}
                {record.description && (
                  <p className="mt-3 pt-3 border-t border-zinc-800 text-sm text-zinc-500 line-clamp-2">
                    {record.description}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
