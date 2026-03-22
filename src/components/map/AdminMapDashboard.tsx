'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Car,
  Building2,
  RefreshCw,
  Search,
  Navigation,
  Filter,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════════
// 📍 TYPES
// ═══════════════════════════════════════════════════════════════════════════════
interface MapPoint {
  id: string;
  type: 'garage' | 'vehicle';
  name: string;
  latitude: number | null;
  longitude: number | null;
  status?: string;
  address?: string;
  phone?: string;
  isCertified?: boolean;
  rating?: number;
  vehicleCount?: number;
  licensePlate?: string;
  make?: string;
  model?: string;
  activatedAt?: string;
  city?: string;
  validationStatus?: string;
}

interface AdminMapDashboardProps {
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ CONSTANTES - Centre du Sénégal
// ═══════════════════════════════════════════════════════════════════════════════
const SENEGAL_CENTER: [number, number] = [14.4974, -14.4524];
const DEFAULT_ZOOM = 7;

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 DYNAMIC IMPORT - Carte chargée côté client uniquement (SSR: false)
// ═══════════════════════════════════════════════════════════════════════════════
const MapComponent = dynamic(
  () => import('./MapContent'),
  {
    ssr: false,
    loading: () => (
      <div 
        className="w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl"
        style={{ height: '600px' }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Chargement de la carte...</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Initialisation de Leaflet</p>
        </div>
      </div>
    )
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
}) {
  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminMapDashboard({ className }: AdminMapDashboardProps) {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);

  const [filters, setFilters] = useState({
    showGarages: true,
    showVehicles: true,
    showSuspended: true,
    showOnlyCertified: false
  });

  // ⚠️ CRITICAL: S'assurer qu'on est côté client avant d'afficher la carte
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Charger les données de la carte
  const fetchMapData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/map?detailed=true');
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPoints(data.points || []);
      
      if (data.stats) {
        console.log('[Map] Stats:', data.stats);
      }
    } catch (error: any) {
      console.error('[Map] Error fetching data:', error);
      setError(error.message || 'Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Filtrer les points selon les critères
  const filteredPoints = points.filter(point => {
    // Recherche textuelle
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        point.name.toLowerCase().includes(searchLower) ||
        point.address?.toLowerCase().includes(searchLower) ||
        point.phone?.includes(searchQuery) ||
        point.city?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Filtres par type
    if (point.type === 'garage') {
      if (!filters.showGarages) return false;
      if (filters.showOnlyCertified && !point.isCertified) return false;
      if (!filters.showSuspended && point.status === 'SUSPENDED') return false;
    } else {
      if (!filters.showVehicles) return false;
    }

    return true;
  });

  // Calcul des statistiques
  const stats = {
    garageCount: points.filter(p => p.type === 'garage').length,
    vehicleCount: points.filter(p => p.type === 'vehicle').length,
    withLocation: points.filter(p => p.latitude && p.longitude).length,
    certifiedCount: points.filter(p => p.type === 'garage' && p.isCertified).length,
    suspendedCount: points.filter(p => p.status === 'SUSPENDED').length,
  };

  return (
    <div className={`max-w-7xl mx-auto ${className || ''}`}>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Carte Interactive
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualisez les garages et véhicules géolocalisés sur OpenStreetMap
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchMapData} 
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard 
          label="Garages" 
          value={stats.garageCount} 
          icon={Building2} 
          color="bg-emerald-500" 
        />
        <StatCard 
          label="Véhicules" 
          value={stats.vehicleCount} 
          icon={Car} 
          color="bg-purple-500" 
        />
        <StatCard 
          label="Certifiés" 
          value={stats.certifiedCount} 
          icon={MapPin} 
          color="bg-amber-500" 
        />
        <StatCard 
          label="Géolocalisés" 
          value={stats.withLocation} 
          icon={Navigation} 
          color="bg-blue-500" 
        />
        <StatCard 
          label="Couverture" 
          value={`${points.length > 0 ? Math.round((stats.withLocation / points.length) * 100) : 0}%`} 
          icon={Filter} 
          color="bg-cyan-500" 
        />
      </div>

      {/* Contrôles de filtre */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom, adresse, téléphone, ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-garages"
              checked={filters.showGarages}
              onCheckedChange={(checked) => setFilters({ ...filters, showGarages: !!checked })}
            />
            <label htmlFor="filter-garages" className="text-sm flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <Building2 className="w-4 h-4 text-emerald-500" />
              Garages
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-vehicles"
              checked={filters.showVehicles}
              onCheckedChange={(checked) => setFilters({ ...filters, showVehicles: !!checked })}
            />
            <label htmlFor="filter-vehicles" className="text-sm flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <Car className="w-4 h-4 text-purple-500" />
              Véhicules
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-certified"
              checked={filters.showOnlyCertified}
              onCheckedChange={(checked) => setFilters({ ...filters, showOnlyCertified: !!checked })}
            />
            <label htmlFor="filter-certified" className="text-sm flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-amber-500" />
              Certifiés uniquement
            </label>
          </div>
        </div>
      </div>

      {/* Conteneur de la carte */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-lg">
        <CardContent className="p-0">
          {/* ⚠️ CRITICAL: Hauteur EXPLICITE de 600px */}
          <div className="relative" style={{ height: '600px' }}>
            {/* Affichage conditionnel */}
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                <div className="text-center p-6">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-700 dark:text-red-400 font-medium mb-2">Erreur de chargement</p>
                  <p className="text-red-600 dark:text-red-500 text-sm mb-4">{error}</p>
                  <Button variant="outline" onClick={fetchMapData}>
                    Réessayer
                  </Button>
                </div>
              </div>
            ) : !isClient ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">Initialisation...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Carte Leaflet */}
                <MapComponent 
                  points={filteredPoints}
                  center={SENEGAL_CENTER}
                  zoom={DEFAULT_ZOOM}
                />
                
                {/* Overlay de chargement */}
                {loading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-[1000]">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Chargement des données...</p>
                    </div>
                  </div>
                )}
                
                {/* Badge nombre de résultats */}
                {!loading && (
                  <div className="absolute top-4 left-4 z-[1000]">
                    <Badge variant="secondary" className="bg-white/90 dark:bg-slate-800/90 shadow-md">
                      {filteredPoints.filter(p => p.latitude && p.longitude).length} points affichés
                    </Badge>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
          <Filter className="w-4 h-4" /> Légende
        </h4>
        <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">★</div>
            <span>Garage Certifié</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">G</div>
            <span>Garage Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">!</div>
            <span>Garage Suspendu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">V</div>
            <span>Véhicule</span>
          </div>
        </div>
      </div>
    </div>
  );
}
