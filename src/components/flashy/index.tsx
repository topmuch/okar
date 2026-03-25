'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Loader2, Check, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// 🌟 FLASHY BUTTON - Bouton avec effets WOW
// ═══════════════════════════════════════════════════════════════════

interface FlashyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'glass' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  success?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  glow?: boolean;
  className?: string;
}

export function FlashyButton({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'left',
  loading = false,
  success = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  glow = false,
  className = '',
}: FlashyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  // Haptic feedback
  const triggerHaptic = () => {
    if (haptic && typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#FF6B00] via-[#FF3D7F] to-[#FF0080] text-white shadow-[0_8px_24px_rgba(255,0,128,0.4)]',
    success: 'bg-gradient-to-r from-[#00E676] via-[#00D68F] to-[#00BFA5] text-white shadow-[0_8px_24px_rgba(0,230,118,0.4)]',
    warning: 'bg-gradient-to-r from-[#FFD600] via-[#FF9100] to-[#FF3D00] text-white shadow-[0_8px_24px_rgba(255,61,0,0.4)]',
    glass: 'bg-white/80 backdrop-blur-xl text-[#111] border border-white/50 shadow-[0_8px_32px_rgba(255,107,0,0.1)]',
    outline: 'bg-transparent border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-[16px]',
    md: 'px-6 py-3 text-base rounded-[20px]',
    lg: 'px-8 py-4 text-lg rounded-[24px]',
    xl: 'px-10 py-5 text-xl rounded-[28px]',
  };

  return (
    <motion.button
      onClick={() => {
        triggerHaptic();
        onClick?.();
      }}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden
        font-bold
        transform transition-all duration-300
        flex items-center justify-center gap-3
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${glow ? 'animate-[glow_2s_ease-in-out_infinite]' : ''}
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.03, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      initial={false}
      animate={isPressed ? { scale: 0.96 } : { scale: 1 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      
      {/* Content */}
      <span className="relative flex items-center gap-3">
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-5 h-5" />
          </motion.div>
        ) : success ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <Check className="w-6 h-6" />
          </motion.div>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </span>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🚗 VEHICLE HERO CARD - Carte véhicule avec effet flottement
// ═══════════════════════════════════════════════════════════════════

interface VehicleHeroCardProps {
  vehicle: {
    make: string;
    model: string;
    year?: number;
    licensePlate: string;
    color?: string;
    imageUrl?: string;
    okarScore: number;
    okarBadge?: 'BRONZE' | 'SILVER' | 'GOLD';
  };
  onClick?: () => void;
}

export function VehicleHeroCard({ vehicle, onClick }: VehicleHeroCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const badgeColors = {
    BRONZE: 'from-[#CD7F32] via-[#B8860B] to-[#8B4513]',
    SILVER: 'from-[#E8E8E8] via-[#C0C0C0] to-[#A8A8A8]',
    GOLD: 'from-[#FFD700] via-[#FFA500] to-[#CD7F32]',
  };

  return (
    <motion.div
      className="relative"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Shadow under car */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 rounded-full blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,107,0,0.3), rgba(255,0,128,0.3))',
        }}
        animate={{
          scale: isHovered ? 1.1 : 1,
          opacity: isHovered ? 0.8 : 0.5,
        }}
      />
      
      {/* Main Card */}
      <div className="relative bg-gradient-to-br from-white to-[#FFF5F0] rounded-[32px] p-6 shadow-[0_20px_60px_rgba(255,107,0,0.15)] border border-white/80 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF6B00]/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-[#FF0080]/20 to-transparent rounded-full blur-2xl" />
        </div>
        
        <div className="relative flex items-center gap-6">
          {/* Car Image - Floating */}
          <motion.div
            className="relative w-32 h-24 flex items-center justify-center"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {vehicle.imageUrl ? (
              <img
                src={vehicle.imageUrl}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#F0F4FF] to-[#FFF5F0] rounded-2xl flex items-center justify-center">
                <span className="text-4xl">🚗</span>
              </div>
            )}
          </motion.div>
          
          {/* Vehicle Info */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-[#111]">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-[#666] text-sm mt-1">
              {vehicle.year && `${vehicle.year} • `}{vehicle.licensePlate}
            </p>
            
            {/* Score Badge */}
            <motion.div
              className={`
                inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full
                bg-gradient-to-r ${badgeColors[vehicle.okarBadge || 'BRONZE']}
                text-white text-sm font-bold
                shadow-lg
              `}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4" />
              Score {vehicle.okarScore}/100
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🎉 CELEBRATION MODAL - Modal de célébration avec confettis
// ═══════════════════════════════════════════════════════════════════

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export function CelebrationModal({
  isOpen,
  onClose,
  title,
  message,
  icon,
}: CelebrationModalProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  
  useEffect(() => {
    if (isOpen) {
      // Generate confetti
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#FF6B00', '#FF0080', '#00E676', '#FFD600', '#2196F3'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 0.5,
      }));
      setConfetti(newConfetti);
      
      // Haptic feedback
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([50, 30, 100]);
      }
    }
  }, [isOpen]);

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
          
          {/* Confetti */}
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${c.x}%`,
                  top: -20,
                  backgroundColor: c.color,
                }}
                initial={{ y: -20, rotate: 0, opacity: 1 }}
                animate={{
                  y: '100vh',
                  rotate: Math.random() * 720 - 360,
                  opacity: 0,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: c.delay,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-[#00E676]/20 via-[#00BFA5]/20 to-[#00E676]/20 blur-xl" />
              
              <div className="relative text-center">
                {/* Animated Icon */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#00E676] to-[#00BFA5] flex items-center justify-center shadow-[0_8px_32px_rgba(0,230,118,0.4)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                >
                  {icon || (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring' }}
                    >
                      <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.div>
                
                {/* Title */}
                <motion.h2
                  className="text-2xl font-bold text-[#111] mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {title}
                </motion.h2>
                
                {/* Message */}
                <motion.p
                  className="text-[#666] mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {message}
                </motion.p>
                
                {/* Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <FlashyButton
                    variant="success"
                    fullWidth
                    onClick={onClose}
                  >
                    Super ! 🎉
                  </FlashyButton>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 📊 SCORE CIRCLE - Jauge de score animée
// ═══════════════════════════════════════════════════════════════════

interface ScoreCircleProps {
  score: number;
  size?: number;
  animated?: boolean;
}

export function ScoreCircle({ score, size = 120, animated = true }: ScoreCircleProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const circumference = 2 * Math.PI * 45;
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayScore(score);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDisplayScore(score);
    }
  }, [score, animated]);
  
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  
  const getColor = () => {
    if (score >= 70) return { from: '#00E676', to: '#00BFA5' };
    if (score >= 40) return { from: '#FFD600', to: '#FF9100' };
    return { from: '#FF3D00', to: '#FF6B00' };
  };
  
  const color = getColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#F0F4FF"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={`url(#gradient-${score})`}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color.from} />
            <stop offset="100%" stopColor={color.to} />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <motion.span
            className="text-3xl font-extrabold text-[#111]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {displayScore}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 📅 TIMELINE ITEM - Item de timeline avec animation
// ═══════════════════════════════════════════════════════════════════

interface TimelineItemProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle: string;
  date: string;
  isPaper?: boolean;
  children?: React.ReactNode;
}

export function TimelineItem({
  icon,
  iconColor,
  title,
  subtitle,
  date,
  isPaper = false,
  children,
}: TimelineItemProps) {
  return (
    <motion.div
      className="relative pl-8 pb-8"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {/* Timeline line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FF6B00] to-[#FF0080]" />
      
      {/* Icon bubble */}
      <motion.div
        className={`
          absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isPaper ? 'bg-gradient-to-br from-amber-100 to-amber-200' : 'bg-white'}
          shadow-lg border-2 border-white
        `}
        whileHover={{ scale: 1.2 }}
        style={{
          boxShadow: `0 4px 20px ${iconColor}40`,
        }}
      >
        {icon}
      </motion.div>
      
      {/* Content card */}
      <motion.div
        className={`
          relative ml-4 p-4 rounded-[20px]
          ${isPaper 
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200' 
            : 'bg-white/80 backdrop-blur-sm border border-white/50'
          }
          shadow-[0_4px_20px_rgba(0,0,0,0.05)]
        `}
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(255,107,0,0.1)' }}
      >
        {isPaper && (
          <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-amber-200/50 text-amber-700 rounded-full font-medium">
            📄 Archive
          </span>
        )}
        
        <h4 className="font-bold text-[#111]">{title}</h4>
        <p className="text-sm text-[#666] mt-1">{subtitle}</p>
        <p className="text-xs text-[#999] mt-2">{date}</p>
        
        {children}
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🔘 QUICK ACTION BUTTON - Bouton d'action rapide rond
// ═══════════════════════════════════════════════════════════════════

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: 'orange' | 'green' | 'blue' | 'pink' | 'yellow';
  onClick?: () => void;
}

export function QuickActionButton({
  icon,
  label,
  color,
  onClick,
}: QuickActionButtonProps) {
  const colors = {
    orange: 'from-[#FF6B00] to-[#FF3D00]',
    green: 'from-[#00E676] to-[#00BFA5]',
    blue: 'from-[#2196F3] to-[#1565C0]',
    pink: 'from-[#FF0080] to-[#FF3D7F]',
    yellow: 'from-[#FFD600] to-[#FF9100]',
  };
  
  const shadows = {
    orange: 'rgba(255,107,0,0.4)',
    green: 'rgba(0,230,118,0.4)',
    blue: 'rgba(33,150,243,0.4)',
    pink: 'rgba(255,0,128,0.4)',
    yellow: 'rgba(255,214,0,0.4)',
  };

  return (
    <motion.button
      className="flex flex-col items-center gap-2"
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        className={`
          w-16 h-16 rounded-2xl
          bg-gradient-to-br ${colors[color]}
          flex items-center justify-center
          text-white text-2xl
        `}
        style={{ boxShadow: `0 8px 24px ${shadows[color]}` }}
        whileHover={{
          boxShadow: `0 12px 32px ${shadows[color]}`,
        }}
      >
        {icon}
      </motion.div>
      <span className="text-xs font-medium text-[#666]">{label}</span>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🆘 EMERGENCY FAB - Bouton flottant d'urgence redesigné
// ═══════════════════════════════════════════════════════════════════

export function EmergencyFAB({ onClick }: { onClick?: () => void }) {
  return (
    <motion.button
      className="fixed bottom-6 right-6 z-40"
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
    >
      {/* Pulse rings */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#FF3D00]"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Button */}
      <motion.div
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#FF3D00] to-[#FF6B00] flex items-center justify-center shadow-[0_8px_32px_rgba(255,61,0,0.5)]"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-2xl">🆘</span>
      </motion.div>
    </motion.button>
  );
}

export default FlashyButton;
