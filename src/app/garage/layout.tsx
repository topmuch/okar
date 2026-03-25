'use client';

import { useState, useEffect, createContext, useContext } from 'react';
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
  Moon,
  Sun,
  Bell,
  History,
  FileText
} from 'lucide-react';
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
};

// OKAR Brand Colors
const OKAR_ORANGE = COLORS.primary;
const OKAR_ORANGE_DARK = COLORS.primaryDark;

// Garage context
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

// Navigation items - OKAR branding
const navItems = [
  { label: 'Accueil', href: '/garage/tableau-de-bord', icon: Home },
  { label: 'Chantiers', href: '/garage/interventions', icon: Wrench },
  { label: 'Stock OKAR', href: '/garage/stock-qr', icon: Package },
  { label: 'Profil', href: '/garage/profil', icon: User },
];

// Bottom navigation for mobile PWA
const bottomNavItems = [
  { label: 'Accueil', href: '/garage/tableau-de-bord', icon: Home },
  { label: 'Chantiers', href: '/garage/interventions', icon: Wrench },
  { label: 'Scanner', href: '/garage/scanner', icon: Camera, highlight: true },
  { label: 'Stock', href: '/garage/stock-qr', icon: Package },
  { label: 'Profil', href: '/garage/profil', icon: User },
];

export default function GarageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Dark mode by default for OKAR

  // Get garage data from auth context
  const garageId = user?.garageId || '';
  const garageName = user?.garage?.name || 'Mon Garage OKAR';
  const isCertified = user?.garage?.isCertified || false;

  // Redirect if not authenticated or not a garage
  useEffect(() => {
    if (loading) return;

    // Skip redirect for login and registration pages
    if (pathname === '/garage/connexion' || pathname === '/garage/inscrire' || pathname === '/garage/activate') {
      return;
    }

    if (!user) {
      router.replace('/garage/connexion');
      return;
    }

    if (user.role !== 'garage') {
      // User is authenticated but not a garage - redirect to their correct area
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        router.replace('/admin/tableau-de-bord');
      } else if (user.role === 'agency') {
        router.replace('/agence/tableau-de-bord');
      } else if (user.role === 'driver') {
        router.replace('/driver/tableau-de-bord');
      } else {
        // Unknown role - redirect to home
        router.replace('/');
      }
    }
  }, [user, loading, router, pathname]);

  // Force dark mode for OKAR (workshop-friendly)
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('garage_dark_mode', String(darkMode));
  }, [darkMode]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await logout();
    router.push('/garage/connexion');
  };

  // Don't wrap login/registration pages with sidebar
  if (pathname === '/garage/connexion' || pathname === '/garage/inscrire' || pathname === '/garage/activate') {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.pageBg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6600]/30 border-t-[#FF6600] rounded-full animate-spin"></div>
          <p className="text-[#B0B0B0] text-sm">Vérification...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not a garage
  if (!user || user.role !== 'garage') {
    return null;
  }

  return (
    <GarageContext.Provider value={{ garageId, garageName, isCertified }}>
      <div className="min-h-screen text-white" style={{ backgroundColor: COLORS.pageBg }}>
        {/* Mobile Header - OKAR Style */}
        <header 
          className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4"
          style={{ backgroundColor: COLORS.cardBg, borderBottom: `1px solid ${COLORS.cardBorder}` }}
        >
          <Link href="/garage/tableau-de-bord" className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)', boxShadow: '0 10px 30px -5px rgba(255, 102, 0, 0.4)' }}
            >
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-tight">OKAR</span>
              <span className="text-[10px] text-[#6B6B75] block -mt-1">PASS</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button 
              className="relative p-2.5 rounded-xl transition-colors"
              style={{ backgroundColor: '#121214' }}
            >
              <Bell className="w-5 h-5 text-[#B0B0B0]" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS.primary }} />
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl transition-colors"
              style={{ backgroundColor: '#121214' }}
            >
              <Menu className="w-6 h-6 text-[#B0B0B0]" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Desktop */}
        <aside
          className={`fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ backgroundColor: COLORS.cardBg, borderRight: `1px solid ${COLORS.cardBorder}` }}
        >
          <div className="h-full flex flex-col">
            {/* Logo - OKAR Brand */}
            <div 
              className="h-20 flex items-center justify-between px-5"
              style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}
            >
              <Link href="/garage/tableau-de-bord" className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)', boxShadow: '0 10px 30px -5px rgba(255, 102, 0, 0.5)' }}
                >
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-black text-2xl text-white tracking-tight">OKAR</span>
                  <span className="text-[10px] text-[#6B6B75] block -mt-1">L'histoire réelle de votre voiture.</span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{ backgroundColor: '#121214' }}
              >
                <X className="w-5 h-5 text-[#B0B0B0]" />
              </button>
            </div>

            {/* Garage Info Badge */}
            <div 
              className="px-5 py-4"
              style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}
            >
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: '#121214' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#252530' }}>
                  <User className="w-6 h-6 text-[#B0B0B0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {garageName}
                  </p>
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
            <div 
              className="px-5 py-4"
              style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}
            >
              <p className="text-xs font-semibold text-[#6B6B75] uppercase tracking-wider mb-3">Actions Rapides</p>
              <div className="space-y-2">
                <Link
                  href="/garage/scanner"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl text-white font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)', boxShadow: '0 10px 30px -5px rgba(255, 102, 0, 0.4)' }}
                >
                  <Camera className="w-5 h-5" />
                  Scanner un Véhicule
                </Link>
                <Link
                  href="/garage/activer-qr"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl text-white font-medium transition-all"
                  style={{ backgroundColor: '#121214', border: `1px solid ${COLORS.cardBorder}` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252530'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#121214'}
                >
                  <QrCode className="w-5 h-5" style={{ color: COLORS.primary }} />
                  Activer un Pass OKAR
                </Link>
                <Link
                  href="/garage/inscrire"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl text-white font-medium transition-all"
                  style={{ backgroundColor: '#121214', border: `1px solid ${COLORS.cardBorder}` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252530'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#121214'}
                >
                  <User className="w-5 h-5" style={{ color: COLORS.primary }} />
                  Inscription Client
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
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? 'border-l-4 pl-3'
                            : 'hover:bg-[#252530] hover:text-white'
                        }`}
                        style={active ? { 
                          backgroundColor: 'rgba(255, 102, 0, 0.1)', 
                          color: COLORS.primary,
                          borderLeftColor: COLORS.primary 
                        } : { color: '#B0B0B0' }}
                      >
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
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ backgroundColor: '#121214' }}
              >
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
                  <Link
                    href="/garage/profil"
                    className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors"
                    style={{ color: '#B0B0B0' }}
                    onClick={() => setUserMenuOpen(false)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252530'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User className="w-4 h-4" />
                    Mon Profil
                  </Link>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors"
                    style={{ color: '#EF4444' }}
                    onClick={handleLogout}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
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
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Mobile PWA */}
        <nav 
          className="lg:hidden fixed bottom-0 left-0 right-0 h-20 z-40"
          style={{ backgroundColor: COLORS.cardBg, borderTop: `1px solid ${COLORS.cardBorder}` }}
        >
          <div className="flex items-center justify-around h-full px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center justify-center w-16 h-16 -mt-8 rounded-2xl transition-all"
                    style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)', boxShadow: '0 10px 30px -5px rgba(255, 102, 0, 0.5)' }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                    <span className="text-[10px] font-semibold text-white mt-1">{item.label}</span>
                  </Link>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-colors"
                  style={{ color: active ? COLORS.primary : '#6B6B75' }}
                >
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
