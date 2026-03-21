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

// OKAR Brand Colors
const OKAR_ORANGE = '#FF6600';
const OKAR_ORANGE_DARK = '#E65C00';

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
      // User is authenticated but not a garage - redirect to their area
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        router.replace('/admin/tableau-de-bord');
      } else {
        router.replace('/agence/tableau-de-bord');
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6600]/30 border-t-[#FF6600] rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm">Vérification...</p>
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
      <div className="min-h-screen bg-black dark:bg-black text-white">
        {/* Mobile Header - OKAR Style */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 z-40 flex items-center justify-between px-4">
          <Link href="/garage/tableau-de-bord" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6600] to-[#FF8533] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-tight">OKAR</span>
              <span className="text-[10px] text-zinc-500 block -mt-1">PASS</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button className="relative p-2.5 hover:bg-zinc-800 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-zinc-400" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF6600] rounded-full animate-pulse" />
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6 text-zinc-300" />
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
          className={`fixed top-0 left-0 h-full w-72 bg-zinc-950 border-r border-zinc-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo - OKAR Brand */}
            <div className="h-20 flex items-center justify-between px-5 border-b border-zinc-800">
              <Link href="/garage/tableau-de-bord" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6600] to-[#FF8533] rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/40">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-black text-2xl text-white tracking-tight">OKAR</span>
                  <span className="text-[10px] text-zinc-500 block -mt-1">L'histoire réelle de votre voiture.</span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Garage Info Badge */}
            <div className="px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-2xl">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {garageName}
                  </p>
                  {isCertified && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#FF6600] font-medium">
                      <Shield className="w-3.5 h-3.5" />
                      CERTIFIÉ OKAR
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-5 py-4 border-b border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Actions Rapides</p>
              <div className="space-y-2">
                <Link
                  href="/garage/scanner"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#FF6600] to-[#FF8533] rounded-2xl text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Scanner un Véhicule
                </Link>
                <Link
                  href="/garage/activer-qr"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-white font-medium border border-zinc-700 transition-all"
                >
                  <QrCode className="w-5 h-5 text-[#FF6600]" />
                  Activer un Pass OKAR
                </Link>
                <Link
                  href="/garage/inscrire"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-white font-medium border border-zinc-700 transition-all"
                >
                  <User className="w-5 h-5 text-[#FF6600]" />
                  Inscription Client
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-5 overflow-y-auto">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Navigation</p>
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
                            ? 'bg-[#FF6600]/10 text-[#FF6600] border-l-4 border-[#FF6600] pl-3'
                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
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
            <div className="p-5 border-t border-zinc-800">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">Paramètres</p>
                  <p className="text-xs text-zinc-500">Configuration garage</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="mt-2 py-2">
                  <Link
                    href="/garage/profil"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Mon Profil
                  </Link>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    onClick={handleLogout}
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-zinc-950 border-t border-zinc-800 z-40">
          <div className="flex items-center justify-around h-full px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center justify-center w-16 h-16 -mt-8 bg-gradient-to-br from-[#FF6600] to-[#FF8533] rounded-2xl shadow-xl shadow-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/50 transition-all"
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
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-colors ${
                    active ? 'text-[#FF6600]' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
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
