'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 LEAFLET CSS - Import CRITICAL
// ═══════════════════════════════════════════════════════════════════════════════
import 'leaflet/dist/leaflet.css';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 FIX: Icônes Leaflet par défaut (CDN)
// ═══════════════════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

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
  licensePlate?: string;
  make?: string;
  model?: string;
  vehicleCount?: number;
  city?: string;
}

interface MapContentProps {
  points: MapPoint[];
  center: [number, number];
  zoom: number;
  theme?: 'light' | 'dark';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 CUSTOM MARKER ICONS
// ═══════════════════════════════════════════════════════════════════════════════
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ">${label}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ FIT BOUNDS
// ═══════════════════════════════════════════════════════════════════════════════
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const validPoints = points.filter(p => p.latitude && p.longitude);
    
    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(
        validPoints.map(p => [p.latitude!, p.longitude!])
      );
      map.fitBounds(bounds, { 
        padding: [50, 50], 
        maxZoom: 14 
      });
    }
  }, [points, map]);

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ MAP CONTENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MapContent({ 
  points, 
  center, 
  zoom, 
  theme = 'light' 
}: MapContentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Points valides
  const validPoints = useMemo(() => {
    return points.filter(p => 
      p.latitude !== null && 
      p.longitude !== null &&
      !isNaN(p.latitude) && 
      !isNaN(p.longitude)
    );
  }, [points]);

  // Icônes selon le type
  const getIcon = (point: MapPoint) => {
    if (point.type === 'garage') {
      if (point.status === 'SUSPENDED') return createCustomIcon('#ef4444', '!');
      return point.isCertified 
        ? createCustomIcon('#10b981', '★') 
        : createCustomIcon('#3b82f6', 'G');
    }
    return createCustomIcon('#8b5cf6', 'V');
  };

  // URL des tuiles selon le thème
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

  if (!mounted) {
    return (
      <div style={{ height: '600px', width: '100%', background: '#f1f5f9' }} 
           className="flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '600px', width: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ 
          height: '100%', 
          width: '100%',
          background: theme === 'dark' ? '#1a1a2e' : '#e8e8e8'
        }}
      >
        {/* TILELAYER - CartoDB */}
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url={tileUrl}
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={19}
        />
        
        {/* Auto-ajustement */}
        <FitBounds points={validPoints} />
        
        {/* MARQUEURS */}
        {validPoints.map((point) => (
          <Marker
            key={`${point.type}-${point.id}`}
            position={[point.latitude!, point.longitude!]}
            icon={getIcon(point)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-gray-900">{point.name}</h3>
                {point.address && (
                  <p className="text-sm text-gray-600 mt-1">📍 {point.address}</p>
                )}
                {point.phone && (
                  <p className="text-sm text-gray-600">📞 {point.phone}</p>
                )}
                {point.type === 'garage' && point.isCertified && (
                  <span className="inline-block mt-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                    ✓ Certifié OKAR
                  </span>
                )}
                {point.type === 'vehicle' && point.licensePlate && (
                  <p className="text-sm font-mono mt-1">🏷️ {point.licensePlate}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
