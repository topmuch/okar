'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Share2,
  Download,
  ExternalLink,
  Sparkles,
  Car,
  Calendar,
  Gauge,
  Shield,
  ChevronUp,
  ChevronDown,
  QrCode,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// 🎴 QR CODE PAGE - Carte Premium avec Glassmorphism
// ═══════════════════════════════════════════════════════════════════

export default function QRCodePage() {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [qrPulse, setQrPulse] = useState(true);
  
  // Mock data
  const vehicle = {
    reference: 'OKAR-2024-ABC123',
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    licensePlate: 'AA-1234-BB',
    color: 'Blanc',
    okarScore: 78,
    ownerName: 'Amadou Diallo',
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientY;
    if (diff > 50) {
      setShowDetails(true);
    } else if (diff < -50) {
      setShowDetails(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Mon véhicule ${vehicle.make} ${vehicle.model}`,
        text: `Découvrez l'historique certifié de mon véhicule sur OKAR`,
        url: `https://okar.sn/v/${vehicle.reference}`,
      });
    }
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🌈 ANIMATED MESH GRADIENT BACKGROUND */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 bg-[#F8F9FC]">
        {/* Animated mesh gradient */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 20% 30%, hsla(30, 100%, 65%, 0.4) 0%, transparent 50%),
              radial-gradient(at 80% 20%, hsla(330, 100%, 60%, 0.3) 0%, transparent 50%),
              radial-gradient(at 50% 80%, hsla(180, 100%, 70%, 0.3) 0%, transparent 50%),
              radial-gradient(at 0% 50%, hsla(280, 100%, 70%, 0.2) 0%, transparent 50%)
            `,
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Floating bubbles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl opacity-60"
            style={{
              width: 100 + i * 50,
              height: 100 + i * 50,
              background: i % 2 === 0 
                ? 'linear-gradient(135deg, #FF6B00, #FF0080)' 
                : 'linear-gradient(135deg, #00E676, #00BFA5)',
              left: `${10 + i * 20}%`,
              top: `${20 + i * 15}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <motion.button
            onClick={() => router.back()}
            className="p-3 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6 text-[#111]" />
          </motion.button>
          
          <h1 className="text-lg font-bold text-[#111]">Mon Passeport Auto</h1>
          
          <motion.button
            onClick={handleShare}
            className="p-3 rounded-2xl bg-white/60 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-6 h-6 text-[#FF6B00]" />
          </motion.button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* QR CODE CARD - Style Carte de Crédit Premium */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 px-6 mt-8">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          {/* Glow behind card */}
          <motion.div
            className="absolute inset-0 rounded-[32px] blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,0,0.3), rgba(255,0,128,0.3))',
              transform: 'scale(0.95) translateY(20px)',
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Main Card - Glassmorphism */}
          <div
            className="relative rounded-[32px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.8)',
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['-100% 0', '200% 0'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
            
            {/* Card content */}
            <div className="relative p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF0080] flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <span className="text-white font-bold text-lg">O</span>
                  </motion.div>
                  <div>
                    <p className="text-xs text-[#666]">OKAR</p>
                    <p className="text-sm font-bold text-[#111]">Passeport Auto</p>
                  </div>
                </div>
                
                {/* Score badge */}
                <motion.div
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white text-sm font-bold flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <Sparkles className="w-4 h-4" />
                  {vehicle.okarScore}
                </motion.div>
              </div>
              
              {/* QR Code */}
              <motion.div
                className="relative mx-auto w-64 h-64 rounded-[24px] bg-white p-4 shadow-inner"
                animate={qrPulse ? {
                  boxShadow: [
                    '0 0 0 0 rgba(255,107,0,0)',
                    '0 0 0 10px rgba(255,107,0,0.1)',
                    '0 0 0 0 rgba(255,107,0,0)',
                  ],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Border animation */}
                <motion.div
                  className="absolute inset-0 rounded-[24px]"
                  style={{
                    border: '2px solid transparent',
                    background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #FF6B00, #FF0080) border-box',
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                {/* QR Placeholder */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111] to-[#333] rounded-xl">
                  <div className="text-center">
                    <QrCode className="w-24 h-24 text-white mx-auto" strokeWidth={1} />
                    <p className="text-white/60 text-xs mt-2 font-mono">
                      {vehicle.reference}
                    </p>
                  </div>
                </div>
                
                {/* Center logo */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="font-bold text-[#FF6B00]">O</span>
                </motion.div>
              </motion.div>
              
              {/* Vehicle info */}
              <div className="mt-6 text-center">
                <h2 className="text-2xl font-bold text-[#111]">
                  {vehicle.make} {vehicle.model}
                </h2>
                <p className="text-[#666] text-lg font-mono mt-1">
                  {vehicle.licensePlate}
                </p>
              </div>
              
              {/* Owner */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#666]">
                <Shield className="w-4 h-4 text-[#00E676]" />
                <span>Propriétaire: {vehicle.ownerName}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SWIPE INDICATOR */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.div
        className="flex flex-col items-center mt-8"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.div
          className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-xl flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <ChevronDown className="w-6 h-6 text-[#FF6B00]" />
          ) : (
            <ChevronUp className="w-6 h-6 text-[#FF6B00]" />
          )}
        </motion.div>
        <p className="text-sm text-[#666] mt-2">
          {showDetails ? 'Masquer' : 'Glissez pour voir les détails'}
        </p>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DETAILS PANEL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="px-6 mt-6 pb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="p-6 rounded-[24px] bg-white/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
              <h3 className="text-lg font-bold text-[#111] mb-4">
                Informations du véhicule
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] flex items-center justify-center">
                    <Car className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#999]">Marque & Modèle</p>
                    <p className="font-medium text-[#111]">{vehicle.make} {vehicle.model}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#999]">Année</p>
                    <p className="font-medium text-[#111]">{vehicle.year}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#999]">Référence OKAR</p>
                    <p className="font-medium text-[#111] font-mono">{vehicle.reference}</p>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <motion.button
                  className="py-3 rounded-[20px] bg-gradient-to-r from-[#FF6B00] to-[#FF0080] text-white font-bold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5" />
                  Partager
                </motion.button>
                
                <motion.button
                  className="py-3 rounded-[20px] bg-white border border-[#FF6B00] text-[#FF6B00] font-bold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-5 h-5" />
                  Télécharger
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
