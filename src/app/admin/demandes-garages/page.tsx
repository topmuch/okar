'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  Eye,
  RefreshCw,
  User,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Download,
  MessageCircle,
  Filter,
  Ban,
  PlayCircle,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Types
interface GarageApplication {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  managerName: string | null;
  managerPhone: string | null;
  businessRegistryNumber: string | null;
  agreementDocumentUrl: string | null;
  shopPhoto: string | null;
  idDocumentUrl: string | null;
  validationStatus: string;
  rejectionReason: string | null;
  createdAt: string;
  validatedAt: string | null;
  validatedBy: string | null;
  isCertified: boolean;
  // PARTIE 1.5 - Suspension manuelle
  accountStatus: string;
  suspendedAt: string | null;
  suspendedBy: string | null;
  suspensionReason: string | null;
  contractEndDate: string | null;
  active: boolean;
}

export default function GarageApplicationsPage() {
  const [applications, setApplications] = useState<GarageApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [selectedApplication, setSelectedApplication] = useState<GarageApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendActionLoading, setSuspendActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/garage-applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: GarageApplication) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/garage-applications/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garageId: application.id,
          action: 'approve',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      toast.success('Garage validé avec succès ! Les identifiants ont été envoyés.');
      fetchApplications();
      setShowDetailModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    if (!rejectionReason.trim()) {
      toast.error('Veuillez saisir un motif de rejet');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/garage-applications/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garageId: selectedApplication.id,
          action: 'reject',
          rejectionReason: rejectionReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du rejet');
      }

      toast.success('Demande rejetée. Le demandeur a été notifié.');
      fetchApplications();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  // PARTIE 1.5 - Suspension/Réactivation
  const handleToggleSuspension = async (application: GarageApplication, suspend: boolean) => {
    if (suspend) {
      // Ouvrir la modal pour saisir le motif
      setSelectedApplication(application);
      setSuspensionReason('');
      setShowSuspendModal(true);
    } else {
      // Réactiver directement
      setSuspendActionLoading(application.id);
      try {
        const res = await fetch('/api/admin/garages/suspend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            garageId: application.id,
            action: 'reactivate',
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erreur lors de la réactivation');
        }

        toast.success('Garage réactivé avec succès.');
        fetchApplications();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la réactivation');
      } finally {
        setSuspendActionLoading(null);
      }
    }
  };

  const handleConfirmSuspension = async () => {
    if (!selectedApplication) return;
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
          garageId: selectedApplication.id,
          action: 'suspend',
          reason: suspensionReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suspension');
      }

      toast.success('Garage suspendu avec succès.');
      fetchApplications();
      setShowSuspendModal(false);
      setSuspensionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suspension');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.managerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone?.includes(searchQuery) ||
      app.managerPhone?.includes(searchQuery);

    const matchesFilter = filterStatus === 'all' || app.validationStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-500 hover:bg-amber-600">En attente</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Validé</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAccountStatusBadge = (application: GarageApplication) => {
    if (application.accountStatus === 'SUSPENDED_BY_ADMIN') {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="w-3 h-3" />
          Suspendu
        </Badge>
      );
    }
    if (application.accountStatus === 'ACTIVE' && application.validationStatus === 'APPROVED') {
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1">
          <CheckCircle className="w-3 h-3" />
          Actif
        </Badge>
      );
    }
    return null;
  };

  const pendingCount = applications.filter(a => a.validationStatus === 'PENDING').length;
  const approvedCount = applications.filter(a => a.validationStatus === 'APPROVED').length;
  const rejectedCount = applications.filter(a => a.validationStatus === 'REJECTED').length;
  const suspendedCount = applications.filter(a => a.accountStatus === 'SUSPENDED_BY_ADMIN').length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Demandes d'adhésion Garages
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {pendingCount} demande(s) en attente de validation
            {suspendedCount > 0 && ` • ${suspendedCount} suspendu(s)`}
          </p>
        </div>
        <Button variant="outline" onClick={fetchApplications} className="gap-2">
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
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">En attente</p>
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
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{approvedCount}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Validés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{rejectedCount}</p>
                <p className="text-sm text-red-600 dark:text-red-400">Rejetés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center">
                <Ban className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{suspendedCount}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Suspendus</p>
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
            placeholder="Rechercher par nom, gérant, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="APPROVED">Validés</SelectItem>
            <SelectItem value="REJECTED">Rejetés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
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
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Aucune demande trouvée
            </h3>
            <p className="text-slate-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Modifiez vos critères de recherche'
                : 'Les nouvelles demandes apparaîtront ici'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Left side - Garage Photo */}
                  <div className="w-full md:w-48 h-40 md:h-auto bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    {application.shopPhoto ? (
                      <Image
                        src={application.shopPhoto}
                        alt={application.name}
                        width={200}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Right side - Details */}
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            {application.name}
                          </h3>
                          {getStatusBadge(application.validationStatus)}
                          {getAccountStatusBadge(application)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-500">
                            <User className="w-4 h-4" />
                            <span>Gérant: {application.managerName || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone className="w-4 h-4" />
                            <span>{application.phone || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <MessageCircle className="w-4 h-4" />
                            <span>{application.whatsappNumber || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{application.address || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <FileText className="w-4 h-4" />
                            <span>N° Agrément: {application.businessRegistryNumber || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(application.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {/* Date fin de contrat */}
                          {application.contractEndDate && (
                            <div className="flex items-center gap-2 text-slate-500">
                              <Calendar className="w-4 h-4" />
                              <span className="text-amber-600 dark:text-amber-400">
                                Fin contrat: {new Date(application.contractEndDate).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Suspension info */}
                        {application.accountStatus === 'SUSPENDED_BY_ADMIN' && application.suspensionReason && (
                          <div className="mt-3 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm text-red-600 dark:text-red-400">
                            <strong>Suspendu:</strong> {application.suspensionReason}
                            {application.suspendedAt && (
                              <span className="ml-2 text-xs">
                                ({new Date(application.suspendedAt).toLocaleDateString('fr-FR')})
                              </span>
                            )}
                          </div>
                        )}

                        {application.validationStatus === 'REJECTED' && application.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm text-red-600 dark:text-red-400">
                            <strong>Motif de rejet:</strong> {application.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailModal(true);
                          }}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Détails
                        </Button>

                        {/* Statut Compte Toggle - Only for APPROVED garages */}
                        {application.validationStatus === 'APPROVED' && (
                          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="text-xs text-slate-500">Statut compte:</span>
                            <Switch
                              checked={application.accountStatus === 'ACTIVE'}
                              onCheckedChange={(checked) => handleToggleSuspension(application, !checked)}
                              disabled={suspendActionLoading === application.id}
                              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
                            />
                            {suspendActionLoading === application.id && (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            )}
                          </div>
                        )}

                        {application.validationStatus === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(application)}
                              disabled={actionLoading}
                              className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Valider
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowRejectModal(true);
                              }}
                              className="gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Détails de la demande
            </DialogTitle>
            <DialogDescription>
              Examinez les informations et documents avant de valider
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(selectedApplication.validationStatus)}
                {getAccountStatusBadge(selectedApplication)}
                <span className="text-sm text-slate-500">
                  Demande du {new Date(selectedApplication.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Garage Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Informations Garage</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nom:</span>
                      <span className="font-medium">{selectedApplication.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Téléphone:</span>
                      <span className="font-medium">{selectedApplication.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">WhatsApp:</span>
                      <span className="font-medium">{selectedApplication.whatsappNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium">{selectedApplication.email || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Adresse:</span>
                      <span className="font-medium">{selectedApplication.address || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">N° Agrément:</span>
                      <span className="font-medium">{selectedApplication.businessRegistryNumber || '-'}</span>
                    </div>
                    {selectedApplication.contractEndDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fin de contrat:</span>
                        <span className="font-medium text-amber-600">
                          {new Date(selectedApplication.contractEndDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Informations Gérant</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nom:</span>
                      <span className="font-medium">{selectedApplication.managerName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Téléphone:</span>
                      <span className="font-medium">{selectedApplication.managerPhone || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Documents justificatifs</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Shop Photo */}
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Photo Façade</p>
                    {selectedApplication.shopPhoto ? (
                      <a
                        href={selectedApplication.shopPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden group"
                      >
                        <Image
                          src={selectedApplication.shopPhoto}
                          alt="Photo façade"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ) : (
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Agreement Document */}
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Photo Agrément</p>
                    {selectedApplication.agreementDocumentUrl ? (
                      <a
                        href={selectedApplication.agreementDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden group"
                      >
                        <Image
                          src={selectedApplication.agreementDocumentUrl}
                          alt="Photo agrément"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ) : (
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* ID Document */}
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Pièce d'identité</p>
                    {selectedApplication.idDocumentUrl ? (
                      <a
                        href={selectedApplication.idDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden group"
                      >
                        <Image
                          src={selectedApplication.idDocumentUrl}
                          alt="Pièce d'identité"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ) : (
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedApplication?.validationStatus === 'PENDING' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowRejectModal(true);
                  }}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  onClick={() => selectedApplication && handleApprove(selectedApplication)}
                  disabled={actionLoading}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider et envoyer les identifiants
                </Button>
              </>
            )}
            {selectedApplication?.validationStatus !== 'PENDING' && (
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Rejeter la demande
            </DialogTitle>
            <DialogDescription>
              Veuillez saisir un motif de rejet. Le demandeur sera notifié par SMS/WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Motif de rejet *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Document illisible, informations incomplètes..."
                rows={4}
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg text-sm text-amber-700 dark:text-amber-300">
              <strong>Note:</strong> Le demandeur pourra corriger sa demande et la resoumettre.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? 'Traitement...' : 'Confirmer le rejet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" />
              Suspendre le garage
            </DialogTitle>
            <DialogDescription>
              Veuillez saisir un motif de suspension. Le garage ne pourra plus se connecter.
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
