'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Car,
  History,
  QrCode,
  ArrowRightLeft,
  User,
  Menu,
  X,
  Bell,
  LogOut,
  Settings,
  Home,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Driver context
interface DriverContextType {
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicle: VehicleInfo | null;
  loading: boolean;
  refreshVehicle: () => Promise<void>;
}

interface VehicleInfo {
  id: string;
  reference: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  mileage: number;
  qrStatus: string;
}

const DriverContext = createContext<DriverContextType>({
  driverId: '',
  driverName: '',
  driverPhone: '',
  vehicle: null,
  loading: true,
  refreshVehicle: async () => {},
});

export const useDriver = () => useContext(DriverContext);

const navItems = [
  { label: 'Accueil', href: '/driver/tableau-de-bord', icon: Home },
  { label: 'Mon Véhicule', href: '/driver/vehicles', icon: Car },
  { label: 'Historique', href: '/driver/historique', icon: History },
  { label: 'Validations', href: '/driver/validation', icon: ArrowRightLeft, badge: 'pending' },
  { label: 'QR Code', href: '/driver/qr', icon: QrCode },
  { label: 'Transférer', href: '/driver/transfert', icon: ArrowRightLeft },
  { label: 'Profil', href: '/driver/profil', icon: User },
];

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  const [vehicleData, setVehicleData] = useState<VehicleInfo | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);

  const refreshVehicle = async () => {
    try {
      const response = await fetch('/api/driver/vehicles');
      const data = await response.json();
      if (data.vehicles && data.vehicles.length > 0) {
        setVehicleData(data.vehicles[0]);
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
    } finally {
      setVehicleLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshVehicle();
      fetchPendingCount();
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/driver/validations?count=true');
      const data = await response.json();
      setPendingCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  // Redirect if not authenticated or not a driver
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'driver') {
      // User is authenticated but not a driver - redirect to their correct area
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        router.replace('/admin/tableau-de-bord');
      } else if (user.role === 'garage') {
        router.replace('/garage/tableau-de-bord');
      } else if (user.role === 'agency') {
        router.replace('/agence/tableau-de-bord');
      } else {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          <span className="text-slate-500">Vérification...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not a driver
  if (!user || user.role !== 'driver') {
    return null;
  }

  const driverName = user.name || 'Conducteur';
  const driverId = user.id;

  return (
    <DriverContext.Provider value={{ 
      driverId, 
      driverName, 
      driverPhone: user.phone || '',
      vehicle: vehicleData, 
      loading: vehicleLoading, 
      refreshVehicle 
    }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
          <Link href="/driver/tableau-de-bord" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">OKAR</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
              <Link href="/driver/tableau-de-bord" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#FF0080] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-white block">OKAR</span>
                  <span className="text-xs text-slate-500">Propriétaire</span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Driver Info */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {driverName}
                  </p>
                  <p className="text-xs text-slate-500">Conducteur</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          active
                            ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${active ? 'text-orange-500' : ''}`} />
                          {item.label}
                        </div>
                        {item.badge === 'pending' && pendingCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User Menu */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-9 h-9 bg-orange-200 dark:bg-orange-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {driverName}
                  </p>
                  <p className="text-xs text-slate-500">Propriétaire</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="mt-2 py-2 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    href="/driver/profil"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Link>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
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
        <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </DriverContext.Provider>
  );
}
