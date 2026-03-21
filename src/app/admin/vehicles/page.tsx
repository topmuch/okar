'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Search,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  QrCode,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  MapPin,
  Phone,
  User,
  FileText,
  Ban,
  ChevronRight,
  ExternalLink,
  History,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
interface Vehicle {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  licensePlate: string | null;
  vin: string | null;
  currentMileage: number;
  vtEndDate: string | null;
  insuranceEndDate: string | null;
  qrStatus: string;
  status: string;
  okarScore: number;
  okarBadge: string | null;
  createdAt: string;
  lastScanDate: string | null;
  owner: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  proprietor: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  garage: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count: {
    maintenanceRecords: number;
  };
  maintenanceRecords: Array<{
    id: string;
    category: string;
    description: string | null;
    interventionDate: string;
    status: string;
    source: string;
    garage: {
      name: string;
    } | null;
  }>;
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterQrStatus, setFilterQrStatus] = useState<string>('all');
  
  // Modal
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vehicles');
      const data = await res.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      vehicle.reference.toLowerCase().includes(searchLower) ||
      vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
      vehicle.make?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower) ||
      vehicle.vin?.toLowerCase().includes(searchLower) ||
      vehicle.owner?.phone?.includes(searchQuery) ||
      vehicle.proprietor?.phone?.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    const matchesQrStatus = filterQrStatus === 'all' || vehicle.qrStatus === filterQrStatus;

    return matchesSearch && matchesStatus && matchesQrStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending_activation: { label: 'En attente', className: 'bg-amber-500' },
      active: { label: 'Actif', className: 'bg-emerald-500' },
      expired: { label: 'Expiré', className: 'bg-red-500' },
      suspended: { label: 'Suspendu', className: 'bg-red-600' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getQrStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      INACTIVE: { label: 'Inactif', className: 'bg-gray-500' },
      ACTIVE: { label: 'Actif', className: 'bg-emerald-500' },
      LOST: { label: 'Perdu', className: 'bg-red-500' },
      REVOKED: { label: 'Révoqué', className: 'bg-red-600' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const getBadgeIcon = (badge: string | null) => {
    if (!badge) return null;
    const colors: Record<string, string> = {
      BRONZE: 'text-amber-600',
      SILVER: 'text-gray-400',
      GOLD: 'text-yellow-500',
    };
    return <Star className={`w-4 h-4 ${colors[badge] || 'text-gray-400'}`} fill="currentColor" />;
  };

  const isExpiringSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  // Stats
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const expiringVt = vehicles.filter(v => isExpiringSoon(v.vtEndDate)).length;
  const expiringInsurance = vehicles.filter(v => isExpiringSoon(v.insuranceEndDate)).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Gestion des Véhicules
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {totalVehicles} véhicules • {activeVehicles} actifs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVehicles} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalVehicles}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{activeVehicles}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{expiringVt}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">VT expire &lt;7j</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{expiringInsurance}</p>
                <p className="text-sm text-red-600 dark:text-red-400">Assurance &lt;7j</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par référence, plaque, VIN, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="pending_activation">En attente</SelectItem>
            <SelectItem value="expired">Expiré</SelectItem>
            <SelectItem value="suspended">Suspendu</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterQrStatus} onValueChange={setFilterQrStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="QR Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous QR</SelectItem>
            <SelectItem value="ACTIVE">QR Actif</SelectItem>
            <SelectItem value="INACTIVE">QR Inactif</SelectItem>
            <SelectItem value="LOST">QR Perdu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vehicles Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Aucun véhicule trouvé
            </h3>
            <p className="text-slate-500">
              {searchQuery ? 'Modifiez vos critères de recherche' : 'Les véhicules apparaîtront ici'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Véhicule</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Propriétaire</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Garage</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Statut</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Score</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Exp. VT</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {vehicle.make?.charAt(0) || 'V'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {vehicle.make} {vehicle.model} {vehicle.year || ''}
                          </p>
                          <p className="text-sm text-slate-500">{vehicle.licensePlate || vehicle.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {vehicle.proprietor?.name || vehicle.owner?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {vehicle.proprietor?.phone || vehicle.owner?.phone || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {vehicle.garage ? (
                        <Link 
                          href={`/admin/garages?id=${vehicle.garage.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {vehicle.garage.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(vehicle.status)}
                        {getQrStatusBadge(vehicle.qrStatus)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-800 dark:text-white">
                          {vehicle.okarScore}
                        </span>
                        {getBadgeIcon(vehicle.okarBadge)}
                      </div>
                    </td>
                    <td className="p-4">
                      {vehicle.vtEndDate ? (
                        <div className={`text-sm ${isExpired(vehicle.vtEndDate) ? 'text-red-600' : isExpiringSoon(vehicle.vtEndDate) ? 'text-amber-600' : 'text-slate-600'}`}>
                          {new Date(vehicle.vtEndDate).toLocaleDateString('fr-FR')}
                          {isExpired(vehicle.vtEndDate) && <span className="ml-1">(Expiré)</span>}
                          {isExpiringSoon(vehicle.vtEndDate) && !isExpired(vehicle.vtEndDate) && <span className="ml-1">(Bientôt)</span>}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setShowDetailModal(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Détails
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal - Vue Dieu */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vue Dieu - {selectedVehicle?.make} {selectedVehicle?.model}
            </DialogTitle>
            <DialogDescription>
              Référence: {selectedVehicle?.reference}
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Infos</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Véhicule</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Marque:</span><span className="font-medium">{selectedVehicle.make || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Modèle:</span><span className="font-medium">{selectedVehicle.model || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Année:</span><span className="font-medium">{selectedVehicle.year || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Couleur:</span><span className="font-medium">{selectedVehicle.color || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Plaque:</span><span className="font-medium">{selectedVehicle.licensePlate || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Kilométrage:</span><span className="font-medium">{selectedVehicle.currentMileage.toLocaleString()} km</span></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Propriétaire</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Nom:</span><span className="font-medium">{selectedVehicle.proprietor?.name || selectedVehicle.owner?.name || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Téléphone:</span><span className="font-medium">{selectedVehicle.proprietor?.phone || selectedVehicle.owner?.phone || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Garage:</span><span className="font-medium">{selectedVehicle.garage?.name || '-'}</span></div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Score OKAR</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-black text-slate-800 dark:text-white">{selectedVehicle.okarScore}</div>
                      <div className="flex items-center gap-2">
                        {getBadgeIcon(selectedVehicle.okarBadge)}
                        <span className="text-lg font-medium">{selectedVehicle.okarBadge || 'Pas de badge'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 dark:text-white">Interventions ({selectedVehicle._count.maintenanceRecords})</h4>
                  {selectedVehicle.maintenanceRecords.length === 0 ? (
                    <p className="text-slate-500 text-sm">Aucune intervention enregistrée</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedVehicle.maintenanceRecords.map((record) => (
                        <div key={record.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${record.source === 'PRE_OKAR_PAPER' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <div>
                              <p className="font-medium text-sm">{record.category}</p>
                              <p className="text-xs text-slate-500">{new Date(record.interventionDate).toLocaleDateString('fr-FR')} • {record.garage?.name || 'N/A'}</p>
                            </div>
                          </div>
                          <Badge variant={record.status === 'VALIDATED' ? 'default' : 'secondary'}>{record.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-sm text-slate-500">Créé le</p>
                    <p className="font-medium">{new Date(selectedVehicle.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-sm text-slate-500">Dernier scan</p>
                    <p className="font-medium">{selectedVehicle.lastScanDate ? new Date(selectedVehicle.lastScanDate).toLocaleDateString('fr-FR') : 'Jamais'}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
