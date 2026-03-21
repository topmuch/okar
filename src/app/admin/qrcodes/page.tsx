'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Package,
  Building2,
  Search,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  User,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
interface Garage {
  id: string;
  name: string;
  slug: string;
  isCertified: boolean;
  active: boolean;
}

interface QRCodeStats {
  total: number;
  stock: number;
  assigned: number;
  active: number;
  revoked: number;
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
  generatedCount: number;
  activatedCount: number;
  stockCount: number;
  utilizationRate: number;
}

export default function QRCodesManagementPage() {
  const [loading, setLoading] = useState(true);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [lots, setLots] = useState<QRLot[]>([]);
  const [stats, setStats] = useState<QRCodeStats>({
    total: 0,
    stock: 0,
    assigned: 0,
    active: 0,
    revoked: 0,
    garageTotal: 0,
    garageActive: 0,
    individualTotal: 0,
    individualActive: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'garage' | 'individual'>('garage');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch garages
      const garagesRes = await fetch('/api/admin/garages');
      const garagesData = await garagesRes.json();
      setGarages(garagesData.garages || []);

      // Fetch QR lots
      const lotsRes = await fetch('/api/admin/qr-lots/generate');
      const lotsData = await lotsRes.json();
      setLots(lotsData.lots || []);

      // Fetch stats
      const statsRes = await fetch('/api/admin/qrcodes/stats');
      const statsData = await statsRes.json();
      if (statsData.stats) {
        setStats({
          ...statsData.stats,
          garageTotal: statsData.garageTotal || 0,
          garageActive: statsData.garageActive || 0,
          individualTotal: statsData.individualTotal || 0,
          individualActive: statsData.individualActive || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter lots based on active tab
  const filteredLots = lots.filter(lot => {
    // Tab filter
    if (activeTab === 'garage' && !lot.garageId) return false;
    if (activeTab === 'individual' && lot.garageId) return false;

    // Status filter
    if (statusFilter !== 'all' && lot.status !== statusFilter) return false;

    return true;
  });

  // Group lots by garage (for garage tab)
  const lotsByGarage = filteredLots.reduce((acc, lot) => {
    const key = lot.garageId || 'unassigned';
    if (!acc[key]) {
      acc[key] = {
        garageName: lot.garageName || 'Non assigné',
        garageId: lot.garageId,
        lots: [],
        totalQR: 0,
        totalActivated: 0,
      };
    }
    acc[key].lots.push(lot);
    acc[key].totalQR += lot.count;
    acc[key].totalActivated += lot.activatedCount;
    return acc;
  }, {} as Record<string, { garageName: string; garageId: string | null; lots: QRLot[]; totalQR: number; totalActivated: number }>);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      CREATED: { className: 'bg-slate-500', label: 'Créé' },
      ASSIGNED: { className: 'bg-blue-500', label: 'Assigné' },
      ACTIVE: { className: 'bg-emerald-500', label: 'Actif' },
    };
    const cfg = config[status] || { className: 'bg-slate-500', label: status };
    return (
      <Badge className={cfg.className}>
        {cfg.label}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const csvContent = [
      'Lot ID,Préfixe,Nombre,Garage,Statut,Activés,En stock,Taux,Date',
      ...filteredLots.map(lot =>
        `${lot.id},${lot.prefix},${lot.count},"${lot.garageName || 'Particulier'}",${lot.status},${lot.activatedCount},${lot.stockCount},${lot.utilizationRate}%,${new Date(lot.createdAt).toLocaleDateString('fr-FR')}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-codes-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate tab stats
  const garageStats = {
    total: lots.filter(l => l.garageId).reduce((sum, l) => sum + l.count, 0),
    activated: lots.filter(l => l.garageId).reduce((sum, l) => sum + l.activatedCount, 0),
    lots: lots.filter(l => l.garageId).length,
  };

  const individualStats = {
    total: lots.filter(l => !l.garageId).reduce((sum, l) => sum + l.count, 0),
    activated: lots.filter(l => !l.garageId).reduce((sum, l) => sum + l.activatedCount, 0),
    lots: lots.filter(l => !l.garageId).length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Gestion des QR Codes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {stats.total} QR codes • {stats.active} activés
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} className="gap-2">
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

      {/* Stats Overview */}
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
        <Card className="bg-blue-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-white/70" />
              <div>
                <p className="text-xl font-bold">{stats.assigned}</p>
                <p className="text-xs text-white/80">Assignés</p>
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
                <p className="text-xl font-bold">{stats.revoked}</p>
                <p className="text-xs text-white/80">Révoqués</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('garage')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
            activeTab === 'garage'
              ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          )}
        >
          <Building2 className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">QR Codes Garages</p>
            <p className="text-xs opacity-80">{garageStats.lots} lots • {garageStats.total} QR</p>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
            activeTab === 'individual'
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          )}
        >
          <ShoppingCart className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">QR Codes Particuliers</p>
            <p className="text-xs opacity-80">{individualStats.lots} lots • {individualStats.total} QR</p>
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par lot ID ou garage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="CREATED">Créé</option>
            <option value="ASSIGNED">Assigné</option>
            <option value="ACTIVE">Actif</option>
          </select>
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Content based on tab */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'garage' ? (
        // GARAGE TAB
        Object.keys(lotsByGarage).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Aucun QR Code garage
              </h3>
              <p className="text-slate-500 mb-4">
                Générez des QR codes pour vos garages partenaires.
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
          <div className="space-y-4">
            {Object.entries(lotsByGarage).map(([key, group]) => (
              <Card key={key} className="overflow-hidden">
                {/* Garage Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {group.garageName?.charAt(0) || 'G'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{group.garageName}</h3>
                        <p className="text-white/70 text-sm">
                          {group.lots.length} lot(s) • {group.totalQR} QR codes • {group.totalActivated} activés
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {group.totalQR > 0 ? Math.round((group.totalActivated / group.totalQR) * 100) : 0}%
                      </p>
                      <p className="text-white/70 text-xs">Activation</p>
                    </div>
                  </div>
                </div>

                {/* Lots Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-slate-500">Lot ID</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-500">Préfixe</th>
                        <th className="text-center p-3 text-sm font-medium text-slate-500">QR</th>
                        <th className="text-center p-3 text-sm font-medium text-slate-500">Activés</th>
                        <th className="text-center p-3 text-sm font-medium text-slate-500">Stock</th>
                        <th className="text-center p-3 text-sm font-medium text-slate-500">Taux</th>
                        <th className="text-center p-3 text-sm font-medium text-slate-500">Statut</th>
                        <th className="text-center p-3 text-sm font-medium text-slate-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.lots.map((lot) => (
                        <tr key={lot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3">
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {lot.id}
                            </code>
                          </td>
                          <td className="p-3 font-medium">{lot.prefix}</td>
                          <td className="p-3 text-center font-semibold">{lot.count}</td>
                          <td className="p-3 text-center text-emerald-600 font-medium">{lot.activatedCount}</td>
                          <td className="p-3 text-center text-amber-600 font-medium">{lot.stockCount}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                                  style={{ width: `${lot.utilizationRate}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{lot.utilizationRate}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">{getStatusBadge(lot.status)}</td>
                          <td className="p-3 text-center text-sm text-slate-500">
                            {new Date(lot.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        // INDIVIDUAL TAB
        filteredLots.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Aucun QR Code particulier
              </h3>
              <p className="text-slate-500 mb-4">
                Générez des QR codes pour la vente aux particuliers.
              </p>
              <Link href="/admin/generer">
                <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500">
                  <QrCode className="w-4 h-4" />
                  Générer des QR Codes
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">QR Codes Particuliers</h3>
                    <p className="text-white/80 text-sm">
                      {filteredLots.length} lot(s) • {filteredLots.reduce((s, l) => s + l.count, 0)} QR • Vente directe
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {filteredLots.reduce((s, l) => s + l.activatedCount, 0)}
                  </p>
                  <p className="text-white/80 text-xs">Activés</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-slate-500">Lot ID</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-500">Préfixe</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-500">QR</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-500">Activés</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-500">Disponibles</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-500">Taux</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-500">Statut</th>
                    <th className="text-center p-3 text-sm font-medium text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3">
                        <code className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                          {lot.id}
                        </code>
                      </td>
                      <td className="p-3 font-medium">{lot.prefix}</td>
                      <td className="p-3 text-center font-semibold">{lot.count}</td>
                      <td className="p-3 text-center text-emerald-600 font-medium">{lot.activatedCount}</td>
                      <td className="p-3 text-center">
                        <span className="text-purple-600 font-medium">{lot.stockCount}</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${lot.utilizationRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{lot.utilizationRate}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">{getStatusBadge(lot.status)}</td>
                      <td className="p-3 text-center text-sm text-slate-500">
                        {new Date(lot.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* Info Banner */}
      <Card className="mt-6 bg-slate-900 text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {activeTab === 'garage' ? (
              <>
                <Building2 className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="font-medium">QR Codes Garages</p>
                  <p className="text-sm text-slate-400">
                    Ces QR codes sont assignés à un garage partenaire spécifique. Seul ce garage peut les activer pour ses clients.
                  </p>
                </div>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="font-medium">QR Codes Particuliers</p>
                  <p className="text-sm text-slate-400">
                    Ces QR codes ne sont pas assignés. Ils peuvent être vendus directement aux particuliers et activés par n'importe quel garage certifié.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
