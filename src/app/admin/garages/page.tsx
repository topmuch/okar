'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types
interface Garage {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isCertified: boolean;
  active: boolean;
  subscriptionPlan: string;
  createdAt: string;
  _count?: {
    vehicles: number;
    users: number;
  };
}

export default function GaragesManagementPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCertified, setFilterCertified] = useState<string>('all');

  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/garages');
      const data = await res.json();
      setGarages(data.garages || []);
    } catch (error) {
      console.error('Error fetching garages:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCertification = async (garageId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/garages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: garageId,
          isCertified: !currentStatus,
        }),
      });

      if (res.ok) {
        setGarages(garages.map(g =>
          g.id === garageId ? { ...g, isCertified: !currentStatus } : g
        ));
      }
    } catch (error) {
      console.error('Error updating garage:', error);
    }
  };

  const filteredGarages = garages.filter(garage => {
    const matchesSearch = garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      garage.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCertified === 'all' ||
      (filterCertified === 'certified' && garage.isCertified) ||
      (filterCertified === 'pending' && !garage.isCertified);
    return matchesSearch && matchesFilter;
  });

  const certifiedCount = garages.filter(g => g.isCertified).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Gestion des Garages
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {garages.length} garages • {certifiedCount} certifiés
          </p>
        </div>
        <Button variant="outline" onClick={fetchGarages} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un garage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterCertified === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterCertified('all')}
            className={filterCertified === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            Tous
          </Button>
          <Button
            variant={filterCertified === 'certified' ? 'default' : 'outline'}
            onClick={() => setFilterCertified('certified')}
            className={filterCertified === 'certified' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
          >
            Certifiés
          </Button>
          <Button
            variant={filterCertified === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterCertified('pending')}
            className={filterCertified === 'pending' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            En attente
          </Button>
        </div>
      </div>

      {/* Garages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGarages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Aucun garage trouvé
            </h3>
            <p className="text-slate-500">
              {searchQuery ? 'Modifiez vos critères de recherche' : 'Les garages apparaîtront ici'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGarages.map((garage) => (
            <Card key={garage.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {garage.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{garage.name}</h3>
                      <p className="text-white/70 text-sm">{garage.slug}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/qrcodes?garage=${garage.id}`}>
                          <QrCode className="w-4 h-4 mr-2" />
                          Voir QR Codes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleCertification(garage.id, garage.isCertified)}>
                        {garage.isCertified ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Retirer certification
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Certifier
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {garage.isCertified ? (
                    <Badge className="bg-emerald-500">Certifié</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">En attente</Badge>
                  )}
                  {garage.active && (
                    <Badge variant="outline">Actif</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  {garage.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{garage.phone}</span>
                    </div>
                  )}
                  {garage.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{garage.email}</span>
                    </div>
                  )}
                  {garage.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{garage.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-white">{garage._count?.vehicles || 0}</span> véhicules
                  </div>
                  <Link href={`/admin/qrcodes?garage=${garage.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <QrCode className="w-4 h-4" />
                      QR Codes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
