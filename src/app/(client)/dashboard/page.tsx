'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Bell,
  ChevronRight,
  Car,
  Droplets,
  Calendar,
  TrendingUp,
  Sparkles,
  Camera,
  FileText,
  Settings,
  User,
  LogOut,
  Zap,
  Shield,
  Award,
} from 'lucide-react';
import { GlassCard, VehicleHeroCard, NotificationCard } from '@/components/flashy/GlassCard';
import { FlashyButton, FlashyIconButton } from '@/components/flashy/FlashyButton';
import { MeshGradient, triggerConfetti, haptic } from '@/lib/animations/celebration';

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 CLIENT DASHBOARD - L'Effet WOW Immédiat
// ═══════════════════════════════════════════════════════════════════════════════

// Mock data - en production, viendrait de l'API
const mockVehicle = {
  id: '1',
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  licensePlate: 'AA-1234-BB',
  color: 'Blanc Nacré',
  mainPhoto: null,
  okarScore: 85,
  okarBadge: 'GOLD' as const,
  currentMileage: 45000,
  lastIntervention: '2024-01-15',
};

const mockStats = [
  { label: 'Interventions', value: 12, icon: <Wrench className="w-5 h-5" /> },
  { label: 'Kilomètres', value: '45K', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Score', value: 85, icon: <Sparkles className="w-5 h-5" /> },
  { label: 'Prochain CT', value: '3 mois', icon: <Calendar className="w-5 h-5" /> },
];

const quickActions = [
  { 
    id: 'scan', 
    label: 'Scanner', 
    icon: <QrCode className="w-7 h-7" />, 
    gradient: 'from-[#FF6B00] to-[#FF0080]',
    description: 'Scanner un QR'
  },
  { 
    id: 'validate', 
    label: 'Valider', 
    icon: <CheckCircle2 className="w-7 h-7" />, 
    gradient: 'from-[#00E676] to-[#00BFA5]',
    description: 'Valider une facture'
  },
  { 
    id: 'myqr', 
    label: 'Mon QR', 
    icon: <QrCode className="w-7 h-7" />, 
    gradient: 'from-[#00B0FF] to-[#AA00FF]',
    description: 'Afficher mon QR'
  },
  { 
    id: 'emergency', 
    label: 'Urgence', 
    icon: <AlertTriangle className="w-7 h-7" />, 
    gradient: 'from-[#FF1744] to-[#D500F9]',
    description: 'Besoin d\'aide'
  },
];

export default function ClientDashboard() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [userName] = useState('Amadou');
  
  // Afficher notification après 3 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Animation de bienvenue avec confettis
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        triggerConfetti('celebration', { particleCount: 50 });
        haptic.success();
      }, 500);
      setShowWelcome(false);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleActionClick = (actionId: string) => {
    haptic.light();
    
    switch (actionId) {
      case 'scan':
        router.push('/scan');
        break;
      case 'validate':
        router.push('/driver/validation');
        break;
      case 'myqr':
        router.push('/driver/my-qr');
        break;
      case 'emergency':
        // Ouvre le modal urgence
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ═══════════════════════════════════════════════════════════════════════
          🌈 MESH GRADIENT BACKGROUND
          ═══════════════════════════════════════════════════════════════════════ */}
      <MeshGradient colors={['#FFF0E5', '#FFE5F0', '#F0E5FF', '#E5F0FF']} />

      {/* ═══════════════════════════════════════════════════════════════════════
          🎨 HEADER INCURVÉ AVEC DÉGRADÉ ANIMÉ
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.header
        className="relative -mx-4 px-6 pt-12 pb-24 rounded-b-[48px] overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#FF6B00] via-[#FF3D7F] to-[#FF0080]"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />
        
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10">
          {/* Top row: Greeting + Profile + Bell */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Profile picture with animated ring */}
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              >
                {/* Golden animated ring */}
                <motion.div
                  className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    background: 'conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700, #FFA500, #FFD700)',
                  }}
                />
                <div className="relative w-14 h-14 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-orange-500">
                  {userName.charAt(0)}
                </div>
              </motion.div>
              
              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-white/80 text-sm">Bonjour,</p>
                <h1 className="text-white text-xl font-bold flex items-center gap-2">
                  {userName} ! 👋
                </h1>
              </motion.div>
            </div>
            
            {/* Notification bell */}
            <motion.button
              className="relative w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Bell className="w-6 h-6 text-white" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                2
              </span>
            </motion.button>
          </div>

          {/* OKAR Score Banner */}
          <motion.div
            className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Score OKAR</p>
                  <p className="text-white text-2xl font-black">{mockVehicle.okarScore}/100</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-sm font-bold">
                  <Sparkles className="w-4 h-4" />
                  {mockVehicle.okarBadge}
                </span>
                <p className="text-white/60 text-xs mt-1">Excellent !</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════════════
          🚗 VEHICLE HERO CARD
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="-mt-12 relative z-20">
        <VehicleHeroCard
          vehicle={mockVehicle}
          onPress={() => router.push('/driver/vehicle/1')}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ⚡ QUICK STATS
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="mt-6 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-3">En bref</h3>
        <div className="grid grid-cols-2 gap-3">
          {mockStats.map((stat, index) => (
            <motion.div
              key={index}
              className="p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-orange-500">
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-black text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          🎯 QUICK ACTIONS - BOUTONS RONDS AVEC EFFET BOUNCE
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="mt-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.9 + index * 0.1,
                type: 'spring',
                stiffness: 400,
                damping: 15
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleActionClick(action.id)}
            >
              {/* Icon container with gradient */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-lg bg-gradient-to-br ${action.gradient}`}
                style={{
                  boxShadow: `0 8px 24px ${action.gradient.includes('FF6B00') ? 'rgba(255, 107, 0, 0.4)' :
                              action.gradient.includes('00E676') ? 'rgba(0, 230, 118, 0.4)' :
                              action.gradient.includes('00B0FF') ? 'rgba(0, 176, 255, 0.4)' :
                              'rgba(255, 23, 68, 0.4)'}`
                }}
              >
                {action.icon}
              </div>
              <span className="text-sm font-semibold text-gray-700">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          📋 RÉCENTS
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="mt-8 px-4 pb-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Interventions récentes</h3>
          <button className="text-orange-500 text-sm font-semibold flex items-center gap-1">
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Recent items */}
        <div className="space-y-3">
          {[
            { type: 'Vidange', date: '15 Jan 2024', garage: 'Auto Plus', status: 'validated' },
            { type: 'Freins AV', date: '10 Dec 2023', garage: 'Garage Moderne', status: 'validated' },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                {item.type === 'Vidange' ? (
                  <Droplets className="w-6 h-6 text-white" />
                ) : (
                  <Wrench className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{item.type}</h4>
                <p className="text-sm text-gray-500">{item.garage} • {item.date}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          🔔 NOTIFICATION FLOTTANTE
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showNotification && (
          <NotificationCard
            title="⚡ 1 facture à valider !"
            message="Auto Plus a soumis une intervention"
            type="warning"
            icon={<FileText className="w-6 h-6" />}
            onPress={() => {
              setShowNotification(false);
              router.push('/driver/validation');
            }}
            onDismiss={() => setShowNotification(false)}
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          🆘 FLOATING ACTION BUTTON - URGENCE
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.button
        className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF1744] to-[#D500F9] flex items-center justify-center shadow-[0_8px_32px_rgba(255,23,68,0.5)]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          haptic.heavy();
          // Ouvre le modal urgence
        }}
      >
        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <AlertTriangle className="w-8 h-8 text-white relative z-10" />
      </motion.button>
    </div>
  );
}
