'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  X,
  ZoomIn,
  FileText,
  Calendar,
  Gauge,
  Wrench,
  ChevronLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  Car,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Main component wrapped in Suspense
export default function ValidationFacturePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
      <motion.div
        className="w-16 h-16 rounded-full border-4 border-[#FF6B00] border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>}>
      <ValidationContent />
    </Suspense>
  );
}

interface MaintenanceRecord {
  id: string;
  category: string;
  description: string | null;
  mileage: number | null;
  totalCost: number | null;
  partsList: string | null;
  invoicePhoto: string | null;
  interventionDate: string;
  createdAt: string;
  vehicleId: string;
  garageId: string | null;
  vehicle: {
    reference: string;
    make: string | null;
    model: string | null;
    licensePlate: string | null;
  };
  garage: {
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
}

function ValidationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');
  const { user } = useAuth();
  
  const [isValidating, setIsValidating] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [validationState, setValidationState] = useState<'pending' | 'success' | 'error'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch the record from API
  useEffect(() => {
    const fetchRecord = async () => {
      if (!recordId) {
        setError('Aucun identifiant de rapport fourni');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/maintenance-records/${recordId}`);
        if (!response.ok) {
          throw new Error('Rapport non trouvé');
        }
        const data = await response.json();
        setRecord(data.record);
        
        // Check if already validated
        if (data.record.ownerValidation !== 'PENDING') {
          setValidationState('success');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [recordId]);

  const handleValidate = async () => {
    if (!recordId || !user?.id) return;
    
    setIsValidating(true);
    
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 20, 50]);
    }
    
    try {
      const response = await fetch('/api/driver/validations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          ownerId: user.id,
          action: 'validate'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      setValidationState('success');
      
      // Show celebration
      setTimeout(() => {
        setShowSuccess(true);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleReject = async () => {
    if (!recordId || !user?.id) return;
    if (!rejectionReason.trim()) {
      setError('Veuillez indiquer le motif du rejet');
      return;
    }

    setIsRejecting(true);
    
    try {
      const response = await fetch('/api/driver/validations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          ownerId: user.id,
          action: 'reject',
          rejectionReason
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du rejet');
      }

      router.push('/driver/tableau-de-bord/flashy');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rejet');
    } finally {
      setIsRejecting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FF6B00] animate-spin mx-auto mb-4" />
          <p className="text-[#666]">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !record) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#111] mb-2">Erreur</h2>
          <p className="text-[#666] mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-[#FF6B00] text-white rounded-xl font-medium"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Parse parts list
  const parts = record?.partsList?.split(',').map(p => p.trim()).filter(Boolean) || [];

  // Category labels
  const categoryLabels: Record<string, string> = {
    vidange: 'Vidange',
    freins: 'Freins',
    pneus: 'Pneus',
    moteur: 'Moteur',
    electricite: 'Électricité',
    carrosserie: 'Carrosserie',
    climatisation: 'Climatisation',
    suspension: 'Suspension',
    transmission: 'Transmission',
    autre: 'Autre',
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/50">
        <div className="flex items-center gap-4 px-6 py-4">
          <motion.button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-slate-100"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6 text-[#111]" />
          </motion.button>
          
          <h1 className="text-xl font-bold text-[#111]">
            Valider l&apos;intervention
          </h1>
        </div>
      </div>

      {record && (
        <div className="p-6 space-y-6">
          {/* Garage Info Card */}
          <motion.div
            className="p-5 rounded-[24px] bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF0080] flex items-center justify-center text-white font-bold text-xl shadow-[0_8px_24px_rgba(255,107,0,0.3)]">
                {record.garage?.name?.charAt(0) || 'G'}
              </div>
              <div>
                <h3 className="font-bold text-[#111]">{record.garage?.name || 'Garage OKAR'}</h3>
                <p className="text-[#666] text-sm">{record.garage?.address || 'Adresse non renseignée'}</p>
              </div>
            </div>
          </motion.div>

          {/* Vehicle Info */}
          <motion.div
            className="p-5 rounded-[24px] bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Car className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <div>
                <p className="font-mono text-xs text-[#FF6B00] font-semibold">{record.vehicle.reference}</p>
                <p className="font-medium text-[#111]">
                  {record.vehicle.make} {record.vehicle.model}
                </p>
                {record.vehicle.licensePlate && (
                  <p className="text-sm text-[#666] font-mono">{record.vehicle.licensePlate}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Invoice Image */}
          <motion.div
            className="relative rounded-[24px] overflow-hidden bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {record.invoicePhoto ? (
              <div
                className="relative aspect-[4/3] bg-gradient-to-br from-[#F0F4FF] to-[#FFF5F0] flex items-center justify-center cursor-pointer"
                onClick={() => setShowZoom(true)}
              >
                <img 
                  src={record.invoicePhoto} 
                  alt="Facture" 
                  className="max-w-full max-h-full object-contain"
                />
                <motion.div
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            ) : (
              <div
                className="relative aspect-[4/3] bg-gradient-to-br from-[#F0F4FF] to-[#FFF5F0] flex items-center justify-center cursor-pointer"
                onClick={() => setShowZoom(true)}
              >
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <FileText className="w-16 h-16 text-[#FF6B00]/40 mx-auto mb-4" />
                  <p className="text-[#666]">Aucune photo de facture</p>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Details Card */}
          <motion.div
            className="p-6 rounded-[24px] bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Category */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF0080] flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#111]">
                  {categoryLabels[record.category] || record.category}
                </h3>
                <p className="text-[#666] text-sm">{record.description || 'Pas de description'}</p>
              </div>
            </div>
            
            <div className="h-px bg-slate-100" />
            
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#FF6B00]" />
                <div>
                  <p className="text-xs text-[#999]">Date</p>
                  <p className="font-medium text-[#111]">
                    {new Date(record.interventionDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              {record.mileage && (
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-[#FF6B00]" />
                  <div>
                    <p className="text-xs text-[#999]">Kilométrage</p>
                    <p className="font-medium text-[#111]">{record.mileage.toLocaleString()} km</p>
                  </div>
                </div>
              )}
            </div>
            
            {parts.length > 0 && (
              <>
                <div className="h-px bg-slate-100" />
                
                {/* Parts */}
                <div>
                  <p className="text-xs text-[#999] mb-2">Pièces utilisées</p>
                  <div className="flex flex-wrap gap-2">
                    {parts.map((part, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-full bg-[#FFF5F0] text-[#FF6B00] text-sm font-medium"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {record.totalCost && (
              <>
                <div className="h-px bg-slate-100" />
                
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-[#666]">Montant total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B00] to-[#FF0080] bg-clip-text text-transparent">
                    {record.totalCost.toLocaleString()} XOF
                  </span>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* BOUTONS D'ACTION FIXES EN BAS */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FC] via-[#F8F9FC] to-transparent"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
      >
        {validationState === 'pending' ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Reject Button */}
            <motion.button
              onClick={() => setShowRejectModal(true)}
              className="py-4 rounded-[24px] bg-white border-2 border-[#FF3D00] text-[#FF3D00] font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,61,0,0.15)]"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5" />
              Rejeter
            </motion.button>
            
            {/* Validate Button */}
            <motion.button
              onClick={handleValidate}
              disabled={isValidating}
              className="py-4 rounded-[24px] bg-gradient-to-r from-[#00E676] via-[#00D68F] to-[#00BFA5] text-white font-bold flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(0,230,118,0.4)] relative overflow-hidden"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                boxShadow: [
                  '0 8px 32px rgba(0,230,118,0.4)',
                  '0 8px 40px rgba(0,230,118,0.6)',
                  '0 8px 32px rgba(0,230,118,0.4)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              />
              
              {isValidating ? (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Validation...
                </motion.div>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Valider
                </>
              )}
            </motion.button>
          </div>
        ) : (
          // Success state
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="flex justify-center"
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-r from-[#00E676] to-[#00BFA5] flex items-center justify-center shadow-[0_8px_40px_rgba(0,230,118,0.5)]"
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 8px 40px rgba(0,230,118,0.5)',
                  '0 12px 50px rgba(0,230,118,0.7)',
                  '0 8px 40px rgba(0,230,118,0.5)',
                ],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* ZOOM MODAL */}
      <AnimatePresence>
        {showZoom && record?.invoicePhoto && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowZoom(false)}
          >
            <motion.div
              className="w-full max-w-lg aspect-[4/3] bg-white rounded-[24px] overflow-hidden"
              initial={{ scale: 0.5, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <img src={record.invoicePhoto} alt="Facture" className="w-full h-full object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJECTION MODAL */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              className="w-full max-w-md bg-white rounded-[24px] p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-[#111] mb-4">Motif du rejet</h3>
              
              <div className="space-y-3 mb-6">
                {['Montant incorrect', 'Travaux non effectués', 'Photos manquantes', 'Autre'].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setRejectionReason(reason)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      rejectionReason === reason
                        ? 'bg-[#FF6B00]/10 border-2 border-[#FF6B00] text-[#FF6B00]'
                        : 'bg-slate-50 border-2 border-transparent text-[#111]'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {rejectionReason === 'Autre' && (
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Décrivez le motif..."
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4"
                  rows={3}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="py-3 rounded-xl bg-slate-100 text-[#111] font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting || !rejectionReason}
                  className="py-3 rounded-xl bg-[#FF3D00] text-white font-medium disabled:opacity-50"
                >
                  {isRejecting ? 'Envoi...' : 'Confirmer le rejet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CELEBRATION MODAL */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm bg-white rounded-[32px] p-8 text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#00E676] to-[#00BFA5] rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              >
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-[#111] mb-2">
                Certifié avec succès !
              </h2>
              <p className="text-[#666] mb-6">
                Votre historique OKAR a été mis à jour. Le garage a été notifié de votre validation.
              </p>
              
              <button
                onClick={() => router.push('/driver/tableau-de-bord/flashy')}
                className="w-full py-4 bg-gradient-to-r from-[#FF6B00] to-[#FF0080] text-white rounded-[20px] font-bold"
              >
                Retour au tableau de bord
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
