'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  User,
  Phone,
  Car,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRightLeft,
  RefreshCw
} from 'lucide-react';
import { useDriver } from '@/app/driver/layout';

interface PendingTransfer {
  id: string;
  code: string;
  vehicle: {
    id: string;
    reference: string;
    make: string;
    model: string;
    licensePlate: string;
  };
  buyerName: string | null;
  buyerPhone: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
  hasBuyer: boolean;
}

export default function PendingTransfersPage() {
  const router = useRouter();
  const { driverId } = useDriver();

  const [transfers, setTransfers] = useState<PendingTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<PendingTransfer | null>(null);
  const [cancelModal, setCancelModal] = useState<PendingTransfer | null>(null);

  useEffect(() => {
    fetchPendingTransfers();
  }, []);

  const fetchPendingTransfers = async () => {
    setLoading(true);
    try {
      // In a real app, this would call an API to fetch pending transfers
      // For demo purposes, we'll use mock data
      const mockTransfers: PendingTransfer[] = [
        {
          id: '1',
          code: '123456',
          vehicle: {
            id: 'v1',
            reference: 'OKAR-ABC123',
            make: 'Toyota',
            model: 'Corolla',
            licensePlate: 'AA-1234-BB'
          },
          buyerName: 'Fatou Diop',
          buyerPhone: '78 987 65 43',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 47 * 60 * 60 * 1000).toISOString(),
          hasBuyer: true
        },
        {
          id: '2',
          code: '789012',
          vehicle: {
            id: 'v2',
            reference: 'OKAR-DEF456',
            make: 'Peugeot',
            model: '504',
            licensePlate: 'CC-5678-DD'
          },
          buyerName: null,
          buyerPhone: null,
          status: 'PENDING',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 46 * 60 * 60 * 1000).toISOString(),
          hasBuyer: false
        }
      ];
      setTransfers(mockTransfers);
    } catch (err) {
      setError('Erreur lors du chargement des transferts');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async (transfer: PendingTransfer) => {
    setActionLoading(transfer.id);
    setError(null);

    try {
      const response = await fetch('/api/transfer/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferCodeId: transfer.id })
      });

      const data = await response.json();

      if (data.success) {
        setTransfers(prev => prev.filter(t => t.id !== transfer.id));
        setConfirmModal(null);
      } else {
        setError(data.error || 'Erreur lors de la confirmation');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelTransfer = async (transfer: PendingTransfer) => {
    setActionLoading(transfer.id);
    setError(null);

    try {
      const response = await fetch('/api/transfer/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferCodeId: transfer.id })
      });

      const data = await response.json();

      if (data.success) {
        setTransfers(prev => prev.filter(t => t.id !== transfer.id));
        setCancelModal(null);
      } else {
        setError(data.error || 'Erreur lors de l\'annulation');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const expires = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = expires - now;

    if (diff <= 0) return 'Expiré';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}j ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/driver/transfert')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <Clock className="w-7 h-7 text-orange-500" />
              Transferts en attente
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Gérez vos transferts de propriété en cours.
            </p>
          </div>
          <button
            onClick={fetchPendingTransfers}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Transfers List */}
      {transfers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowRightLeft className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
            Aucun transfert en attente
          </h3>
          <p className="text-slate-500 mb-6">
            Vous n&apos;avez aucun transfert de propriété en cours.
          </p>
          <button
            onClick={() => router.push('/driver/transfer/initiate')}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
          >
            Initier un transfert
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
            >
              {/* Vehicle Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Car className="w-7 h-7 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-white text-lg">
                    {transfer.vehicle.make} {transfer.vehicle.model}
                  </p>
                  <p className="text-slate-500">{transfer.vehicle.licensePlate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Code</p>
                  <p className="font-mono font-bold text-orange-500 text-lg">
                    {transfer.code}
                  </p>
                </div>
              </div>

              {/* Buyer Info (if exists) */}
              {transfer.hasBuyer ? (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">
                          {transfer.buyerName}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {transfer.buyerPhone}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                      Acheteur identifié
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                  <p className="text-sm text-slate-500 text-center">
                    En attente de saisie du code par l&apos;acheteur...
                  </p>
                </div>
              )}

              {/* Timer */}
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <Clock className="w-4 h-4" />
                <span>Expire dans {getTimeRemaining(transfer.expiresAt)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {transfer.hasBuyer ? (
                  <>
                    <button
                      onClick={() => setCancelModal(transfer)}
                      disabled={actionLoading === transfer.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 
                        border border-red-300 text-red-600 rounded-xl font-semibold 
                        hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors 
                        disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Refuser
                    </button>
                    <button
                      onClick={() => setConfirmModal(transfer)}
                      disabled={actionLoading === transfer.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 
                        bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold 
                        transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Confirmer
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setCancelModal(transfer)}
                    disabled={actionLoading === transfer.id}
                    className="w-full flex items-center justify-center gap-2 py-3 
                      border border-slate-300 text-slate-600 rounded-xl font-semibold 
                      hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors 
                      disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Annuler le transfert
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Confirmer le transfert ?
              </h3>
              <p className="text-slate-500 mb-4">
                Vous êtes sur le point de transférer le passeport numérique à{' '}
                <strong>{confirmModal.buyerName}</strong>.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                <p className="font-medium text-slate-800 dark:text-white">
                  {confirmModal.vehicle.make} {confirmModal.vehicle.model}
                </p>
                <p className="text-sm text-slate-500">{confirmModal.vehicle.licensePlate}</p>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Cette action est définitive. Vous conserverez un accès en lecture seule à l&apos;historique.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 
                    text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleConfirmTransfer(confirmModal)}
                  disabled={actionLoading === confirmModal.id}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white 
                    rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === confirmModal.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Confirmer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCancelModal(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Annuler le transfert ?
              </h3>
              <p className="text-slate-500 mb-4">
                {cancelModal.hasBuyer 
                  ? `Le transfert à ${cancelModal.buyerName} sera annulé.`
                  : 'Le code de transfert sera invalidé.'}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                <p className="font-medium text-slate-800 dark:text-white">
                  {cancelModal.vehicle.make} {cancelModal.vehicle.model}
                </p>
                <p className="text-sm text-slate-500">{cancelModal.vehicle.licensePlate}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModal(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 
                    text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Retour
                </button>
                <button
                  onClick={() => handleCancelTransfer(cancelModal)}
                  disabled={actionLoading === cancelModal.id}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white 
                    rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === cancelModal.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Annuler le transfert'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
