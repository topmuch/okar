'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Car, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Download, 
  Plus, 
  MoreVertical,
  Calendar,
  Wrench,
  Shield
} from 'lucide-react';

interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  totalMileage: number;
  avgMileagePerVehicle: number;
  pendingAlerts: number;
  vtExpiringSoon: number;
  insuranceExpiringSoon: number;
  maintenanceDue: number;
}

interface FleetAlert {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  internalId?: string;
  message: string;
  dueDate?: string;
  dueKm?: number;
}

interface FleetVehicle {
  id: string;
  internalId?: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year?: number;
    licensePlate?: string;
    currentMileage: number;
    vtEndDate?: string;
    insuranceEndDate?: string;
    nextMaintenanceDueDate?: string;
    nextMaintenanceType?: string;
  };
  assignedDriverName?: string;
  active: boolean;
}

export function FleetDashboard({ fleetAccountId }: { fleetAccountId: string }) {
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFleetData();
  }, [fleetAccountId]);

  const loadFleetData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, alertsRes, vehiclesRes] = await Promise.all([
        fetch(`/api/fleet/${fleetAccountId}/stats`),
        fetch(`/api/fleet/${fleetAccountId}/alerts`),
        fetch(`/api/fleet/${fleetAccountId}/vehicles`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts);
      }

      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(data.vehicles);
      }
    } catch (error) {
      console.error('Failed to load fleet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'CSV' | 'PDF') => {
    try {
      const response = await fetch(`/api/fleet/${fleetAccountId}/export?format=${format}`);
      const data = await response.text();
      
      // Télécharger le fichier
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flotte-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ma Flotte</h1>
          <p className="text-gray-500">Gestion centralisée de vos véhicules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('CSV')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter véhicule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Véhicules</p>
                  <p className="text-2xl font-bold">{stats.totalVehicles}</p>
                  <p className="text-xs text-gray-400">{stats.activeVehicles} actifs</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Alertes</p>
                  <p className="text-2xl font-bold text-red-600">{stats.pendingAlerts}</p>
                  <p className="text-xs text-gray-400">En attente</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Kilométrage Total</p>
                  <p className="text-2xl font-bold">{stats.totalMileage.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">~{stats.avgMileagePerVehicle.toLocaleString()} km/véh.</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expiration Proche</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.vtExpiringSoon + stats.insuranceExpiringSoon}
                  </p>
                  <p className="text-xs text-gray-400">
                    VT: {stats.vtExpiringSoon} | Assur: {stats.insuranceExpiringSoon}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alertes ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                    alert.severity === 'high' ? 'bg-orange-50 border border-orange-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {alert.type.includes('VT') && <Calendar className="h-5 w-5 text-gray-400" />}
                    {alert.type.includes('INSURANCE') && <Shield className="h-5 w-5 text-gray-400" />}
                    {alert.type.includes('MAINTENANCE') && <Wrench className="h-5 w-5 text-gray-400" />}
                    <div>
                      <p className="font-medium text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-500">
                        {alert.vehicleName} - {alert.vehiclePlate}
                        {alert.internalId && ` (${alert.internalId})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                      {alert.severity === 'critical' ? 'Urgent' : 
                       alert.severity === 'high' ? 'Important' : 'À prévoir'}
                    </Badge>
                    <Button size="sm" variant="outline">Voir</Button>
                  </div>
                </div>
              ))}
              {alerts.length > 5 && (
                <Button variant="link" className="w-full">
                  Voir les {alerts.length - 5} alertes supplémentaires
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Véhicules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Interne</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Immatriculation</TableHead>
                <TableHead>Kilométrage</TableHead>
                <TableHead>VT</TableHead>
                <TableHead>Assurance</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((fv) => {
                const vtStatus = getExpiryStatus(fv.vehicle.vtEndDate);
                const insuranceStatus = getExpiryStatus(fv.vehicle.insuranceEndDate);
                
                return (
                  <TableRow key={fv.id}>
                    <TableCell className="font-medium">
                      {fv.internalId || '-'}
                    </TableCell>
                    <TableCell>
                      {fv.vehicle.make} {fv.vehicle.model}
                      {fv.vehicle.year && ` (${fv.vehicle.year})`}
                    </TableCell>
                    <TableCell>{fv.vehicle.licensePlate || '-'}</TableCell>
                    <TableCell>
                      {fv.vehicle.currentMileage.toLocaleString()} km
                    </TableCell>
                    <TableCell>
                      <Badge variant={vtStatus.variant} className="text-xs">
                        {vtStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={insuranceStatus.variant} className="text-xs">
                        {insuranceStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{fv.assignedDriverName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={fv.active ? 'default' : 'secondary'}>
                        {fv.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Voir détails</DropdownMenuItem>
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
                          <DropdownMenuItem>Historique</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Retirer de la flotte
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function
function getExpiryStatus(dateStr?: string): { variant: 'default' | 'destructive' | 'outline' | 'secondary'; label: string } {
  if (!dateStr) {
    return { variant: 'secondary', label: 'Non renseigné' };
  }
  
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) {
    return { variant: 'destructive', label: 'Expiré' };
  }
  if (days <= 7) {
    return { variant: 'destructive', label: `${days}j` };
  }
  if (days <= 30) {
    return { variant: 'outline', label: `${days}j` };
  }
  return { variant: 'default', label: `OK (${days}j)` };
}

export default FleetDashboard;
