'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 LEAFLET CSS - Import direct (pas d'import dynamique)
// ═══════════════════════════════════════════════════════════════════════════════
import 'leaflet/dist/leaflet.css';
import './map-styles.css';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 FIX: Configuration des icônes par défaut Leaflet
// Nécessaire car Webpack/Next.js ne résout pas les images par défaut
// ═══════════════════════════════════════════════════════════════════════════════
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

// Icônes prédéfinies pour les différents types
const ICONS = {
  garageCertified: createIcon('#10b981', '★', 34),
  garageStandard: createIcon('#3b82f6', 'G', 30),
  garageSuspended: createIcon('#ef4444', '!', 30),
  vehicle: createIcon('#8b5cf6', 'V', 28),
  vehicleWarning: createIcon('#f59e0b', 'V', 28),
};

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
// 🗺️ FIT BOUNDS COMPONENT - Ajuste la vue pour montrer tous les points
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
        console.warn('Could not fit bounds:', error);
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
    <div className="min-w-[220px] font-sans">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
          point.type === 'garage' 
            ? point.isCertified ? 'bg-emerald-500' : 'bg-blue-500'
            : 'bg-purple-500'
        }`}>
          {point.type === 'garage' ? (point.isCertified ? '★' : 'G') : 'V'}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {point.name}
          </h3>
          {point.city && (
            <p className="text-xs text-gray-500">{point.city}</p>
          )}
        </div>
      </div>
      
      {/* Details */}
      <div className="space-y-1.5 text-sm">
        {point.address && (
          <p className="text-gray-600 flex items-start gap-1.5">
            <span className="text-base">📍</span>
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
      
      {/* Badge */}
      {point.type === 'garage' && point.isCertified && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            ✓ Certifié OKAR
          </span>
        </div>
      )}
      
      {point.status === 'SUSPENDED' && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            ⚠️ Suspendu
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ MAP CONTENT COMPONENT - Composant principal de la carte
// ═══════════════════════════════════════════════════════════════════════════════
export default function MapContent({ points, center, zoom }: MapContentProps) {
  // Filtrer les points valides (avec coordonnées)
  const validPoints = useMemo(() => {
    return points.filter(p => 
      p.latitude !== null && 
      p.longitude !== null &&
      !isNaN(p.latitude) && 
      !isNaN(p.longitude)
    );
  }, [points]);

  // Obtenir l'icône appropriée pour chaque point
  const getIcon = (point: MapPoint): L.DivIcon => {
    if (point.type === 'garage') {
      if (point.status === 'SUSPENDED') return ICONS.garageSuspended;
      return point.isCertified ? ICONS.garageCertified : ICONS.garageStandard;
    }
    return ICONS.vehicle;
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={true}
      doubleClickZoom={true}
      // ⚠️ CRITICAL: Hauteur EXPLICITE en pixels (pas 100%)
      style={{ 
        height: '600px', 
        width: '100%',
        zIndex: 1,
        background: '#f1f5f9'
      }}
      className="leaflet-map-container"
    >
      {/* Fond de carte OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      
      {/* Ajuster la vue pour montrer tous les points */}
      <FitBounds points={validPoints} />
      
      {/* Marqueurs */}
      {validPoints.map((point) => (
        <Marker
          key={`${point.type}-${point.id}`}
          position={[point.latitude!, point.longitude!]}
          icon={getIcon(point)}
          eventHandlers={{
            mouseover: (e) => {
              const marker = e.target;
              marker.openPopup();
            }
          }}
        >
          <Popup 
            maxWidth={300}
            closeButton={true}
            className="leaflet-popup-custom"
          >
            <PopupContent point={point} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
