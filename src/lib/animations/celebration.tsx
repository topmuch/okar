'use client';

import { useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎊 CONFETTI CELEBRATION - Effet de confettis
// ═══════════════════════════════════════════════════════════════════════════════

export type ConfettiType = 
  | 'celebration'    // Explosion complète
  | 'success'        // Confettis verts
  | 'stars'          // Étoiles dorées
  | 'fireworks'      // Feux d'artifice
  | 'side-cannons'   // Canons latéraux
  | 'snow'           // Neige / flocons
  | 'confetti-rain'; // Pluie de confettis

interface ConfettiOptions {
  duration?: number;
  particleCount?: number;
  spread?: number;
  colors?: string[];
  origin?: { x: number; y: number };
}

const defaultColors = {
  celebration: ['#FF6B00', '#FF0080', '#00E676', '#FFD600', '#00B0FF', '#AA00FF'],
  success: ['#00E676', '#00D4AA', '#00BFA5', '#76FF03', '#64DD17'],
  stars: ['#FFD700', '#FFA000', '#FFD700', '#FFECB3'],
  fireworks: ['#FF1744', '#FF6B00', '#FFD600', '#00E676', '#00B0FF', '#AA00FF'],
};

export const triggerConfetti = (
  type: ConfettiType = 'celebration',
  options: ConfettiOptions = {}
) => {
  const {
    duration = 3000,
    particleCount = 100,
    spread = 70,
    colors = defaultColors[type as keyof typeof defaultColors] || defaultColors.celebration,
    origin = { x: 0.5, y: 0.6 },
  } = options;

  switch (type) {
    case 'celebration':
      // Double explosion from center
      confetti({
        particleCount,
        spread,
        origin,
        colors,
        duration,
        zIndex: 9999,
      });
      setTimeout(() => {
        confetti({
          particleCount: particleCount / 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors,
        });
        confetti({
          particleCount: particleCount / 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors,
        });
      }, 250);
      break;

    case 'success':
      // Green confetti burst
      confetti({
        particleCount: particleCount * 1.5,
        spread: 100,
        origin: { x: 0.5, y: 0.7 },
        colors,
        ticks: 200,
        gravity: 0.8,
      });
      break;

    case 'stars':
      // Golden stars burst
      confetti({
        particleCount: particleCount / 2,
        spread,
        origin,
        colors,
        shapes: ['star'],
        scalar: 1.5,
      });
      break;

    case 'fireworks':
      // Multiple firework bursts
      const durationMs = duration;
      const animationEnd = Date.now() + durationMs;
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        confetti({
          particleCount: 40,
          startVelocity: 20,
          spread: 360,
          origin: {
            x: Math.random(),
            y: Math.random() * 0.5,
          },
          colors,
        });
      }, 200);
      break;

    case 'side-cannons':
      // Side cannons
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
      break;

    case 'snow':
      // Snow / falling particles
      const snowDuration = duration;
      const snowEnd = Date.now() + snowDuration;
      const snowFrame = () => {
        confetti({
          particleCount: 1,
          startVelocity: 0,
          ticks: 200,
          gravity: 0.3,
          origin: {
            x: Math.random(),
            y: 0,
          },
          colors: ['#ffffff', '#f0f0f0'],
          shapes: ['circle'],
          scalar: 0.5,
        });
        if (Date.now() < snowEnd) {
          requestAnimationFrame(snowFrame);
        }
      };
      snowFrame();
      break;

    case 'confetti-rain':
      // Rain from top
      const rainDuration = duration;
      const rainEnd = Date.now() + rainDuration;
      const rainFrame = () => {
        confetti({
          particleCount: 3,
          startVelocity: 0,
          ticks: 300,
          gravity: 0.5,
          origin: {
            x: Math.random(),
            y: 0,
          },
          colors,
        });
        if (Date.now() < rainEnd) {
          requestAnimationFrame(rainFrame);
        }
      };
      rainFrame();
      break;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎉 CELEBRATION COMPONENT - Composant React pour célébrations
// ═══════════════════════════════════════════════════════════════════════════════

interface CelebrationProps {
  trigger: boolean;
  type?: ConfettiType;
  onComplete?: () => void;
  haptic?: boolean;
}

export const Celebration: React.FC<CelebrationProps> = ({
  trigger,
  type = 'celebration',
  onComplete,
  haptic = true,
}) => {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      
      // Haptic feedback
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate([50, 30, 100]);
      }
      
      // Trigger confetti
      triggerConfetti(type);
      
      // Reset after animation
      setTimeout(() => {
        hasTriggered.current = false;
        onComplete?.();
      }, 3000);
    }
  }, [trigger, type, haptic, onComplete]);

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ SUCCESS BUTTON - Bouton qui se transforme en succès
// ═══════════════════════════════════════════════════════════════════════════════

import { Check, Loader2 } from 'lucide-react';

interface SuccessButtonProps {
  loading: boolean;
  success: boolean;
  onClick: () => void;
  loadingText?: string;
  successText?: string;
  defaultText?: string;
  onCelebration?: () => void;
}

const buttonVariants: Variants = {
  default: {
    scale: 1,
    borderRadius: '24px',
  },
  loading: {
    scale: 1,
  },
  success: {
    scale: [1, 1.1, 1],
    borderRadius: '50%',
    transition: { duration: 0.5 }
  }
};

const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: { type: 'spring', stiffness: 500, damping: 15 }
  }
};

export const SuccessButton: React.FC<SuccessButtonProps> = ({
  loading,
  success,
  onClick,
  loadingText = 'Chargement...',
  successText = 'Succès !',
  defaultText = 'Valider',
  onCelebration,
}) => {
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (success && !hasCelebrated.current) {
      hasCelebrated.current = true;
      triggerConfetti('success');
      onCelebration?.();
    }
  }, [success, onCelebration]);

  return (
    <motion.button
      className="relative w-full overflow-hidden font-bold text-lg text-white"
      variants={buttonVariants}
      animate={success ? 'success' : loading ? 'loading' : 'default'}
      onClick={onClick}
      disabled={loading || success}
      whileHover={!loading && !success ? { scale: 1.02 } : undefined}
      whileTap={!loading && !success ? { scale: 0.98 } : undefined}
      style={{
        background: success
          ? 'linear-gradient(135deg, #00E676, #00BFA5)'
          : 'linear-gradient(135deg, #FF6B00, #FF0080)',
        boxShadow: success
          ? '0 8px 32px rgba(0, 230, 118, 0.5)'
          : '0 8px 32px rgba(255, 107, 0, 0.4)',
        padding: success ? '20px' : '20px 32px',
      }}
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center"
          >
            <Check className="w-8 h-8" />
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{loadingText}</span>
          </motion.div>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {defaultText}
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Inner glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: success
            ? 'inset 0 2px 20px rgba(0, 230, 118, 0.5)'
            : 'inset 0 2px 20px rgba(255, 107, 0, 0.5)',
        }}
      />
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌈 MESH GRADIENT BACKGROUND - Fond animé avec dégradé mesh
// ═══════════════════════════════════════════════════════════════════════════════

interface MeshGradientProps {
  className?: string;
  animated?: boolean;
  colors?: string[];
}

export const MeshGradient: React.FC<MeshGradientProps> = ({
  className = '',
  animated = true,
  colors = ['#FFE5B4', '#FFB6C1', '#E0BFFF', '#B4E7FF', '#FFB6E1'],
}) => {
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Base white background */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Animated blobs */}
      {colors.map((color, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full blur-3xl opacity-60"
          style={{
            background: color,
            width: '150%',
            height: '150%',
          }}
          animate={animated ? {
            x: [
              `${-50 + index * 30}%`,
              `${-30 + index * 20}%`,
              `${-50 + index * 30}%`,
            ],
            y: [
              `${-30 + index * 20}%`,
              `${-50 + index * 30}%`,
              `${-30 + index * 20}%`,
            ],
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          } : undefined}
          transition={{
            duration: 20 + index * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔔 HAPTIC FEEDBACK HELPER
// ═══════════════════════════════════════════════════════════════════════════════

export const haptic = {
  light: () => 'vibrate' in navigator && navigator.vibrate(10),
  medium: () => 'vibrate' in navigator && navigator.vibrate(20),
  heavy: () => 'vibrate' in navigator && navigator.vibrate(30),
  success: () => 'vibrate' in navigator && navigator.vibrate([10, 30, 50]),
  error: () => 'vibrate' in navigator && navigator.vibrate([50, 20, 50, 20, 50]),
  selection: () => 'vibrate' in navigator && navigator.vibrate(5),
};

export default triggerConfetti;
