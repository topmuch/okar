'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Car,
  Building2,
  RefreshCw,
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  count?: number;
}

export default function AdminMapPage() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [zoom, setZoom] = useState(10);

  // Dakar center coordinates
  const DAKAR_CENTER = { lat: 14.6928, lng: -17.4467 };

  useEffect(() => {
    fetchMapData();
  }, [filterType]);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/map?type=${filterType}`);
      const data = await res.json();
      setPoints(data.points || []);
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filteredPoints = points.filter(point => {
    const searchLower = searchQuery.toLowerCase();
    return point.name.toLowerCase().includes(searchLower) ||
           point.address?.toLowerCase().includes(searchLower) ||
           point.phone?.includes(searchQuery);
  });

  // Stats
  const garageCount = points.filter(p => p.type === 'garage').length;
  const vehicleCount = points.filter(p => p.type === 'vehicle').length;
  const withLocation = points.filter(p => p.latitude && p.longitude).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Carte Interactive
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualisez les garages et véhicules géolocalisés
          </p>
        </div>
        <Button variant="outline" onClick={fetchMapData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{garageCount}</p>
                <p className="text-sm text-emerald-600">Garages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-500/10 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{vehicleCount}</p>
                <p className="text-sm text-blue-600">Véhicules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-500/10 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{withLocation}</p>
                <p className="text-sm text-purple-600">Géolocalisés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-500/10 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {points.length > 0 ? Math.round((withLocation / points.length) * 100) : 0}%
                </p>
                <p className="text-sm text-amber-600">Couverture</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un garage ou véhicule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="garage">Garages</SelectItem>
            <SelectItem value="vehicle">Véhicules</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Map Placeholder */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-[600px] bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900">
            {/* Map Background Pattern */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              }}
            />

            {/* Center Marker (Dakar) */}
            <div 
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping" />
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                  D
                </div>
              </div>
            </div>

            {/* Sample Points - In a real app, these would be positioned based on coordinates */}
            {filteredPoints.slice(0, 50).map((point, index) => {
              // Simple positioning based on index for demo
              const angle = (index / 50) * 360;
              const radius = 100 + (index % 5) * 50;
              const x = 50 + (radius / 300) * Math.cos(angle * Math.PI / 180) * 30;
              const y = 50 + (radius / 300) * Math.sin(angle * Math.PI / 180) * 30;

              return (
                <div
                  key={point.id}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => setSelectedPoint(point)}
                >
                  {/* Pulse animation */}
                  {point.type === 'garage' && (
                    <div className="absolute -inset-2 bg-emerald-500/20 rounded-full animate-pulse" />
                  )}
                  
                  {/* Marker */}
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-lg transition-transform group-hover:scale-125 ${
                      point.type === 'garage' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  >
                    {point.type === 'garage' ? <Building2 className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-sm">
                      <p className="font-medium">{point.name}</p>
                      {point.address && (
                        <p className="text-xs text-slate-500">{point.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
              <h4 className="font-semibold text-sm mb-3">Légende</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                  <span className="text-sm">Garages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full" />
                  <span className="text-sm">Véhicules</span>
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.min(z + 1, 20))}
                className="w-10 h-10 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.max(z - 1, 1))}
                className="w-10 h-10 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Note about real implementation */}
            <div className="absolute top-4 left-4 bg-amber-100 dark:bg-amber-500/20 border border-amber-300 rounded-xl p-3 max-w-sm">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Pour une vraie carte interactive, intégrez Leaflet ou MapBox avec les coordonnées GPS réelles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Point Details */}
      {selectedPoint && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedPoint.type === 'garage' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {selectedPoint.type === 'garage' ? <Building2 className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{selectedPoint.name}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedPoint.address || 'Adresse non renseignée'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline">
                  {selectedPoint.latitude && selectedPoint.longitude 
                    ? `${selectedPoint.latitude.toFixed(4)}, ${selectedPoint.longitude.toFixed(4)}`
                    : 'Non géolocalisé'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points List */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Points non géolocalisés ({points.length - withLocation})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {points
            .filter(p => !p.latitude || !p.longitude)
            .slice(0, 12)
            .map(point => (
              <Card key={point.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    point.type === 'garage' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {point.type === 'garage' ? <Building2 className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{point.name}</p>
                    <p className="text-xs text-slate-500">Coordonnées manquantes</p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
