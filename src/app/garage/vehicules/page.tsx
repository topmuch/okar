'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Search,
  Plus,
  QrCode,
  Eye,
  Wrench,
  Calendar,
  Clock,
  CheckCircle,
  User,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface Vehicle {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  licensePlate: string | null;
  qrStatus: string;
  ownerName: string | null;
  ownerPhone: string | null;
  activatedAt: string | null;
  lastMaintenance: string | null;
  maintenanceCount: number;
}

export default function GarageVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Garage ID (would come from auth)
  const garageId = 'demo-garage-id';

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, search, statusFilter]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`/api/vehicles?garageId=${garageId}`);
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = [...vehicles];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.qrStatus === statusFilter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(v =>
        v.reference.toLowerCase().includes(searchLower) ||
        (v.licensePlate && v.licensePlate.toLowerCase().includes(searchLower)) ||
        (v.ownerName && v.ownerName.toLowerCase().includes(searchLower)) ||
        (v.make && v.make.toLowerCase().includes(searchLower)) ||
        (v.model && v.model.toLowerCase().includes(searchLower))
      );
    }

    setFilteredVehicles(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusConfig = (qrStatus: string) => {
    switch (qrStatus) {
      case 'ACTIVE':
        return { label: 'Actif', className: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
      case 'INACTIVE':
        return { label: 'Inactif', className: 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' };
      case 'BLOCKED':
        return { label: 'Bloqué', className: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400', dot: 'bg-red-500' };
      default:
        return { label: qrStatus, className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
    }
  };

  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'ACTIVE', label: 'Actifs' },
    { id: 'INACTIVE', label: 'Inactifs' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Car className="w-8 h-8 text-orange-500" />
            Véhicules
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Tous les véhicules enregistrés via votre garage
          </p>
        </div>
        <Link
          href="/garage/activer-qr"
          className="inline-flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter un véhicule
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par immatriculation, marque, propriétaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setStatusFilter(btn.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              statusFilter === btn.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-slate-500 mt-4">Chargement des véhicules...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Aucun véhicule trouvé</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            {search || statusFilter !== 'all'
              ? 'Essayez de modifier vos filtres.'
              : 'Activez des QR codes pour ajouter des véhicules.'
            }
          </p>
          <Link
            href="/garage/activer-qr"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            Ajouter un véhicule
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredVehicles.map((vehicle) => {
            const status = getStatusConfig(vehicle.qrStatus);
            
            return (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Vehicle Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Car className="w-7 h-7 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-orange-500 font-medium">{vehicle.reference}</span>
                        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                      </div>
                      <p className="text-slate-800 dark:text-white font-medium truncate">
                        {vehicle.make || vehicle.model
                          ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim()
                          : 'Véhicule non renseigné'}
                        {vehicle.year && ` (${vehicle.year})`}
                      </p>
                      {vehicle.licensePlate && (
                        <p className="text-sm text-slate-500 font-mono">{vehicle.licensePlate}</p>
                      )}
                    </div>
                  </div>

                  {/* Owner & Stats */}
                  <div className="flex items-center gap-6 flex-wrap sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-6">
                    {vehicle.ownerName && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <User className="w-4 h-4" />
                        <span>{vehicle.ownerName}</span>
                      </div>
                    )}
                    
                    {vehicle.maintenanceCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Wrench className="w-4 h-4" />
                        <span>{vehicle.maintenanceCount} intervention(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/scan/${vehicle.reference}`}
                        target="_blank"
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Voir fiche publique"
                      >
                        <Eye className="w-5 h-5 text-slate-400 hover:text-orange-500" />
                      </Link>
                      {vehicle.qrStatus === 'ACTIVE' && (
                        <Link
                          href={`/garage/interventions/nouvelle?vehicleId=${vehicle.id}`}
                          className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                          title="Nouvelle intervention"
                        >
                          <Wrench className="w-5 h-5 text-slate-400 hover:text-purple-500" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {filteredVehicles.length > 0 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          {filteredVehicles.length} véhicule(s) affiché(s) sur {vehicles.length}
        </div>
      )}
    </div>
  );
}
