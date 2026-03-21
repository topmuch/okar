'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  Shield,
  Calendar,
  Gauge,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Camera,
  Edit3,
  History,
  MapPin,
  Phone,
  ChevronRight,
  Download,
  Share2,
  MoreVertical,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
interface MaintenanceRecord {
  id: string;
  category: string;
  subCategory: string | null;
  description: string | null;
  mileage: number | null;
  interventionDate: string;
  status: string;
  ownerValidation: string;
  isLocked: boolean;
  mechanicName: string | null;
  garageName: string | null;
  invoicePhoto: string | null;
  workPhotos: string | null;
  correctionOfId: string | null;
  createdAt: string;
}

interface Vehicle {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  licensePlate: string | null;
  vin: string | null;
  mainPhoto: string | null;
  currentMileage: number;
  engineType: string | null;
  
  // Administrative
  vtStartDate: string | null;
  vtEndDate: string | null;
  vtCenter: string | null;
  insuranceStartDate: string | null;
  insuranceEndDate: string | null;
  insuranceCompany: string | null;
  insurancePolicyNum: string | null;
  
  // Maintenance
  nextMaintenanceDueKm: number | null;
  nextMaintenanceDueDate: string | null;
  nextMaintenanceType: string | null;
  lastMaintenanceKm: number | null;
  lastMaintenanceDate: string | null;
  lastMaintenanceType: string | null;
  
  // Owner
  ownerName: string | null;
  ownerPhone: string | null;
  
  // Garage
  garageId: string | null;
  garageName: string | null;
  
  // Records
  maintenanceRecords: MaintenanceRecord[];
}

const CATEGORY_LABELS: Record<string, string> = {
  activation: 'Activation',
  vidange: 'Vidange',
  freins: 'Freins',
  pneus: 'Pneus',
  moteur: 'Moteur',
  electricite: 'Électricité',
  carrosserie: 'Carrosserie',
  suspension: 'Suspension',
  climatisation: 'Climatisation',
  batterie: 'Batterie',
  transmission: 'Transmission',
  echappement: 'Échappement',
  diagnostic: 'Diagnostic',
  autre: 'Autre',
};

const CATEGORY_ICONS: Record<string, string> = {
  activation: '🚗',
  vidange: '🛢️',
  freins: '🛑',
  pneus: '🛞',
  moteur: '⚙️',
  electricite: '⚡',
  carrosserie: '🔧',
  suspension: '🔩',
  climatisation: '❄️',
  batterie: '🔋',
  transmission: '🔗',
  echappement: '💨',
  diagnostic: '🔍',
  autre: '📋',
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getProgressColor(daysLeft: number | null): string {
  if (daysLeft === null) return 'bg-gray-300';
  if (daysLeft <= 0) return 'bg-red-500';
  if (daysLeft <= 7) return 'bg-red-500';
  if (daysLeft <= 30) return 'bg-orange-500';
  return 'bg-emerald-500';
}

function getProgressWidth(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params?.id as string;
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'administratif' | 'carnet' | 'planification'>('administratif');
  
  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);
  
  const fetchVehicle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/driver/vehicle/${vehicleId}`);
      const data = await res.json();
      setVehicle(data.vehicle);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Véhicule non trouvé</h2>
            <p className="text-slate-500 mb-4">Ce véhicule n'existe pas ou vous n'y avez pas accès.</p>
            <Link href="/driver/vehicles">
              <Button>Retour à Ma Flotte</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const vtDaysLeft = daysUntil(vehicle.vtEndDate);
  const insuranceDaysLeft = daysUntil(vehicle.insuranceEndDate);
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg text-slate-800 dark:text-white">
                  {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-sm text-slate-500">{vehicle.licensePlate || vehicle.reference}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <Share2 className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Vehicle Hero Card */}
        <Card className="overflow-hidden mb-6">
          <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative">
            {vehicle.mainPhoto ? (
              <img src={vehicle.mainPhoto} alt={vehicle.make || 'Véhicule'} className="w-full h-full object-cover" />
            ) : (
              <Car className="w-20 h-20 text-slate-400" />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-end justify-between">
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h2>
                  <p className="text-white/80">{vehicle.year} • {vehicle.color || 'Couleur non renseignée'}</p>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Gauge className="w-4 h-4" />
                  <span className="font-semibold">{vehicle.currentMileage.toLocaleString()} km</span>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Immatriculation</p>
                <p className="font-semibold text-slate-800 dark:text-white">{vehicle.licensePlate || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500">VIN</p>
                <p className="font-mono text-slate-800 dark:text-white truncate">{vehicle.vin || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500">Motorisation</p>
                <p className="font-semibold text-slate-800 dark:text-white capitalize">{vehicle.engineType || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500">Référence OKAR</p>
                <p className="font-mono text-orange-500">{vehicle.reference}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('administratif')}
            className={cn(
              "px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors",
              activeTab === 'administratif'
                ? "bg-slate-900 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            )}
          >
            📋 Administratif
          </button>
          <button
            onClick={() => setActiveTab('carnet')}
            className={cn(
              "px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors",
              activeTab === 'carnet'
                ? "bg-slate-900 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            )}
          >
            🔧 Carnet d'entretien
          </button>
          <button
            onClick={() => setActiveTab('planification')}
            className={cn(
              "px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors",
              activeTab === 'planification'
                ? "bg-slate-900 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            )}
          >
            📅 Planification
          </button>
        </div>
        
        {/* TAB: Administratif */}
        {activeTab === 'administratif' && (
          <div className="space-y-4">
            {/* Visite Technique */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  Visite Technique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", getProgressColor(vtDaysLeft))}
                      style={{ width: `${getProgressWidth(vehicle.vtStartDate, vehicle.vtEndDate)}%` }}
                    />
                  </div>
                  {vtDaysLeft !== null && vtDaysLeft <= 30 && (
                    <div className="absolute -top-1 right-0">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-1 rounded-full",
                        vtDaysLeft <= 0 ? "bg-red-100 text-red-700" :
                        vtDaysLeft <= 7 ? "bg-red-100 text-red-700" :
                        "bg-orange-100 text-orange-700"
                      )}>
                        {vtDaysLeft <= 0 ? 'EXPIRÉ' : `${vtDaysLeft} jours restants`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Date de début</p>
                    <p className="font-medium">{formatDate(vehicle.vtStartDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date de fin</p>
                    <p className="font-medium">{formatDate(vehicle.vtEndDate)}</p>
                  </div>
                  {vehicle.vtCenter && (
                    <div className="col-span-2">
                      <p className="text-slate-500">Centre</p>
                      <p className="font-medium">{vehicle.vtCenter}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Assurance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Assurance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", getProgressColor(insuranceDaysLeft))}
                      style={{ width: `${getProgressWidth(vehicle.insuranceStartDate, vehicle.insuranceEndDate)}%` }}
                    />
                  </div>
                  {insuranceDaysLeft !== null && insuranceDaysLeft <= 30 && (
                    <div className="absolute -top-1 right-0">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-1 rounded-full",
                        insuranceDaysLeft <= 0 ? "bg-red-100 text-red-700" :
                        insuranceDaysLeft <= 7 ? "bg-red-100 text-red-700" :
                        "bg-orange-100 text-orange-700"
                      )}>
                        {insuranceDaysLeft <= 0 ? 'EXPIRÉ' : `${insuranceDaysLeft} jours restants`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Compagnie</p>
                    <p className="font-medium">{vehicle.insuranceCompany || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">N° Police</p>
                    <p className="font-medium font-mono">{vehicle.insurancePolicyNum || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date de début</p>
                    <p className="font-medium">{formatDate(vehicle.insuranceStartDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date de fin</p>
                    <p className="font-medium">{formatDate(vehicle.insuranceEndDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* TAB: Carnet d'entretien */}
        {activeTab === 'carnet' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-500" />
                Historique des interventions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicle.maintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune intervention enregistrée</p>
                  <p className="text-sm mt-1">Les garages certifiés pourront ajouter des interventions ici.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicle.maintenanceRecords.map((record, index) => (
                    <div 
                      key={record.id}
                      className={cn(
                        "relative pl-6 pb-4 border-l-2",
                        index === vehicle.maintenanceRecords.length - 1 ? "border-l-transparent" : "border-l-slate-200 dark:border-l-slate-700"
                      )}
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-500" />
                      
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{CATEGORY_ICONS[record.category] || '🔧'}</span>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {CATEGORY_LABELS[record.category] || record.category}
                              </p>
                              {record.subCategory && (
                                <p className="text-xs text-slate-500">{record.subCategory}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {record.isLocked ? (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verrouillé
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                <Clock className="w-3 h-3 mr-1" /> En attente
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {record.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                            {record.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(record.interventionDate)}
                          </span>
                          {record.mileage && (
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              {record.mileage.toLocaleString()} km
                            </span>
                          )}
                          {record.garageName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {record.garageName}
                            </span>
                          )}
                        </div>
                        
                        {record.correctionOfId && (
                          <div className="mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded">
                            ⚠️ Correction d'une intervention précédente
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* TAB: Planification */}
        {activeTab === 'planification' && (
          <div className="space-y-4">
            {/* Next Maintenance */}
            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Wrench className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500">Prochaine échéance</p>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
                      {vehicle.nextMaintenanceType || 'Entretien'}
                    </h3>
                    {vehicle.nextMaintenanceDueKm && (
                      <p className="text-slate-600 dark:text-slate-300">
                        Prévu à <span className="font-semibold">{vehicle.nextMaintenanceDueKm.toLocaleString()} km</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {vehicle.currentMileage && vehicle.nextMaintenanceDueKm && (
                      <div>
                        <p className="text-2xl font-bold text-orange-500">
                          {(vehicle.nextMaintenanceDueKm - vehicle.currentMileage).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">km restants</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Last Maintenance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Dernier entretien
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehicle.lastMaintenanceDate ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold capitalize">{vehicle.lastMaintenanceType || 'Entretien'}</p>
                      <p className="text-sm text-slate-500">{formatDate(vehicle.lastMaintenanceDate)}</p>
                    </div>
                    {vehicle.lastMaintenanceKm && (
                      <div className="text-right">
                        <p className="font-semibold">{vehicle.lastMaintenanceKm.toLocaleString()} km</p>
                        <p className="text-xs text-slate-500">Kilométrage</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Aucun entretien enregistré</p>
                )}
              </CardContent>
            </Card>
            
            {/* Reminders */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Rappels configurés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-orange-500" />
                    <span className="text-sm">Visite Technique</span>
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                    Activé
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">Assurance</span>
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                    Activé
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-purple-500" />
                    <span className="text-sm">Vidange / Entretien</span>
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                    Activé
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Owner Info */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {vehicle.ownerName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">{vehicle.ownerName || 'Propriétaire'}</p>
                <p className="text-sm text-slate-500">{vehicle.ownerPhone || 'Téléphone non renseigné'}</p>
              </div>
              {vehicle.ownerPhone && (
                <a href={`tel:${vehicle.ownerPhone}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Phone className="w-4 h-4" />
                    Appeler
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
