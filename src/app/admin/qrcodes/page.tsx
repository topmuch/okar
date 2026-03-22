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
  Loader2,
  User
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
  garageTotal: number;
  garageActive: number;
  individualTotal: number;
  individualActive: number;
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
    lost: 0,
    garageTotal: 0,
    garageActive: 0,
    individualTotal: 0,
    individualActive: 0
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Main category tab: 'garage' or 'particulier'
  const [categoryTab, setCategoryTab] = useState<'garage' | 'particulier'>('garage');
  
  // View mode within each category
  const [viewMode, setViewMode] = useState<'grid' | 'lots'>('grid');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modals
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Loading states
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch data when filters change
  useEffect(() => {
    fetchQRCodes();
  }, [page, statusFilter, categoryTab]);

  useEffect(() => {
    fetchStats();
    fetchLots();
  }, []);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [categoryTab]);

  // Fetch QR codes with relations
  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '21',
        status: statusFilter,
        search: searchQuery,
        category: categoryTab // 'garage' or 'particulier'
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
          lost: Number(data.stats.lost) || 0,
          garageTotal: Number(data.garageTotal) || 0,
          garageActive: Number(data.garageActive) || 0,
          individualTotal: Number(data.individualTotal) || 0,
          individualActive: Number(data.individualActive) || 0
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

  // Filter lots by category
  const garageLots = lots.filter(l => l.garageId);
  const individualLots = lots.filter(l => !l.garageId);
  
  // Current lots based on category tab
  const currentLots = categoryTab === 'garage' ? garageLots : individualLots;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Stock QR Codes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {stats.total} QR codes • {stats.active} activés
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

      {/* Main Category Tabs - Garage vs Particulier */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Garage Tab */}
        <button
          onClick={() => setCategoryTab('garage')}
          className={cn(
            "relative p-6 rounded-2xl text-left transition-all overflow-hidden",
            categoryTab === 'garage'
              ? "bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-xl shadow-orange-500/25"
              : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              categoryTab === 'garage' ? "bg-white/20" : "bg-orange-100 dark:bg-orange-900/30"
            )}>
              <Building2 className={cn(
                "w-7 h-7",
                categoryTab === 'garage' ? "text-white" : "text-orange-500"
              )} />
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-bold text-lg",
                categoryTab === 'garage' ? "text-white" : "text-slate-800 dark:text-white"
              )}>
                QR Codes Garage
              </h3>
              <p className={cn(
                "text-sm",
                categoryTab === 'garage' ? "text-white/80" : "text-slate-500 dark:text-slate-400"
              )}>
                {stats.garageTotal} QR • {stats.garageActive} activés
              </p>
            </div>
            {stats.garageTotal > 0 && (
              <div className={cn(
                "text-right",
              )}>
                <p className={cn(
                  "text-2xl font-bold",
                  categoryTab === 'garage' ? "text-white" : "text-slate-800 dark:text-white"
                )}>
                  {stats.garageTotal > 0 ? Math.round((stats.garageActive / stats.garageTotal) * 100) : 0}%
                </p>
                <p className={cn(
                  "text-xs",
                  categoryTab === 'garage' ? "text-white/70" : "text-slate-500"
                )}>Taux</p>
              </div>
            )}
          </div>
          {categoryTab === 'garage' && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          )}
        </button>

        {/* Particulier Tab */}
        <button
          onClick={() => setCategoryTab('particulier')}
          className={cn(
            "relative p-6 rounded-2xl text-left transition-all overflow-hidden",
            categoryTab === 'particulier'
              ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl shadow-purple-500/25"
              : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              categoryTab === 'particulier' ? "bg-white/20" : "bg-purple-100 dark:bg-purple-900/30"
            )}>
              <User className={cn(
                "w-7 h-7",
                categoryTab === 'particulier' ? "text-white" : "text-purple-500"
              )} />
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-bold text-lg",
                categoryTab === 'particulier' ? "text-white" : "text-slate-800 dark:text-white"
              )}>
                QR Codes Particulier
              </h3>
              <p className={cn(
                "text-sm",
                categoryTab === 'particulier' ? "text-white/80" : "text-slate-500 dark:text-slate-400"
              )}>
                {stats.individualTotal} QR • {stats.individualActive} activés
              </p>
            </div>
            {stats.individualTotal > 0 && (
              <div className="text-right">
                <p className={cn(
                  "text-2xl font-bold",
                  categoryTab === 'particulier' ? "text-white" : "text-slate-800 dark:text-white"
                )}>
                  {stats.individualTotal > 0 ? Math.round((stats.individualActive / stats.individualTotal) * 100) : 0}%
                </p>
                <p className={cn(
                  "text-xs",
                  categoryTab === 'particulier' ? "text-white/70" : "text-slate-500"
                )}>Taux</p>
              </div>
            )}
          </div>
          {categoryTab === 'particulier' && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          )}
        </button>
      </div>

      {/* View Mode Toggle & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm",
              viewMode === 'grid'
                ? "bg-slate-900 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <Grid3X3 className="w-4 h-4" />
            Individuel
          </button>
          <button
            onClick={() => setViewMode('lots')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm",
              viewMode === 'lots'
                ? "bg-slate-900 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <Table className="w-4 h-4" />
            Par Lots
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex-1 flex gap-3">
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
            <option value="all">Tous</option>
            <option value="STOCK">En Stock</option>
            <option value="ACTIVE">Activés</option>
            <option value="REVOKED">Révoqués</option>
            <option value="LOST">Perdus</option>
          </select>
          <Button variant="outline" onClick={handleSearch} className="gap-2">
            <Search className="w-4 h-4" />
          </Button>
        </div>
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
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <>
          {qrCodes.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600">
              <CardContent className="p-12 text-center">
                {categoryTab === 'garage' ? (
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                ) : (
                  <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Aucun QR Code {categoryTab === 'garage' ? 'Garage' : 'Particulier'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Essayez de modifier vos filtres'
                    : `Générez des QR codes ${categoryTab === 'garage' ? 'pour les garages' : 'particuliers'}`}
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
          {currentLots.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Aucun lot {categoryTab === 'garage' ? 'Garage' : 'Particulier'}
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
          ) : (
            currentLots.map((lot) => (
              <Card key={lot.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className={cn(
                    "p-5",
                    categoryTab === 'garage'
                      ? "bg-gradient-to-r from-slate-800 to-slate-900"
                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                          {categoryTab === 'garage' ? (
                            <Building2 className="w-6 h-6 text-white" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-lg">
                            {lot.garageName || lot.prefix}
                          </p>
                          <p className="text-white/70 text-sm">
                            {lot.count} QR • {lot.activatedCount} activés • {lot.stockCount} en stock
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-3xl font-bold text-white">
                            {lot.count > 0 ? Math.round((lot.activatedCount / lot.count) * 100) : 0}%
                          </p>
                          <p className="text-white/70 text-xs">Taux d'activation</p>
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
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${lot.count > 0 ? (lot.activatedCount / lot.count) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

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
