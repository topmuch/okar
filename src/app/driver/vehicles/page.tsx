'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Shield,
  Calendar,
  Gauge,
  ChevronRight,
  Bell,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
interface Vehicle {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  licensePlate: string | null;
  mainPhoto: string | null;
  currentMileage: number;
  status: string;
  
  // Administrative
  vtEndDate: string | null;
  insuranceEndDate: string | null;
  
  // Maintenance
  nextMaintenanceDueKm: number | null;
  nextMaintenanceDueDate: string | null;
  nextMaintenanceType: string | null;
  lastMaintenanceDate: string | null;
  lastMaintenanceType: string | null;
  
  // Alerts
  hasAlerts: boolean;
  alertCount: number;
  alerts: AlertItem[];
}

interface AlertItem {
  type: 'VT' | 'ASSURANCE' | 'MAINTENANCE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  daysLeft?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

// Helper functions
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getAlertColor(severity: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  switch (severity) {
    case 'HIGH': return 'bg-red-500';
    case 'MEDIUM': return 'bg-orange-500';
    case 'LOW': return 'bg-amber-500';
  }
}

function getProgressColor(percentage: number): string {
  if (percentage < 30) return 'bg-red-500';
  if (percentage < 60) return 'bg-orange-500';
  return 'bg-emerald-500';
}

export default function MaFlottePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user and vehicles
      const [userRes, vehiclesRes] = await Promise.all([
        fetch('/api/driver/me'),
        fetch('/api/driver/vehicles'),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate global stats
  const totalVehicles = vehicles.length;
  const totalAlerts = vehicles.reduce((sum, v) => sum + v.alertCount, 0);
  const vehiclesWithAlerts = vehicles.filter(v => v.hasAlerts).length;
  const totalMileage = vehicles.reduce((sum, v) => sum + v.currentMileage, 0);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-800 dark:text-white">Ma Flotte</h1>
                <p className="text-xs text-slate-500">{totalVehicles} véhicule{totalVehicles > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalAlerts > 0 && (
              <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {totalAlerts}
                </span>
              </button>
            )}
            
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {user?.name || 'Utilisateur'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 pt-20 lg:pt-4">
            <nav className="space-y-1">
              <Link href="/driver/vehicles" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                <Car className="w-5 h-5" />
                <span className="font-medium">Ma Flotte</span>
              </Link>
              <Link href="/driver/notifications" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </Link>
              <Link href="/driver/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Wrench className="w-5 h-5" />
                <span>Historique</span>
              </Link>
              <Link href="/driver/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Settings className="w-5 h-5" />
                <span>Paramètres</span>
              </Link>
            </nav>
            
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Car className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-2xl font-bold">{totalVehicles}</p>
                      <p className="text-xs text-slate-400">Véhicules</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={cn(
                "text-white",
                totalAlerts > 0 
                  ? "bg-gradient-to-br from-red-500 to-rose-600" 
                  : "bg-gradient-to-br from-emerald-500 to-green-600"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-white/70" />
                    <div>
                      <p className="text-2xl font-bold">{totalAlerts}</p>
                      <p className="text-xs text-white/80">Alertes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-8 h-8 text-white/70" />
                    <div>
                      <p className="text-2xl font-bold">{(totalMileage / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-white/80">Km total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-white/70" />
                    <div>
                      <p className="text-xl font-bold">OKAR</p>
                      <p className="text-xs text-white/80">Actif</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicles Grid */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mes Véhicules</h2>
              <Link href="/driver/add-vehicle">
                <Button className="gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                    Aucun véhicule enregistré
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Activez un QR Code OKAR pour ajouter votre premier véhicule.
                  </p>
                  <Link href="/activate">
                    <Button className="gap-2 bg-gradient-to-r from-orange-500 to-pink-500">
                      <QrCode className="w-4 h-4" />
                      Activer un QR Code
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <Link key={vehicle.id} href={`/driver/vehicle/${vehicle.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                      {/* Alert Banner */}
                      {vehicle.hasAlerts && (
                        <div className="bg-red-500 text-white px-4 py-2 text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {vehicle.alertCount} alerte{vehicle.alertCount > 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {/* Vehicle Image */}
                      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                        {vehicle.mainPhoto ? (
                          <img 
                            src={vehicle.mainPhoto} 
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Car className="w-12 h-12 text-slate-400" />
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        {/* Vehicle Info */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">
                              {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {vehicle.licensePlate || vehicle.reference}
                            </p>
                          </div>
                          <Badge variant={vehicle.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {vehicle.status === 'ACTIVE' ? 'Actif' : 'En attente'}
                          </Badge>
                        </div>
                        
                        {/* Mileage */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                          <Gauge className="w-4 h-4" />
                          {vehicle.currentMileage.toLocaleString()} km
                        </div>
                        
                        {/* Administrative Status */}
                        <div className="space-y-2 mb-3">
                          {/* VT Progress */}
                          {vehicle.vtEndDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-16">VT</span>
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full", getProgressColor(daysUntil(vehicle.vtEndDate) || 0 > 30 ? 80 : daysUntil(vehicle.vtEndDate) || 0 > 7 ? 50 : 20))}
                                  style={{ width: `${Math.min(100, ((daysUntil(vehicle.vtEndDate) || 0) / 365) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-12 text-right">
                                {daysUntil(vehicle.vtEndDate) || '?'}j
                              </span>
                            </div>
                          )}
                          
                          {/* Insurance Progress */}
                          {vehicle.insuranceEndDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-16">Assur.</span>
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full", getProgressColor(daysUntil(vehicle.insuranceEndDate) || 0 > 30 ? 80 : daysUntil(vehicle.insuranceEndDate) || 0 > 7 ? 50 : 20))}
                                  style={{ width: `${Math.min(100, ((daysUntil(vehicle.insuranceEndDate) || 0) / 365) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-12 text-right">
                                {daysUntil(vehicle.insuranceEndDate) || '?'}j
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Next Maintenance */}
                        {vehicle.nextMaintenanceDueKm && (
                          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                            <Wrench className="w-4 h-4 text-orange-500" />
                            <span className="text-slate-600 dark:text-slate-300">
                              Prochaine échéance: {vehicle.nextMaintenanceDueKm.toLocaleString()} km
                            </span>
                          </div>
                        )}
                        
                        {/* Arrow */}
                        <div className="mt-3 flex items-center justify-end text-orange-500 text-sm font-medium group-hover:gap-3 transition-all">
                          <span>Voir détails</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <Link href="/driver/scan" className="block">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">Scanner QR</h3>
                      <p className="text-sm text-slate-500">Vérifier un véhicule</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/driver/garages" className="block">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">Garages</h3>
                      <p className="text-sm text-slate-500">Trouver un partenaire</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/driver/help" className="block">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">Aide</h3>
                      <p className="text-sm text-slate-500">FAQ & Support</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
