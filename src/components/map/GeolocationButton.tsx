'use client';

import { useState } from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GeolocationButtonProps {
  onLocationCaptured: (lat: number, lng: number) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export default function GeolocationButton({
  onLocationCaptured,
  className = '',
  variant = 'outline',
  size = 'default'
}: GeolocationButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setStatus('success');
        onLocationCaptured(latitude, longitude);

        // Reset to idle after 3 seconds
        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      },
      (error) => {
        setStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage('Autorisation de géolocalisation refusée. Veuillez l\'activer dans les paramètres de votre navigateur.');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('Position non disponible. Veuillez réessayer.');
            break;
          case error.TIMEOUT:
            setErrorMessage('Délai d\'attente dépassé. Veuillez réessayer.');
            break;
          default:
            setErrorMessage('Erreur lors de la récupération de la position.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleGetLocation}
        disabled={status === 'loading'}
        className={`gap-2 ${className}`}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Localisation...</span>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Position capturée !</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4" />
            <span>📍 Utiliser ma position actuelle</span>
          </>
        )}
      </Button>

      {status === 'error' && errorMessage && (
        <div className="flex items-start gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span>Votre position a été enregistrée avec succès</span>
        </div>
      )}
    </div>
  );
}
