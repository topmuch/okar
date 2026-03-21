'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Share2,
  Download,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Car,
  Calendar,
  Gauge,
  Award,
  Sparkles,
  Shield,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { MeshGradient } from '@/lib/animations/celebration';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎫 QR CODE DISPLAY - Le Passeport Premium
// ═══════════════════════════════════════════════════════════════════════════════

const mockVehicle = {
  reference: 'OKAR-2024-ABC123',
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  licensePlate: 'AA-1234-BB',
  color: 'Blanc Nacré',
  vin: 'JTDKN3DU5A0123456',
  okarScore: 85,
  okarBadge: 'GOLD',
  ownerName: 'Amadou Diallo',
  activationDate: '2023-06-15',
  mileage: 45000,
};

export default function MyQRPage() {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const shareData = {
      title: 'Mon QR OKAR',
      text: `Mon passeport automobile OKAR - ${mockVehicle.make} ${mockVehicle.model}`,
      url: `https://okar.sn/v/${mockVehicle.reference}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(`https://okar.sn/v/${mockVehicle.reference}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mockVehicle.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════
          🌈 ANIMATED MESH GRADIENT BACKGROUND
          ═══════════════════════════════════════════════════════════════════════ */}
      <MeshGradient 
        colors={['#FFF0E5', '#FFE5F0', '#F0E5FF', '#E5F0FF', '#FFB6E1']}
        animated={true}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          🔙 HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.header
        className="sticky top-0 z-30 bg-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 bg-white/50 backdrop-blur-xl px-4 py-2 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </button>
          <h1 className="font-bold text-gray-800 bg-white/50 backdrop-blur-xl px-4 py-2 rounded-full">
            Mon QR Code
          </h1>
          <div className="w-20" />
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════════════
          🎫 PREMIUM QR CARD WITH GLASSMORPHISM
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col items-center justify-center px-6 pt-8">
        <motion.div
          ref={qrRef}
          className="relative w-full max-w-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Glassmorphism Card */}
          <div className="relative p-8 rounded-[32px] backdrop-blur-xl bg-white/70 border border-white/50 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
            
            {/* Gradient border glow */}
            <div 
              className="absolute -inset-[2px] rounded-[34px] opacity-50"
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #FF0080)',
                zIndex: -1,
                filter: 'blur(8px)'
              }}
            />

            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF0080] flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-[#FF6B00] to-[#FF0080] bg-clip-text text-transparent">
                  OKAR
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">Passeport Numérique Automobile</p>
            </div>

            {/* QR Code Container */}
            <motion.div
              className="relative bg-white rounded-2xl p-6 shadow-inner"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(255, 107, 0, 0)',
                  '0 0 0 8px rgba(255, 107, 0, 0.1)',
                  '0 0 0 0 rgba(255, 107, 0, 0)',
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {/* QR Code SVG Placeholder */}
              <div className="w-full aspect-square flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="w-full h-full flex items-center justify-center">
                  <QrCode className="w-48 h-48 text-gray-800" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Center logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-xl bg-white shadow-lg flex items-center justify-center">
                  <span className="text-2xl font-black text-orange-500">O</span>
                </div>
              </div>
            </motion.div>

            {/* Reference Code */}
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-gray-500 text-sm mb-1">Référence</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-bold text-lg text-gray-800">
                  {mockVehicle.reference}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Vehicle Info */}
            <motion.div
              className="mt-6 pt-6 border-t border-gray-200/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl">
                    🚗
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {mockVehicle.make} {mockVehicle.model}
                    </h3>
                    <p className="text-gray-500 text-sm">{mockVehicle.licensePlate}</p>
                  </div>
                </div>
              </div>
              
              {/* Score badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-gray-700">Score OKAR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-yellow-600">{mockVehicle.okarScore}</span>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
            </motion.div>

            {/* Owner info */}
            <motion.div
              className="mt-4 flex items-center gap-2 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Shield className="w-4 h-4 text-green-500" />
              <span>Propriétaire: {mockVehicle.ownerName}</span>
            </motion.div>
          </div>

          {/* Colored shadow */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-2xl opacity-40"
            style={{ background: 'linear-gradient(to right, #FF6B00, #FF0080)' }}
          />
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════════
            📲 ACTION BUTTONS
            ═══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="flex gap-4 mt-8 w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Share button */}
          <motion.button
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#00B0FF] to-[#AA00FF] text-white font-bold flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(0,176,255,0.4)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
            Partager
          </motion.button>
          
          {/* Download button */}
          <motion.button
            className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center gap-2 shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-5 h-5" />
            Télécharger
          </motion.button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════════
            👆 SWIPE INDICATOR
            ═══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-2 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronUp className="w-6 h-6" />
          </motion.div>
          <span className="text-sm">Glissez pour voir les détails</span>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          📋 DETAILS SECTION (Swipeable)
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="mt-12 px-6 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">Informations du véhicule</h3>
        
        <div className="space-y-3">
          {[
            { icon: <Car className="w-5 h-5" />, label: 'Marque', value: mockVehicle.make },
            { icon: <Car className="w-5 h-5" />, label: 'Modèle', value: mockVehicle.model },
            { icon: <Calendar className="w-5 h-5" />, label: 'Année', value: mockVehicle.year },
            { icon: <Gauge className="w-5 h-5" />, label: 'Kilométrage', value: `${mockVehicle.mileage.toLocaleString()} km` },
            { icon: <Sparkles className="w-5 h-5" />, label: 'Couleur', value: mockVehicle.color },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-orange-500">
                  {item.icon}
                </div>
                <span className="text-gray-500">{item.label}</span>
              </div>
              <span className="font-semibold text-gray-800">{item.value}</span>
            </motion.div>
          ))}
        </div>

        {/* View public page button */}
        <motion.button
          className="w-full mt-6 py-4 rounded-2xl border-2 border-orange-200 text-orange-500 font-bold flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.open(`/v/${mockVehicle.reference}`, '_blank')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
        >
          <ExternalLink className="w-5 h-5" />
          Voir la page publique
        </motion.button>
      </motion.div>
    </div>
  );
}
