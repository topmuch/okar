'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ DYNAMIC IMPORT - Carte chargée côté client uniquement
// Leaflet nécessite `window` donc SSR doit être désactivé
// ═══════════════════════════════════════════════════════════════════════════════
const AdminMapDashboard = dynamic(
  () => import('@/components/map/AdminMapDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-7xl mx-auto p-6">
        {/* Skeleton de chargement */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div>
                  <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div 
          className="bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center"
          style={{ height: '600px' }}
        >
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Chargement de la carte...</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Initialisation de Leaflet</p>
          </div>
        </div>
      </div>
    )
  }
);

export default function AdminMapPage() {
  return <AdminMapDashboard />;
}
