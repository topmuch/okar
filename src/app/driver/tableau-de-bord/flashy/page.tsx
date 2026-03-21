'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  CheckCircle,
  Bell,
  ChevronRight,
  Sparkles,
  Zap,
  FileText,
  Wrench,
} from 'lucide-react';
import { FlashyButton, VehicleHeroCard, ScoreCircle, QuickActionButton, CelebrationModal, EmergencyFAB, TimelineItem } from '@/components/flashy';

// ═══════════════════════════════════════════════════════════════════
// 🏠 DRIVER DASHBOARD - Version Flashy Ultra-Moderne
// ═══════════════════════════════════════════════════════════════════

export default function FlashyDriverDashboard() {
  const router = useRouter();
  const [greeting, setGreeting] = useState('Bonjour');
  const [showCelebration, setShowCelebration] = useState(false);
  const [pendingValidations, setPendingValidations] = useState(1);
  
  // Mock data
  const user = {
    name: 'Amadou',
    avatar: null,
  };
  
  const vehicle = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    licensePlate: 'AA-1234-BB',
    okarScore: 78,
    okarBadge: 'GOLD' as const,
    imageUrl: null,
  };
  
  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🌈 HEADER - Bandeau incurvé avec dégradé animé */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#FF6B00] via-[#FF3D7F] to-[#FF0080]"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ backgroundSize: '200% 200%' }}
        />
        
        {/* Mesh overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
        
        {/* Curved bottom */}
        <svg
          className="absolute bottom-0 w-full h-16 text-[#F8F9FC]"
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,64 L1440,64 L1440,32 Q720,96 0,32 Z"
          />
        </svg>
        
        {/* Content */}
        <div className="relative px-6 pt-12 pb-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar with animated ring */}
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  style={{ padding: 3 }}
                />
                <div className="relative w-14 h-14 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#FF6B00]">
                  {user.name.charAt(0)}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-2xl font-bold text-white">
                  {greeting}, {user.name} ! 👋
                </h1>
                <p className="text-white/80 text-sm">
                  Votre véhicule vous attend
                </p>
              </motion.div>
            </div>
            
            {/* Notification bell */}
            <motion.button
              className="relative p-3 rounded-xl bg-white/20 backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-6 h-6 text-white" />
              {pendingValidations > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FFD600] text-[#111] text-xs font-bold flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {pendingValidations}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🚗 VEHICLE HERO CARD - Flottante avec ombre colorée */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="px-6 -mt-8 relative z-10">
        <VehicleHeroCard
          vehicle={vehicle}
          onClick={() => router.push('/driver/vehicle/main')}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📊 SCORE SECTION - Jauge animée */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.div
        className="mx-6 mt-6 p-6 rounded-[28px] bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-6">
          <ScoreCircle score={vehicle.okarScore} size={100} />
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#111]">
              Score OKAR
            </h3>
            <p className="text-[#666] text-sm mt-1">
              Votre véhicule est en excellente santé !
            </p>
            
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white text-sm font-bold"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4" />
              Badge Or
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ⚡ ALERT - Facture en attente */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {pendingValidations > 0 && (
          <motion.div
            className="mx-6 mt-6"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <motion.button
              className="w-full p-4 rounded-[24px] bg-gradient-to-r from-[#FFD600] to-[#FF9100] flex items-center gap-4 shadow-[0_8px_24px_rgba(255,214,0,0.3)]"
              onClick={() => router.push('/driver/validation')}
              animate={{
                boxShadow: [
                  '0 8px 24px rgba(255,214,0,0.3)',
                  '0 8px 32px rgba(255,214,0,0.5)',
                  '0 8px 24px rgba(255,214,0,0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              
              <div className="flex-1 text-left">
                <h4 className="font-bold text-white">
                  ⚡ {pendingValidations} facture à valider !
                </h4>
                <p className="text-white/80 text-sm">
                  Cliquez pour certifier l'intervention
                </p>
              </div>
              
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🔘 QUICK ACTIONS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.div
        className="px-6 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-bold text-[#111] mb-4">
          Actions rapides
        </h3>
        
        <div className="grid grid-cols-4 gap-4">
          <QuickActionButton
            icon={<QrCode className="w-6 h-6" />}
            label="Scanner"
            color="orange"
            onClick={() => router.push('/scan')}
          />
          <QuickActionButton
            icon={<CheckCircle className="w-6 h-6" />}
            label="Valider"
            color="green"
            onClick={() => router.push('/driver/validation')}
          />
          <QuickActionButton
            icon={<FileText className="w-6 h-6" />}
            label="Mon QR"
            color="pink"
            onClick={() => router.push('/driver/qr')}
          />
          <QuickActionButton
            icon={<Wrench className="w-6 h-6" />}
            label="Urgence"
            color="yellow"
            onClick={() => router.push('/driver/emergency')}
          />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📜 TIMELINE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.div
        className="px-6 mt-8 pb-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#111]">
            Historique récent
          </h3>
          <button
            className="text-[#FF6B00] text-sm font-medium"
            onClick={() => router.push('/driver/historique')}
          >
            Voir tout
          </button>
        </div>
        
        <div className="space-y-0">
          <TimelineItem
            icon={<span className="text-sm">🛢️</span>}
            iconColor="#FF6B00"
            title="Vidange moteur"
            subtitle="Huile 5W40 • 45 000 km"
            date="15 mars 2024"
          />
          <TimelineItem
            icon={<span className="text-sm">🔧</span>}
            iconColor="#00E676"
            title="Freins avant"
            subtitle="Plaquettes & disques"
            date="28 février 2024"
          />
          <TimelineItem
            icon={<span className="text-sm">📄</span>}
            iconColor="#FFD600"
            title="Vidange (archive)"
            subtitle="Garage Auto Plus"
            date="10 janvier 2024"
            isPaper
          />
        </div>
      </motion.div>

      {/* 🆘 EMERGENCY FAB */}
      <EmergencyFAB onClick={() => router.push('/driver/emergency')} />

      {/* 🎉 CELEBRATION MODAL */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="Certifié avec succès !"
        message="Votre historique est mis à jour. Le garage a été notifié."
      />
    </div>
  );
}
