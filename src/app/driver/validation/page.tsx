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
} from 'lucide-react';
import { FlashyButton, CelebrationModal } from '@/components/flashy';

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

function ValidationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');
  
  const [isValidating, setIsValidating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [validationState, setValidationState] = useState<'pending' | 'success' | 'error'>('pending');
  
  // Mock data
  const intervention = {
    id: '1',
    category: 'Vidange',
    garage: {
      name: 'Garage Auto Plus',
      logo: null,
      address: 'Dakar, Plateau',
    },
    date: '15 Mars 2024',
    mileage: 45000,
    description: 'Vidange moteur complet avec filtre à huile',
    parts: ['Huile 5W40 - 5L', 'Filtre à huile TOY-123'],
    cost: 35000,
    invoiceUrl: '/demo-invoice.jpg',
  };

  const handleValidate = async () => {
    setIsValidating(true);
    
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 20, 50]);
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setValidationState('success');
    setIsValidating(false);
    
    // Show celebration
    setTimeout(() => {
      setShowSuccess(true);
    }, 500);
  };

  const handleReject = () => {
    router.push(`/driver/validation/reject?id=${recordId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════ */}
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
            Valider l'intervention
          </h1>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CONTENU PRINCIPAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="p-6 space-y-6">
        {/* Garage Info Card */}
        <motion.div
          className="p-5 rounded-[24px] bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF0080] flex items-center justify-center text-white font-bold text-xl shadow-[0_8px_24px_rgba(255,107,0,0.3)]">
              {intervention.garage.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-[#111]">{intervention.garage.name}</h3>
              <p className="text-[#666] text-sm">{intervention.garage.address}</p>
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
          {/* Image */}
          <div
            className="relative aspect-[4/3] bg-gradient-to-br from-[#F0F4FF] to-[#FFF5F0] flex items-center justify-center cursor-pointer"
            onClick={() => setShowZoom(true)}
          >
            <motion.div
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <FileText className="w-16 h-16 text-[#FF6B00]/40 mx-auto mb-4" />
              <p className="text-[#666]">Cliquez pour agrandir la facture</p>
            </motion.div>
            
            {/* Zoom indicator */}
            <motion.div
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </motion.div>
          </div>
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
              <h3 className="text-xl font-bold text-[#111]">{intervention.category}</h3>
              <p className="text-[#666] text-sm">{intervention.description}</p>
            </div>
          </div>
          
          <div className="h-px bg-slate-100" />
          
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#FF6B00]" />
              <div>
                <p className="text-xs text-[#999]">Date</p>
                <p className="font-medium text-[#111]">{intervention.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-[#FF6B00]" />
              <div>
                <p className="text-xs text-[#999]">Kilométrage</p>
                <p className="font-medium text-[#111]">{intervention.mileage.toLocaleString()} km</p>
              </div>
            </div>
          </div>
          
          <div className="h-px bg-slate-100" />
          
          {/* Parts */}
          <div>
            <p className="text-xs text-[#999] mb-2">Pièces utilisées</p>
            <div className="flex flex-wrap gap-2">
              {intervention.parts.map((part, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-[#FFF5F0] text-[#FF6B00] text-sm font-medium"
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
          
          <div className="h-px bg-slate-100" />
          
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-[#666]">Montant total</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B00] to-[#FF0080] bg-clip-text text-transparent">
              {intervention.cost.toLocaleString()} XOF
            </span>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BOUTONS D'ACTION FIXES EN BAS */}
      {/* ═══════════════════════════════════════════════════════════ */}
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
              onClick={handleReject}
              className="py-4 rounded-[24px] bg-white border-2 border-[#FF3D00] text-[#FF3D00] font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,61,0,0.15)]"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5" />
              Rejeter
            </motion.button>
            
            {/* Validate Button - SUCCESS GRADIENT */}
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
              {/* Inner glow animation */}
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
          // Success state - Transform button
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

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ZOOM MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showZoom && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowZoom(false)}
          >
            <motion.div
              className="w-full max-w-lg aspect-[4/3] bg-white rounded-[24px] flex items-center justify-center"
              initial={{ scale: 0.5, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-center">
                <FileText className="w-20 h-20 text-[#FF6B00]/30 mx-auto mb-4" />
                <p className="text-[#666]">Image de la facture</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CELEBRATION MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CelebrationModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push('/driver/tableau-de-bord/flashy');
        }}
        title="🎉 Certifié avec succès !"
        message="Votre historique OKAR a été mis à jour. Le garage a été notifié de votre validation."
      />
    </div>
  );
}
