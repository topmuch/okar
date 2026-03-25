'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, 
  X, 
  ArrowLeft,
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  Download, 
  Share2,
  Calendar,
  MapPin,
  Car,
  Wrench,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { SuccessButton, Celebration, triggerConfetti, haptic } from '@/lib/animations/celebration';

// Mock invoice data
const mockInvoice = {
  id: '1',
  garageName: 'Auto Plus Dakar',
  garageAddress: 'Dakar, Sicap Liberté 2',
  date: '15 Janvier 2024',
  mileage: 45000,
  interventions: [
    { type: 'Vidange', cost: 25000 },
    { type: 'Filtre à huile', cost: 8500 },
    { type: 'Main d\'œuvre', cost: 10000 },
  ],
  totalCost: 43500,
  invoicePhoto: null,
  notes: 'Huile 5W40 synthèse',
};

export default function ValidationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

  const handleValidate = async () => {
    haptic.medium();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
    setShowCelebration(true);
    haptic.success();
  };

  const handleReject = () => {
    haptic.light();
    router.push('/driver/validation?reject=true');
  };

  const handleCelebrationComplete = () => {
    setTimeout(() => router.push('/driver/tableau-de-bord'), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F9FC] to-white">
      <Celebration trigger={showCelebration} type="celebration" onComplete={handleCelebrationComplete} />

      {/* Header */}
      <motion.header
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </button>
          <h1 className="font-bold text-gray-800">Validation</h1>
          <div className="w-20" />
        </div>
      </motion.header>

      {/* Invoice Card */}
      <div className="p-4 pb-40">
        <motion.div
          className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Invoice photo */}
          <div 
            className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer"
            onClick={() => setShowZoom(true)}
          >
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <FileText className="w-16 h-16 mb-2" />
              <span className="text-sm">Photo de la facture</span>
            </div>
            <motion.div
              className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ZoomIn className="w-6 h-6 text-white" />
            </motion.div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{mockInvoice.garageName}</h2>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {mockInvoice.garageAddress}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-sm font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                En attente
              </span>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5 text-orange-500" />
                <span>{mockInvoice.date}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Car className="w-5 h-5 text-blue-500" />
                <span>{mockInvoice.mileage.toLocaleString()} km</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">INTERVENTIONS</h3>
              <div className="space-y-3">
                {mockInvoice.interventions.map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-gray-700">{item.type}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.cost.toLocaleString()} XOF</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {mockInvoice.notes && (
              <div className="p-3 rounded-xl bg-gray-50 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Notes:</span> {mockInvoice.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#FF6B00]/10 to-[#FF0080]/10 border border-orange-100">
              <span className="text-lg font-bold text-gray-800">Total</span>
              <span className="text-2xl font-black bg-gradient-to-r from-[#FF6B00] to-[#FF0080] bg-clip-text text-transparent">
                {mockInvoice.totalCost.toLocaleString()} XOF
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100">
        <div className="flex gap-4">
          <motion.button
            className="flex-1 py-4 rounded-2xl border-2 border-red-200 text-red-500 font-bold flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReject}
          >
            <X className="w-5 h-5" />
            Rejeter
          </motion.button>
          <div className="flex-1">
            <SuccessButton
              loading={loading}
              success={success}
              onClick={handleValidate}
              loadingText="Validation..."
              successText="Certifié !"
              defaultText="Valider"
            />
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-3">
          En validant, vous certifiez l'authenticité de cette intervention
        </p>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-8 bg-white/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <motion.div
                className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#00E676] to-[#00BFA5] flex items-center justify-center shadow-[0_20px_60px_rgba(0,230,118,0.4)]"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Check className="w-16 h-16 text-white" />
              </motion.div>
              <motion.h2
                className="text-3xl font-black text-gray-800 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Certifié avec succès ! 🎉
              </motion.h2>
              <motion.p
                className="text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Votre historique est mis à jour.
              </motion.p>
              <div className="flex items-center justify-center gap-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <Sparkles key={i} className="w-6 h-6 text-yellow-500" />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
