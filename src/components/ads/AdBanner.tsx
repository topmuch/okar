'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { trackAdClick, type TargetedAd } from '@/lib/ad-engine';

interface AdBannerProps {
  context: {
    vehicleId?: string;
    vehicleType?: string;
    vehicleMake?: string;
    category?: string;
    location?: string;
    alertType?: string;
    userId?: string;
    garageId?: string;
    pageType?: string;
  };
  position?: 'top' | 'sidebar' | 'inline' | 'bottom';
  limit?: number;
  className?: string;
}

export function AdBanner({ 
  context, 
  position = 'inline', 
  limit = 1,
  className = '' 
}: AdBannerProps) {
  const [ads, setAds] = useState<TargetedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, [context]);

  const loadAds = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ads/targeted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, limit }),
      });
      
      const data = await response.json();
      if (data.ads) {
        setAds(data.ads);
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async (ad: TargetedAd) => {
    // Tracker le clic
    await fetch('/api/ads/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        campaignId: ad.id, 
        context 
      }),
    });

    // Ouvrir le lien
    if (ad.ctaUrl && ad.ctaUrl !== '#') {
      window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading || ads.length === 0) {
    return null;
  }

  // Layout selon la position
  if (position === 'sidebar') {
    return (
      <div className={`space-y-4 ${className}`}>
        {ads.map((ad) => (
          <Card 
            key={ad.id} 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleClick(ad)}
          >
            {ad.imageUrl && (
              <div className="aspect-video relative">
                <img 
                  src={ad.imageUrl} 
                  alt={ad.headline}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-3">
              <Badge variant="outline" className="text-xs mb-2">Sponsorisé</Badge>
              <h4 className="font-medium text-sm line-clamp-2">{ad.headline}</h4>
              {ad.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ad.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{ad.advertiserName}</span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (position === 'top') {
    return (
      <div className={className}>
        {ads.slice(0, 1).map((ad) => (
          <div 
            key={ad.id}
            className="relative bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => handleClick(ad)}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative p-4 md:p-6 flex items-center justify-between">
              <div className="text-white">
                <Badge className="bg-white/20 text-white border-0 mb-2">Sponsorisé</Badge>
                <h3 className="text-lg md:text-xl font-bold">{ad.headline}</h3>
                {ad.description && (
                  <p className="text-blue-100 text-sm mt-1">{ad.description}</p>
                )}
                <p className="text-xs text-blue-200 mt-2">{ad.advertiserName}</p>
              </div>
              {ad.imageUrl && (
                <img 
                  src={ad.imageUrl} 
                  alt={ad.headline}
                  className="w-24 h-24 md:w-32 md:h-32 object-contain"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (position === 'bottom') {
    return (
      <div className={`border-t bg-slate-50 ${className}`}>
        <div className="p-4 flex items-center gap-4 overflow-x-auto">
          {ads.map((ad) => (
            <div 
              key={ad.id}
              className="flex-shrink-0 flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[280px]"
              onClick={() => handleClick(ad)}
            >
              {ad.imageUrl && (
                <img 
                  src={ad.imageUrl} 
                  alt={ad.headline}
                  className="w-12 h-12 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className="text-[10px] px-1 py-0">Sponsorisé</Badge>
                <p className="font-medium text-sm truncate">{ad.headline}</p>
                <p className="text-xs text-gray-400">{ad.advertiserName}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Inline (default)
  return (
    <div className={className}>
      {ads.map((ad) => (
        <Card 
          key={ad.id}
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
          onClick={() => handleClick(ad)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {ad.imageUrl && (
                <img 
                  src={ad.imageUrl} 
                  alt={ad.headline}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Sponsorisé</Badge>
                  <span className="text-xs text-gray-400">{ad.advertiserName}</span>
                </div>
                <h4 className="font-semibold text-gray-900">{ad.headline}</h4>
                {ad.description && (
                  <p className="text-sm text-gray-600 mt-1">{ad.description}</p>
                )}
                {ad.ctaText && (
                  <span className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2">
                    {ad.ctaText}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Composant pour les alertes contextuelles avec pub intégrée
export function AlertWithAd({
  type,
  vehicleInfo,
  daysRemaining,
  className = '',
}: {
  type: 'VT' | 'ASSURANCE' | 'MAINTENANCE';
  vehicleInfo: { make: string; model: string; plate: string };
  daysRemaining: number;
  className?: string;
}) {
  const getAlertConfig = () => {
    switch (type) {
      case 'VT':
        return {
          title: 'Visite Technique',
          icon: '🔍',
          urgency: daysRemaining <= 7 ? 'critical' : 'warning',
          adCategory: 'VT',
        };
      case 'ASSURANCE':
        return {
          title: 'Assurance',
          icon: '🛡️',
          urgency: daysRemaining <= 7 ? 'critical' : 'warning',
          adCategory: 'INSURANCE',
        };
      case 'MAINTENANCE':
        return {
          title: 'Maintenance',
          icon: '🔧',
          urgency: daysRemaining <= 0 ? 'critical' : 'warning',
          adCategory: 'VEHICLE_MAINTENANCE',
        };
    }
  };

  const config = getAlertConfig();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Alerte */}
      <div className={`p-4 rounded-lg ${
        config.urgency === 'critical' 
          ? 'bg-red-50 border border-red-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h4 className={`font-semibold ${
              config.urgency === 'critical' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {config.title} {daysRemaining <= 0 ? 'expirée' : `expire dans ${daysRemaining} jours`}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {vehicleInfo.make} {vehicleInfo.model} - {vehicleInfo.plate}
            </p>
          </div>
        </div>
      </div>

      {/* Publicité contextuelle */}
      <AdBanner 
        context={{ 
          category: config.adCategory,
          vehicleMake: vehicleInfo.make,
          alertType: `${type}_EXPIRING`,
        }}
        position="inline"
        limit={1}
      />
    </div>
  );
}

export default AdBanner;
