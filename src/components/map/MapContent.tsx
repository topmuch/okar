'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
const createIcon = (color: string, content: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        ${content}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Icons for different marker types
const garageCertifiedIcon = createIcon('#10b981', '★');
const garageStandardIcon = createIcon('#3b82f6', 'G');
const vehicleIcon = createIcon('#8b5cf6', 'V');

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
}

interface MapContentProps {
  points: MapPoint[];
  center: [number, number];
  zoom: number;
}

// Component to fit bounds when points change
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const validPoints = points.filter(p => p.latitude && p.longitude);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(
          validPoints.map(p => [p.latitude!, p.longitude!])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [points, map]);

  return null;
}

export default function MapContent({ points, center, zoom }: MapContentProps) {
  // Get points with valid coordinates
  const validPoints = points.filter(p => p.latitude && p.longitude);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height: '100%', background: '#e5e7eb' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      
      {/* Fit bounds to show all points */}
      <FitBounds points={validPoints} />

      {/* Markers */}
      {validPoints.map((point) => {
        let icon;
        if (point.type === 'garage') {
          icon = point.isCertified ? garageCertifiedIcon : garageStandardIcon;
        } else {
          icon = vehicleIcon;
        }

        return (
          <Marker
            key={point.id}
            position={[point.latitude!, point.longitude!]}
            icon={icon}
          >
            <Popup>
              <div style={{ minWidth: '200px', fontFamily: 'system-ui, sans-serif' }}>
                <h3 style={{ fontWeight: 600, margin: '0 0 8px 0', fontSize: '14px' }}>
                  {point.name}
                </h3>
                <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '13px' }}>
                  📍 {point.address || 'Adresse non renseignée'}
                </p>
                {point.phone && (
                  <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '13px' }}>
                    📞 {point.phone}
                  </p>
                )}
                {point.type === 'garage' && point.isCertified && (
                  <span style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '4px 8px',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}>
                    ✓ Certifié OKAR
                  </span>
                )}
                {point.type === 'vehicle' && point.licensePlate && (
                  <p style={{ color: '#666', margin: '0', fontSize: '13px' }}>
                    🚗 {point.licensePlate}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
