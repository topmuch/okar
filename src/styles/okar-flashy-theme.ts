/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    OKAR FLASHY - GUIDE DE STYLE OFFICIEL                      ║
 * ║                    Version 2.0 - Mobile Client Experience                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * 💡 PHILOSOPHIE: "La JOIE au volant de votre voiture"
 * 🎯 OBJECTIF: Créer une expérience visuelle addictive et mémorable
 */

export const OKAR_FLASHY_THEME = {
  // ═══════════════════════════════════════════════════════════════════════
  // 🎨 PALETTE DE COULEURS PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════
  
  colors: {
    // === FONDS ===
    background: {
      primary: '#FFFFFF',      // Blanc pur
      secondary: '#F8F9FC',    // Gris très clair (nuage)
      tertiary: '#F0F4FF',     // Bleu très léger
      card: 'rgba(255, 255, 255, 0.85)', // Pour glassmorphism
    },
    
    // === TEXTE ===
    text: {
      primary: '#111111',      // Noir profond - contraste max
      secondary: '#444444',    // Gris foncé
      tertiary: '#888888',     // Gris moyen
      inverse: '#FFFFFF',      // Blanc pour fonds sombres
      accent: '#FF6B00',       // Orange pour highlights
    },
    
    // === DÉGRADÉS PRINCIPAUX ===
    gradients: {
      // Action Primaire - Orange Vif → Rose Fuchsia
      primary: {
        from: '#FF6B00',
        via: '#FF3D7F',
        to: '#FF0080',
        angle: '135deg',
        css: 'linear-gradient(135deg, #FF6B00 0%, #FF3D7F 50%, #FF0080 100%)',
      },
      
      // Succès - Vert Néon → Turquoise
      success: {
        from: '#00E676',
        via: '#00D4AA',
        to: '#00BFA5',
        angle: '135deg',
        css: 'linear-gradient(135deg, #00E676 0%, #00D4AA 50%, #00BFA5 100%)',
      },
      
      // Attention - Jaune Soleil → Orange Rouge
      warning: {
        from: '#FFD600',
        via: '#FF9100',
        to: '#FF3D00',
        angle: '135deg',
        css: 'linear-gradient(135deg, #FFD600 0%, #FF9100 50%, #FF3D00 100%)',
      },
      
      // Erreur - Rouge → Rose
      danger: {
        from: '#FF1744',
        via: '#FF0055',
        to: '#D500F9',
        angle: '135deg',
        css: 'linear-gradient(135deg, #FF1744 0%, #FF0055 50%, #D500F9 100%)',
      },
      
      // Info - Bleu Ciel → Violet
      info: {
        from: '#00B0FF',
        via: '#7C4DFF',
        to: '#AA00FF',
        angle: '135deg',
        css: 'linear-gradient(135deg, #00B0FF 0%, #7C4DFF 50%, #AA00FF 100%)',
      },
      
      // Mesh Background (animé)
      mesh: {
        colors: ['#FFE5B4', '#FFB6C1', '#E0BFFF', '#B4E7FF'],
        css: 'radial-gradient(at 40% 20%, hsla(35,100%,84%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(340,100%,85%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(265,100%,85%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(200,100%,85%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(35,100%,84%,1) 0px, transparent 50%)',
      },
    },
    
    // === COULEURS UNIES IMPORTANTES ===
    solid: {
      orange: '#FF6B00',
      pink: '#FF0080',
      green: '#00E676',
      turquoise: '#00BFA5',
      yellow: '#FFD600',
      red: '#FF1744',
      blue: '#00B0FF',
      purple: '#AA00FF',
      gold: '#FFD700',
    },
    
    // === OMBRES COLORÉES ===
    shadows: {
      orange: {
        color: 'rgba(255, 107, 0, 0.4)',
        css: '0 8px 32px rgba(255, 107, 0, 0.4)',
      },
      pink: {
        color: 'rgba(255, 0, 128, 0.4)',
        css: '0 8px 32px rgba(255, 0, 128, 0.4)',
      },
      green: {
        color: 'rgba(0, 230, 118, 0.4)',
        css: '0 8px 32px rgba(0, 230, 118, 0.4)',
      },
      blue: {
        color: 'rgba(0, 176, 255, 0.4)',
        css: '0 8px 32px rgba(0, 176, 255, 0.4)',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 📐 ESPACEMENTS ET TAILLES
  // ═══════════════════════════════════════════════════════════════════════
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
  },
  
  borderRadius: {
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    full: '9999px',
    hero: '0 0 48px 48px', // Pour header incurvé
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.25rem',    // 20px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '2.5rem',  // 40px
    hero: '3rem',     // 48px
    mega: '4rem',     // 64px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ✨ STYLES SPÉCIAUX
  // ═══════════════════════════════════════════════════════════════════════
  
  effects: {
    // Glassmorphism
    glass: {
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    },
    
    // Neumorphism Soft (boutons en relief)
    neumorphism: {
      light: {
        background: '#FFFFFF',
        boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.08), -8px -8px 16px rgba(255, 255, 255, 0.8)',
      },
      pressed: {
        background: '#F8F9FC',
        boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.06), inset -4px -4px 8px rgba(255, 255, 255, 0.6)',
      },
    },
    
    // Inner Glow (pour boutons)
    innerGlow: {
      green: 'inset 0 2px 20px rgba(0, 230, 118, 0.5)',
      orange: 'inset 0 2px 20px rgba(255, 107, 0, 0.5)',
    },
    
    // Ombre portée sous éléments flottants
    floatingShadow: {
      light: '0 20px 60px rgba(0, 0, 0, 0.1)',
      medium: '0 30px 80px rgba(0, 0, 0, 0.15)',
      strong: '0 40px 100px rgba(0, 0, 0, 0.2)',
    },
    
    // Bordure gradient
    gradientBorder: {
      css: 'background: linear-gradient(white, white) padding-box, linear-gradient(135deg, #FF6B00, #FF0080) border-box',
      border: '2px solid transparent',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🎬 ANIMATIONS (Durées et Easing)
  // ═══════════════════════════════════════════════════════════════════════
  
  animation: {
    duration: {
      instant: '0.1s',
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s',
      slower: '0.8s',
      dramatic: '1.2s',
    },
    
    easing: {
      // Spring-like
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      bounceIn: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      
      // Smooth
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smoothOut: 'cubic-bezier(0, 0, 0.2, 1)',
      smoothIn: 'cubic-bezier(0.4, 0, 1, 1)',
      
      // Elastic
      elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      
      // Dramatic
      dramatic: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
    
    // Spring configs for Framer Motion
    spring: {
      bounce: { type: 'spring', stiffness: 400, damping: 10 },
      gentle: { type: 'spring', stiffness: 200, damping: 20 },
      snappy: { type: 'spring', stiffness: 500, damping: 30 },
      wobbly: { type: 'spring', stiffness: 180, damping: 12 },
      stiff: { type: 'spring', stiffness: 600, damping: 35 },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🏷️ BADGES ET SCORES
  // ═══════════════════════════════════════════════════════════════════════
  
  scoreColors: {
    // Score OKAR (0-100)
    excellent: { range: [80, 100], color: '#00E676', gradient: 'linear-gradient(135deg, #00E676, #00BFA5)' },
    good: { range: [60, 79], color: '#76FF03', gradient: 'linear-gradient(135deg, #76FF03, #64DD17)' },
    average: { range: [40, 59], color: '#FFD600', gradient: 'linear-gradient(135deg, #FFD600, #FF9100)' },
    poor: { range: [20, 39], color: '#FF9100', gradient: 'linear-gradient(135deg, #FF9100, #FF3D00)' },
    critical: { range: [0, 19], color: '#FF1744', gradient: 'linear-gradient(135deg, #FF1744, #D500F9)' },
  },
  
  badges: {
    gold: {
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 50%, #FFD700 100%)',
      border: '2px solid #FFD700',
      shadow: '0 4px 20px rgba(255, 215, 0, 0.5)',
    },
    silver: {
      background: 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 50%, #E0E0E0 100%)',
      border: '2px solid #BDBDBD',
      shadow: '0 4px 20px rgba(189, 189, 189, 0.5)',
    },
    bronze: {
      background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 50%, #CD7F32 100%)',
      border: '2px solid #CD7F32',
      shadow: '0 4px 20px rgba(205, 127, 50, 0.5)',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// 📱 BREAKPOINTS MOBILE-FIRST
// ═══════════════════════════════════════════════════════════════════════

export const breakpoints = {
  xs: '320px',   // iPhone SE
  sm: '375px',   // iPhone standard
  md: '414px',   // iPhone Plus
  lg: '768px',   // Tablet
  xl: '1024px',  // Tablet landscape
  '2xl': '1280px', // Desktop
};

// ═══════════════════════════════════════════════════════════════════════
// 🎵 HAPTIC FEEDBACK CONFIG
// ═══════════════════════════════════════════════════════════════════════

export const hapticPatterns = {
  light: 'lightImpact',
  medium: 'mediumImpact',
  heavy: 'heavyImpact',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
  selection: 'selection',
};

// ═══════════════════════════════════════════════════════════════════════
// 🎨 CLASSES CSS PRÊTES À L'EMPLOI
// ═══════════════════════════════════════════════════════════════════════

export const cssClasses = {
  // Container principal
  container: 'min-h-screen bg-white',
  
  // Header avec dégradé
  headerGradient: 'bg-gradient-to-br from-[#FF6B00] via-[#FF3D7F] to-[#FF0080]',
  
  // Carte glassmorphism
  glassCard: 'backdrop-blur-xl bg-white/75 border border-white/50 rounded-3xl shadow-lg',
  
  // Bouton principal flashy
  primaryButton: `
    px-8 py-4 rounded-full 
    bg-gradient-to-r from-[#FF6B00] via-[#FF3D7F] to-[#FF0080]
    text-white font-bold text-lg
    shadow-[0_8px_32px_rgba(255,107,0,0.4)]
    hover:shadow-[0_12px_40px_rgba(255,107,0,0.5)]
    active:scale-95
    transition-all duration-300
  `,
  
  // Bouton succès
  successButton: `
    px-8 py-4 rounded-full 
    bg-gradient-to-r from-[#00E676] via-[#00D4AA] to-[#00BFA5]
    text-white font-bold text-lg
    shadow-[0_8px_32px_rgba(0,230,118,0.4)]
    hover:shadow-[0_12px_40px_rgba(0,230,118,0.5)]
    active:scale-95
    transition-all duration-300
  `,
  
  // Texte gradient
  gradientText: 'bg-gradient-to-r from-[#FF6B00] to-[#FF0080] bg-clip-text text-transparent',
  
  // Ombre colorée
  coloredShadow: 'shadow-[0_20px_60px_rgba(255,107,0,0.25)]',
};

export default OKAR_FLASHY_THEME;
