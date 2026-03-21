'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  AlertTriangle,
  Car,
  Shield,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  Bell,
  Send,
  Phone,
  User,
  FileText,
  ChevronRight,
  ExternalLink
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
interface ExpiringVehicle {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  licensePlate: string | null;
  vtEndDate: string | null;
  insuranceEndDate: string | null;
  daysUntilVtExpiry: number | null;
  daysUntilInsuranceExpiry: number | null;
  owner: {
    name: string | null;
    phone: string | null;
  } | null;
  proprietor: {
    name: string | null;
    phone: string | null;
  } | null;
  garage: {
    name: string;
  } | null;
}

export default function AdminExpirationsPage() {
  const [vehicles, setVehicles] = useState<ExpiringVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDays, setFilterDays] = useState<string>('7');

  useEffect(() => {
    fetchExpiringVehicles();
  }, [filterDays]);

  const fetchExpiringVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/expirations?days=${filterDays}`);
      const data = await res.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching expirations:', error);
      toast.error('Erreur lors du chargement');
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
      vehicle.owner?.phone?.includes(searchQuery) ||
      vehicle.proprietor?.phone?.includes(searchQuery);

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'vt') return matchesSearch && vehicle.daysUntilVtExpiry !== null;
    if (filterType === 'insurance') return matchesSearch && vehicle.daysUntilInsuranceExpiry !== null;
    return matchesSearch;
  });

  const getExpiryStatus = (days: number | null) => {
    if (days === null) return { label: '-', color: 'text-gray-400', urgent: false };
    if (days < 0) return { label: 'Expiré', color: 'text-red-600', urgent: true };
    if (days <= 3) return { label: `${days}j`, color: 'text-red-600', urgent: true };
    if (days <= 7) return { label: `${days}j`, color: 'text-amber-600', urgent: true };
    return { label: `${days}j`, color: 'text-green-600', urgent: false };
  };

  // Stats
  const vtExpiring = vehicles.filter(v => v.daysUntilVtExpiry !== null && v.daysUntilVtExpiry! <= 7 && v.daysUntilVtExpiry! >= 0);
  const insuranceExpiring = vehicles.filter(v => v.daysUntilInsuranceExpiry !== null && v.daysUntilInsuranceExpiry! <= 7 && v.daysUntilInsuranceExpiry! >= 0);
  const vtExpired = vehicles.filter(v => v.daysUntilVtExpiry !== null && v.daysUntilVtExpiry! < 0);
  const insuranceExpired = vehicles.filter(v => v.daysUntilInsuranceExpiry !== null && v.daysUntilInsuranceExpiry! < 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Suivi des Expirations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Véhicules avec VT ou Assurance arrivant à expiration
          </p>
        </div>
        <Button variant="outline" onClick={fetchExpiringVehicles} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{vtExpiring.length}</p>
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
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{vtExpired.length}</p>
                <p className="text-sm text-red-600 dark:text-red-400">VT expirés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{insuranceExpiring.length}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Assurance &lt;7j</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{insuranceExpired.length}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Assurance expirées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vt" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="vt" className="gap-2">
            <Calendar className="w-4 h-4" />
            Contrôle Technique ({vtExpiring.length + vtExpired.length})
          </TabsTrigger>
          <TabsTrigger value="insurance" className="gap-2">
            <Shield className="w-4 h-4" />
            Assurance ({insuranceExpiring.length + insuranceExpired.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher par plaque, référence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDays} onValueChange={setFilterDays}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Dans les 3 jours</SelectItem>
              <SelectItem value="7">Dans les 7 jours</SelectItem>
              <SelectItem value="14">Dans les 14 jours</SelectItem>
              <SelectItem value="30">Dans les 30 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="vt">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6"><div className="h-16 bg-slate-200 rounded"></div></CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVehicles
                .filter(v => v.daysUntilVtExpiry !== null)
                .sort((a, b) => (a.daysUntilVtExpiry || 0) - (b.daysUntilVtExpiry || 0))
                .map((vehicle) => {
                  const status = getExpiryStatus(vehicle.daysUntilVtExpiry);
                  return (
                    <Card 
                      key={vehicle.id} 
                      className={`${status.urgent ? 'border-red-300 dark:border-red-800' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              status.urgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">
                                {vehicle.make} {vehicle.model} - {vehicle.licensePlate || vehicle.reference}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {vehicle.proprietor?.name || vehicle.owner?.name || 'N/A'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {vehicle.proprietor?.phone || vehicle.owner?.phone || '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-xl font-bold ${status.color}`}>
                                {status.label}
                              </p>
                              <p className="text-xs text-slate-500">
                                {vehicle.vtEndDate && new Date(vehicle.vtEndDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <Link href={`/admin/vehicles?id=${vehicle.id}`}>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insurance">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6"><div className="h-16 bg-slate-200 rounded"></div></CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVehicles
                .filter(v => v.daysUntilInsuranceExpiry !== null)
                .sort((a, b) => (a.daysUntilInsuranceExpiry || 0) - (b.daysUntilInsuranceExpiry || 0))
                .map((vehicle) => {
                  const status = getExpiryStatus(vehicle.daysUntilInsuranceExpiry);
                  return (
                    <Card 
                      key={vehicle.id} 
                      className={`${status.urgent ? 'border-red-300 dark:border-red-800' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              status.urgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              <Shield className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">
                                {vehicle.make} {vehicle.model} - {vehicle.licensePlate || vehicle.reference}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {vehicle.proprietor?.name || vehicle.owner?.name || 'N/A'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {vehicle.proprietor?.phone || vehicle.owner?.phone || '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-xl font-bold ${status.color}`}>
                                {status.label}
                              </p>
                              <p className="text-xs text-slate-500">
                                {vehicle.insuranceEndDate && new Date(vehicle.insuranceEndDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <Link href={`/admin/vehicles?id=${vehicle.id}`}>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
