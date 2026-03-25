'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  MapPin,
  Phone,
  MessageCircle,
  X,
  Loader2,
  Navigation,
  Wrench,
  Clock
} from 'lucide-react';

interface Garage {
  id: string;
  name: string;
  phone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  distance: number;
}

export default function EmergencyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Animation pulse
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const requestGeolocation = async (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationError(null);
          resolve({ lat: latitude, lng: longitude });
        },
        (error) => {
          let message = 'Impossible d\'obtenir votre position';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permission de géolocalisation refusée. Veuillez l\'activer dans les paramètres.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Position indisponible. Veuillez réessayer.';
              break;
            case error.TIMEOUT:
              message = 'Délai d\'attente dépassé. Veuillez réessayer.';
              break;
          }
          setLocationError(message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const fetchNearbyGarages = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/garages/nearby?lat=${lat}&lng=${lng}&radius=5`);
      const data = await response.json();

      if (data.success) {
        setGarages(data.garages);
        if (data.garages.length === 0) {
          setError('Aucun garage certifié trouvé dans un rayon de 5 km');
        }
      } else {
        setError(data.error || 'Erreur lors de la recherche');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPanel = async () => {
    setIsOpen(true);
    setLoading(true);

    // Demander la géolocalisation
    const location = await requestGeolocation();

    if (location) {
      await fetchNearbyGarages(location.lat, location.lng);
    } else {
      setLoading(false);
    }
  };

  const handleCall = (phone: string | null) => {
    if (phone) {
      window.location.href = `tel:${phone.replace(/\s/g, '')}`;
    }
  };

  const handleWhatsApp = (garage: Garage) => {
    const phone = garage.whatsappNumber || garage.phone;
    if (phone && userLocation) {
      const message = encodeURIComponent(
        `🆘 URGENCE PANNE\n\n` +
        `Je suis en panne près de ma position actuelle.\n` +
        `📍 Localisation: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}\n\n` +
        `Pouvez-vous m'envoyer une assistance ?`
      );
      const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance} km`;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpenPanel}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 
          rounded-full shadow-lg shadow-red-500/40 flex items-center justify-center
          hover:from-red-600 hover:to-red-700 transition-all duration-300
          ${isPulsing ? 'animate-pulse' : ''}`}
        aria-label="Urgence Panne"
      >
        <span className="text-2xl">🆘</span>
      </button>

      {/* Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-md max-h-[80vh] bg-white dark:bg-slate-900 
            rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Urgence Panne</h2>
                    <p className="text-sm text-white/80">Garages certifiés à proximité</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Location */}
              {userLocation && (
                <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span>Position: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-96">
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Recherche des garages à proximité...
                  </p>
                </div>
              )}

              {/* Location Error */}
              {locationError && !loading && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Navigation className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Géolocalisation requise
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                        {locationError}
                      </p>
                      <button
                        onClick={async () => {
                          setLoading(true);
                          const loc = await requestGeolocation();
                          if (loc) {
                            await fetchNearbyGarages(loc.lat, loc.lng);
                          } else {
                            setLoading(false);
                          }
                        }}
                        className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && !locationError && (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">{error}</p>
                </div>
              )}

              {/* Garages List */}
              {!loading && !locationError && garages.length > 0 && (
                <div className="space-y-3">
                  {garages.map((garage) => (
                    <div
                      key={garage.id}
                      className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-white">
                            {garage.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{formatDistance(garage.distance)}</span>
                            {garage.address && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-32">{garage.address}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          <span>Disponible</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCall(garage.phone)}
                          disabled={!garage.phone}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 
                            bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium
                            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Phone className="w-4 h-4" />
                          Appeler
                        </button>
                        <button
                          onClick={() => handleWhatsApp(garage)}
                          disabled={!garage.whatsappNumber && !garage.phone}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 
                            bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium
                            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800">
              <p className="text-xs text-center text-slate-500">
                Rayon de recherche: 5 km • Garages certifiés OKAR uniquement
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
