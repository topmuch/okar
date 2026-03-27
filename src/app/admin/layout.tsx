'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Search,
  Users,
  MessageSquare,
  Settings,
  BarChart3,
  Shield,
  Globe,
  UserPlus,
  Megaphone,
  Newspaper,
  Database,
  LayoutDashboard,
  Building2,
  Package,
  ClipboardCheck,
  Car,
  Calendar,
  MapPin,
  AlertTriangle,
  Wrench,
  Loader2
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/admin/NotificationBell';
import { PERMISSIONS, ROLES, ROLE_COLORS, Permission } from '@/lib/permissions';

// Debug
const DEBUG = process.env.NODE_ENV === 'development';
function log(...args: unknown[]) { if (DEBUG) console.log('[ADMIN]', ...args); }

// ============================================
// Types
// ============================================
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  isCategory?: boolean;
  permission?: Permission;
  roles?: string[];
}

// ============================================
// Sidebar Component
// ============================================
function Sidebar({
  isOpen,
  setIsOpen,
  unreadMessages,
  onLogout,
  userName,
  userRole
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  unreadMessages?: number;
  onLogout: () => void;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const { can } = useAuth();

  const allMenuItems: MenuItem[] = useMemo(() => [
    { label: "Tableau de bord", icon: <LayoutDashboard className="w-5 h-5" />, href: "/admin/tableau-de-bord", roles: ['superadmin', 'admin'] },
    { label: "VÉHICULES", icon: null, isCategory: true },
    { label: "Tous les véhicules", icon: <Car className="w-5 h-5" />, href: "/admin/vehicles", roles: ['superadmin', 'admin'] },
    { label: "Expirations", icon: <Calendar className="w-5 h-5" />, href: "/admin/expirations", roles: ['superadmin', 'admin'] },
    { label: "GARAGES", icon: null, isCategory: true },
    { label: "Garages partenaires", icon: <Building2 className="w-5 h-5" />, href: "/admin/garages", roles: ['superadmin', 'admin'] },
    { label: "Demandes d'adhésion", icon: <ClipboardCheck className="w-5 h-5" />, href: "/admin/demandes-garages", roles: ['superadmin', 'admin'] },
    { label: "QR CODES", icon: null, isCategory: true },
    { label: "Générer QR", icon: <QrCode className="w-5 h-5" />, href: "/admin/generer" },
    { label: "Stock QR", icon: <Package className="w-5 h-5" />, href: "/admin/qrcodes" },
    { label: "SÉCURITÉ", icon: null, isCategory: true, roles: ['superadmin', 'admin'] },
    { label: "Utilisateurs", icon: <Users className="w-5 h-5" />, href: "/admin/utilisateurs", roles: ['superadmin', 'admin'] },
    { label: "CONFIGURATION", icon: null, isCategory: true },
    { label: "Paramètres", icon: <Settings className="w-5 h-5" />, href: "/admin/parametres" },
    { label: "MARKETING", icon: null, isCategory: true, roles: ['superadmin'] },
    { label: "CRM", icon: <UserPlus className="w-5 h-5" />, href: "/admin/crm", roles: ['superadmin', 'admin', 'agent'] },
    { label: "Rapports", icon: <BarChart3 className="w-5 h-5" />, href: "/admin/rapports" },
  ], [unreadMessages]);

  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => {
      if (item.isCategory) return true;
      if (item.roles && item.roles.length > 0) return item.roles.includes(userRole);
      return true;
    });
  }, [allMenuItems, userRole]);

  const roleLabel = ROLES[userRole as keyof typeof ROLES] || userRole;
  const roleColor = ROLE_COLORS[userRole as keyof typeof ROLE_COLORS] || 'bg-gray-500';

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-[#ff7f00] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col shadow-2xl`}>
        <div className="p-6 border-b border-white/10">
          <Link href="/admin/tableau-de-bord" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">OKAR</span>
              <span className="block text-xs text-white/60 font-medium">Administration</span>
            </div>
          </Link>
          <button className="lg:hidden absolute top-6 right-4 text-white/60 hover:text-white" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.isCategory) {
                return <li key={index} className="pt-4 first:pt-0"><span className="px-4 text-xs font-semibold text-white uppercase tracking-wider">{item.label}</span></li>;
              }
              const isActive = pathname === item.href;
              return (
                <li key={index}>
                  <Link href={item.href!} className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-black text-white shadow-lg' : 'bg-black text-white hover:bg-black/80'}`} onClick={() => setIsOpen(false)}>
                    <span className="shrink-0 text-white">{item.icon}</span>
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20">
            <div className={`w-10 h-10 rounded-full ${roleColor} flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">{userName?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-white/60">{roleLabel}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-black text-white hover:bg-black/80 transition-all duration-200 w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ============================================
// Header Component
// ============================================
function Header({ onMenuClick, userName, userRole }: { onMenuClick: () => void; userName: string; userRole: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const roleLabel = ROLES[userRole as keyof typeof ROLES] || userRole;
  const roleColor = ROLE_COLORS[userRole as keyof typeof ROLE_COLORS] || 'bg-gray-500';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 w-80">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          <NotificationBell />
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className={`w-9 h-9 rounded-full ${roleColor} flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">{userName?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================
// MAIN LAYOUT - LE JUGE PATIENT
// ============================================
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout, isSuperAdmin, isAdmin, isAgent } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const hasAdminAccess = isSuperAdmin || isAdmin || isAgent;

  // ============================================
  // LOGIQUE DE REDIRECTION - PATIENTE
  // ============================================
  useEffect(() => {
    log('Effect:', { loading, hasUser: !!user, hasAdminAccess, pathname });

    // 1. SI ÇA CHARGE ENCORE : On ne fait RIEN
    // C'est cette ligne qui empêche la boucle !
    if (loading) {
      log('⏳ En attente du chargement...');
      return;
    }

    // Ne pas rediriger sur les pages de login
    if (pathname === '/admin/connexion' || pathname === '/admin/login') {
      log('📍 Page de login, pas de redirection');
      return;
    }

    // 2. SI ÇA A FINI DE CHARGER ET QU'IL N'Y A PAS D'USER
    if (!loading && !user) {
      log('❌ Pas d\'utilisateur après chargement, redirection login');
      router.replace('/admin/connexion');
      return;
    }

    // 3. SI USER MAIS PAS LES BONS DROITS
    if (!loading && user && !hasAdminAccess) {
      log('⚠️ Mauvais rôle, redirection vers la bonne zone');
      if (user.role === 'garage') {
        router.replace('/garage/tableau-de-bord');
      } else if (user.role === 'agency') {
        router.replace('/agence/tableau-de-bord');
      } else if (user.role === 'driver') {
        router.replace('/driver/tableau-de-bord');
      } else {
        router.replace('/');
      }
    }
  }, [user, loading, hasAdminAccess, router, pathname]);

  // ============================================
  // Handle logout
  // ============================================
  const handleLogout = async () => {
    await logout();
    router.replace('/admin/connexion');
  };

  // ============================================
  // Ne pas wrapper les pages de login
  // ============================================
  if (pathname === '/admin/connexion' || pathname === '/admin/login') {
    return <>{children}</>;
  }

  // ============================================
  // AFFICHAGE PENDANT LE CHARGEMENT
  // C'est crucial d'afficher un spinner pendant que loading=true
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Chargement de votre espace OKAR...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // SI PAS D'USER APRÈS CHARGEMENT = REDIRECTION
  // ============================================
  if (!user || !hasAdminAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Redirection...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // AFFICHAGE NORMAL SI CONNECTÉ
  // ============================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onLogout={handleLogout} userName={user.name || 'Utilisateur'} userRole={user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} userName={user.name || 'Utilisateur'} userRole={user.role} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
