'use client';

import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { forwardRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { OKAR_FLASHY_THEME } from '@/styles/okar-flashy-theme';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 FLASHY BUTTON - Boutton avec effets WOW
// ═══════════════════════════════════════════════════════════════════════════════

type ButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'glass' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'mega';

interface FlashyButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  glow?: boolean;
  pulse?: boolean;
  haptic?: boolean;
  celebrationOnClick?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `bg-gradient-to-r from-[#FF6B00] via-[#FF3D7F] to-[#FF0080] text-white shadow-[0_8px_32px_rgba(255,107,0,0.4)]`,
  success: `bg-gradient-to-r from-[#00E676] via-[#00D4AA] to-[#00BFA5] text-white shadow-[0_8px_32px_rgba(0,230,118,0.4)]`,
  warning: `bg-gradient-to-r from-[#FFD600] via-[#FF9100] to-[#FF3D00] text-white shadow-[0_8px_32px_rgba(255,214,0,0.4)]`,
  danger: `bg-gradient-to-r from-[#FF1744] via-[#FF0055] to-[#D500F9] text-white shadow-[0_8px_32px_rgba(255,23,68,0.4)]`,
  info: `bg-gradient-to-r from-[#00B0FF] via-[#7C4DFF] to-[#AA00FF] text-white shadow-[0_8px_32px_rgba(0,176,255,0.4)]`,
  glass: `backdrop-blur-xl bg-white/75 border border-white/50 text-gray-800 shadow-lg`,
  outline: `bg-transparent border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/10`,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
  xl: 'px-10 py-5 text-xl rounded-3xl',
  mega: 'px-12 py-6 text-2xl rounded-3xl w-full',
};

const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  },
  tap: { 
    scale: 0.96,
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  },
  glow: {
    boxShadow: [
      '0 8px 32px rgba(255, 107, 0, 0.4)',
      '0 12px 48px rgba(255, 107, 0, 0.6)',
      '0 8px 32px rgba(255, 107, 0, 0.4)',
    ],
    transition: { duration: 1.5, repeat: Infinity }
  }
};

export const FlashyButton = forwardRef<HTMLButtonElement, FlashyButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'lg',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    glow = false,
    pulse = false,
    haptic = true,
    className = '',
    disabled,
    ...props
  }, ref) => {
    
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic feedback (si disponible)
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      props.onClick?.(e);
    }, [haptic, props]);

    return (
      <motion.button
        ref={ref}
        className={`
          relative overflow-hidden font-bold
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          transition-all duration-200
          flex items-center justify-center gap-3
          ${className}
        `}
        variants={buttonVariants}
        initial="initial"
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        animate={glow && !disabled ? "glow" : undefined}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
        
        {/* Content */}
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <span className="relative z-10">{children}</span>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
        
        {/* Pulse ring */}
        {pulse && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-inherit pointer-events-none"
            style={{ 
              borderRadius: 'inherit',
              border: '2px solid currentColor'
            }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>
    );
  }
);

FlashyButton.displayName = 'FlashyButton';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 FLASHY ICON BUTTON - Bouton rond avec icône
// ═══════════════════════════════════════════════════════════════════════════════

interface FlashyIconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  badge?: number;
  pulse?: boolean;
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
  mega: 'w-20 h-20',
};

export const FlashyIconButton = forwardRef<HTMLButtonElement, FlashyIconButtonProps>(
  ({ icon, variant = 'primary', size = 'lg', label, badge, pulse, className, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={`
          relative flex items-center justify-center rounded-full
          ${variantStyles[variant]}
          ${iconSizeStyles[size]}
          ${className}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        aria-label={label}
        {...props}
      >
        {icon}
        
        {/* Badge */}
        {badge && badge > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5
                       bg-red-500 text-white text-xs font-bold
                       rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {badge}
          </motion.span>
        )}
        
        {/* Pulse effect */}
        {pulse && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ 
              border: '2px solid currentColor',
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>
    );
  }
);

FlashyIconButton.displayName = 'FlashyIconButton';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎈 FLOATING ACTION BUTTON (FAB)
// ═══════════════════════════════════════════════════════════════════════════════

interface FabProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  label: string;
  color?: 'orange' | 'red' | 'green' | 'blue';
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  expanded?: boolean;
  children?: React.ReactNode;
}

export const FlashyFab = forwardRef<HTMLButtonElement, FabProps>(
  ({ icon, label, color = 'orange', position = 'bottom-right', expanded, children, className, ...props }, ref) => {
    
    const colorStyles = {
      orange: 'from-[#FF6B00] to-[#FF0080] shadow-[0_8px_32px_rgba(255,107,0,0.5)]',
      red: 'from-[#FF1744] to-[#D500F9] shadow-[0_8px_32px_rgba(255,23,68,0.5)]',
      green: 'from-[#00E676] to-[#00BFA5] shadow-[0_8px_32px_rgba(0,230,118,0.5)]',
      blue: 'from-[#00B0FF] to-[#AA00FF] shadow-[0_8px_32px_rgba(0,176,255,0.5)]',
    };
    
    const positionStyles = {
      'bottom-right': 'bottom-24 right-6',
      'bottom-center': 'bottom-24 left-1/2 -translate-x-1/2',
      'bottom-left': 'bottom-24 left-6',
    };

    return (
      <motion.button
        ref={ref}
        className={`
          fixed z-50
          w-16 h-16 rounded-full
          bg-gradient-to-br ${colorStyles[color]}
          text-white shadow-2xl
          flex items-center justify-center
          ${positionStyles[position]}
          ${className}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={expanded ? { rotate: 45 } : { rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        aria-label={label}
        {...props}
      >
        {/* Pulse background */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/30"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <span className="relative z-10">{icon}</span>
      </motion.button>
    );
  }
);

FlashyFab.displayName = 'FlashyFab';

export default FlashyButton;
