'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Gauge,
  Calendar,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Wrench,
  Eye,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Download,
  Share2,
  ExternalLink
} from 'lucide-react';

interface ValidationRecord {
  id: string;
  category: string;
  description: string;
  mileage: number;
  partsList: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  invoicePhoto: string;
  invoiceNumber: string;
  mechanicSignature: string;
  mechanicName: string;
  garageName: string;
  garagePhone: string;
  garageCertified: boolean;
  vehicleMake: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  vehicleReference: string;
  interventionDate: string;
  createdAt: string;
  ownerValidation: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vidange: 'Vidange',
  freins: 'Freins',
  pneus: 'Pneus',
  moteur: 'Moteur',
  electricite: 'Électricité',
  carrosserie: 'Carrosserie',
  autre: 'Autre',
};

const REJECTION_REASONS = [
  { id: 'invoice_unreadable', label: 'Facture illisible ou incorrecte' },
  { id: 'price_mismatch', label: 'Prix différent de celui annoncé' },
  { id: 'work_not_done', label: 'Travaux non effectués' },
  { id: 'parts_not_conform', label: 'Pièces non conformes' },
  { id: 'unauthorized', label: 'Je n\'ai pas autorisé ces travaux' },
  { id: 'other', label: 'Autre raison' },
];

export default function DriverValidationPage() {
  const router = useRouter();
  const [records, setRecords] = useState<ValidationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ValidationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAction, setSuccessAction] = useState<'validated' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(false);

  useEffect(() => {
    fetchPendingValidations();
  }, []);

  const fetchPendingValidations = async () => {
    try {
      const response = await fetch('/api/driver/validations?status=PENDING');
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Error fetching validations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      maximumFractionDigits: 0
    }).format(price) + ' FCFA';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return past.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const handleValidate = async (recordId: string) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/driver/validations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          ownerId: 'demo-driver-id',
          action: 'validate'
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowDetailModal(false);
        setSuccessAction('validated');
        setShowSuccessModal(true);
        fetchPendingValidations();
      } else {
        alert(data.error || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Error validating:', error);
      alert('Erreur lors de la validation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecord || !rejectionReason) {
      alert('Veuillez sélectionner un motif de rejet');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/driver/validations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: selectedRecord.id,
          ownerId: 'demo-driver-id',
          action: 'reject',
          rejectionReason: REJECTION_REASONS.find(r => r.id === rejectionReason)?.label + (rejectionComment ? `: ${rejectionComment}` : '')
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowRejectModal(false);
        setShowDetailModal(false);
        setSuccessAction('rejected');
        setShowSuccessModal(true);
        fetchPendingValidations();
        setRejectionReason('');
        setRejectionComment('');
      } else {
        alert(data.error || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Erreur lors du rejet');
    } finally {
      setSubmitting(false);
    }
  };

  const parsePartsList = (partsList: string | null) => {
    if (!partsList) return [];
    try {
      return JSON.parse(partsList);
    } catch {
      return [];
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <FileText className="w-7 h-7 text-orange-500" />
          Validations en attente
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Les interventions soumises par le garage nécessitent votre validation avant d'être visibles publiquement.
        </p>
      </div>

      {/* Pending List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Tout est à jour !
          </h3>
          <p className="text-slate-500">
            Aucune intervention en attente de validation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedRecord(record);
                setShowDetailModal(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium">
                        {CATEGORY_LABELS[record.category] || record.category}
                      </span>
                      {record.garageCertified && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <Shield className="w-3 h-3" />
                          Certifié
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {record.description || CATEGORY_LABELS[record.category]}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {record.garageName} • {record.vehicleMake} {record.vehicleModel}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        {record.mileage?.toLocaleString()} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {timeAgo(record.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {formatPrice(record.totalCost)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    En attente
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecord(record);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Rejeter
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleValidate(record.id);
                  }}
                  disabled={submitting}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Valider
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecord(record);
                    setShowDetailModal(true);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-orange-50 dark:bg-orange-500/10 p-6 border-b border-orange-100 dark:border-orange-800 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                      En attente de validation
                    </h2>
                    <p className="text-sm text-slate-500">
                      Cette intervention sera visible publiquement uniquement après votre validation.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Intervention Details */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-purple-500" />
                  Détails de l'intervention
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Type</p>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {CATEGORY_LABELS[selectedRecord.category] || selectedRecord.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {formatDate(selectedRecord.interventionDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Kilométrage</p>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {selectedRecord.mileage?.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">N° Facture</p>
                    <p className="font-medium text-slate-800 dark:text-white font-mono">
                      {selectedRecord.invoiceNumber || '—'}
                    </p>
                  </div>
                </div>
                {selectedRecord.description && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 text-sm">Description</p>
                    <p className="text-slate-800 dark:text-white">{selectedRecord.description}</p>
                  </div>
                )}
              </div>

              {/* Garage Info */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 rounded-xl border border-orange-100 dark:border-orange-800">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {selectedRecord.garageName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedRecord.garageCertified && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <Shield className="w-3 h-3" />
                        Garage certifié AutoPass
                      </span>
                    )}
                    {selectedRecord.garagePhone && (
                        <a
                          href={`tel:${selectedRecord.garagePhone}`}
                          className="text-xs text-orange-600 hover:text-orange-700"
                        >
                          <Phone className="w-3 h-3 inline mr-1" />
                          {selectedRecord.garagePhone}
                        </a>
                      )}
                  </div>
                </div>
              </div>

              {/* Invoice Photo */}
              {selectedRecord.invoicePhoto && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Facture / Photos
                  </h3>
                  <div 
                    className="relative rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => setExpandedInvoice(!expandedInvoice)}
                  >
                    <div className={`${expandedInvoice ? 'max-h-none' : 'max-h-64'} overflow-hidden transition-all duration-300`}>
                      <div className="bg-white dark:bg-slate-700 p-8 flex items-center justify-center min-h-[200px]">
                        <div className="text-center">
                          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">Facture {selectedRecord.invoiceNumber}</p>
                          <p className="text-xs text-slate-400 mt-1">Cliquez pour agrandir</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 rounded-lg p-2">
                      <ZoomIn className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Parts List */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                  Détail des pièces et main d'œuvre
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 text-slate-500 font-medium">Pièce</th>
                        <th className="text-center py-2 text-slate-500 font-medium">Qté</th>
                        <th className="text-right py-2 text-slate-500 font-medium">Prix Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsePartsList(selectedRecord.partsList).map((part: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 text-slate-700 dark:text-slate-200">{part.name}</td>
                          <td className="py-2 text-center text-slate-600 dark:text-slate-300">{part.quantity || 1}</td>
                          <td className="py-2 text-right text-slate-600 dark:text-slate-300">
                            {part.price?.toLocaleString()} FCFA
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                        <td colSpan={2} className="py-2 font-medium text-slate-800 dark:text-white">
                          Sous-total pièces
                        </td>
                        <td className="py-2 text-right font-medium text-slate-800 dark:text-white">
                          {formatPrice(selectedRecord.partsCost)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="py-2 text-slate-600 dark:text-slate-300">
                          Main d'œuvre
                        </td>
                        <td className="py-2 text-right text-slate-600 dark:text-slate-300">
                          {formatPrice(selectedRecord.laborCost)}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-orange-50 dark:bg-orange-500/10">
                        <td colSpan={2} className="py-3 font-bold text-slate-800 dark:text-white">
                          TOTAL
                        </td>
                        <td className="py-3 text-right font-bold text-orange-600">
                          {formatPrice(selectedRecord.totalCost)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mechanic Signature */}
              {selectedRecord.mechanicSignature && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    Signature du mécanicien
                  </h3>
                  <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
                    <div className="h-20 flex items-center justify-center border-b border-slate-200 dark:border-slate-600 mb-2">
                      <p className="text-slate-400 italic text-lg">
                        [Signature numérique]
                      </p>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>{selectedRecord.mechanicName || 'Mécanicien'}</span>
                      <span>{formatDateTime(selectedRecord.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 py-4 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <XCircle className="w-5 h-5 inline mr-2" />
                  Rejeter
                </button>
                <button
                  onClick={() => handleValidate(selectedRecord.id)}
                  disabled={submitting}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Validation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 inline mr-2" />
                      Valider
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Rejeter l'intervention
                </h2>
                <p className="text-sm text-slate-500">
                  Le garage sera notifié et pourra corriger le rapport.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Motif du rejet (obligatoire)
                </label>
                <div className="space-y-2">
                  {REJECTION_REASONS.map((reason) => (
                    <label
                      key={reason.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        rejectionReason === reason.id
                          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={reason.id}
                        checked={rejectionReason === reason.id}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Commentaire additionnel (optionnel)
                </label>
                <textarea
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  rows={3}
                  placeholder="Plus de détails sur le problème..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setShowDetailModal(true);
                }}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || submitting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {submitting ? 'Rejet en cours...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              successAction === 'validated' 
                ? 'bg-emerald-100 dark:bg-emerald-500/10' 
                : 'bg-red-100 dark:bg-red-500/10'
            }`}>
              {successAction === 'validated' ? (
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              ) : (
                <XCircle className="w-10 h-10 text-red-500" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {successAction === 'validated' ? 'Intervention validée !' : 'Intervention rejetée'}
            </h2>
            <p className="text-slate-500 mb-6">
              {successAction === 'validated'
                ? 'Elle est désormais visible dans l\'historique public de votre véhicule.'
                : 'Le garage a été notifié et pourra vous contacter pour corriger le problème.'
              }
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setSuccessAction(null);
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
