'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Car,
  Wrench,
  History,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Gauge,
  MapPin,
  Phone,
  Clock,
  Share2,
  QrCode,
  ChevronRight,
  ChevronDown,
  Plus,
  Settings,
  User,
  Building2,
  MessageCircle,
  Download,
  Bell,
  Edit3,
  Camera,
  TrendingUp,
  Eye,
  Lock,
  Unlock,
  Filter,
  X,
  Send,
  Image as ImageIcon,
  FileText,
  Check,
  AlertCircle,
  ChevronUp,
  Flag,
  Award,
  ThumbsUp,
  ThumbsDown,
  Mail,
  ArrowRightLeft,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Dynamic QR Code import - using QRCodeSVG from qrcode.react
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QRCode = dynamic<any>(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), { ssr: false });

// ============================================
// TYPES
// ============================================
interface VehicleData {
  id: string;
  reference: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  mainPhoto: string | null;
  photos: string[];
  currentMileage: number;
  engineType: string;
  vin: string;
  
  // Owner info
  ownerId: string | null;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  
  // Garage
  garageId: string | null;
  garageName: string;
  garageLogo: string | null;
  garageCertified: boolean;
  
  // Administrative
  vtStartDate: string | null;
  vtEndDate: string | null;
  vtCenter: string | null;
  insuranceStartDate: string | null;
  insuranceEndDate: string | null;
  insuranceCompany: string | null;
  insurancePolicyNum: string | null;
  
  // Status
  status: string;
  forSale: boolean;
  salePrice: number | null;
  saleContact: string;
  
  // Maintenance
  nextMaintenanceDueKm: number | null;
  nextMaintenanceDueDate: string | null;
  nextMaintenanceType: string | null;
  
  // Stats
  totalInterventions: number;
  ownerCount: number;
  createdAt: string;
  activatedAt: string;
  
  // Records
  maintenanceRecords: MaintenanceRecord[];
  ownershipHistory: OwnershipRecord[];
}

interface MaintenanceRecord {
  id: string;
  category: string;
  categories?: string[]; // All selected categories
  subCategory: string | null;
  description: string;
  mileage: number;
  interventionDate: string;
  status: string;
  ownerValidation: string;
  isLocked: boolean;
  garageCertified?: boolean; // Whether the garage is certified
  garageName: string;
  garageLogo: string | null;
  mechanicName: string;
  invoicePhoto: string | null;
  workPhotos: string[];
  totalCost?: number;
  createdAt: string;
}

interface OwnershipRecord {
  id: string;
  ownerName: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  role: 'driver' | 'garage' | 'admin' | 'superadmin';
  garageId?: string;
}

type UserRole = 'public' | 'owner' | 'garage';
type TabId = 'home' | 'carnet' | 'history' | 'alerts' | 'validation';

// ============================================
// CONSTANTS
// ============================================
const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  activation: { label: 'Activation', icon: '🚗', color: 'bg-emerald-500' },
  vidange: { label: 'Vidange', icon: '🛢️', color: 'bg-amber-500' },
  freins: { label: 'Freins', icon: '🛑', color: 'bg-red-500' },
  pneus: { label: 'Pneus', icon: '🛞', color: 'bg-slate-600' },
  moteur: { label: 'Moteur', icon: '⚙️', color: 'bg-blue-500' },
  electricite: { label: 'Électricité', icon: '⚡', color: 'bg-yellow-500' },
  carrosserie: { label: 'Carrosserie', icon: '🔧', color: 'bg-purple-500' },
  suspension: { label: 'Suspension', icon: '🔩', color: 'bg-indigo-500' },
  climatisation: { label: 'Climatisation', icon: '❄️', color: 'bg-cyan-500' },
  batterie: { label: 'Batterie', icon: '🔋', color: 'bg-green-500' },
  transmission: { label: 'Transmission', icon: '🔗', color: 'bg-orange-500' },
  echappement: { label: 'Échappement', icon: '💨', color: 'bg-gray-500' },
  diagnostic: { label: 'Diagnostic', icon: '🔍', color: 'bg-teal-500' },
  autre: { label: 'Autre', icon: '📋', color: 'bg-slate-400' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null, short = false): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', short 
    ? { day: '2-digit', month: 'short' }
    : { day: '2-digit', month: 'long', year: 'numeric' }
  );
}

function getProgressColor(daysLeft: number | null): string {
  if (daysLeft === null) return 'bg-gray-300';
  if (daysLeft <= 0) return 'bg-red-500';
  if (daysLeft <= 7) return 'bg-red-500';
  if (daysLeft <= 30) return 'bg-orange-500';
  return 'bg-emerald-500';
}

function getProgressBg(daysLeft: number | null): string {
  if (daysLeft === null) return 'bg-gray-100 dark:bg-gray-800';
  if (daysLeft <= 0) return 'bg-red-100 dark:bg-red-900/30';
  if (daysLeft <= 7) return 'bg-red-100 dark:bg-red-900/30';
  if (daysLeft <= 30) return 'bg-orange-100 dark:bg-orange-900/30';
  return 'bg-emerald-100 dark:bg-emerald-900/30';
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function QRWebApp() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  // State
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [headerTransparent, setHeaderTransparent] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Fetch data
  useEffect(() => {
    if (code) {
      fetchVehicleData();
      checkUserRole();
    }
  }, [code]);
  
  // Handle scroll for header
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      setHeaderTransparent(target.scrollTop < 50);
    };
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  const fetchVehicleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/scan/${code}`);
      const data = await res.json();
      
      if (data.status === 'active' && data.vehicle) {
        setVehicle({
          ...data.vehicle,
          maintenanceRecords: data.maintenanceRecords || [],
          ownershipHistory: data.ownershipHistory || [],
          photos: data.photos || [],
          totalInterventions: data.maintenanceRecords?.length || 0,
          ownerCount: data.ownershipHistory?.length || 1,
        });
      } else if (data.status === 'inactive') {
        router.push(`/activate/${code}`);
      } else {
        setError(data.message || 'QR Code non trouvé');
      }
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };
  
  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        
        if (data.user?.role === 'garage') {
          setUserRole('garage');
        } else if (vehicle?.ownerId === data.user?.id) {
          setUserRole('owner');
        } else {
          setUserRole('public');
        }
      }
    } catch {
      setUserRole('public');
    }
  };
  
  // Update role when vehicle loads
  useEffect(() => {
    if (vehicle && currentUser) {
      if (currentUser.role === 'garage') {
        setUserRole('garage');
      } else if (vehicle.ownerId === currentUser.id) {
        setUserRole('owner');
      }
    }
  }, [vehicle, currentUser]);
  
  // Share functionality
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/v/${code}`;
    const shareData = {
      title: `${vehicle?.make} ${vehicle?.model} - OKAR`,
      text: `Consultez l'historique certifié de ce véhicule ${vehicle?.make} ${vehicle?.model} ${vehicle?.year}`,
      url: shareUrl,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Lien copié dans le presse-papier !');
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-orange-500 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse" />
            <div className="absolute inset-2 bg-white/30 rounded-2xl flex items-center justify-center">
              <QrCode className="w-12 h-12 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-xl font-semibold mb-2">OKAR</p>
          <p className="text-white/80 text-sm">Chargement du passeport...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !vehicle) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center max-w-sm w-full shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            QR Code non valide
          </h1>
          <p className="text-slate-500 mb-6">{error || 'Ce QR Code n\'existe pas'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-medium"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate confidence score - count validated records (from certified garages or owner-validated)
  const validatedRecords = vehicle.maintenanceRecords.filter(r => 
    r.ownerValidation === 'VALIDATED' && (r.isLocked || r.garageCertified)
  );
  const confidenceScore = Math.min(100, validatedRecords.length * 15 + 25);
  
  // Get pending records count for owner
  const pendingRecords = vehicle.maintenanceRecords.filter(r => r.ownerValidation === 'PENDING');
  
  // Main render
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        headerTransparent 
          ? "bg-transparent" 
          : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-lg"
      )}>
        <div className="h-14 flex items-center justify-between px-4 safe-area-top">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
              headerTransparent ? "bg-white/20" : "bg-gradient-to-br from-orange-500 to-pink-500"
            )}>
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={cn(
                "font-bold text-sm transition-colors",
                headerTransparent ? "text-white" : "text-slate-800 dark:text-white"
              )}>
                OKAR
              </p>
              <p className={cn(
                "text-xs transition-colors",
                headerTransparent ? "text-white/70" : "text-slate-500"
              )}>
                {userRole === 'garage' ? 'Mode Garage' : userRole === 'owner' ? 'Mon Véhicule' : 'Passeport'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className={cn(
                "p-2 rounded-xl transition-colors",
                headerTransparent ? "bg-white/20 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"
              )}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* ===== MAIN CONTENT ===== */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pb-20"
      >
        {activeTab === 'home' && (
          <HomeTab 
            vehicle={vehicle} 
            userRole={userRole}
            confidenceScore={confidenceScore}
            validatedCount={validatedRecords.length}
            onShowQR={() => setShowQRModal(true)}
            onReport={() => setShowReportModal(true)}
            onEdit={() => setShowEditModal(true)}
            onTransfer={() => setShowTransferModal(true)}
          />
        )}
        
        {activeTab === 'carnet' && (
          <CarnetTab 
            records={vehicle.maintenanceRecords}
            expandedRecord={expandedRecord}
            setExpandedRecord={setExpandedRecord}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            userRole={userRole}
          />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab 
            vehicle={vehicle}
            ownershipHistory={vehicle.ownershipHistory}
            userRole={userRole}
          />
        )}
        
        {activeTab === 'alerts' && userRole === 'owner' && (
          <AlertsTab vehicle={vehicle} />
        )}
        
        {activeTab === 'validation' && userRole === 'owner' && (
          <ValidationTab 
            vehicle={vehicle}
            onRefresh={fetchVehicleData}
          />
        )}
      </main>
      
      {/* ===== TAB BAR ===== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/50 safe-area-bottom z-50">
        <div className="flex items-center justify-around h-16 px-2">
          <TabButton 
            id="home" 
            icon={<Car className="w-5 h-5" />} 
            label="Accueil" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')}
          />
          <TabButton 
            id="carnet" 
            icon={<Wrench className="w-5 h-5" />} 
            label="Carnet" 
            badge={vehicle.totalInterventions}
            active={activeTab === 'carnet'} 
            onClick={() => setActiveTab('carnet')}
          />
          <TabButton 
            id="history" 
            icon={<History className="w-5 h-5" />} 
            label="Historique" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          />
          {userRole === 'owner' && (
            <TabButton 
              id="validation" 
              icon={<CheckCircle className="w-5 h-5" />} 
              label="Validation" 
              badge={pendingRecords.length}
              active={activeTab === 'validation'} 
              onClick={() => setActiveTab('validation')}
            />
          )}
          {userRole === 'owner' && (
            <TabButton 
              id="alerts" 
              icon={<Bell className="w-5 h-5" />} 
              label="Alertes" 
              active={activeTab === 'alerts'} 
              onClick={() => setActiveTab('alerts')}
            />
          )}
        </div>
      </nav>
      
      {/* ===== FLOATING ACTION BUTTON (Garage Only) ===== */}
      {userRole === 'garage' && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center text-white z-40 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      
      {/* ===== MODALS ===== */}
      {showAddModal && (
        <AddInterventionModal 
          vehicleId={vehicle.id}
          currentMileage={vehicle.currentMileage}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchVehicleData();
          }}
        />
      )}
      
      {showQRModal && (
        <QRCodeModal 
          vehicle={vehicle}
          code={code}
          onClose={() => setShowQRModal(false)}
        />
      )}
      
      {showReportModal && (
        <ReportAnomalyModal 
          vehicle={vehicle}
          onClose={() => setShowReportModal(false)}
        />
      )}
      
      {showEditModal && (
        <EditVehicleModal 
          vehicle={vehicle}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchVehicleData();
          }}
        />
      )}
      
      {showTransferModal && (
        <TransferOwnershipModal 
          vehicle={vehicle}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            router.push('/');
          }}
        />
      )}
    </div>
  );
}

// ============================================
// TAB BUTTON COMPONENT
// ============================================
function TabButton({ 
  id, icon, label, badge, active, onClick 
}: { 
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]",
        active 
          ? "text-orange-500" 
          : "text-slate-400 dark:text-slate-500"
      )}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// ============================================
// OKAR CONFIDENCE SCORE COMPONENT
// ============================================
function ConfidenceScore({ score, validatedCount }: { score: number; validatedCount: number }) {
  const getScoreColor = () => {
    if (score >= 80) return 'from-emerald-500 to-green-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-orange-500 to-amber-500';
    return 'from-slate-500 to-gray-500';
  };
  
  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Limité';
  };
  
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center",
            getScoreColor()
          )}>
            <Award className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-white">{score}%</p>
              <Badge className={cn(
                "text-xs",
                score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-blue-500" : "bg-orange-500"
              )}>
                {getScoreLabel()}
              </Badge>
            </div>
            <p className="text-white/70 text-sm">Score de Confiance OKAR</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-400">{validatedCount}</p>
          <p className="text-white/50 text-xs">Interventions<br/>certifiées</p>
        </div>
      </div>
      
      {/* Score bar */}
      <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", getScoreColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      
      <p className="mt-2 text-white/40 text-xs flex items-center gap-1">
        <Lock className="w-3 h-3" />
        Historique infalsifiable vérifié par OKAR
      </p>
    </div>
  );
}

// ============================================
// HOME TAB COMPONENT
// ============================================
function HomeTab({ 
  vehicle, 
  userRole, 
  confidenceScore, 
  validatedCount,
  onShowQR,
  onReport,
  onEdit,
  onTransfer
}: { 
  vehicle: VehicleData; 
  userRole: UserRole;
  confidenceScore: number;
  validatedCount: number;
  onShowQR: () => void;
  onReport: () => void;
  onEdit: () => void;
  onTransfer: () => void;
}) {
  const vtDays = daysUntil(vehicle.vtEndDate);
  const insDays = daysUntil(vehicle.insuranceEndDate);
  
  return (
    <div className="min-h-full">
      {/* Hero Image with Parallax */}
      <div className="relative h-72 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
        {vehicle.mainPhoto ? (
          <img 
            src={vehicle.mainPhoto} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-24 h-24 text-slate-400 dark:text-slate-600" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Vehicle Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            {vehicle.make} {vehicle.model}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/80">{vehicle.year}</span>
            {vehicle.color && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-white/80">{vehicle.color}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-16 right-4">
          <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Actif
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* OKAR Confidence Score */}
        <ConfidenceScore score={confidenceScore} validatedCount={validatedCount} />
        
        {/* Quick Stats */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {vehicle.currentMileage.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">Kilomètres</div>
            </div>
            <div className="text-center border-x border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {vehicle.totalInterventions}
              </div>
              <div className="text-xs text-slate-500 mt-1">Interventions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {vehicle.ownerCount}
              </div>
              <div className="text-xs text-slate-500 mt-1">Propriétaires</div>
            </div>
          </div>
        </div>
        
        {/* License Plate */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Immatriculation</p>
              <p className="text-2xl font-mono font-bold text-white tracking-wider">
                {vehicle.licensePlate}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Référence</p>
              <p className="text-sm font-mono text-orange-400">{vehicle.reference}</p>
            </div>
          </div>
        </div>
        
        {/* Administrative Status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500" />
              Documents Administratifs
            </h3>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Visite Technique */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Visite Technique
                </span>
                <span className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-full",
                  vtDays && vtDays <= 0 ? "bg-red-100 text-red-600" :
                  vtDays && vtDays <= 30 ? "bg-orange-100 text-orange-600" :
                  "bg-emerald-100 text-emerald-600"
                )}>
                  {vtDays === null ? 'Non renseigné' :
                   vtDays <= 0 ? 'Expiré' :
                   `${vtDays} jours`}
                </span>
              </div>
              <div className={cn("h-2 rounded-full overflow-hidden", getProgressBg(vtDays))}>
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", getProgressColor(vtDays))}
                  style={{ 
                    width: vtDays === null ? '0%' : 
                           vtDays <= 0 ? '100%' :
                           `${Math.min(100, Math.max(0, 100 - (vtDays / 365) * 100))}%` 
                  }}
                />
              </div>
              {vehicle.vtEndDate && (
                <p className="text-xs text-slate-400">
                  Valide jusqu'au {formatDate(vehicle.vtEndDate)}
                </p>
              )}
            </div>
            
            {/* Assurance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Assurance
                </span>
                <span className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-full",
                  insDays && insDays <= 0 ? "bg-red-100 text-red-600" :
                  insDays && insDays <= 30 ? "bg-orange-100 text-orange-600" :
                  "bg-emerald-100 text-emerald-600"
                )}>
                  {insDays === null ? 'Non renseigné' :
                   insDays <= 0 ? 'Expiré' :
                   `${insDays} jours`}
                </span>
              </div>
              <div className={cn("h-2 rounded-full overflow-hidden", getProgressBg(insDays))}>
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", getProgressColor(insDays))}
                  style={{ 
                    width: insDays === null ? '0%' : 
                           insDays <= 0 ? '100%' :
                           `${Math.min(100, Math.max(0, 100 - (insDays / 365) * 100))}%` 
                  }}
                />
              </div>
              {vehicle.insuranceEndDate && (
                <p className="text-xs text-slate-400">
                  {vehicle.insuranceCompany || 'Assurance'} {vehicle.insurancePolicyNum && `• N° ${vehicle.insurancePolicyNum}`} • Valide jusqu'au {formatDate(vehicle.insuranceEndDate)}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Garage Info */}
        {vehicle.garageName && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center">
                {vehicle.garageLogo ? (
                  <img src={vehicle.garageLogo} alt={vehicle.garageName} className="w-10 h-10 object-contain" />
                ) : (
                  <Building2 className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 dark:text-white">{vehicle.garageName}</p>
                  {vehicle.garageCertified && (
                    <Badge className="bg-emerald-500 text-white text-xs">Certifié</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">Garage attitré</p>
              </div>
            </div>
          </div>
        )}
        
        {/* ===== GARAGE VIEW: Owner Contact Info ===== */}
        {userRole === 'garage' && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-3xl p-5 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-blue-500" />
              Informations Propriétaire
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Nom</span>
                <span className="font-medium text-slate-800 dark:text-white">{vehicle.ownerName || 'Non renseigné'}</span>
              </div>
              {vehicle.ownerPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Téléphone</span>
                  <a 
                    href={`tel:${vehicle.ownerPhone}`}
                    className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Phone className="w-4 h-4" />
                    {vehicle.ownerPhone}
                  </a>
                </div>
              )}
              {vehicle.ownerEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Email</span>
                  <a 
                    href={`mailto:${vehicle.ownerEmail}`}
                    className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Mail className="w-4 h-4" />
                    {vehicle.ownerEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ===== OWNER ACTIONS ===== */}
        {userRole === 'owner' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" />
                Gestion du Véhicule
              </h3>
            </div>
            <div className="p-2">
              <button 
                onClick={onShowQR}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-800 dark:text-white">Afficher mon QR Code</p>
                  <p className="text-xs text-slate-500">Montrer au garage ou à un acheteur</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
              
              <button 
                onClick={onEdit}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-800 dark:text-white">Modifier les infos</p>
                  <p className="text-xs text-slate-500">Kilométrage, photos, documents</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
              
              <button 
                onClick={onTransfer}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-800 dark:text-white">Transférer la propriété</p>
                  <p className="text-xs text-slate-500">Vendre ou céder ce véhicule</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-800 dark:text-white">Télécharger le certificat</p>
                  <p className="text-xs text-slate-500">PDF officiel OKAR</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        )}
        
        {/* ===== PUBLIC ACTIONS ===== */}
        {userRole === 'public' && (
          <>
            {/* Contact Seller (if for sale) */}
            {vehicle.forSale && (
              <div className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-4 shadow-lg z-30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Prix demandé</p>
                    <p className="text-2xl font-bold text-white">
                      {vehicle.salePrice?.toLocaleString() || 'Sur demande'} XOF
                    </p>
                  </div>
                  <a 
                    href={`https://wa.me/${vehicle.saleContact?.replace(/\D/g, '')}`}
                    className="bg-white text-orange-500 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
            
            {/* Report Anomaly Button */}
            <button 
              onClick={onReport}
              className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium"
            >
              <Flag className="w-5 h-5" />
              Signaler une anomalie
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// CARNET TAB COMPONENT
// ============================================
function CarnetTab({ 
  records, 
  expandedRecord, 
  setExpandedRecord,
  selectedFilter,
  setSelectedFilter,
  showFilters,
  setShowFilters,
  userRole
}: { 
  records: MaintenanceRecord[];
  expandedRecord: string | null;
  setExpandedRecord: (id: string | null) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  userRole: UserRole;
}) {
  // For public users, only show validated records
  // For garage and owner, show all records
  const displayRecords = userRole === 'public' 
    ? records.filter(r => r.ownerValidation === 'VALIDATED')
    : records;
  
  const filteredRecords = selectedFilter === 'all' 
    ? displayRecords 
    : displayRecords.filter(r => 
        (r.categories || [r.category]).includes(selectedFilter)
      );
  
  // Get all unique categories from all records
  const allCategories = displayRecords.flatMap(r => r.categories || [r.category]);
  const categories = [...new Set(allCategories)];
  
  const getValidationBadge = (validation: string) => {
    switch (validation) {
      case 'VALIDATED':
        return <Badge className="bg-emerald-500 text-white text-xs">Validé</Badge>;
      case 'PENDING':
        return <Badge className="bg-orange-500 text-white text-xs">En attente</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500 text-white text-xs">Rejeté</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className="p-4 pt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Carnet d'entretien
        </h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-2 rounded-xl transition-colors",
            showFilters 
              ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20" 
              : "bg-slate-100 text-slate-500 dark:bg-slate-800"
          )}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              selectedFilter === 'all'
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
                selectedFilter === cat
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              <span>{CATEGORY_CONFIG[cat]?.icon || '📋'}</span>
              {CATEGORY_CONFIG[cat]?.label || cat}
            </button>
          ))}
        </div>
      )}
      
      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
        <span>{filteredRecords.length} interventions</span>
        {userRole !== 'public' && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              {records.filter(r => r.ownerValidation === 'PENDING').length} en attente
            </span>
          </>
        )}
      </div>
      
      {/* Timeline */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Aucune intervention enregistrée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record, index) => (
            <div key={record.id} className="relative">
              {/* Timeline Line */}
              {index < filteredRecords.length - 1 && (
                <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
              )}
              
              {/* Card */}
              <div 
                onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                className={cn(
                  "bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer",
                  expandedRecord === record.id 
                    ? "border-orange-300 dark:border-orange-700 shadow-lg" 
                    : "border-slate-100 dark:border-slate-800"
                )}
              >
                <div className="p-4">
                  <div className="flex gap-3">
                    {/* Icon - Show all categories */}
                    <div className="flex gap-1">
                      {(record.categories || [record.category]).map((cat, i) => (
                        <div key={i} className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0",
                          CATEGORY_CONFIG[cat]?.color || 'bg-slate-500'
                        )}>
                          {CATEGORY_CONFIG[cat]?.icon || '📋'}
                        </div>
                      ))}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {(record.categories || [record.category]).map((cat, i) => (
                              <span key={i} className="font-semibold text-slate-800 dark:text-white text-sm">
                                {CATEGORY_CONFIG[cat]?.label || cat}
                                {i < (record.categories?.length || 1) - 1 && <span className="text-slate-400 mx-1">+</span>}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(record.interventionDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getValidationBadge(record.ownerValidation)}
                          {record.isLocked && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
                              <Lock className="w-3 h-3 text-emerald-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5" />
                          {record.mileage?.toLocaleString()} km
                        </span>
                        {record.garageName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {record.garageName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {expandedRecord === record.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
                    <div className="pt-4 space-y-3">
                      {record.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {record.description}
                        </p>
                      )}
                      
                      {record.mechanicName && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User className="w-4 h-4" />
                          <span>Mécanicien: {record.mechanicName}</span>
                        </div>
                      )}
                      
                      {record.invoicePhoto && (
                        <div className="mt-3">
                          <img 
                            src={record.invoicePhoto} 
                            alt="Facture"
                            className="w-full h-40 object-cover rounded-xl"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        Ajouté le {formatDate(record.createdAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// HISTORY TAB COMPONENT
// ============================================
function HistoryTab({ 
  vehicle, 
  ownershipHistory, 
  userRole 
}: { 
  vehicle: VehicleData;
  ownershipHistory: OwnershipRecord[];
  userRole: UserRole;
}) {
  return (
    <div className="p-4 pt-16">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
        Historique & Transparence
      </h2>
      
      {/* Owner Count */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 mb-4 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{vehicle.ownerCount}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">
              {vehicle.ownerCount === 1 ? 'Première main' : `${vehicle.ownerCount}ème main`}
            </p>
            <p className="text-sm text-slate-500">Nombre de propriétaires</p>
          </div>
        </div>
      </div>
      
      {/* Ownership Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden mb-4 border border-slate-100 dark:border-slate-800">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-orange-500" />
            Historique des propriétaires
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          {ownershipHistory.map((owner, index) => (
            <div key={owner.id} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 dark:text-white">{owner.ownerName}</p>
                  {owner.isCurrent && (
                    <Badge className="bg-emerald-500 text-white text-xs">Actuel</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(owner.startDate)} - {owner.endDate ? formatDate(owner.endDate) : "Aujourd'hui"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Mileage Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden mb-4 border border-slate-100 dark:border-slate-800">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Évolution du kilométrage
          </h3>
        </div>
        
        <div className="p-4">
          <div className="h-32 flex items-end gap-2">
            {vehicle.maintenanceRecords.slice(0, 10).reverse().map((record, i) => {
              const maxKm = Math.max(...vehicle.maintenanceRecords.map(r => r.mileage || 0));
              const height = record.mileage ? (record.mileage / maxKm) * 100 : 0;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-pink-500 rounded-t-lg transition-all"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="text-[8px] text-slate-400 mt-1 truncate w-full text-center">
                    {formatDate(record.interventionDate, true)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Sale Status */}
      <div className={cn(
        "rounded-3xl p-5 border",
        vehicle.forSale 
          ? "bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-500/10 dark:to-pink-500/10 border-orange-200 dark:border-orange-800"
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800 dark:text-white">
              {vehicle.forSale ? 'À Vendre' : 'En circulation'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {vehicle.forSale && vehicle.salePrice 
                ? `Prix: ${vehicle.salePrice.toLocaleString()} XOF`
                : 'Ce véhicule n\'est pas à vendre'}
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            vehicle.forSale ? "bg-orange-500" : "bg-emerald-500"
          )}>
            {vehicle.forSale 
              ? <span className="text-xl">🏷️</span>
              : <CheckCircle className="w-6 h-6 text-white" />
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ALERTS TAB COMPONENT
// ============================================
function AlertsTab({ vehicle }: { vehicle: VehicleData }) {
  const vtDays = daysUntil(vehicle.vtEndDate);
  const insDays = daysUntil(vehicle.insuranceEndDate);
  const kmLeft = vehicle.nextMaintenanceDueKm ? vehicle.nextMaintenanceDueKm - vehicle.currentMileage : null;
  
  const alerts = [
    {
      type: 'VT',
      icon: Shield,
      title: 'Visite Technique',
      daysLeft: vtDays,
      urgent: vtDays !== null && vtDays <= 7,
    },
    {
      type: 'INSURANCE',
      icon: FileText,
      title: 'Assurance',
      daysLeft: insDays,
      urgent: insDays !== null && insDays <= 7,
    },
    {
      type: 'MAINTENANCE',
      icon: Wrench,
      title: 'Prochain entretien',
      kmLeft,
      urgent: kmLeft !== null && kmLeft <= 500,
    },
  ];
  
  return (
    <div className="p-4 pt-16">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
        Planification & Alertes
      </h2>
      
      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.type}
            className={cn(
              "bg-white dark:bg-slate-900 rounded-2xl p-4 border",
              alert.urgent 
                ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-500/5"
                : "border-slate-100 dark:border-slate-800"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                alert.urgent ? "bg-red-500" : "bg-slate-100 dark:bg-slate-800"
              )}>
                <alert.icon className={cn(
                  "w-6 h-6",
                  alert.urgent ? "text-white" : "text-slate-500"
                )} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">{alert.title}</p>
                {alert.daysLeft !== null && alert.daysLeft !== undefined && (
                  <p className={cn(
                    "text-sm",
                    alert.urgent ? "text-red-600" : "text-slate-500"
                  )}>
                    {alert.daysLeft <= 0 ? 'Expiré!' : `${alert.daysLeft} jours restants`}
                  </p>
                )}
                {alert.kmLeft !== null && alert.kmLeft !== undefined && (
                  <p className={cn(
                    "text-sm",
                    alert.urgent ? "text-red-600" : "text-slate-500"
                  )}>
                    {alert.kmLeft <= 0 ? 'En retard!' : `${alert.kmLeft.toLocaleString()} km restants`}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Actions rapides</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-left">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <p className="font-medium text-slate-800 dark:text-white">Prendre RDV</p>
            <p className="text-xs text-slate-500 mt-0.5">Chez un garage partenaire</p>
          </button>
          
          <button className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-left">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="font-medium text-slate-800 dark:text-white">Trouver un garage</p>
            <p className="text-xs text-slate-500 mt-0.5">Garages certifiés OKAR</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VALIDATION TAB COMPONENT (Owner Only)
// ============================================
function ValidationTab({ 
  vehicle, 
  onRefresh 
}: { 
  vehicle: VehicleData;
  onRefresh: () => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);
  
  const pendingRecords = vehicle.maintenanceRecords.filter(r => r.ownerValidation === 'PENDING');
  
  const handleValidate = async (recordId: string, approve: boolean) => {
    setProcessing(recordId);
    
    try {
      const res = await fetch(`/api/maintenance-records/${recordId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });
      
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };
  
  if (pendingRecords.length === 0) {
    return (
      <div className="p-4 pt-16">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
          Validation des interventions
        </h2>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            Tout est à jour
          </h3>
          <p className="text-slate-500">
            Aucune intervention en attente de validation
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 pt-16">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
        Validation des interventions
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        {pendingRecords.length} intervention(s) soumises par les garages attendent votre validation
      </p>
      
      <div className="space-y-4">
        {pendingRecords.map((record) => (
          <div 
            key={record.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border-b border-orange-100 dark:border-orange-800">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl",
                  CATEGORY_CONFIG[record.category]?.color || 'bg-slate-500'
                )}>
                  {CATEGORY_CONFIG[record.category]?.icon || '📋'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {CATEGORY_CONFIG[record.category]?.label || record.category}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      {record.mileage?.toLocaleString()} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(record.interventionDate)}
                    </span>
                  </div>
                </div>
                <Badge className="bg-orange-500 text-white">En attente</Badge>
              </div>
            </div>
            
            {/* Details */}
            <div className="p-4 space-y-3">
              {record.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {record.description}
                </p>
              )}
              
              {record.garageName && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Building2 className="w-4 h-4" />
                  <span>Soumis par: {record.garageName}</span>
                </div>
              )}
              
              {record.totalCost && record.totalCost > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Coût total: {record.totalCost.toLocaleString()} XOF</span>
                </div>
              )}
              
              {record.invoicePhoto && (
                <img 
                  src={record.invoicePhoto} 
                  alt="Facture"
                  className="w-full h-32 object-cover rounded-xl"
                />
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleValidate(record.id, true)}
                  disabled={processing === record.id}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing === record.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className="w-5 h-5" />
                      Valider
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleValidate(record.id, false)}
                  disabled={processing === record.id}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing === record.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ThumbsDown className="w-5 h-5" />
                      Rejeter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// QR CODE MODAL
// ============================================
function QRCodeModal({ 
  vehicle, 
  code, 
  onClose 
}: { 
  vehicle: VehicleData;
  code: string;
  onClose: () => void;
}) {
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${code}`;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Mon QR Code</h3>
              <p className="text-white/80 text-sm">OKAR Passeport</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* QR Code */}
        <div className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <QRCode 
              value={qrUrl}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>
          
          <p className="mt-4 text-lg font-bold text-slate-800 dark:text-white">
            {vehicle.make} {vehicle.model}
          </p>
          <p className="text-sm text-slate-500">{vehicle.licensePlate}</p>
          <p className="mt-2 font-mono text-orange-500 text-sm">{code}</p>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// REPORT ANOMALY MODAL
// ============================================
function ReportAnomalyModal({ 
  vehicle, 
  onClose 
}: { 
  vehicle: VehicleData;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    type: 'info_incorrect',
    description: '',
    email: '',
  });
  
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/reports/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          type: form.type,
          description: form.description,
          reporterEmail: form.email || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert(data.error || 'Erreur lors de l\'envoi du signalement');
      }
    } catch (err) {
      console.error('Report error:', err);
      alert('Erreur lors de l\'envoi du signalement');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Signalement envoyé
          </h3>
          <p className="text-slate-500 mb-6">
            Merci pour votre signalement. Notre équipe va l'examiner dans les plus brefs délais.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Signaler une anomalie
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Vehicle Info */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500">Véhicule concerné</p>
          <p className="font-semibold text-slate-800 dark:text-white">
            {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
          </p>
        </div>
        
        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type d'anomalie
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              <option value="info_incorrect">Informations incorrectes</option>
              <option value="fake_record">Intervention suspecte/falsifiée</option>
              <option value="odometer_rollback">Kilométrage frauduleux</option>
              <option value="other">Autre</option>
            </select>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white resize-none"
              rows={4}
              placeholder="Décrivez l'anomalie que vous avez constatée..."
            />
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Votre email (optionnel)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              placeholder="Pour vous tenir informé"
            />
          </div>
          
          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.description}
            className="w-full py-4 bg-red-500 text-white font-semibold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Envoyer le signalement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EDIT VEHICLE MODAL
// ============================================
function EditVehicleModal({ 
  vehicle, 
  onClose, 
  onSuccess 
}: { 
  vehicle: VehicleData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    mileage: vehicle.currentMileage.toString(),
    vtEndDate: vehicle.vtEndDate ? vehicle.vtEndDate.split('T')[0] : '',
    insuranceEndDate: vehicle.insuranceEndDate ? vehicle.insuranceEndDate.split('T')[0] : '',
  });
  
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMileage: parseInt(form.mileage),
          vtEndDate: form.vtEndDate || null,
          insuranceEndDate: form.insuranceEndDate || null,
        }),
      });
      
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Modifier les informations
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Mileage */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Kilométrage actuel
            </label>
            <input
              type="number"
              value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              placeholder="Kilométrage"
            />
          </div>
          
          {/* VT End Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Expiration Visite Technique
            </label>
            <input
              type="date"
              value={form.vtEndDate}
              onChange={(e) => setForm({ ...form, vtEndDate: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            />
          </div>
          
          {/* Insurance End Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Expiration Assurance
            </label>
            <input
              type="date"
              value={form.insuranceEndDate}
              onChange={(e) => setForm({ ...form, insuranceEndDate: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            />
          </div>
          
          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TRANSFER OWNERSHIP MODAL
// ============================================
function TransferOwnershipModal({ 
  vehicle, 
  onClose, 
  onSuccess 
}: { 
  vehicle: VehicleData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    newOwnerName: '',
    newOwnerPhone: '',
    transferPrice: '',
    transferType: 'sale',
  });
  
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/vehicle/${vehicle.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newOwnerName: form.newOwnerName,
          newOwnerPhone: form.newOwnerPhone,
          transferPrice: form.transferPrice ? parseFloat(form.transferPrice) : null,
          transferType: form.transferType,
        }),
      });
      
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Transférer la propriété
              </h3>
              <p className="text-xs text-slate-500">Vendre ou céder ce véhicule</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Vehicle Info */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500">Véhicule</p>
          <p className="font-semibold text-slate-800 dark:text-white">
            {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.licensePlate}
          </p>
        </div>
        
        {/* Warning */}
        <div className="mx-5 mt-4 p-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-800">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Attention
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Cette action est irréversible. Une fois transféré, vous n'aurez plus accès à la gestion de ce véhicule.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Transfer Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type de transfert
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setForm({ ...form, transferType: 'sale' })}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all",
                  form.transferType === 'sale'
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <span className="text-2xl">💰</span>
                <p className="text-sm font-medium text-slate-800 dark:text-white mt-1">Vente</p>
              </button>
              <button
                onClick={() => setForm({ ...form, transferType: 'gift' })}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all",
                  form.transferType === 'gift'
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <span className="text-2xl">🎁</span>
                <p className="text-sm font-medium text-slate-800 dark:text-white mt-1">Don</p>
              </button>
            </div>
          </div>
          
          {/* New Owner Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nom du nouveau propriétaire *
            </label>
            <input
              type="text"
              value={form.newOwnerName}
              onChange={(e) => setForm({ ...form, newOwnerName: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              placeholder="Amadou Diallo"
            />
          </div>
          
          {/* New Owner Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Téléphone du nouveau propriétaire *
            </label>
            <input
              type="tel"
              value={form.newOwnerPhone}
              onChange={(e) => setForm({ ...form, newOwnerPhone: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              placeholder="+221 77 123 45 67"
            />
          </div>
          
          {/* Price (if sale) */}
          {form.transferType === 'sale' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prix de vente (XOF)
              </label>
              <input
                type="number"
                value={form.transferPrice}
                onChange={(e) => setForm({ ...form, transferPrice: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                placeholder="5 000 000"
              />
            </div>
          )}
          
          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.newOwnerName || !form.newOwnerPhone}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Transfert en cours...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-5 h-5" />
                Confirmer le transfert
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADD INTERVENTION MODAL
// ============================================
function AddInterventionModal({
  vehicleId,
  currentMileage,
  onClose,
  onSuccess
}: {
  vehicleId: string;
  currentMileage: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: 'vidange',
    description: '',
    mileage: currentMileage.toString(),
    partsList: '',
    totalCost: '',
  });
  
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/garage/intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          category: form.category,
          description: form.description,
          mileage: parseInt(form.mileage),
          partsList: form.partsList || undefined,
          totalCost: form.totalCost ? parseFloat(form.totalCost) : 0,
        }),
      });
      
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Nouvelle Intervention
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type d'intervention
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_CONFIG).slice(0, 9).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, category: key })}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all",
                    form.category === key
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                      : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  <span className="text-lg">{config.icon}</span>
                  <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">{config.label}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Mileage */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Kilométrage
            </label>
            <input
              type="number"
              value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              placeholder="Kilométrage actuel"
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white resize-none"
              rows={3}
              placeholder="Décrivez l'intervention..."
            />
          </div>
          
          {/* Total Cost */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Coût total (XOF)
            </label>
            <input
              type="number"
              value={form.totalCost}
              onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              placeholder="25000"
            />
          </div>
          
          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.description}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Enregistrer l'intervention
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
