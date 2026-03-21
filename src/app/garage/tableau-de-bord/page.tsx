'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  QrCode,
  Wrench,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Camera,
  ChevronRight,
  Loader2,
  Shield,
  Wallet,
  AlertCircle,
  ArrowRight,
  Plus,
  History,
  Megaphone,
  Newspaper,
  ExternalLink
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

// OKAR Brand
const OKAR_ORANGE = '#FF6600';

interface Vehicle {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  licensePlate: string | null;
  qrStatus: string;
  owner?: { name: string | null } | null;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicle: { 
    reference: string; 
    make: string | null; 
    model: string | null; 
    licensePlate: string | null;
  };
  category: string;
  totalCost: number | null;
  ownerValidation: string;
  createdAt: string;
  photos?: string[];
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

interface MaintenanceStats {
  total: number;
  pending: number;
  validated: number;
  rejected: number;
}

interface RevenueStats {
  today: number;
  thisMonth: number;
  pendingValidation: number;
}

interface QRStock {
  total: number;
  used: number;
  remaining: number;
}

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
}

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
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

export default function GarageDashboardOKAR() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [recentRecords, setRecentRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats>({ total: 0, pending: 0, validated: 0, rejected: 0 });
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({ today: 0, thisMonth: 0, pendingValidation: 0 });
  const [qrStock, setQrStock] = useState<QRStock>({ total: 0, used: 0, remaining: 0 });
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Garage info from auth
  const garageId = user?.garageId || '';
  const garageName = user?.garage?.name || 'Mon Garage OKAR';
  const isCertified = user?.garage?.isCertified || false;

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;
    
    // If no user, redirect to login
    if (!user) {
      router.push('/garage/connexion');
      return;
    }
    
    // Fetch data if we have a garage ID
    if (garageId) {
      fetchData();
    } else {
      // No garage ID but logged in - show empty state
      setLoading(false);
    }
  }, [user, authLoading, garageId, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicles
      const vehiclesRes = await fetch(`/api/vehicles?garageId=${garageId}`);
      const vehiclesData = await vehiclesRes.json();
      setRecentVehicles((vehiclesData.vehicles || []).slice(0, 5));
      setStats(vehiclesData.stats || { total: 0, active: 0, inactive: 0 });

      // Fetch maintenance records
      const maintRes = await fetch(`/api/maintenance-records?garageId=${garageId}`);
      const maintData = await maintRes.json();
      setRecentRecords((maintData.records || []).slice(0, 5));
      setMaintenanceStats(maintData.stats || { total: 0, pending: 0, validated: 0, rejected: 0 });

      // Fetch QR stock
      const qrRes = await fetch(`/api/qr-lots?garageId=${garageId}`);
      const qrData = await qrRes.json();
      const totalQR = qrData.lots?.reduce((sum: number, lot: { count: number }) => sum + lot.count, 0) || 0;
      const usedQR = qrData.lots?.reduce((sum: number, lot: { usedCount?: number; stats?: { activated: number } }) => sum + (lot.usedCount || lot.stats?.activated || 0), 0) || 0;
      setQrStock({ total: totalQR, used: usedQR, remaining: totalQR - usedQR });

      // Calculate revenue
      const validatedRecords = (maintData.records || []).filter((r: MaintenanceRecord) => r.ownerValidation === 'VALIDATED');
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthlyRevenue = validatedRecords
        .filter((r: MaintenanceRecord) => new Date(r.createdAt) >= thisMonth)
        .reduce((sum: number, r: MaintenanceRecord) => sum + (r.totalCost || 0), 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRevenue = validatedRecords
        .filter((r: MaintenanceRecord) => new Date(r.createdAt) >= today)
        .reduce((sum: number, r: MaintenanceRecord) => sum + (r.totalCost || 0), 0);

      const pendingRevenue = (maintData.records || [])
        .filter((r: MaintenanceRecord) => r.ownerValidation === 'PENDING')
        .reduce((sum: number, r: MaintenanceRecord) => sum + (r.totalCost || 0), 0);

      setRevenueStats({
        today: todayRevenue,
        thisMonth: monthlyRevenue,
        pendingValidation: pendingRevenue
      });

      // Fetch advertisements
      try {
        const adsRes = await fetch('/api/advertisements');
        const adsData = await adsRes.json();
        setAdvertisements(adsData.advertisements || []);
      } catch (e) {
        console.error('Error fetching ads:', e);
      }

      // Fetch blog posts
      try {
        const blogRes = await fetch('/api/blog?limit=3');
        const blogData = await blogRes.json();
        setBlogPosts(blogData.posts || []);
      } catch (e) {
        console.error('Error fetching blog:', e);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getValidationBadge = (validation: string) => {
    switch (validation) {
      case 'PENDING':
        return { 
          label: '⏳ En attente', 
          className: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
          dotClass: 'bg-amber-500 animate-pulse'
        };
      case 'VALIDATED':
        return { 
          label: '✅ Validé OKAR', 
          className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
          dotClass: 'bg-emerald-500'
        };
      case 'REJECTED':
        return { 
          label: '❌ Rejeté', 
          className: 'bg-red-500/10 text-red-400 border border-red-500/30',
          dotClass: 'bg-red-500'
        };
      default:
        return { 
          label: validation, 
          className: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30',
          dotClass: 'bg-zinc-500'
        };
    }
  };

  // Show loading while auth is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-[#FF6600] rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 mt-6 text-lg">Chargement OKAR...</p>
        </div>
      </div>
    );
  }

  // If no user, show redirect message
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FF6600] animate-spin mx-auto" />
          <p className="text-zinc-500 mt-4">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header - OKAR Brand */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-black text-white">
                Bienvenue, <span className="text-[#FF6600]">{garageName.split(' ')[0]}</span>
              </h1>
              {isCertified && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6600]/10 border border-[#FF6600]/30 rounded-full text-sm font-semibold text-[#FF6600]">
                  <Shield className="w-4 h-4" />
                  CERTIFIÉ OKAR
                </span>
              )}
            </div>
            <p className="text-zinc-500">
              L'histoire réelle de votre voiture commence ici.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Action - Scanner OKAR */}
      <div className="mb-8">
        <Link
          href="/garage/scanner"
          className="block w-full bg-gradient-to-r from-[#FF6600] to-[#FF8533] rounded-3xl p-6 lg:p-8 text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 border-4 border-white rounded-full" />
            <div className="absolute -right-5 -bottom-10 w-32 h-32 border-4 border-white rounded-full" />
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-10 h-10 lg:w-12 lg:h-12" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black">SCANNER UN VÉHICULE</h2>
                <p className="text-white/80 text-lg">Scannez le QR Code OKAR du véhicule</p>
              </div>
            </div>
            <ChevronRight className="w-10 h-10 group-hover:translate-x-3 transition-transform hidden lg:block" />
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/garage/activer-qr"
          className="bg-zinc-900 border-2 border-zinc-700 hover:border-[#FF6600] rounded-2xl p-5 lg:p-6 transition-all group active:scale-95"
        >
          <div className="w-14 h-14 bg-[#FF6600]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <QrCode className="w-7 h-7 text-[#FF6600]" />
          </div>
          <p className="font-bold text-white text-lg">Activer Pass OKAR</p>
          <p className="text-sm text-zinc-500 mt-1">Lier un code vierge</p>
        </Link>

        <Link
          href="/garage/inscrire"
          className="bg-zinc-900 border-2 border-zinc-700 hover:border-[#FF6600] rounded-2xl p-5 lg:p-6 transition-all group active:scale-95"
        >
          <div className="w-14 h-14 bg-[#FF6600]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UserPlus className="w-7 h-7 text-[#FF6600]" />
          </div>
          <p className="font-bold text-white text-lg">Inscription Client</p>
          <p className="text-sm text-zinc-500 mt-1">Créer un compte Driver</p>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* À Valider */}
        <div className={`rounded-2xl p-5 border-2 transition-all ${maintenanceStats.pending > 0 ? 'bg-amber-500/5 border-amber-500/50' : 'bg-zinc-900 border-zinc-700'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${maintenanceStats.pending > 0 ? 'bg-amber-500/20' : 'bg-zinc-800'}`}>
              <Clock className={`w-6 h-6 ${maintenanceStats.pending > 0 ? 'text-amber-400' : 'text-zinc-500'}`} />
            </div>
            {maintenanceStats.pending > 0 && (
              <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className={`text-4xl font-black ${maintenanceStats.pending > 0 ? 'text-amber-400' : 'text-white'}`}>
            {maintenanceStats.pending}
          </p>
          <p className="text-sm text-zinc-500 mt-1">À valider</p>
        </div>

        {/* Chantiers */}
        <div className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-5">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
            <Wrench className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-4xl font-black text-white">{maintenanceStats.total}</p>
          <p className="text-sm text-zinc-500 mt-1">Chantiers</p>
        </div>

        {/* Pass OKAR actifs */}
        <div className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-5">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
            <Car className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-4xl font-black text-white">{stats.active}</p>
          <p className="text-sm text-zinc-500 mt-1">Pass OKAR actifs</p>
        </div>

        {/* CA Mois */}
        <div className="bg-gradient-to-br from-[#FF6600] to-[#FF8533] rounded-2xl p-5 shadow-xl shadow-orange-500/20">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(revenueStats.thisMonth)}</p>
          <p className="text-sm text-white/70 mt-1">CA ce mois</p>
        </div>
      </div>

      {/* Chantiers Récents */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden mb-8">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6600]/10 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-[#FF6600]" />
            </div>
            Mes Chantiers Récents
          </h3>
          <Link href="/garage/interventions" className="text-sm text-[#FF6600] hover:text-[#FF8533] font-semibold flex items-center gap-1">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-800">
          {recentRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-10 h-10 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-lg">Aucune intervention enregistrée</p>
              <p className="text-zinc-600 text-sm mt-2">Scannez un véhicule pour commencer</p>
            </div>
          ) : (
            recentRecords.map((record) => {
              const badge = getValidationBadge(record.ownerValidation);
              const vehicleName = `${record.vehicle.make || ''} ${record.vehicle.model || ''}`.trim() || 'Véhicule';
              
              return (
                <div key={record.id} className="p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {record.photos?.[0] ? (
                        <img src={record.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-7 h-7 text-zinc-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[#FF6600] font-semibold">{record.vehicle.reference}</span>
                        <span className="text-xs text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">{formatDate(record.createdAt)}</span>
                      </div>
                      <p className="text-white font-semibold truncate">{vehicleName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-zinc-400">{categoryLabels[record.category] || record.category}</span>
                        {record.vehicle.licensePlate && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-sm font-mono text-zinc-500">{record.vehicle.licensePlate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-white">
                        {record.totalCost ? formatCurrency(record.totalCost) : '—'}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${badge.className}`}>
                        <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stock QR */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6600]/10 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#FF6600]" />
            </div>
            Stock Pass OKAR
          </h3>
          <Link href="/garage/stock-qr" className="text-sm text-[#FF6600] hover:text-[#FF8533] font-semibold">
            Gérer
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">{qrStock.remaining} disponibles sur {qrStock.total}</span>
              {qrStock.remaining < 10 && qrStock.total > 0 && (
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Stock bas
                </span>
              )}
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF6600] to-[#FF8533] rounded-full transition-all duration-500"
                style={{ width: qrStock.total > 0 ? `${(qrStock.remaining / qrStock.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <Link
            href="/garage/stock-qr"
            className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Commander
          </Link>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Aperçu Financier</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-zinc-500 text-sm mb-1">Aujourd'hui</p>
            <p className="text-2xl font-black text-white">{formatCurrency(revenueStats.today)}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-sm mb-1">Ce mois</p>
            <p className="text-2xl font-black text-white">{formatCurrency(revenueStats.thisMonth)}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-sm mb-1">En attente validation</p>
            <p className="text-2xl font-black text-amber-400">{formatCurrency(revenueStats.pendingValidation)}</p>
          </div>
        </div>
      </div>

      {/* Publicités */}
      {advertisements.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden mb-8">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-purple-400" />
              </div>
              Annonces OKAR
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {advertisements.map((ad) => (
              <div 
                key={ad.id} 
                className="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 hover:border-purple-500/50 transition-colors"
              >
                {ad.imageUrl && (
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="font-bold text-white mb-2">{ad.title}</h4>
                  {ad.description && (
                    <p className="text-sm text-zinc-400 line-clamp-2">{ad.description}</p>
                  )}
                  {ad.linkUrl && (
                    <a 
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 font-medium"
                    >
                      En savoir plus <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blog */}
      {blogPosts.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden mb-8">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-blue-400" />
              </div>
              Actualités OKAR
            </h3>
            <Link href="/blog" className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800">
            {blogPosts.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors"
              >
                {post.coverImage ? (
                  <img 
                    src={post.coverImage} 
                    alt={post.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Newspaper className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{post.title}</p>
                  {post.excerpt && (
                    <p className="text-sm text-zinc-500 line-clamp-1 mt-1">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-blue-400">{post.category}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-500">{formatDate(post.publishedAt)}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
