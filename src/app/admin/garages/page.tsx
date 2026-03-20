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
  RefreshCw,
  Ban,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

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
  // PARTIE 1.5 - Suspension manuelle
  accountStatus: string;
  suspendedAt: string | null;
  suspendedBy: string | null;
  suspensionReason: string | null;
  contractEndDate: string | null;
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

  // Suspension modal
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendActionLoading, setSuspendActionLoading] = useState<string | null>(null);

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
      toast.error('Erreur lors du chargement des garages');
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
        toast.success(currentStatus ? 'Certification retirée' : 'Garage certifié');
      }
    } catch (error) {
      console.error('Error updating garage:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // PARTIE 1.5 - Suspension/Réactivation
  const handleToggleSuspension = async (garage: Garage, suspend: boolean) => {
    if (suspend) {
      // Ouvrir la modal pour saisir le motif
      setSelectedGarage(garage);
      setSuspensionReason('');
      setShowSuspendModal(true);
    } else {
      // Réactiver directement
      setSuspendActionLoading(garage.id);
      try {
        const res = await fetch('/api/admin/garages/suspend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            garageId: garage.id,
            action: 'reactivate',
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erreur lors de la réactivation');
        }

        toast.success('Garage réactivé avec succès.');
        fetchGarages();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la réactivation');
      } finally {
        setSuspendActionLoading(null);
      }
    }
  };

  const handleConfirmSuspension = async () => {
    if (!selectedGarage) return;
    if (!suspensionReason.trim()) {
      toast.error('Veuillez saisir un motif de suspension');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/garages/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garageId: selectedGarage.id,
          action: 'suspend',
          reason: suspensionReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suspension');
      }

      toast.success('Garage suspendu avec succès.');
      fetchGarages();
      setShowSuspendModal(false);
      setSuspensionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suspension');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredGarages = garages.filter(garage => {
    const matchesSearch = garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      garage.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCertified === 'all' ||
      (filterCertified === 'certified' && garage.isCertified) ||
      (filterCertified === 'pending' && !garage.isCertified) ||
      (filterCertified === 'suspended' && garage.accountStatus === 'SUSPENDED_BY_ADMIN');
    return matchesSearch && matchesFilter;
  });

  const certifiedCount = garages.filter(g => g.isCertified).length;
  const suspendedCount = garages.filter(g => g.accountStatus === 'SUSPENDED_BY_ADMIN').length;

  const getAccountStatusBadge = (garage: Garage) => {
    if (garage.accountStatus === 'SUSPENDED_BY_ADMIN') {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="w-3 h-3" />
          Suspendu
        </Badge>
      );
    }
    return null;
  };

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
            {suspendedCount > 0 && ` • ${suspendedCount} suspendu(s)`}
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
        <div className="flex gap-2 flex-wrap">
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
          <Button
            variant={filterCertified === 'suspended' ? 'default' : 'outline'}
            onClick={() => setFilterCertified('suspended')}
            className={filterCertified === 'suspended' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            Suspendus
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
            <Card key={garage.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${garage.accountStatus === 'SUSPENDED_BY_ADMIN' ? 'border-red-300 dark:border-red-800' : ''}`}>
              {/* Header */}
              <div className={`p-4 ${garage.accountStatus === 'SUSPENDED_BY_ADMIN' ? 'bg-gradient-to-r from-red-800 to-red-900' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${garage.accountStatus === 'SUSPENDED_BY_ADMIN' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-orange-500 to-pink-500'}`}>
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
                      <DropdownMenuSeparator />
                      {garage.accountStatus === 'SUSPENDED_BY_ADMIN' ? (
                        <DropdownMenuItem 
                          onClick={() => handleToggleSuspension(garage, false)}
                          className="text-emerald-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Réactiver le compte
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleToggleSuspension(garage, true)}
                          className="text-red-600"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Suspendre le compte
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {garage.isCertified ? (
                    <Badge className="bg-emerald-500">Certifié</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">En attente</Badge>
                  )}
                  {getAccountStatusBadge(garage)}
                  {garage.active && garage.accountStatus !== 'SUSPENDED_BY_ADMIN' && (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600">Actif</Badge>
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
                  {garage.contractEndDate && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Calendar className="w-4 h-4" />
                      <span>Fin contrat: {new Date(garage.contractEndDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                {/* Suspension reason */}
                {garage.accountStatus === 'SUSPENDED_BY_ADMIN' && garage.suspensionReason && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm text-red-600 dark:text-red-400">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Suspendu:</strong> {garage.suspensionReason}
                        {garage.suspendedAt && (
                          <div className="text-xs mt-1">
                            {new Date(garage.suspendedAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Status Toggle */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Statut compte:</span>
                    <Switch
                      checked={garage.accountStatus === 'ACTIVE'}
                      onCheckedChange={(checked) => handleToggleSuspension(garage, !checked)}
                      disabled={suspendActionLoading === garage.id}
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
                    />
                    {suspendActionLoading === garage.id && (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    )}
                  </div>
                  <Link href={`/admin/qrcodes?garage=${garage.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <QrCode className="w-4 h-4" />
                      QR Codes
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-between mt-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-white">{garage._count?.vehicles || 0}</span> véhicules
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" />
              Suspendre le garage
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de suspendre <strong>{selectedGarage?.name}</strong>.
              Veuillez saisir un motif de suspension.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Motif de suspension *</label>
              <Textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Ex: Non-paiement, violation des conditions d'utilisation..."
                rows={4}
              />
            </div>

            <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-lg text-sm text-red-700 dark:text-red-300">
              <strong>Attention:</strong> Le garage sera immédiatement déconnecté et ne pourra plus accéder à son compte.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSuspension}
              disabled={actionLoading || !suspensionReason.trim()}
            >
              {actionLoading ? 'Traitement...' : 'Confirmer la suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
