'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Search,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  User,
  Building2,
  Car,
  QrCode,
  RefreshCw,
  Filter,
  MessageCircle,
  FileText,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Types
interface Report {
  id: string;
  type: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  reporterName: string | null;
  reporterPhone: string | null;
  reporterRole: string | null;
  reportedType: string;
  reportedId: string | null;
  reportedName: string | null;
  adminNotes: string | null;
  resolution: string | null;
  actionTaken: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

const REPORT_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  FRAUD: { label: 'Fraude', icon: Shield, color: 'text-red-600' },
  LOST_QR: { label: 'QR Perdu', icon: QrCode, color: 'text-amber-600' },
  SUSPICIOUS_GARAGE: { label: 'Garage Suspect', icon: Building2, color: 'text-purple-600' },
  FAKE_INTERVENTION: { label: 'Fausse Intervention', icon: FileText, color: 'text-orange-600' },
  OTHER: { label: 'Autre', icon: AlertTriangle, color: 'text-gray-600' },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status: newStatus,
          adminNotes,
          resolution,
        }),
      });

      if (res.ok) {
        toast.success('Signalement mis à jour');
        fetchReports();
        setShowDetailModal(false);
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      report.title.toLowerCase().includes(searchLower) ||
      report.description.toLowerCase().includes(searchLower) ||
      report.reporterName?.toLowerCase().includes(searchLower) ||
      report.reporterPhone?.includes(searchQuery);

    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'En attente', className: 'bg-amber-500' },
      INVESTIGATING: { label: 'En enquête', className: 'bg-blue-500' },
      RESOLVED: { label: 'Résolu', className: 'bg-emerald-500' },
      DISMISSED: { label: 'Rejeté', className: 'bg-gray-500' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  // Stats
  const pendingCount = reports.filter(r => r.status === 'PENDING').length;
  const investigatingCount = reports.filter(r => r.status === 'INVESTIGATING').length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const criticalCount = reports.filter(r => r.priority === 'CRITICAL').length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Signalements & Alertes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gérez les signalements de fraude, QR perdus et activités suspectes
          </p>
        </div>
        <Button variant="outline" onClick={fetchReports} className="gap-2">
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

        <Card className="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{investigatingCount}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">En enquête</p>
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
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{resolvedCount}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Résolus</p>
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
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{criticalCount}</p>
                <p className="text-sm text-red-600 dark:text-red-400">Critiques</p>
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
            placeholder="Rechercher par titre, description, déclarant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            {Object.entries(REPORT_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="INVESTIGATING">En enquête</SelectItem>
            <SelectItem value="RESOLVED">Résolu</SelectItem>
            <SelectItem value="DISMISSED">Rejeté</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="CRITICAL">Critique</SelectItem>
            <SelectItem value="HIGH">Haute</SelectItem>
            <SelectItem value="NORMAL">Normale</SelectItem>
            <SelectItem value="LOW">Basse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Aucun signalement trouvé
            </h3>
            <p className="text-slate-500">
              {searchQuery ? 'Modifiez vos critères de recherche' : 'Les signalements apparaîtront ici'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const typeConfig = REPORT_TYPES[report.type] || REPORT_TYPES.OTHER;
            const TypeIcon = typeConfig.icon;

            return (
              <Card 
                key={report.id} 
                className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  report.priority === 'CRITICAL' ? 'border-red-300 dark:border-red-800' : ''
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Left - Type indicator */}
                    <div className={`w-full md:w-2 h-2 md:h-auto ${
                      report.priority === 'CRITICAL' ? 'bg-red-500' :
                      report.priority === 'HIGH' ? 'bg-amber-500' :
                      report.priority === 'NORMAL' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />

                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${typeConfig.color}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white">{report.title}</h3>
                            {getStatusBadge(report.status)}
                            <Badge className={PRIORITY_COLORS[report.priority]}>
                              {report.priority}
                            </Badge>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {report.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{report.reporterName || 'Anonyme'}</span>
                              {report.reporterPhone && <span>({report.reporterPhone})</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Type: {typeConfig.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setAdminNotes(report.adminNotes || '');
                              setResolution(report.resolution || '');
                              setShowDetailModal(true);
                            }}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Traiter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Traiter le signalement
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* Report details */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedReport.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Déclarant: {selectedReport.reporterName || 'Anonyme'}</span>
                  {selectedReport.reporterPhone && <span>Tél: {selectedReport.reporterPhone}</span>}
                  <span>Signalé: {selectedReport.reportedType}</span>
                </div>
              </div>

              {/* Admin notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes admin</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes internes sur l'enquête..."
                  rows={3}
                />
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-sm font-medium mb-2">Résolution</label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Conclusion de l'enquête..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus(selectedReport?.id || '', 'INVESTIGATING')}
              disabled={actionLoading}
            >
              <Search className="w-4 h-4 mr-2" />
              Enquêter
            </Button>
            <Button
              onClick={() => handleUpdateStatus(selectedReport?.id || '', 'RESOLVED')}
              disabled={actionLoading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Résoudre
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdateStatus(selectedReport?.id || '', 'DISMISSED')}
              disabled={actionLoading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
