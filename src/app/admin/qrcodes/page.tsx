'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Plus,
  Search,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Calendar,
  ChevronRight,
  Loader2,
  Download,
  Trash2,
  Send,
  Eye
} from 'lucide-react';
import { printQRCodes } from '@/lib/qr-pdf';

interface QRLot {
  id: string;
  prefix: string;
  count: number;
  status: string;
  createdAt: string;
  assignedAt: string | null;
  notes: string | null;
  garage: {
    id: string;
    name: string;
    isCertified: boolean;
  } | null;
  stats: {
    total: number;
    activated: number;
    available: number;
  };
}

interface Garage {
  id: string;
  name: string;
  isCertified: boolean;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  CREATED: { label: 'Créé', className: 'bg-blue-100 text-blue-700', icon: Clock },
  ASSIGNED: { label: 'Assigné', className: 'bg-purple-100 text-purple-700', icon: Send },
  PARTIALLY_USED: { label: 'Partiellement utilisé', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  FULLY_USED: { label: 'Épuisé', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

export default function AdminQRLotsPage() {
  const [lots, setLots] = useState<QRLot[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<QRLot | null>(null);
  
  // Form state
  const [newLotCount, setNewLotCount] = useState(50);
  const [newLotNotes, setNewLotNotes] = useState('');
  const [newLotGarage, setNewLotGarage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch lots
      const lotsRes = await fetch('/api/qr-lots');
      const lotsData = await lotsRes.json();
      setLots(lotsData.lots || []);

      // Fetch garages
      const garagesRes = await fetch('/api/admin/garages?certified=true');
      const garagesData = await garagesRes.json();
      setGarages(garagesData.garages || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLot = async () => {
    if (newLotCount < 1 || newLotCount > 1000) {
      alert('Le nombre de QR doit être entre 1 et 1000');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/qr-lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: newLotCount,
          notes: newLotNotes,
          assignToGarageId: newLotGarage || null,
          createdBy: 'admin' // In production, get from auth
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setNewLotCount(50);
        setNewLotNotes('');
        setNewLotGarage('');
        fetchData();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }

    } catch (error) {
      console.error('Error creating lot:', error);
      alert('Erreur lors de la création du lot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignLot = async () => {
    if (!selectedLot || !newLotGarage) {
      alert('Veuillez sélectionner un garage');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/qr-lots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId: selectedLot.id,
          garageId: newLotGarage,
          action: 'assign'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowAssignModal(false);
        setSelectedLot(null);
        setNewLotGarage('');
        fetchData();
      } else {
        alert(data.error || 'Erreur lors de l\'assignation');
      }

    } catch (error) {
      console.error('Error assigning lot:', error);
      alert('Erreur lors de l\'assignation');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintLot = async (lot: QRLot) => {
    // Fetch QR codes for this lot
    try {
      const response = await fetch(`/api/qr-lots/${lot.id}/codes`);
      const data = await response.json();

      if (data.codes) {
        printQRCodes(
          data.codes.map((code: any) => ({
            reference: code.reference,
            securityHash: code.securityHash,
            lotPrefix: lot.prefix
          })),
          {
            title: 'Lot de QR Codes AutoPass',
            lotPrefix: lot.prefix,
            count: lot.count,
            generatedBy: 'SuperAdmin',
            generatedAt: new Date(),
            notes: lot.notes || undefined
          }
        );
      }
    } catch (error) {
      console.error('Error printing lot:', error);
      alert('Erreur lors de l\'impression');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredLots = lots.filter(lot => {
    if (statusFilter !== 'all' && lot.status !== statusFilter) return false;
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      return (
        lot.prefix.toLowerCase().includes(searchLower) ||
        lot.garage?.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <QrCode className="w-8 h-8 text-orange-500" />
            Gestion des Lots QR
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Créez et assignez des lots de QR codes aux garages certifiés
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" />
          Nouveau Lot
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{lots.length}</p>
              <p className="text-sm text-slate-500">Lots créés</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {lots.filter(l => l.status === 'ASSIGNED' || l.status === 'PARTIALLY_USED').length}
              </p>
              <p className="text-sm text-slate-500">Assignés</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {lots.reduce((sum, l) => sum + l.stats.activated, 0)}
              </p>
              <p className="text-sm text-slate-500">QR Activés</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {lots.reduce((sum, l) => sum + l.stats.available, 0)}
              </p>
              <p className="text-sm text-slate-500">QR Disponibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par préfixe, garage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200"
        >
          <option value="all">Tous les statuts</option>
          <option value="CREATED">Créés</option>
          <option value="ASSIGNED">Assignés</option>
          <option value="PARTIALLY_USED">Partiellement utilisés</option>
          <option value="FULLY_USED">Épuisés</option>
        </select>
      </div>

      {/* Lots Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-slate-500 mt-4">Chargement des lots...</p>
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun lot trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Lot</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">QR Codes</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Garage</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Statut</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Date</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((lot) => {
                  const status = statusConfig[lot.status] || statusConfig.CREATED;
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr key={lot.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-slate-800 dark:text-white">{lot.prefix}</p>
                            {lot.notes && (
                              <p className="text-xs text-slate-400 truncate max-w-[200px]">{lot.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-800 dark:text-white">{lot.stats.total}</span>
                            <span className="text-slate-400">total</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-emerald-600">{lot.stats.activated} activés</span>
                            <span className="text-orange-600">{lot.stats.available} dispo</span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden w-24">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${(lot.stats.activated / lot.stats.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lot.garage ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-slate-800 dark:text-white font-medium">{lot.garage.name}</p>
                              {lot.garage.isCertified && (
                                <span className="text-xs text-emerald-600">Certifié</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Non assigné</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.className}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-slate-800 dark:text-white">{formatDate(lot.createdAt)}</p>
                          {lot.assignedAt && (
                            <p className="text-xs text-slate-400">Assigné: {formatDate(lot.assignedAt)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!lot.garage && (
                            <button
                              onClick={() => {
                                setSelectedLot(lot);
                                setNewLotGarage('');
                                setShowAssignModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 text-purple-500 transition-colors"
                              title="Assigner à un garage"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintLot(lot)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            title="Imprimer les QR codes"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/qrcodes/${lot.id}`}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Lot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                Créer un nouveau lot
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre de QR codes *
                </label>
                <input
                  type="number"
                  value={newLotCount}
                  onChange={(e) => setNewLotCount(parseInt(e.target.value) || 0)}
                  min={1}
                  max={1000}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
                />
                <p className="text-xs text-slate-400 mt-1">Entre 1 et 1000 QR codes par lot</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Assigner à un garage (optionnel)
                </label>
                <select
                  value={newLotGarage}
                  onChange={(e) => setNewLotGarage(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
                >
                  <option value="">-- Non assigné --</option>
                  {garages.filter(g => g.isCertified).map(garage => (
                    <option key={garage.id} value={garage.id}>{garage.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newLotNotes}
                  onChange={(e) => setNewLotNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes internes..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateLot}
                disabled={submitting}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Créer le lot
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedLot && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Assigner le lot {selectedLot.prefix}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {selectedLot.count} QR codes disponibles
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sélectionner un garage certifié *
              </label>
              <select
                value={newLotGarage}
                onChange={(e) => setNewLotGarage(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
              >
                <option value="">-- Choisir un garage --</option>
                {garages.filter(g => g.isCertified).map(garage => (
                  <option key={garage.id} value={garage.id}>{garage.name}</option>
                ))}
              </select>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedLot(null);
                }}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignLot}
                disabled={submitting || !newLotGarage}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
