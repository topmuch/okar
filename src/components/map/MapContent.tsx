'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 LEAFLET CSS - Import direct
// ═══════════════════════════════════════════════════════════════════════════════
import 'leaflet/dist/leaflet.css';
import './map-styles.css';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 FIX: Configuration des icônes par défaut Leaflet
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 CREATE CUSTOM DIV ICON
// ═══════════════════════════════════════════════════════════════════════════════
const createIcon = (color: string, content: string, size: number = 32) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${size * 0.4}px;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.8);
        border: 2px solid white;
        transition: transform 0.2s ease;
      ">
        ${content}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ FIT BOUNDS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const validPoints = points.filter(p => p.latitude && p.longitude);
    
    if (validPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(
          validPoints.map(p => [p.latitude!, p.longitude!])
        );
        map.fitBounds(bounds, { 
          padding: [50, 50], 
          maxZoom: 14,
          animate: true,
          duration: 0.5
        });
      } catch (error) {
        console.warn('[MapContent] Could not fit bounds:', error);
      }
    }
  }, [points, map]);

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 MARKER POPUP CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
function PopupContent({ point }: { point: MapPoint }) {
  return (
    <div className="min-w-[200px] font-sans p-1">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
          point.type === 'garage' 
            ? point.isCertified ? 'bg-emerald-500' : 'bg-blue-500'
            : 'bg-purple-500'
        }`}>
          {point.type === 'garage' ? (point.isCertified ? '★' : 'G') : 'V'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {point.name}
          </h3>
          {point.city && (
            <p className="text-xs text-gray-500 truncate">{point.city}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-1 text-sm">
        {point.address && (
          <p className="text-gray-600 flex items-start gap-1.5">
            <span>📍</span>
            <span className="line-clamp-2">{point.address}</span>
          </p>
        )}
        
        {point.phone && (
          <p className="text-gray-600 flex items-center gap-1.5">
            <span>📞</span>
            <a href={`tel:${point.phone}`} className="text-blue-600 hover:underline">
              {point.phone}
            </a>
          </p>
        )}
        
        {point.type === 'garage' && point.vehicleCount !== undefined && (
          <p className="text-gray-600 flex items-center gap-1.5">
            <span>🚗</span>
            <span>{point.vehicleCount} véhicule{point.vehicleCount > 1 ? 's' : ''}</span>
          </p>
        )}
        
        {point.type === 'vehicle' && point.licensePlate && (
          <p className="text-gray-600 flex items-center gap-1.5">
            <span>🏷️</span>
            <span className="font-mono font-semibold">{point.licensePlate}</span>
          </p>
        )}
      </div>
      
      {point.type === 'garage' && point.isCertified && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            ✓ Certifié OKAR
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ MAP CONTENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MapContent({ points, center, zoom }: MapContentProps) {
  const [isReady, setIsReady] = useState(false);

  // Icônes créées côté client seulement
  const icons = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return {
      garageCertified: createIcon('#10b981', '★', 34),
      garageStandard: createIcon('#3b82f6', 'G', 30),
      garageSuspended: createIcon('#ef4444', '!', 30),
      vehicle: createIcon('#8b5cf6', 'V', 28),
    };
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

  // Marquer prêt quand les icônes sont créées
  useEffect(() => {
    if (icons) {
      setIsReady(true);
    }
  }, [icons]);

  // Obtenir l'icône pour un point
  const getIcon = (point: MapPoint): L.DivIcon | null => {
    if (!icons) return null;
    
    if (point.type === 'garage') {
      if (point.status === 'SUSPENDED') return icons.garageSuspended;
      return point.isCertified ? icons.garageCertified : icons.garageStandard;
    }
    return icons.vehicle;
  };

  // Ne pas rendre tant que les icônes ne sont pas prêtes
  if (!isReady || !icons) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl"
        style={{ height: '600px' }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Préparation de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={true}
      doubleClickZoom={true}
      style={{ 
        height: '600px', 
        width: '100%',
        zIndex: 1,
        background: '#f1f5f9'
      }}
      className="leaflet-map-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      
      <FitBounds points={validPoints} />
      
      {validPoints.map((point) => {
        const icon = getIcon(point);
        if (!icon) return null;
        
        return (
          <Marker
            key={`${point.type}-${point.id}`}
            position={[point.latitude!, point.longitude!]}
            icon={icon}
          >
            <Popup maxWidth={300} closeButton={true}>
              <PopupContent point={point} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
