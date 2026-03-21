'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Car,
  Building2,
  RefreshCw,
  Search,
  ZoomIn,
  ZoomOut,
  Navigation,
  Filter,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Types
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
}

interface AdminMapDashboardProps {
  className?: string;
}

// Senegal center coordinates
const SENEGAL_CENTER: [number, number] = [14.4974, -14.4524];
const DEFAULT_ZOOM = 7;

// Import Leaflet CSS on client side
if (typeof window !== 'undefined') {
  import('leaflet/dist/leaflet.css');
}

// Dynamic import of MapComponent with SSR disabled
const MapComponent = dynamic(
  () => import('./MapContent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Chargement de la carte...</p>
        </div>
      </div>
    )
  }
);

export default function AdminMapDashboard({ className }: AdminMapDashboardProps) {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [filters, setFilters] = useState({
    showGarages: true,
    showVehicles: true,
    showSuspended: true,
    showOnlyCertified: false
  });

  // Fetch map data
  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/map?detailed=true');
      const data = await res.json();
      setPoints(data.points || []);
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Filter points
  const filteredPoints = points.filter(point => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = point.name.toLowerCase().includes(searchLower) ||
        point.address?.toLowerCase().includes(searchLower) ||
        point.phone?.includes(searchQuery);
      if (!matchesSearch) return false;
    }

    if (point.type === 'garage') {
      if (!filters.showGarages) return false;
      if (filters.showOnlyCertified && !point.isCertified) return false;
      if (!filters.showSuspended && point.status === 'SUSPENDED') return false;
    } else {
      if (!filters.showVehicles) return false;
    }

    return true;
  });

  // Stats
  const garageCount = points.filter(p => p.type === 'garage').length;
  const vehicleCount = points.filter(p => p.type === 'vehicle').length;
  const withLocation = points.filter(p => p.latitude && p.longitude).length;
  const certifiedCount = points.filter(p => p.type === 'garage' && p.isCertified).length;

  return (
    <div className={`max-w-7xl mx-auto ${className || ''}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Carte Interactive
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualisez les garages et véhicules géolocalisés sur OpenStreetMap
          </p>
        </div>
        <Button variant="outline" onClick={fetchMapData} className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Garages', value: garageCount, icon: Building2, color: 'emerald' },
          { label: 'Véhicules', value: vehicleCount, icon: Car, color: 'purple' },
          { label: 'Certifiés', value: certifiedCount, icon: MapPin, color: 'amber' },
          { label: 'Géolocalisés', value: withLocation, icon: Navigation, color: 'blue' },
          { label: 'Couverture', value: `${points.length > 0 ? Math.round((withLocation / points.length) * 100) : 0}%`, icon: Filter, color: 'cyan' }
        ].map((stat, i) => (
          <Card key={i} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-${stat.color}-500 rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom, adresse, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'garages', label: 'Garages', icon: Building2, color: 'text-emerald-500', filter: 'showGarages' },
            { id: 'vehicles', label: 'Véhicules', icon: Car, color: 'text-purple-500', filter: 'showVehicles' },
            { id: 'certified', label: 'Certifiés uniquement', icon: MapPin, color: 'text-amber-500', filter: 'showOnlyCertified' }
          ].map(f => (
            <div key={f.id} className="flex items-center gap-2">
              <Checkbox
                id={`filter-${f.id}`}
                checked={filters[f.filter as keyof typeof filters]}
                onCheckedChange={(checked) => setFilters({ ...filters, [f.filter]: !!checked })}
              />
              <label htmlFor={`filter-${f.id}`} className="text-sm flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <f.icon className={`w-4 h-4 ${f.color}`} />
                {f.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
        <CardContent className="p-0">
          <div className="relative" style={{ height: '600px' }}>
            {/* Map */}
            <MapComponent 
              points={filteredPoints}
              center={SENEGAL_CENTER}
              zoom={DEFAULT_ZOOM}
            />

            {/* Loading */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-[1001]">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Chargement...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
          <Filter className="w-4 h-4" /> Légende
        </h4>
        <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">★</div>
            <span>Garage Certifié</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">G</div>
            <span>Garage Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">V</div>
            <span>Véhicule</span>
          </div>
        </div>
      </div>
    </div>
  );
}
