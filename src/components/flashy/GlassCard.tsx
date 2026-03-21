'use client';

import { motion, HTMLMotionProps, Variants, AnimatePresence } from 'framer-motion';
import { forwardRef, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🪟 GLASS CARD - Carte avec effet glassmorphism
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'floating';
  glow?: boolean;
  glowColor?: 'orange' | 'pink' | 'green' | 'blue' | 'purple';
  interactive?: boolean;
  gradientBorder?: boolean;
}

const glowColors = {
  orange: 'rgba(255, 107, 0, 0.3)',
  pink: 'rgba(255, 0, 128, 0.3)',
  green: 'rgba(0, 230, 118, 0.3)',
  blue: 'rgba(0, 176, 255, 0.3)',
  purple: 'rgba(170, 0, 255, 0.3)',
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  hover: {
    y: -4,
    transition: { type: 'spring', stiffness: 400, damping: 15 }
  }
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    children,
    variant = 'default',
    glow = false,
    glowColor = 'orange',
    interactive = false,
    gradientBorder = false,
    className = '',
    ...props
  }, ref) => {
    
    const variantStyles = {
      default: 'backdrop-blur-xl bg-white/80 border border-white/50',
      elevated: 'backdrop-blur-xl bg-white/90 border border-white/60 shadow-2xl',
      floating: 'backdrop-blur-xl bg-white/85 border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.1)]',
    };

    return (
      <motion.div
        ref={ref}
        className={`
          relative rounded-3xl overflow-hidden
          ${variantStyles[variant]}
          ${interactive ? 'cursor-pointer' : ''}
          ${gradientBorder ? 'p-[2px]' : ''}
          ${className}
        `}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={interactive ? "hover" : undefined}
        {...props}
      >
        {/* Gradient border wrapper */}
        {gradientBorder && (
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FF6B00] via-[#FF3D7F] to-[#FF0080]" />
        )}
        
        {/* Inner content */}
        <div className={`relative ${gradientBorder ? 'bg-white rounded-[22px]' : ''}`}>
          {/* Glow effect */}
          {glow && (
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl opacity-30 -z-10"
              style={{ background: glowColors[glowColor] }}
            />
          )}
          
          {/* Content */}
          {children}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// ═══════════════════════════════════════════════════════════════════════════════
// 🚗 VEHICLE HERO CARD - Carte véhicule flottante
// ═══════════════════════════════════════════════════════════════════════════════

interface VehicleHeroCardProps {
  vehicle: {
    make: string;
    model: string;
    year?: number;
    licensePlate: string;
    color?: string;
    mainPhoto?: string;
    okarScore?: number;
    okarBadge?: 'BRONZE' | 'SILVER' | 'GOLD';
  };
  onPress?: () => void;
}

export const VehicleHeroCard = forwardRef<HTMLDivElement, VehicleHeroCardProps>(
  ({ vehicle, onPress }, ref) => {
    
    const getScoreColor = (score: number) => {
      if (score >= 80) return { from: '#00E676', to: '#00BFA5' };
      if (score >= 60) return { from: '#76FF03', to: '#64DD17' };
      if (score >= 40) return { from: '#FFD600', to: '#FF9100' };
      if (score >= 20) return { from: '#FF9100', to: '#FF3D00' };
      return { from: '#FF1744', to: '#D500F9' };
    };

    const scoreColor = vehicle.okarScore ? getScoreColor(vehicle.okarScore) : null;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (circumference * (vehicle.okarScore || 0)) / 100;

    return (
      <motion.div
        ref={ref}
        className="relative mx-4"
        onClick={onPress}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#FFF5F0] via-[#FFF0F5] to-[#F5F0FF]" />
        
        {/* Card content */}
        <div className="relative p-6 rounded-[32px] backdrop-blur-xl bg-white/60 border border-white/50 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          
          {/* Score circle */}
          {vehicle.okarScore !== undefined && (
            <div className="absolute -top-4 -right-4">
              <motion.div
                className="relative w-24 h-24"
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 }}
              >
                {/* Background circle */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="#E5E5E5"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke={`url(#scoreGradient-${vehicle.okarScore})`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id={`scoreGradient-${vehicle.okarScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={scoreColor?.from} />
                      <stop offset="100%" stopColor={scoreColor?.to} />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Score text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl font-black text-gray-800">{vehicle.okarScore}</span>
                    <Sparkles className="w-4 h-4 mx-auto text-yellow-500" />
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Vehicle image with floating effect */}
          <motion.div
            className="relative w-full h-48 mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {vehicle.mainPhoto ? (
              <img
                src={vehicle.mainPhoto}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🚗
              </div>
            )}
            
            {/* Colored shadow under car */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 blur-xl opacity-40"
              style={{ background: 'linear-gradient(to right, #FF6B00, #FF0080)' }}
            />
          </motion.div>

          {/* Vehicle info */}
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-800">
              {vehicle.make} {vehicle.model}
              {vehicle.year && <span className="text-gray-400 text-lg ml-2">{vehicle.year}</span>}
            </h3>
            
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-600 font-mono">
                {vehicle.licensePlate}
              </span>
              {vehicle.color && (
                <span className="text-sm text-gray-500">{vehicle.color}</span>
              )}
            </div>
          </div>

          {/* View details button */}
          <motion.div
            className="absolute bottom-4 right-4 flex items-center gap-1 text-[#FF6B00] font-semibold text-sm"
            whileHover={{ x: 4 }}
          >
            Détails <ChevronRight className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>
    );
  }
);

VehicleHeroCard.displayName = 'VehicleHeroCard';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎊 CELEBRATION MODAL - Modal de célébration avec confettis
// ═══════════════════════════════════════════════════════════════════════════════

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: React.ReactNode;
  confetti?: boolean;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  icon,
  confetti = true,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-sm p-8 rounded-[32px] bg-white shadow-2xl"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {/* Confetti effect placeholder - actual confetti rendered via canvas */}
              {confetti && (
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {/* Confetti will be rendered by canvas-confetti */}
                </div>
              )}
              
              {/* Icon with animation */}
              {icon && (
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#00E676] to-[#00BFA5] flex items-center justify-center text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 10 }}
                >
                  {icon}
                </motion.div>
              )}
              
              {/* Title */}
              <motion.h2
                className="text-2xl font-black text-center text-gray-800 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {title}
              </motion.h2>
              
              {/* Message */}
              <motion.p
                className="text-center text-gray-600 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {message}
              </motion.p>
              
              {/* Close button */}
              <motion.button
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00E676] to-[#00BFA5] text-white font-bold text-lg shadow-[0_8px_32px_rgba(0,230,118,0.4)]"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Super ! 🎉
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ NOTIFICATION CARD - Carte de notification flottante
// ═══════════════════════════════════════════════════════════════════════════════

interface NotificationCardProps {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'urgent';
  icon?: React.ReactNode;
  onPress?: () => void;
  onDismiss?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  message,
  type = 'info',
  icon,
  onPress,
  onDismiss,
}) => {
  const typeStyles = {
    info: 'from-[#00B0FF] to-[#7C4DFF]',
    warning: 'from-[#FFD600] to-[#FF9100]',
    success: 'from-[#00E676] to-[#00BFA5]',
    urgent: 'from-[#FF1744] to-[#FF0080]',
  };

  return (
    <motion.div
      className="fixed bottom-6 left-4 right-4 z-40"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="relative p-4 rounded-2xl backdrop-blur-xl bg-white/90 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] cursor-pointer"
        onClick={onPress}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          boxShadow: [
            '0 8px 32px rgba(0,0,0,0.1)',
            '0 12px 48px rgba(0,0,0,0.15)',
            '0 8px 32px rgba(0,0,0,0.1)',
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Accent bar */}
        <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-full bg-gradient-to-b ${typeStyles[type]}`} />
        
        <div className="flex items-center gap-4 pl-4">
          {/* Icon */}
          {icon && (
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeStyles[type]} flex items-center justify-center text-white`}>
              {icon}
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 truncate">{title}</h4>
            <p className="text-sm text-gray-600 truncate">{message}</p>
          </div>
          
          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GlassCard;
