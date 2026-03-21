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
  ExternalLink,
  Trophy,
  Star,
  Target,
  Zap,
  Users,
  Eye,
  Sparkles,
  Calendar,
  ArrowUpRight,
  Gift
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

// ========================================
// 🎨 OKAR DESIGN SYSTEM 2.0 - DASHBOARD PRO
// ========================================
const COLORS = {
  // Backgrounds
  pageBg: '#121214',           // Anthracite profond
  cardBg: '#1E1E24',           // Gris foncé soft
  cardBgHover: '#252530',      // Carte éclaircie au hover
  cardBorder: '#2A2A35',       // Bordure subtile
  cardBorderHover: '#FF6600',  // Bordure orange au hover
  
  // Brand
  primary: '#FF6600',          // Orange OKAR
  primaryLight: '#FF8533',     // Orange clair
  primaryDark: '#E65C00',      // Orange foncé
  
  // Premium gradients
  gradientRevenue: 'from-[#FF6600] via-[#FF7A1A] to-[#FF8533]',
  gradientPremium: 'from-[#FFD700] via-[#FF8C00] to-[#FF0080]',
  gradientSuccess: 'from-emerald-600 to-emerald-400',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#6B6B75',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// OKAR Brand
const OKAR_ORANGE = COLORS.primary;

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
  clientsCount: number;
  visitsCount: number;
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
  price?: string;
  badge?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
  readTime?: number;
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

// Gamification badges
const BADGES = [
  { id: 'certified', label: 'Certifié', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 'top_garage', label: 'Top Garage', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { id: 'fast_response', label: 'Réactif', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20' },
];

export default function GarageDashboardOKAR() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [recentRecords, setRecentRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats>({ total: 0, pending: 0, validated: 0, rejected: 0 });
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({ 
    today: 0, 
    thisMonth: 0, 
    pendingValidation: 0,
    clientsCount: 0,
    visitsCount: 0
  });
  const [qrStock, setQrStock] = useState<QRStock>({ total: 0, used: 0, remaining: 0 });
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Garage info from auth
  const garageId = user?.garageId || '';
  const garageName = user?.garage?.name || 'Mon Garage OKAR';
  const isCertified = user?.garage?.isCertified || false;
  
  // Gamification - Reputation score (simulated based on activity)
  const reputationScore = Math.min(100, Math.round(
    (maintenanceStats.validated * 5) + 
    (stats.active * 3) + 
    (isCertified ? 20 : 0)
  ));

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/garage/connexion');
      return;
    }
    
    if (garageId) {
      fetchData();
    } else {
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

      // Count unique clients
      const uniqueClients = new Set((maintData.records || []).map((r: MaintenanceRecord) => r.vehicleId)).size;
      const visitsCount = (maintData.records || []).length;

      setRevenueStats({
        today: todayRevenue,
        thisMonth: monthlyRevenue,
        pendingValidation: pendingRevenue,
        clientsCount: uniqueClients,
        visitsCount: visitsCount
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
          <div className="w-16 h-16 border-4 border-[#2A2A35] border-t-[#FF6600] rounded-full animate-spin mx-auto" />
          <p className="text-[#B0B0B0] mt-6 text-lg">Chargement OKAR...</p>
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
          <p className="text-[#B0B0B0] mt-4">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ======================================== */}
      {/* 🎯 SECTION 1: EN-TÊTE & BIENVENUE */}
      {/* ======================================== */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-black text-white">
                Bonjour, <span className="text-[#FF6600]">{garageName.split(' ')[0]}</span> 👋
              </h1>
              {/* Badges de statut */}
              <div className="hidden sm:flex items-center gap-2">
                {isCertified && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm font-semibold text-emerald-400">
                    <Shield className="w-4 h-4" />
                    Certifié
                  </span>
                )}
                {reputationScore >= 50 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-sm font-semibold text-amber-400">
                    <Trophy className="w-4 h-4" />
                    Top Garage
                  </span>
                )}
              </div>
            </div>
            <p className="text-[#B0B0B0]">
              L'histoire réelle de votre voiture commence ici.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#B0B0B0]">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        
        {/* Barre de progression réputation */}
        <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}>
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Niveau de réputation</p>
                <p className="text-sm text-[#B0B0B0]">Continuez à servir vos clients pour progresser</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#FF6600]">{reputationScore}</span>
              <span className="text-[#B0B0B0] text-lg">/100</span>
            </div>
          </div>
          <div className="h-3 bg-[#121214] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700"
              style={{ 
                width: `${reputationScore}%`,
                background: reputationScore >= 75 
                  ? 'linear-gradient(90deg, #FFD700, #FF8C00)' 
                  : reputationScore >= 50 
                    ? 'linear-gradient(90deg, #FF6600, #FF8533)'
                    : 'linear-gradient(90deg, #3B82F6, #60A5FA)'
              }}
            />
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* 🎯 SECTION 2: SCANNER PRINCIPAL */}
      {/* ======================================== */}
      <div className="mb-8">
        <Link
          href="/garage/scanner"
          className="block w-full rounded-3xl p-6 lg:p-8 text-white shadow-2xl transition-all group relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #FF6600, #FF8533)',
            boxShadow: '0 25px 50px -12px rgba(255, 102, 0, 0.35)'
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 border-4 border-white rounded-full" />
            <div className="absolute -right-5 -bottom-10 w-32 h-32 border-4 border-white rounded-full" />
            <div className="absolute left-10 top-1/2 w-24 h-24 border-2 border-white rounded-full" />
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

      {/* ======================================== */}
      {/* 🎯 SECTION 3: REVENUS HERO CARD */}
      {/* ======================================== */}
      <div className="mb-8">
        <div 
          className="rounded-3xl p-6 lg:p-8 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.cardBg}, #252530)`,
            border: `1px solid ${COLORS.cardBorder}`
          }}
        >
          {/* Effet de brillance */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6600]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Tableau de bord Revenus</h3>
            </div>
            
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* CA du mois - Grand format */}
              <div className="md:col-span-1 p-6 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                <div className="relative z-10">
                  <p className="text-white/80 text-sm font-medium mb-2">Chiffre d'affaires ce mois</p>
                  <p className="text-4xl lg:text-5xl font-black text-white">{formatCurrency(revenueStats.thisMonth)}</p>
                  <div className="flex items-center gap-2 mt-3 text-white/70">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">+12% vs mois dernier</span>
                  </div>
                </div>
              </div>
              
              {/* Clients & Visites */}
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#121214', border: `1px solid ${COLORS.cardBorder}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-[#B0B0B0] text-sm">Clients OKAR</span>
                </div>
                <p className="text-4xl font-black text-white">{revenueStats.clientsCount}</p>
                <p className="text-sm text-[#B0B0B0] mt-1">clients uniques servis</p>
              </div>
              
              {/* Visites générées */}
              <div className="p-5 rounded-2xl" style={{ backgroundColor: '#121214', border: `1px solid ${COLORS.cardBorder}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[#B0B0B0] text-sm">Visites générées</span>
                </div>
                <p className="text-4xl font-black text-white">{revenueStats.visitsCount}</p>
                <p className="text-sm text-[#B0B0B0] mt-1">interventions enregistrées</p>
              </div>
            </div>
            
            {/* Sparkline / tendance simulée */}
            <div className="flex items-end justify-between h-16 px-2 opacity-60">
              {[35, 45, 30, 55, 40, 65, 50, 75, 60, 80, 70, 90].map((h, i) => (
                <div 
                  key={i} 
                  className="w-2 rounded-t transition-all"
                  style={{ 
                    height: `${h}%`, 
                    backgroundColor: i === 11 ? '#FF6600' : '#3B3B45'
                  }} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* 🎯 SECTION 4: ACTIONS RAPIDES */}
      {/* ======================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/garage/scanner"
          className="group relative overflow-hidden rounded-2xl p-5 lg:p-6 transition-all active:scale-95"
          style={{ 
            backgroundColor: COLORS.cardBg, 
            border: `2px solid ${COLORS.cardBorder}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.primary;
            e.currentTarget.style.backgroundColor = COLORS.cardBgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.cardBorder;
            e.currentTarget.style.backgroundColor = COLORS.cardBg;
          }}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#FF6600]/10 rounded-full blur-xl group-hover:bg-[#FF6600]/20 transition-colors" />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)', boxShadow: '0 10px 30px -5px rgba(255, 102, 0, 0.4)' }}>
            <Camera className="w-7 h-7 text-white" />
          </div>
          <p className="font-bold text-white text-lg">Scanner</p>
          <p className="text-sm text-[#B0B0B0] mt-1">QR Code véhicule</p>
        </Link>

        <Link
          href="/garage/activer-qr"
          className="group relative overflow-hidden rounded-2xl p-5 lg:p-6 transition-all active:scale-95"
          style={{ 
            backgroundColor: COLORS.cardBg, 
            border: `2px solid ${COLORS.cardBorder}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.primary;
            e.currentTarget.style.backgroundColor = COLORS.cardBgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.cardBorder;
            e.currentTarget.style.backgroundColor = COLORS.cardBg;
          }}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-emerald-500 to-emerald-400" style={{ boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.4)' }}>
            <QrCode className="w-7 h-7 text-white" />
          </div>
          <p className="font-bold text-white text-lg">Activer Pass</p>
          <p className="text-sm text-[#B0B0B0] mt-1">Lier un code vierge</p>
        </Link>

        <Link
          href="/garage/inscrire"
          className="group relative overflow-hidden rounded-2xl p-5 lg:p-6 transition-all active:scale-95"
          style={{ 
            backgroundColor: COLORS.cardBg, 
            border: `2px solid ${COLORS.cardBorder}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.primary;
            e.currentTarget.style.backgroundColor = COLORS.cardBgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.cardBorder;
            e.currentTarget.style.backgroundColor = COLORS.cardBg;
          }}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-blue-500 to-blue-400" style={{ boxShadow: '0 10px 30px -5px rgba(59, 130, 246, 0.4)' }}>
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <p className="font-bold text-white text-lg">Inscription</p>
          <p className="text-sm text-[#B0B0B0] mt-1">Créer compte Driver</p>
        </Link>

        <Link
          href="/garage/interventions/nouvelle"
          className="group relative overflow-hidden rounded-2xl p-5 lg:p-6 transition-all active:scale-95"
          style={{ 
            backgroundColor: COLORS.cardBg, 
            border: `2px solid ${COLORS.cardBorder}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.primary;
            e.currentTarget.style.backgroundColor = COLORS.cardBgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.cardBorder;
            e.currentTarget.style.backgroundColor = COLORS.cardBg;
          }}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors" />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-purple-500 to-purple-400" style={{ boxShadow: '0 10px 30px -5px rgba(168, 85, 247, 0.4)' }}>
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <p className="font-bold text-white text-lg">Chantier</p>
          <p className="text-sm text-[#B0B0B0] mt-1">Nouvelle intervention</p>
        </Link>
      </div>

      {/* ======================================== */}
      {/* 🎯 SECTION 5: KPIs CARTES */}
      {/* ======================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* À Valider */}
        <div 
          className={`rounded-2xl p-5 border-2 transition-all ${maintenanceStats.pending > 0 ? 'border-amber-500/50' : ''}`}
          style={{ 
            backgroundColor: maintenanceStats.pending > 0 ? 'rgba(245, 158, 11, 0.05)' : COLORS.cardBg,
            borderColor: maintenanceStats.pending > 0 ? undefined : COLORS.cardBorder
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${maintenanceStats.pending > 0 ? 'bg-amber-500/20' : ''}`} style={{ backgroundColor: maintenanceStats.pending > 0 ? undefined : '#121214' }}>
              <Clock className={`w-6 h-6 ${maintenanceStats.pending > 0 ? 'text-amber-400' : 'text-[#6B6B75]'}`} />
            </div>
            {maintenanceStats.pending > 0 && (
              <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className={`text-4xl font-black ${maintenanceStats.pending > 0 ? 'text-amber-400' : 'text-white'}`}>
            {maintenanceStats.pending}
          </p>
          <p className="text-sm text-[#B0B0B0] mt-1">À valider</p>
        </div>

        {/* Chantiers */}
        <div className="rounded-2xl p-5 border-2 transition-all" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.cardBorder }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#121214' }}>
            <Wrench className="w-6 h-6 text-[#B0B0B0]" />
          </div>
          <p className="text-4xl font-black text-white">{maintenanceStats.total}</p>
          <p className="text-sm text-[#B0B0B0] mt-1">Chantiers</p>
        </div>

        {/* Pass OKAR actifs */}
        <div className="rounded-2xl p-5 border-2 transition-all" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.cardBorder }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#121214' }}>
            <Car className="w-6 h-6 text-[#B0B0B0]" />
          </div>
          <p className="text-4xl font-black text-white">{stats.active}</p>
          <p className="text-sm text-[#B0B0B0] mt-1">Pass OKAR actifs</p>
        </div>

        {/* En attente validation */}
        <div className="rounded-2xl p-5 border-2 transition-all" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.cardBorder }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#121214' }}>
            <Wallet className="w-6 h-6 text-[#B0B0B0]" />
          </div>
          <p className="text-2xl font-black text-amber-400">{formatCurrency(revenueStats.pendingValidation)}</p>
          <p className="text-sm text-[#B0B0B0] mt-1">En attente</p>
        </div>
      </div>

      {/* ======================================== */}
      {/* 🎯 SECTION 6: CHANTIERS RÉCENTS */}
      {/* ======================================== */}
      <div className="rounded-3xl overflow-hidden mb-8" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}` }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: COLORS.cardBorder }}>
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
              <History className="w-5 h-5 text-white" />
            </div>
            Mes Chantiers Récents
          </h3>
          <Link href="/garage/interventions" className="text-sm text-[#FF6600] hover:text-[#FF8533] font-semibold flex items-center gap-1">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y" style={{ borderColor: COLORS.cardBorder }}>
          {recentRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#121214' }}>
                <Wrench className="w-10 h-10 text-[#6B6B75]" />
              </div>
              <p className="text-[#B0B0B0] text-lg">Aucune intervention enregistrée</p>
              <p className="text-[#6B6B75] text-sm mt-2">Scannez un véhicule pour commencer</p>
            </div>
          ) : (
            recentRecords.map((record) => {
              const badge = getValidationBadge(record.ownerValidation);
              const vehicleName = `${record.vehicle.make || ''} ${record.vehicle.model || ''}`.trim() || 'Véhicule';
              
              return (
                <div key={record.id} className="p-4 hover:bg-[#252530] transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#121214' }}>
                      {record.photos?.[0] ? (
                        <img src={record.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-7 h-7 text-[#6B6B75]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[#FF6600] font-semibold">{record.vehicle.reference}</span>
                        <span className="text-xs text-[#6B6B75]">•</span>
                        <span className="text-xs text-[#B0B0B0]">{formatDate(record.createdAt)}</span>
                      </div>
                      <p className="text-white font-semibold truncate">{vehicleName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-[#B0B0B0]">{categoryLabels[record.category] || record.category}</span>
                        {record.vehicle.licensePlate && (
                          <>
                            <span className="text-[#6B6B75]">•</span>
                            <span className="text-sm font-mono text-[#6B6B75]">{record.vehicle.licensePlate}</span>
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

      {/* ======================================== */}
      {/* 🎯 SECTION 7: STOCK QR */}
      {/* ======================================== */}
      <div className="rounded-3xl p-5 mb-8" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
              <QrCode className="w-5 h-5 text-white" />
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
              <span className="text-sm text-[#B0B0B0]">{qrStock.remaining} disponibles sur {qrStock.total}</span>
              {qrStock.remaining < 10 && qrStock.total > 0 && (
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Stock bas
                </span>
              )}
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#121214' }}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: qrStock.total > 0 ? `${(qrStock.remaining / qrStock.total) * 100}%` : '0%',
                  background: 'linear-gradient(90deg, #FF6600, #FF8533)'
                }}
              />
            </div>
          </div>
          <Link
            href="/garage/stock-qr"
            className="px-5 py-3 rounded-xl text-white font-semibold transition-colors flex items-center gap-2"
            style={{ backgroundColor: '#121214' }}
          >
            <Plus className="w-4 h-4" />
            Commander
          </Link>
        </div>
      </div>

      {/* ======================================== */}
      {/* 🎯 SECTION 8: PUBLICITÉS - STYLE PREMIUM */}
      {/* ======================================== */}
      {advertisements.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Offres Partenaires</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {advertisements.slice(0, 3).map((ad, index) => (
              <a 
                key={ad.id} 
                href={ad.linkUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl transition-all duration-300"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Image avec overlay */}
                <div className="relative h-48 overflow-hidden">
                  {ad.imageUrl ? (
                    <img 
                      src={ad.imageUrl} 
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
                      <Gift className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                  {/* Badge promo */}
                  {index === 0 && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #FF0080, #FF4D94)' }}>
                      🔥 OFFRE DU JOUR
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                
                {/* Contenu */}
                <div className="p-5">
                  <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-[#FF6600] transition-colors">{ad.title}</h4>
                  {ad.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ad.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6600]">
                      Voir l'offre <ExternalLink className="w-4 h-4" />
                    </span>
                    {ad.price && (
                      <span className="text-lg font-black text-gray-900">{ad.price}</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* 🎯 SECTION 9: BLOG - STYLE MAGAZINE */}
      {/* ======================================== */}
      {blogPosts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA)' }}>
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Actualités OKAR</h3>
            </div>
            <Link href="/blog" className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Grille Magazine */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {blogPosts.map((post, index) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300"
                style={{ 
                  backgroundColor: COLORS.cardBg, 
                  border: `1px solid ${COLORS.cardBorder}`
                }}
              >
                {/* Image large */}
                <div className="relative h-48 overflow-hidden">
                  {post.coverImage ? (
                    <img 
                      src={post.coverImage} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#121214' }}>
                      <Newspaper className="w-12 h-12 text-[#6B6B75]" />
                    </div>
                  )}
                  {/* Category badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: 'rgba(59, 130, 246, 0.9)' }}>
                    {post.category}
                  </div>
                </div>
                
                {/* Contenu */}
                <div className="p-5">
                  <h4 className="font-bold text-white text-lg mb-2 group-hover:text-[#FF6600] transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  {post.excerpt && (
                    <p className="text-sm text-[#B0B0B0] line-clamp-2 mb-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#6B6B75]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.publishedAt)}
                    </span>
                    {post.readTime && (
                      <span>{post.readTime} min de lecture</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* 🎯 SECTION 10: RÉSUMÉ FINANCIER */}
      {/* ======================================== */}
      <div className="rounded-3xl p-6 mb-8" style={{ 
        background: `linear-gradient(135deg, ${COLORS.cardBg}, #252530)`,
        border: `1px solid ${COLORS.cardBorder}`
      }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Aperçu Financier</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[#B0B0B0] text-sm mb-1">Aujourd'hui</p>
            <p className="text-2xl font-black text-white">{formatCurrency(revenueStats.today)}</p>
          </div>
          <div>
            <p className="text-[#B0B0B0] text-sm mb-1">Ce mois</p>
            <p className="text-2xl font-black text-white">{formatCurrency(revenueStats.thisMonth)}</p>
          </div>
          <div>
            <p className="text-[#B0B0B0] text-sm mb-1">En attente validation</p>
            <p className="text-2xl font-black text-amber-400">{formatCurrency(revenueStats.pendingValidation)}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
