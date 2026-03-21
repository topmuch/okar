'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamic import of the map component (Leaflet requires window)
const AdminMapDashboard = dynamic(
  () => import('@/components/map/AdminMapDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-7xl mx-auto p-6">
        {/* Loading skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats skeleton */}
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

        {/* Map skeleton */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl h-[600px] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Chargement de la carte...</p>
          </div>
        </div>
      </div>
    )
  }
);

export default function AdminMapPage() {
  return <AdminMapDashboard />;
}
