'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Package,
  Building2,
  Search,
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
  FileDown,
  Grid3X3,
  Table,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Components
import QRCodeCard, { QRCodeData } from '@/components/admin/QRCodeCard';
import VehicleDetailModal from '@/components/admin/VehicleDetailModal';

// Utilities
import { 
  generateQRCodeLotPDF, 
  generateSingleQRStickerPDF, 
  downloadPDF,
  QRCodeForPDF 
} from '@/lib/qr-lot-pdf';

// ========================================
// TYPES
// ========================================
interface QRCodeStats {
  total: number;
  stock: number;
  active: number;
  revoked: number;
  lost: number;
}

interface QRLot {
  id: string;
  prefix: string;
  count: number;
  status: string;
  createdAt: string;
  garageId: string | null;
  garageName: string | null;
  activatedCount: number;
  stockCount: number;
}

// ========================================
// MAIN COMPONENT
// ========================================
export default function QRCodesManagementPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [lots, setLots] = useState<QRLot[]>([]);
  const [stats, setStats] = useState<QRCodeStats>({ 
    total: 0, 
    stock: 0, 
    active: 0, 
    revoked: 0, 
    lost: 0 
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'grid' | 'lots'>('grid');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modals
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Loading states
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchQRCodes();
  }, [page, statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchLots();
  }, []);

  // Fetch QR codes with relations
  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '21',
        status: statusFilter,
        search: searchQuery
      });

      const res = await fetch(`/api/admin/qrcodes/list?${params}`);
      const data = await res.json();

      if (data.success) {
        setQRCodes(data.qrCodes);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } else {
        console.error('Error fetching QR codes:', data.error);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/qrcodes/stats');
      const data = await res.json();
      if (data.stats) {
        setStats({
          total: Number(data.stats.total) || 0,
          stock: Number(data.stats.stock) || 0,
          active: Number(data.stats.active) || 0,
          revoked: Number(data.stats.revoked) || 0,
          lost: Number(data.stats.lost) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch lots
  const fetchLots = async () => {
    try {
      const res = await fetch('/api/admin/qr-lots/generate');
      const data = await res.json();
      setLots(data.lots || []);
    } catch (error) {
      console.error('Error fetching lots:', error);
    }
  };

  // Handle search
  const handleSearch = () => {
    setPage(1);
    fetchQRCodes();
  };

  // Handle view details
  const handleViewDetails = useCallback((qr: QRCodeData) => {
    setSelectedQR(qr);
    setModalOpen(true);
  }, []);

  // Handle print single QR
  const handlePrintSingle = useCallback(async (qr: QRCodeData) => {
    try {
      const vehicleInfo = qr.vehicle ? {
        make: qr.vehicle.make,
        model: qr.vehicle.model,
        licensePlate: qr.vehicle.licensePlate
      } : undefined;

      const blob = await generateSingleQRStickerPDF(
        qr.shortCode,
        qr.lotPrefix,
        vehicleInfo
      );
      downloadPDF(blob, `qr-${qr.shortCode}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }, []);

  // Handle suspend QR
  const handleSuspendQR = useCallback((qr: QRCodeData) => {
    // TODO: Implement suspend functionality
    console.log('Suspend QR:', qr.shortCode);
    alert(`Fonctionnalité "Suspendre QR" à implémenter pour ${qr.shortCode}`);
  }, []);

  // Handle download lot PDF
  const handleDownloadLotPDF = useCallback(async (lotId: string) => {
    setGeneratingPDF(true);
    try {
      const res = await fetch(`/api/admin/qrcodes/list?lotId=${lotId}&limit=500`);
      const data = await res.json();

      if (data.success && data.qrCodes.length > 0) {
        const qrForPdf: QRCodeForPDF[] = data.qrCodes.map((qr: QRCodeData) => ({
          shortCode: qr.shortCode,
          codeUnique: qr.codeUnique,
          lotPrefix: qr.lotPrefix
        }));

        const lot = lots.find(l => l.id === lotId);
        const blob = await generateQRCodeLotPDF(qrForPdf, lotId, {
          notes: lot?.garageName ? `Garage: ${lot.garageName}` : undefined
        });
        downloadPDF(blob, `lot-${lot?.prefix || lotId}.pdf`);
      } else {
        alert('Aucun QR code trouvé pour ce lot');
      }
    } catch (error) {
      console.error('Error generating lot PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPDF(false);
    }
  }, [lots]);

  // Calculate lot stats
  const garageLots = lots.filter(l => l.garageId);
  const individualLots = lots.filter(l => !l.garageId);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Gestion des QR Codes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {total} QR codes • {stats.active} activés
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchQRCodes(); fetchStats(); }} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
          <Link href="/admin/generer">
            <Button className="gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
              <QrCode className="w-4 h-4" />
              Générer QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-white/70" />
              <div>
                <p className="text-xl font-bold">{stats.stock}</p>
                <p className="text-xs text-white/80">En stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-white/70" />
              <div>
                <p className="text-xl font-bold">{stats.active}</p>
                <p className="text-xs text-white/80">Activés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-white/70" />
              <div>
                <p className="text-xl font-bold">{stats.revoked + stats.lost}</p>
                <p className="text-xs text-white/80">Révoqués/Perdus</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-white/70" />
              <div>
                <p className="text-xl font-bold">{lots.length}</p>
                <p className="text-xs text-white/80">Lots</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('grid')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
            activeTab === 'grid'
              ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          )}
        >
          <Grid3X3 className="w-5 h-5" />
          Vue Individuelle
        </button>
        <button
          onClick={() => setActiveTab('lots')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
            activeTab === 'lots'
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          )}
        >
          <Table className="w-5 h-5" />
          Vue par Lots
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par code, plaque, propriétaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300"
        >
          <option value="all">Tous les statuts</option>
          <option value="STOCK">En Stock</option>
          <option value="ACTIVE">Activés</option>
          <option value="REVOKED">Révoqués</option>
          <option value="LOST">Perdus</option>
        </select>
        <Button variant="outline" onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Rechercher
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-64 bg-slate-200 dark:bg-slate-700 rounded"></CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'grid' ? (
        <>
          {qrCodes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <QrCode className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Aucun QR Code trouvé
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Essayez de modifier vos filtres de recherche'
                    : 'Commencez par générer des QR codes'}
                </p>
                <Link href="/admin/generer">
                  <Button className="gap-2 bg-gradient-to-r from-orange-500 to-pink-500">
                    <QrCode className="w-4 h-4" />
                    Générer des QR Codes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qrCodes.map((qr) => (
                  <QRCodeCard
                    key={qr.id}
                    qrCode={qr}
                    onViewDetails={handleViewDetails}
                    onPrint={handlePrintSingle}
                    onSuspend={handleSuspendQR}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Page {page} sur {totalPages} ({total} résultats)
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Lots View */
        <div className="space-y-4">
          {/* Garage Lots */}
          {garageLots.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                QR Codes Garages ({garageLots.length} lots)
              </h3>
              <div className="space-y-3">
                {garageLots.map((lot) => (
                  <Card key={lot.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white text-lg">{lot.garageName}</p>
                            <p className="text-white/70 text-sm">
                              Lot: {lot.prefix} • {lot.count} QR • {lot.activatedCount} activés
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">
                                {lot.count > 0 ? Math.round((lot.activatedCount / lot.count) * 100) : 0}%
                              </p>
                              <p className="text-white/70 text-xs">Taux</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                              onClick={() => handleDownloadLotPDF(lot.id)}
                              disabled={generatingPDF}
                            >
                              {generatingPDF ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileDown className="w-4 h-4 mr-2" />
                              )}
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Individual Lots */}
          {individualLots.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
                QR Codes Particuliers ({individualLots.length} lots)
              </h3>
              <div className="space-y-3">
                {individualLots.map((lot) => (
                  <Card key={lot.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white text-lg">{lot.prefix}</p>
                            <p className="text-white/80 text-sm">
                              {lot.count} QR • {lot.activatedCount} activés • {lot.stockCount} disponibles
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">
                                {lot.count > 0 ? Math.round((lot.activatedCount / lot.count) * 100) : 0}%
                              </p>
                              <p className="text-white/80 text-xs">Taux</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                              onClick={() => handleDownloadLotPDF(lot.id)}
                              disabled={generatingPDF}
                            >
                              {generatingPDF ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileDown className="w-4 h-4 mr-2" />
                              )}
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {lots.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Aucun lot de QR Code
                </h3>
                <p className="text-slate-500 mb-4">
                  Générez votre premier lot de QR codes
                </p>
                <Link href="/admin/generer">
                  <Button className="gap-2 bg-gradient-to-r from-orange-500 to-pink-500">
                    <QrCode className="w-4 h-4" />
                    Générer des QR Codes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info Banner */}
      <Card className="mt-6 bg-slate-900 text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {activeTab === 'grid' ? (
              <>
                <Grid3X3 className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="font-medium">Vue Individuelle</p>
                  <p className="text-sm text-slate-400">
                    Visualisez chaque QR code avec son image réelle. Cliquez sur un QR activé pour voir la fiche véhicule complète avec l'historique d'entretien.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Table className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="font-medium">Vue par Lots</p>
                  <p className="text-sm text-slate-400">
                    Gérez vos lots de QR codes et téléchargez des PDF imprimables pour distribution aux garages.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        qrCode={selectedQR}
        onViewPublicProfile={() => {
          if (selectedQR) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn';
            window.open(`${appUrl}/v/${selectedQR.shortCode}`, '_blank');
          }
        }}
        onSuspendQR={() => {
          if (selectedQR) {
            handleSuspendQR(selectedQR);
          }
        }}
        onTransferOwnership={() => {
          alert('Fonctionnalité "Transférer la propriété" à implémenter');
        }}
      />
    </div>
  );
}
