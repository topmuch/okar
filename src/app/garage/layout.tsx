'use client';

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Car,
  QrCode,
  Wrench,
  Home,
  Package,
  User,
  Menu,
  X,
  Shield,
  LogOut,
  Settings,
  ChevronDown,
  Camera,
  Bell,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// Debug
// ============================================
const DEBUG = process.env.NODE_ENV === 'development';
function debugLog(...args: unknown[]) {
  if (DEBUG) console.log('[GARAGE_LAYOUT]', ...args);
}

// ============================================
// Colors
// ============================================
const COLORS = {
  pageBg: '#121214',
  cardBg: '#1E1E24',
  cardBorder: '#2A2A35',
  primary: '#FF6600',
  primaryLight: '#FF8533',
};

// ============================================
// Garage Context
// ============================================
const GarageContext = createContext<{
  garageId: string;
  garageName: string;
  isCertified: boolean;
}>({
  garageId: '',
  garageName: '',
  isCertified: false,
});

export const useGarage = () => useContext(GarageContext);

// ============================================
// Navigation
// ============================================
const navItems = [
  { label: 'Accueil', href: '/garage/tableau-de-bord', icon: Home },
  { label: 'Chantiers', href: '/garage/interventions', icon: Wrench },
  { label: 'Stock OKAR', href: '/garage/stock-qr', icon: Package },
  { label: 'Profil', href: '/garage/profil', icon: User },
];

const bottomNavItems = [
  { label: 'Accueil', href: '/garage/tableau-de-bord', icon: Home },
  { label: 'Chantiers', href: '/garage/interventions', icon: Wrench },
  { label: 'Scanner', href: '/garage/scanner', icon: Camera, highlight: true },
  { label: 'Stock', href: '/garage/stock-qr', icon: Package },
  { label: 'Profil', href: '/garage/profil', icon: User },
];

// ============================================
// Layout Component
// ============================================
export default function GarageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, initialized, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const redirectAttempted = useRef(false);

  const garageId = user?.garageId || '';
  const garageName = user?.garage?.name || 'Mon Garage OKAR';
  const isCertified = user?.garage?.isCertified || false;

  // ============================================
  // Handle redirects - AFTER initialization
  // ============================================
  useEffect(() => {
    debugLog('Effect:', { loading, initialized, hasUser: !!user, pathname });

    // Wait for initialization
    if (!initialized || loading) return;

    // Skip for login/registration pages
    if (pathname === '/garage/connexion' || pathname === '/garage/inscrire' || pathname === '/garage/activate') {
      return;
    }

    // Prevent duplicate redirects
    if (redirectAttempted.current) return;

    // No user - redirect to login
    if (!user) {
      debugLog('No user, redirecting to login');
      redirectAttempted.current = true;
      setTimeout(() => router.replace('/garage/connexion'), 0);
      return;
    }

    // User is not a garage - redirect to correct area
    if (user.role !== 'garage') {
      debugLog('User not garage, redirecting');
      redirectAttempted.current = true;
      
      let redirectPath = '/';
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        redirectPath = '/admin/tableau-de-bord';
      } else if (user.role === 'agency') {
        redirectPath = '/agence/tableau-de-bord';
      } else if (user.role === 'driver') {
        redirectPath = '/driver/tableau-de-bord';
      }
      
      setTimeout(() => router.replace(redirectPath), 0);
    }
  }, [user, loading, initialized, router, pathname]);

  // Reset when user changes
  useEffect(() => {
    redirectAttempted.current = false;
  }, [user?.id]);

  // ============================================
  // Force dark mode
  // ============================================
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // ============================================
  // Handle logout
  // ============================================
  const handleLogout = async () => {
    await logout();
    router.push('/garage/connexion');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // ============================================
  // Don't wrap login/registration pages
  // ============================================
  if (pathname === '/garage/connexion' || pathname === '/garage/inscrire' || pathname === '/garage/activate') {
    return <>{children}</>;
  }

  // ============================================
  // Show loading state
  // ============================================
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.pageBg }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#FF6600] animate-spin" />
          <p className="text-[#B0B0B0] text-sm">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Don't render if not authenticated or not garage
  // ============================================
  if (!user || user.role !== 'garage') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.pageBg }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#FF6600] animate-spin" />
          <p className="text-[#B0B0B0] text-sm">Redirection...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Render layout
  // ============================================
  return (
    <GarageContext.Provider value={{ garageId, garageName, isCertified }}>
      <div className="min-h-screen text-white" style={{ backgroundColor: COLORS.pageBg }}>
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4" style={{ backgroundColor: COLORS.cardBg, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
          <Link href="/garage/tableau-de-bord" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-tight">OKAR</span>
              <span className="text-[10px] text-[#6B6B75] block -mt-1">PASS</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl" style={{ backgroundColor: '#121214' }}>
              <Bell className="w-5 h-5 text-[#B0B0B0]" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS.primary }} />
            </button>
            <button onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-xl" style={{ backgroundColor: '#121214' }}>
              <Menu className="w-6 h-6 text-[#B0B0B0]" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: COLORS.cardBg, borderRight: `1px solid ${COLORS.cardBorder}` }}>
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="h-20 flex items-center justify-between px-5" style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <Link href="/garage/tableau-de-bord" className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-black text-2xl text-white tracking-tight">OKAR</span>
                  <span className="text-[10px] text-[#6B6B75] block -mt-1">L'histoire réelle de votre voiture.</span>
                </div>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-xl" style={{ backgroundColor: '#121214' }}>
                <X className="w-5 h-5 text-[#B0B0B0]" />
              </button>
            </div>

            {/* Garage Info */}
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: '#121214' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#252530' }}>
                  <User className="w-6 h-6 text-[#B0B0B0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{garageName}</p>
                  {isCertified && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.primary }}>
                      <Shield className="w-3.5 h-3.5" />
                      CERTIFIÉ OKAR
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <p className="text-xs font-semibold text-[#6B6B75] uppercase tracking-wider mb-3">Actions Rapides</p>
              <div className="space-y-2">
                <Link href="/garage/scanner" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-white font-semibold transition-all" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
                  <Camera className="w-5 h-5" />
                  Scanner un Véhicule
                </Link>
                <Link href="/garage/activer-qr" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-white font-medium transition-all" style={{ backgroundColor: '#121214', border: `1px solid ${COLORS.cardBorder}` }}>
                  <QrCode className="w-5 h-5" style={{ color: COLORS.primary }} />
                  Activer un Pass OKAR
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-5 overflow-y-auto">
              <p className="text-xs font-semibold text-[#6B6B75] uppercase tracking-wider mb-3">Navigation</p>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'border-l-4 pl-3' : 'hover:bg-[#252530]'}`} style={active ? { backgroundColor: 'rgba(255, 102, 0, 0.1)', color: COLORS.primary, borderLeftColor: COLORS.primary } : { color: '#B0B0B0' }}>
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User Menu */}
            <div className="p-5" style={{ borderTop: `1px solid ${COLORS.cardBorder}` }}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: '#121214' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#252530' }}>
                  <Settings className="w-5 h-5 text-[#B0B0B0]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">Paramètres</p>
                  <p className="text-xs text-[#6B6B75]">Configuration garage</p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} style={{ color: '#6B6B75' }} />
              </button>
              {userMenuOpen && (
                <div className="mt-2 py-2">
                  <Link href="/garage/profil" className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors" style={{ color: '#B0B0B0' }} onClick={() => setUserMenuOpen(false)}>
                    <User className="w-4 h-4" />
                    Mon Profil
                  </Link>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors" style={{ color: '#EF4444' }} onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen pb-24 lg:pb-0">
          <div className="p-4 lg:p-8">{children}</div>
        </main>

        {/* Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 z-40" style={{ backgroundColor: COLORS.cardBg, borderTop: `1px solid ${COLORS.cardBorder}` }}>
          <div className="flex items-center justify-around h-full px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              if (item.highlight) {
                return (
                  <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-16 h-16 -mt-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
                    <Icon className="w-6 h-6 text-white" />
                    <span className="text-[10px] font-semibold text-white mt-1">{item.label}</span>
                  </Link>
                );
              }
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-16 h-16 rounded-xl" style={{ color: active ? COLORS.primary : '#6B6B75' }}>
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </GarageContext.Provider>
  );
}
