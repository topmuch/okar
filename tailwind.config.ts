import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        // ===== WAHOU MULTICOLOR PALETTE =====
        'orange-electrique': '#FF6B00',
        'rose-fuchsia': '#FF0080',
        'jaune-soleil': '#FFD700',
        'bleu-cyan': '#00E5FF',
        'violet-profond': '#6200EA',
        'vert-menthe': '#00E676',
        'noir-profond': '#111111',
        
        // Legacy support
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#FF6B00',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#FF0080',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        accent: {
          cyan: '#00E5FF',
          yellow: '#FFD700',
          violet: '#6200EA',
          green: '#00E676',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255, 107, 0, 0.3)',
        'glow-pink': '0 0 20px rgba(255, 0, 128, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.3)',
        'glow-yellow': '0 0 20px rgba(255, 215, 0, 0.3)',
        'hard-orange': '4px 4px 0 0 #FF6B00',
        'hard-pink': '4px 4px 0 0 #FF0080',
        'hard-cyan': '4px 4px 0 0 #00E5FF',
        'hard-yellow': '4px 4px 0 0 #FFD700',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
