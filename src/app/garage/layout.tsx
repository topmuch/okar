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
  Bell,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Debug
const DEBUG = process.env.NODE_ENV === 'development';
function log(...args: unknown[]) { if (DEBUG) console.log('[GARAGE]', ...args); }

// Colors
const COLORS = {
  pageBg: '#121214',
  cardBg: '#1E1E24',
  cardBorder: '#2A2A35',
  primary: '#FF6600',
};

// Garage Context
const GarageContext = createContext<{ garageId: string; garageName: string; isCertified: boolean }>({ garageId: '', garageName: '', isCertified: false });
export const useGarage = () => useContext(GarageContext);

// Navigation
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
// MAIN LAYOUT - LE JUGE PATIENT
// ============================================
export default function GarageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const garageId = user?.garageId || '';
  const garageName = user?.garage?.name || 'Mon Garage OKAR';
  const isCertified = user?.garage?.isCertified || false;

  // ============================================
  // LOGIQUE DE REDIRECTION - PATIENTE
  // ============================================
  useEffect(() => {
    log('Effect:', { loading, hasUser: !!user, userRole: user?.role, pathname });

    // 1. SI ÇA CHARGE ENCORE : On ne fait RIEN
    // C'est cette ligne qui empêche la boucle !
    if (loading) {
      log('⏳ En attente du chargement...');
      return;
    }

    // Ne pas rediriger sur les pages de login/inscription
    if (pathname === '/garage/connexion' || pathname === '/garage/inscrire' || pathname === '/garage/activate') {
      log('📍 Page de login, pas de redirection');
      return;
    }

    // 2. SI ÇA A FINI DE CHARGER ET QU'IL N'Y A PAS D'USER
    if (!loading && !user) {
      log('❌ Pas d\'utilisateur après chargement, redirection login');
      router.replace('/garage/connexion');
      return;
    }

    // 3. SI USER MAIS PAS LE BON RÔLE
    if (!loading && user && user.role !== 'garage') {
      log('⚠️ Mauvais rôle, redirection vers la bonne zone');
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        router.replace('/admin/tableau-de-bord');
      } else if (user.role === 'agency') {
        router.replace('/agence/tableau-de-bord');
      } else if (user.role === 'driver') {
        router.replace('/driver/tableau-de-bord');
      } else {
        router.replace('/');
      }
    }
  }, [user, loading, router, pathname]);

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/garage/connexion');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // ============================================
  // Ne pas wrapper les pages de login
  // ============================================
  if (pathname === '/garage/connexion' || pathname === '/garage/inscrire' || pathname === '/garage/activate') {
    return <>{children}</>;
  }

  // ============================================
  // AFFICHAGE PENDANT LE CHARGEMENT
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.pageBg }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#FF6600] animate-spin" />
          <p className="text-[#B0B0B0] text-sm">Chargement de votre espace OKAR...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // SI PAS D'USER APRÈS CHARGEMENT = REDIRECTION
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
  // AFFICHAGE NORMAL SI CONNECTÉ
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
            </button>
            <button onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-xl" style={{ backgroundColor: '#121214' }}>
              <Menu className="w-6 h-6 text-[#B0B0B0]" />
            </button>
          </div>
        </header>

        {/* Sidebar Overlay */}
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
                      <Shield className="w-3.5 h-3.5" /> CERTIFIÉ OKAR
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <p className="text-xs font-semibold text-[#6B6B75] uppercase tracking-wider mb-3">Actions Rapides</p>
              <div className="space-y-2">
                <Link href="/garage/scanner" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-white font-semibold" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
                  <Camera className="w-5 h-5" /> Scanner un Véhicule
                </Link>
                <Link href="/garage/activer-qr" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl text-white font-medium" style={{ backgroundColor: '#121214', border: `1px solid ${COLORS.cardBorder}` }}>
                  <QrCode className="w-5 h-5" style={{ color: COLORS.primary }} /> Activer un Pass OKAR
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
                        <Icon className="w-5 h-5" /> {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User Menu */}
            <div className="p-5" style={{ borderTop: `1px solid ${COLORS.cardBorder}` }}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="w-full flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#121214' }}>
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
                  <Link href="/garage/profil" className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl" style={{ color: '#B0B0B0' }} onClick={() => setUserMenuOpen(false)}>
                    <User className="w-4 h-4" /> Mon Profil
                  </Link>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl" style={{ color: '#EF4444' }} onClick={handleLogout}>
                    <LogOut className="w-4 h-4" /> Déconnexion
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
