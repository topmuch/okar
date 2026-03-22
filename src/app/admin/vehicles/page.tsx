'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Search,
  Eye,
  AlertTriangle,
  Calendar,
  RefreshCw,
  User,
  FileText,
  Star,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

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
  qrCode: {
    id: string;
    codeUnique: string;
    shortCode: string;
    status: string;
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
  
  // Modal détail
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Modal révocation QR
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [vehicleToRevoke, setVehicleToRevoke] = useState<Vehicle | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

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

  const handleRevokeQr = async () => {
    if (!vehicleToRevoke) return;
    if (revokeReason.length < 5) {
      toast.error('La raison doit contenir au moins 5 caractères');
      return;
    }

    setRevoking(true);
    try {
      const res = await fetch('/api/admin/qrcode/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicleToRevoke.id,
          reason: revokeReason
        })
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('QR code révoqué avec succès');
        setShowRevokeModal(false);
        setVehicleToRevoke(null);
        setRevokeReason('');
        fetchVehicles(); // Rafraîchir la liste
      } else {
        toast.error(data.error || 'Erreur lors de la révocation');
      }
    } catch (error) {
      console.error('Error revoking QR:', error);
      toast.error('Erreur lors de la révocation du QR code');
    } finally {
      setRevoking(false);
    }
  };

  const openRevokeModal = (vehicle: Vehicle) => {
    setVehicleToRevoke(vehicle);
    setRevokeReason('');
    setShowRevokeModal(true);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = searchQuery.toLowerCase();
    return (
      vehicle.reference.toLowerCase().includes(searchLower) ||
      vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
      vehicle.make?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower) ||
      vehicle.vin?.toLowerCase().includes(searchLower) ||
      vehicle.owner?.phone?.includes(searchQuery) ||
      vehicle.proprietor?.phone?.includes(searchQuery)
    );
  });

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
  const totalInterventions = vehicles.reduce((acc, v) => acc + (v._count?.maintenanceRecords || 0), 0);
  const expiringVt = vehicles.filter(v => isExpiringSoon(v.vtEndDate)).length;
  const expiringInsurance = vehicles.filter(v => isExpiringSoon(v.insuranceEndDate)).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Véhicules Activés
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {totalVehicles} véhicules avec QR code activé
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
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalInterventions}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Interventions</p>
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
                  <th className="text-left p-4 text-sm font-medium text-slate-500">QR Code</th>
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
                      {vehicle.qrCode ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500">Actif</Badge>
                          <a 
                            href={`/v/${vehicle.qrCode.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {vehicle.qrCode.shortCode}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
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
                      <div className="flex items-center gap-2">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRevokeModal(vehicle)}
                          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

      {/* Modal Révocation QR */}
      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Révoquer le QR Code
            </DialogTitle>
            <DialogDescription>
              Cette action va désactiver le QR code du véhicule.
            </DialogDescription>
          </DialogHeader>

          {vehicleToRevoke && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="font-medium">
                  {vehicleToRevoke.make} {vehicleToRevoke.model} {vehicleToRevoke.year || ''}
                </p>
                <p className="text-sm text-slate-500">
                  {vehicleToRevoke.licensePlate || vehicleToRevoke.reference}
                </p>
                {vehicleToRevoke.qrCode && (
                  <p className="text-xs text-blue-600 mt-1">
                    QR: {vehicleToRevoke.qrCode.shortCode}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Raison de la révocation *
                </label>
                <Textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Indiquez la raison de la révocation..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRevokeModal(false);
                setVehicleToRevoke(null);
                setRevokeReason('');
              }}
              disabled={revoking}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeQr}
              disabled={revoking || revokeReason.length < 5}
            >
              {revoking ? 'Révocation...' : 'Révoquer le QR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
