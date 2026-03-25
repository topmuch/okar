'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Package,
  AlertCircle,
  Plus,
  ChevronRight,
  Calendar,
  Loader2,
  Download,
  Eye,
  Truck,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// OKAR Brand
const OKAR_ORANGE = '#FF6600';

interface QRLot {
  id: string;
  prefix: string;
  count: number;
  usedCount: number;
  status: string;
  createdAt: string;
  assignedAt?: string;
}

export default function StockOKARPage() {
  const { user } = useAuth();
  const [lots, setLots] = useState<QRLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(50);

  const garageId = user?.garageId || '';
  const garageName = user?.garage?.name || 'Mon Garage';

  useEffect(() => {
    if (garageId) {
      fetchLots();
    }
  }, [garageId]);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/qr-lots?garageId=${garageId}`);
      const data = await res.json();
      // Map API response to expected format
      const mappedLots = (data.lots || []).map((lot: any) => ({
        id: lot.id,
        prefix: lot.prefix,
        count: lot.count,
        usedCount: lot.stats?.activated || lot.activatedCount || 0,
        status: lot.status,
        createdAt: lot.createdAt,
        assignedAt: lot.assignedAt
      }));
      setLots(mappedLots);
    } catch (err) {
      console.error('Error fetching lots:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalCodes = lots.reduce((sum, lot) => sum + lot.count, 0);
  const usedCodes = lots.reduce((sum, lot) => sum + (lot.usedCount || 0), 0);
  const remainingCodes = totalCodes - usedCodes;
  const usagePercent = totalCodes > 0 ? (usedCodes / totalCodes) * 100 : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get lot status badge
  const getLotStatus = (lot: QRLot) => {
    const percentUsed = lot.count > 0 ? ((lot.usedCount || 0) / lot.count) * 100 : 0;
    
    if (percentUsed >= 100) {
      return { label: 'Épuisé', className: 'bg-red-500/10 text-red-400 border border-red-500/30', icon: XCircle };
    } else if (percentUsed >= 80) {
      return { label: 'Presque épuisé', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/30', icon: AlertCircle };
    } else if (lot.usedCount && lot.usedCount > 0) {
      return { label: 'En utilisation', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/30', icon: Clock };
    } else {
      return { label: 'Neuf', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', icon: CheckCircle };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-[#FF6600] rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 mt-6">Chargement du stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Stock Pass OKAR</h1>
          <p className="text-zinc-500">Gérez vos codes QR OKAR</p>
        </div>
        <button
          onClick={() => setShowOrderModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#FF6600] hover:bg-[#FF8533] rounded-xl text-white font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Commander
        </button>
      </div>

      {/* Main Stock Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#FF6600]/10 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-[#FF6600]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{garageName}</h2>
            <p className="text-zinc-500">Votre stock de Pass OKAR</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400">
              <span className="text-2xl font-black text-white">{remainingCodes}</span> codes disponibles
            </span>
            <span className="text-zinc-500">{totalCodes} au total</span>
          </div>
          <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                remainingCodes === 0 
                  ? 'bg-red-500' 
                  : remainingCodes < 10 
                  ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                  : 'bg-gradient-to-r from-[#FF6600] to-[#FF8533]'
              }`}
              style={{ width: `${100 - usagePercent}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-white">{lots.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Lots reçus</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-400">{usedCodes}</p>
            <p className="text-xs text-zinc-500 mt-1">Pass activés</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-[#FF6600]">{remainingCodes}</p>
            <p className="text-xs text-zinc-500 mt-1">Disponibles</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        {remainingCodes < 10 && remainingCodes > 0 && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-amber-400 font-semibold">Stock bas !</p>
              <p className="text-amber-400/70 text-sm">Commandez de nouveaux Pass OKAR pour éviter la rupture</p>
            </div>
          </div>
        )}

        {remainingCodes === 0 && totalCodes > 0 && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-semibold">Stock épuisé !</p>
              <p className="text-red-400/70 text-sm">Vous ne pouvez plus activer de nouveaux Pass OKAR</p>
            </div>
          </div>
        )}
      </div>

      {/* Lots List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#FF6600]" />
          Détail par lot
        </h3>

        {lots.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 mb-2">Aucun lot de Pass OKAR</p>
            <p className="text-zinc-600 text-sm mb-4">Contactez l'administrateur pour obtenir des codes</p>
            <Link
              href="/garage/messages"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-colors"
            >
              Contacter le support
            </Link>
          </div>
        ) : (
          lots.map((lot) => {
            const status = getLotStatus(lot);
            const StatusIcon = status.icon;
            const lotUsage = lot.count > 0 ? ((lot.usedCount || 0) / lot.count) * 100 : 0;
            
            return (
              <div
                key={lot.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FF6600]/10 rounded-xl flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-[#FF6600]" />
                    </div>
                    <div>
                      <p className="font-mono text-lg text-white font-bold">{lot.prefix}</p>
                      <p className="text-zinc-500 text-sm">Lot de {lot.count} codes</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 ${status.className}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-zinc-500">{lot.usedCount || 0} utilisés</span>
                    <span className="text-white font-medium">{lot.count - (lot.usedCount || 0)} restants</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF6600] to-[#FF8533] rounded-full transition-all"
                      style={{ width: `${lotUsage}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Reçu le {formatDate(lot.createdAt)}
                  </span>
                  <Link
                    href={`/garage/activer-qr?lot=${lot.id}`}
                    className="text-[#FF6600] hover:text-[#FF8533] font-medium flex items-center gap-1"
                  >
                    Activer un code
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF6600]/10 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#FF6600]" />
                </div>
                Commander des Pass OKAR
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-zinc-400 text-sm">
                Sélectionnez la quantité de Pass OKAR que vous souhaitez commander. 
                Un administrateur traitera votre demande.
              </p>

              {/* Quantity Selector */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Quantité</label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 200].map(qty => (
                    <button
                      key={qty}
                      onClick={() => setOrderQuantity(qty)}
                      className={`py-3 rounded-xl font-bold transition-colors ${
                        orderQuantity === qty
                          ? 'bg-[#FF6600] text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Quantity */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Ou quantité personnalisée</label>
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none"
                  min={1}
                />
              </div>

              {/* Info */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">
                  <strong className="text-white">{orderQuantity}</strong> Pass OKAR = 
                  environ <strong className="text-[#FF6600]">{Math.ceil(orderQuantity / 10)}</strong> plaques
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  // TODO: Send order request
                  setShowOrderModal(false);
                  alert(`Commande de ${orderQuantity} Pass OKAR envoyée !`);
                }}
                className="flex-1 py-4 bg-[#FF6600] hover:bg-[#FF8533] rounded-xl text-white font-bold transition-colors"
              >
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
