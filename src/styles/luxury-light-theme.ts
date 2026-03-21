/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║              OKAR LUXURY LIGHT - GUIDE DE STYLE OFFICIEL                      ║
 * ║              Version 3.0 - "Wahoo Effects" Landing Page                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * 💡 PHILOSOPHIE: "Lumière, Mouvement, Émotion"
 * 🎯 OBJECTIF: Créer une expérience visuelle "Wahoo" en mode 100% lumineux
 */

export const OKAR_LUXURY_LIGHT = {
  // ═══════════════════════════════════════════════════════════════════════
  // 🎨 PALETTE DE COULEURS "FLASHY LUXE"
  // ═══════════════════════════════════════════════════════════════════════
  
  colors: {
    // === FONDS LUMINEUX ===
    background: {
      primary: '#FFFFFF',       // Blanc Porcelaine
      secondary: '#F8F9FC',     // Gris très clair
      tertiary: '#FFF8F0',      // Crème subtil
      accent: '#FFF0F5',        // Rose poudré très clair
    },
    
    // === TEXTE ===
    text: {
      primary: '#1A1A1A',       // Noir Charbon - contraste max
      secondary: '#333333',     // Gris foncé
      tertiary: '#666666',      // Gris moyen (éviter sur fond clair)
      inverse: '#FFFFFF',       // Blanc pour fonds colorés
    },
    
    // === DÉGRADÉ "SUNSET GOLD" ===
    gradients: {
      // Primaire - Sunset Gold (boutons, titres clés)
      sunsetGold: {
        from: '#FF9900',
        via: '#FFD700',
        to: '#FF007F',
        angle: '135deg',
        css: 'linear-gradient(135deg, #FF9900 0%, #FFD700 50%, #FF007F 100%)',
        animated: 'linear-gradient(270deg, #FF9900, #FFD700, #FF007F, #FFD700, #FF9900)',
      },
      
      // CTA Principal - Orange Vif → Rose
      primary: {
        from: '#FF9900',
        to: '#FF007F',
        css: 'linear-gradient(135deg, #FF9900 0%, #FF007F 100%)',
      },
      
      // Confiance/Tech - Bleu Électrique Doux
      trust: {
        from: '#4facfe',
        to: '#00f2fe',
        css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      },
      
      // Footer vibrant - Orange → Rose → Violet
      footer: {
        from: '#FF9900',
        via: '#FF007F',
        to: '#8B5CF6',
        css: 'linear-gradient(90deg, #FF9900 0%, #FF007F 50%, #8B5CF6 100%)',
      },
      
      // Mesh Background (animé)
      mesh: {
        colors: ['#FFFFFF', '#FFF8F0', '#FFF0F5', '#F0F8FF'],
        css: `
          radial-gradient(at 40% 20%, rgba(255, 248, 240, 0.8) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(255, 240, 245, 0.6) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(240, 248, 255, 0.5) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(255, 248, 240, 0.4) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(255, 240, 245, 0.6) 0px, transparent 50%)
        `,
      },
      
      // Titre animé
      textAnimated: {
        css: 'linear-gradient(90deg, #FF9900, #FFD700, #FF007F, #FFD700, #FF9900)',
        backgroundSize: '200% auto',
      },
    },
    
    // === COULEURS UNIES ===
    solid: {
      orange: '#FF9900',
      gold: '#FFD700',
      magenta: '#FF007F',
      electricBlue: '#4facfe',
      lemonNeon: '#FAFF00',
      white: '#FFFFFF',
      charcoal: '#1A1A1A',
    },
    
    // === OMBRES COLORÉES ===
    shadows: {
      orange: {
        light: '0 4px 20px rgba(255, 153, 0, 0.25)',
        medium: '0 8px 40px rgba(255, 153, 0, 0.35)',
        strong: '0 16px 60px rgba(255, 153, 0, 0.45)',
      },
      pink: {
        light: '0 4px 20px rgba(255, 0, 127, 0.2)',
        medium: '0 8px 40px rgba(255, 0, 127, 0.3)',
      },
      blue: {
        light: '0 4px 20px rgba(79, 172, 254, 0.25)',
      },
      white: {
        soft: '0 8px 32px rgba(0, 0, 0, 0.08)',
        medium: '0 16px 48px rgba(0, 0, 0, 0.12)',
        strong: '0 24px 64px rgba(0, 0, 0, 0.16)',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ✨ EFFETS SPÉCIAUX
  // ═══════════════════════════════════════════════════════════════════════
  
  effects: {
    // Glassmorphism Lumineux
    glassCard: {
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.9)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)',
      borderRadius: '24px',
    },
    
    // Bouton Glow
    buttonGlow: {
      orange: '0 0 40px rgba(255, 153, 0, 0.4), 0 0 80px rgba(255, 153, 0, 0.2)',
      pink: '0 0 40px rgba(255, 0, 127, 0.4), 0 0 80px rgba(255, 0, 127, 0.2)',
    },
    
    // Flottement
    floating: {
      animation: 'float 6s ease-in-out infinite',
      keyframes: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
      `,
    },
    
    // Parallaxe cartes
    parallax: {
      perspective: '1000px',
      transformStyle: 'preserve-3d',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🎬 ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════
  
  animation: {
    // Durées
    duration: {
      instant: '0.1s',
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s',
      dramatic: '0.8s',
      cinematic: '1.2s',
    },
    
    // Easing
    easing: {
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      dramatic: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
    
    // Framer Motion configs
    spring: {
      bounce: { type: 'spring', stiffness: 400, damping: 10 },
      gentle: { type: 'spring', stiffness: 200, damping: 20 },
      snappy: { type: 'spring', stiffness: 500, damping: 30 },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 📐 SPACING & RADIUS
  // ═══════════════════════════════════════════════════════════════════════
  
  spacing: {
    section: '120px',
    container: 'max-w-7xl',
    cardPadding: '32px',
  },
  
  borderRadius: {
    card: '24px',
    button: '9999px',
    input: '16px',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// 🎨 CSS CLASSES PRÊTES À L'EMPLOI
// ═══════════════════════════════════════════════════════════════════════

export const luxuryClasses = {
  // Container principal
  pageContainer: 'min-h-screen bg-white overflow-x-hidden',
  
  // Mesh gradient animé
  meshBackground: `
    fixed inset-0 -z-10
    bg-white
    before:absolute before:inset-0 before:opacity-80
    before:bg-[radial-gradient(at_40%_20%,rgba(255,248,240,0.8)_0px,transparent_50%),radial-gradient(at_80%_0%,rgba(255,240,245,0.6)_0px,transparent_50%),radial-gradient(at_0%_50%,rgba(240,248,255,0.5)_0px,transparent_50%),radial-gradient(at_80%_50%,rgba(255,248,240,0.4)_0px,transparent_50%),radial-gradient(at_0%_100%,rgba(255,240,245,0.6)_0px,transparent_50%)]
  `,
  
  // Bouton Wahoo principal
  wahooButton: `
    relative px-8 py-4 rounded-full
    bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F]
    bg-[length:200%_100%] animate-gradient-shift
    text-white font-bold text-lg
    shadow-[0_8px_32px_rgba(255,153,0,0.35)]
    hover:shadow-[0_12px_48px_rgba(255,153,0,0.5)]
    hover:scale-105
    active:scale-95
    transition-all duration-300
    overflow-hidden
    before:absolute before:inset-0 before:bg-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity
  `,
  
  // Bouton secondaire doré
  secondaryButton: `
    px-8 py-4 rounded-full
    bg-white
    border-2 border-[#FFD700]
    text-[#1A1A1A] font-semibold text-lg
    hover:bg-gradient-to-r hover:from-[#FFD700] hover:to-[#FF9900] hover:text-white
    hover:shadow-[0_8px_32px_rgba(255,215,0,0.3)]
    transition-all duration-300
  `,
  
  // Carte Glassmorphism
  glassCard: `
    backdrop-blur-xl bg-white/85
    border border-white/90
    rounded-3xl
    shadow-[0_8px_32px_rgba(0,0,0,0.08)]
    hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]
    transition-all duration-500
  `,
  
  // Texte gradient animé
  gradientText: `
    bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F]
    bg-[length:200%_auto]
    bg-clip-text text-transparent
    animate-text-shimmer
  `,
  
  // Titre Hero
  heroTitle: `
    text-4xl md:text-5xl lg:text-6xl xl:text-7xl
    font-black
    leading-tight tracking-tight
    bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F]
    bg-[length:200%_auto]
    bg-clip-text text-transparent
    animate-text-shimmer
  `,
};

export default OKAR_LUXURY_LIGHT;
