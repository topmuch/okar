'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Shield, 
  Car, 
  Wrench, 
  Handshake, 
  QrCode, 
  ChevronRight, 
  Play,
  CheckCircle2,
  Star,
  Users,
  Building2,
  Sparkles,
  Menu,
  X,
  Smartphone,
  ArrowRight,
  Zap,
  Award,
  Lock
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 LUXURY LIGHT CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  // Gradients
  sunsetGold: 'from-[#FF9900] via-[#FFD700] to-[#FF007F]',
  trust: 'from-[#4facfe] to-[#00f2fe]',
  footer: 'from-[#FF9900] via-[#FF007F] to-[#8B5CF6]',
  
  // Text
  charcoal: '#1A1A1A',
  grayDark: '#333333',
  
  // Backgrounds
  white: '#FFFFFF',
  cream: '#FFF8F0',
  pinkPowder: '#FFF0F5',
};

const ANIMATIONS = {
  springBounce: { type: 'spring', stiffness: 400, damping: 15 } as const,
  springGentle: { type: 'spring', stiffness: 200, damping: 25 } as const,
  easeOut: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧭 NAVIGATION - Light Glassmorphism
// ═══════════════════════════════════════════════════════════════════════════════

function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#confiance', label: 'Pourquoi OKAR' },
    { href: '#demo', label: 'Comment ça marche' },
    { href: '#qui', label: 'Pour qui' },
    { href: '/devenir-partenaire', label: 'Devenir Partenaire' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9900] via-[#FFD700] to-[#FF007F] flex items-center justify-center shadow-lg shadow-orange-500/25"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <QrCode className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-black bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
                OKAR
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF9900] to-[#FF007F] group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/garage/connexion">
                <motion.button 
                  className="px-5 py-2.5 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Connexion
                </motion.button>
              </Link>
              <Link href="/inscrire">
                <motion.button 
                  className="relative px-6 py-3 rounded-full bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-[length:200%_100%] animate-gradient-shift text-white font-bold shadow-lg shadow-orange-500/30 overflow-hidden group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">S&apos;inscrire</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </motion.button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden text-gray-800 p-2 rounded-xl bg-white/80 backdrop-blur"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden pt-24"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xl text-gray-700 hover:text-gray-900 transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex flex-col gap-4 mt-8 w-full max-w-xs">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <motion.button 
                    className="w-full px-6 py-3 border-2 border-gray-200 rounded-full text-gray-800 font-semibold"
                    whileTap={{ scale: 0.98 }}
                  >
                    Connexion
                  </motion.button>
                </Link>
                <Link href="/inscrire" onClick={() => setIsMobileMenuOpen(false)}>
                  <motion.button 
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#FF9900] to-[#FF007F] rounded-full text-white font-bold shadow-lg"
                    whileTap={{ scale: 0.98 }}
                  >
                    S&apos;inscrire
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ ANIMATED BACKGROUND - Mesh Gradient + Blobs
// ═══════════════════════════════════════════════════════════════════════════════

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base white */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Animated Mesh Gradient */}
      <div className="absolute inset-0 opacity-80">
        {/* Blob 1 - Orange */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(255,153,0,0.4) 0%, transparent 70%)' }}
          animate={{
            x: [0, 100, 50, 0],
            y: [0, 50, 100, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Blob 2 - Pink */}
        <motion.div
          className="absolute right-0 top-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(255,0,127,0.4) 0%, transparent 70%)' }}
          animate={{
            x: [0, -80, -40, 0],
            y: [0, 80, 40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        
        {/* Blob 3 - Gold */}
        <motion.div
          className="absolute left-1/4 bottom-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 70%)' }}
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -60, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
        
        {/* Blob 4 - Blue Trust */}
        <motion.div
          className="absolute right-1/4 top-0 w-[300px] h-[300px] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(79,172,254,0.4) 0%, transparent 70%)' }}
          animate={{
            x: [0, -40, 20, 0],
            y: [0, 60, 30, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        />
      </div>
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚗 FLOATING CAR + QR - Hero Visual
// ═══════════════════════════════════════════════════════════════════════════════

function FloatingCarVisual() {
  return (
    <div className="relative w-full h-[500px] lg:h-[600px]">
      {/* Golden Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i % 2 === 0 ? '#FFD700' : '#FF9900',
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            boxShadow: `0 0 ${10 + Math.random() * 10}px ${i % 2 === 0 ? 'rgba(255,215,0,0.5)' : 'rgba(255,153,0,0.5)'}`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Data Flow Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
        {[...Array(5)].map((_, i) => (
          <motion.path
            key={i}
            d={`M${50 + i * 70},400 Q${100 + i * 60},${200 - i * 20} ${350 - i * 20},${50 + i * 30}`}
            fill="none"
            stroke={`url(#lineGradient${i})`}
            strokeWidth="2"
            strokeDasharray="8 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, repeatType: 'reverse' }}
          />
        ))}
        <defs>
          {[0, 1, 2, 3, 4].map(i => (
            <linearGradient key={`lineGradient${i}`} id={`lineGradient${i}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF9900" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF007F" stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
      </svg>
      
      {/* Main Car Image - Floating */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          y: [0, -20, 0],
          rotateY: [0, 5, 0, -5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Car Glow Shadow */}
        <div 
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 blur-2xl opacity-40"
          style={{ background: 'linear-gradient(90deg, #FF9900, #FF007F)' }}
        />
        
        {/* Car Container */}
        <div className="relative w-80 h-48 lg:w-[450px] lg:h-64">
          <Image
            src="/hero-car-luxury.png"
            alt="Luxury Vehicle - OKAR Passport"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>
      </motion.div>
      
      {/* Floating QR Code - Golden */}
      <motion.div
        className="absolute right-0 top-1/4 lg:right-10"
        animate={{
          y: [0, -15, 0],
          rotateY: [0, 360],
        }}
        transition={{
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          rotateY: { duration: 20, repeat: Infinity, ease: 'linear' },
        }}
      >
        <div className="relative">
          {/* QR Glow */}
          <div 
            className="absolute -inset-4 rounded-3xl blur-2xl opacity-50"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
          />
          
          {/* QR Card with generated image */}
          <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/30">
            <Image
              src="/hero-qr-gold.png"
              alt="OKAR Golden QR Code"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🦸 HERO SECTION - The Wow Effect
// ═══════════════════════════════════════════════════════════════════════════════

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden pt-20">
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <motion.div style={{ opacity }} className="text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 mb-8"
              >
                <Sparkles className="w-4 h-4 text-[#FF9900]" />
                <span className="text-sm font-semibold text-gray-700">Le futur de l&apos;automobile commence ici</span>
              </motion.div>
              
              {/* Main Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight tracking-tight mb-6"
              >
                <span className="text-[#1A1A1A]">L&apos;Histoire</span>
                <br />
                <span className="bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent bg-[length:200%_auto] animate-text-shimmer">
                  Réelle
                </span>
                <span className="text-[#1A1A1A]"> de</span>
                <br />
                <span className="text-[#1A1A1A]">Votre Voiture.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-10"
              >
                Le premier passeport numérique certifié, transparent et luxueux. 
                Protégez votre véhicule avec la technologie de confiance.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                {/* Primary CTA */}
                <Link href="/scan">
                  <motion.button
                    className="group relative px-8 py-4 rounded-full overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-[length:200%_100%] animate-gradient-shift" />
                    {/* Glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/20" />
                    {/* Content */}
                    <span className="relative flex items-center justify-center gap-2 text-white font-bold text-lg">
                      <QrCode className="w-5 h-5" />
                      Scanner un Véhicule
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </Link>

                {/* Secondary CTA */}
                <Link href="/devenir-partenaire">
                  <motion.button
                    className="group px-8 py-4 rounded-full border-2 border-[#FFD700] bg-white hover:bg-gradient-to-r hover:from-[#FFD700] hover:to-[#FF9900] transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex items-center justify-center gap-2 text-gray-800 group-hover:text-white font-semibold transition-colors">
                      <Building2 className="w-5 h-5" />
                      Devenir Partenaire
                    </span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="mt-12 flex items-center justify-center lg:justify-start gap-6 md:gap-8"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9900] to-[#FF007F] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-800">500+</p>
                    <p className="text-xs text-gray-500">garages</p>
                  </div>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-800">2000+</p>
                    <p className="text-xs text-gray-500">véhicules</p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-200" />
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-800">4.9/5</p>
                    <p className="text-xs text-gray-500">note</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Visual */}
            <motion.div style={{ y }} className="hidden lg:block">
              <FloatingCarVisual />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-8 h-14 rounded-full border-2 border-gray-300 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-3 bg-gradient-to-b from-[#FF9900] to-[#FF007F] rounded-full"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TRUST SECTION - Floating Glass Cards
// ═══════════════════════════════════════════════════════════════════════════════

function TrustSection() {
  const cards = [
    {
      icon: Shield,
      title: 'Historique Certifié',
      description: 'Jamais modifiable. Jamais falsifiable. Une blockchain de confiance pour votre véhicule.',
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-orange-500/20',
    },
    {
      icon: Wrench,
      title: 'Garages Partenaires',
      description: 'Validé par les meilleurs mécaniciens. Un réseau de confiance vérifié.',
      gradient: 'from-[#4facfe] to-[#00f2fe]',
      shadow: 'shadow-blue-500/20',
    },
    {
      icon: Handshake,
      title: 'Vente Sécurisée',
      description: 'Vendez plus cher, achetez en paix. Transparence totale garantie.',
      gradient: 'from-[#FF9900] to-[#FF007F]',
      shadow: 'shadow-pink-500/20',
    },
  ];

  return (
    <section id="confiance" className="relative py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] mb-6">
            Pourquoi{' '}
            <span className="bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
              OKAR
            </span>
            {' '}?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Une technologie qui protège votre investissement automobile avec une transparence absolue
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className={`
                relative h-full p-8 rounded-3xl
                bg-white/80 backdrop-blur-xl
                border border-white/90
                shadow-lg ${card.shadow}
                hover:shadow-2xl
                transition-all duration-500
                overflow-hidden
              `}>
                {/* Decorative gradient blob */}
                <div 
                  className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}
                />
                
                {/* Icon */}
                <motion.div
                  className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} p-4 mb-6 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <card.icon className="w-full h-full text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#FF9900] group-hover:to-[#FF007F] group-hover:bg-clip-text transition-all duration-300">
                  {card.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {card.description}
                </p>

                {/* Learn more link */}
                <div className="mt-6 flex items-center gap-2 text-[#FF9900] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm">En savoir plus</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 DEMO SECTION - Phone Mockup
// ═══════════════════════════════════════════════════════════════════════════════

function DemoSection() {
  const [isScanning, setIsScanning] = useState(false);
  const [isScanned, setIsScanned] = useState(false);

  const startDemo = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsScanned(true);
      setTimeout(() => setIsScanned(false), 3000);
    }, 2000);
  };

  return (
    <section id="demo" className="relative py-32 bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center order-2 lg:order-1"
          >
            <motion.div
              className="relative w-72 md:w-80"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Glow behind phone */}
              <div className="absolute -inset-8 bg-gradient-to-r from-[#FF9900]/20 via-[#FFD700]/20 to-[#FF007F]/20 rounded-[60px] blur-3xl" />
              
              {/* Phone body */}
              <div className="relative bg-gray-900 rounded-[40px] p-3 border border-gray-700 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
                
                {/* Screen */}
                <div className="relative bg-white rounded-[32px] overflow-hidden aspect-[9/19]">
                  {/* App Interface */}
                  <div className="absolute inset-0 flex flex-col">
                    {/* Header */}
                    <div className="p-4 pt-10 bg-gradient-to-r from-[#FF9900] to-[#FF007F]">
                      <p className="text-white font-bold text-lg">OKAR Scanner</p>
                      <p className="text-white/80 text-xs">Scannez le QR du véhicule</p>
                    </div>

                    {/* Scanner Area */}
                    <div className="flex-1 relative flex items-center justify-center p-8 bg-gray-50">
                      <div className="relative w-48 h-48">
                        {/* Corner brackets */}
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                          <div
                            key={pos}
                            className={`absolute w-8 h-8 border-4 border-[#FF9900] ${
                              pos.includes('top') ? 'top-0' : 'bottom-0'
                            } ${pos.includes('left') ? 'left-0' : 'right-0'} ${
                              pos.includes('left') ? 'border-r-0' : 'border-l-0'
                            } ${pos.includes('top') ? 'border-b-0' : 'border-t-0'}`}
                          />
                        ))}

                        {/* Scanning line */}
                        {isScanning && (
                          <motion.div
                            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#FF9900] to-transparent"
                            animate={{ top: ['10%', '90%', '10%'] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}

                        {/* QR Code placeholder */}
                        <div className="absolute inset-4 flex items-center justify-center">
                          <QrCode className="w-24 h-24 text-gray-300" />
                        </div>
                      </div>
                    </div>

                    {/* Success State */}
                    <AnimatePresence>
                      {isScanned && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8"
                        >
                          {/* Confetti */}
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: ['#FF9900', '#FF007F', '#FFD700', '#00E676'][i % 4],
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                              }}
                              initial={{ scale: 0, y: 0 }}
                              animate={{ 
                                scale: [0, 1, 0],
                                y: [0, -100],
                                x: [(Math.random() - 0.5) * 100],
                              }}
                              transition={{ duration: 1, delay: i * 0.02 }}
                            />
                          ))}
                          
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00E676] to-[#00BFA5] flex items-center justify-center mb-4 shadow-lg shadow-green-500/30"
                          >
                            <CheckCircle2 className="w-12 h-12 text-white" />
                          </motion.div>
                          <p className="text-gray-800 font-bold text-xl text-center">VÉHICULE CERTIFIÉ</p>
                          <p className="text-gray-500 text-sm mt-2">Toyota Corolla 2019</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Demo Button */}
            <motion.button
              onClick={startDemo}
              disabled={isScanning || isScanned}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-[#FF9900] to-[#FF007F] rounded-full text-white font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-4 h-4" />
              Voir la démo
            </motion.button>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-6 leading-tight">
              Une technologie simple.
              <br />
              <span className="bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
                Une confiance absolue.
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Accédez à tout l&apos;historique d&apos;entretien en moins de 3 secondes. 
              Vérifiez l&apos;authenticité d&apos;un véhicule avant achat.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              {[
                { icon: Zap, text: 'Historique complet des interventions' },
                { icon: Award, text: 'Certification garage vérifiable' },
                { icon: Lock, text: 'Alertes expiration VT & Assurance' },
                { icon: Handshake, text: 'Transfert de propriété digitalisé' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9900] to-[#FF007F] flex items-center justify-center shadow-md">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SEGMENTATION SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function SegmentationSection() {
  const [activeTab, setActiveTab] = useState<'acheteur' | 'proprietaire' | 'garagiste'>('acheteur');

  const tabs = {
    acheteur: {
      icon: Car,
      title: 'Acheteur',
      headline: 'Évitez les arnaques. Voyez la vraie histoire.',
      description: 'Avant d\'acheter un véhicule d\'occasion, scannez son QR OKAR pour accéder à l\'historique complet : entretiens, accidents, kilométrage vérifié. Prenez une décision éclairée.',
      cta: 'Vérifier un véhicule',
      stats: [
        { value: '85%', label: 'des arnaques évitées' },
        { value: '2 min', label: 'pour vérifier' },
      ],
    },
    proprietaire: {
      icon: Users,
      title: 'Propriétaire',
      headline: 'Boostez la valeur de revente de 20%.',
      description: 'Un véhicule avec un carnet OKAR certifié se vend plus cher et plus vite. Prouvez l\'historique d\'entretien à vos acheteurs potentiels.',
      cta: 'Créer mon carnet',
      stats: [
        { value: '+20%', label: 'valeur à la revente' },
        { value: '3x', label: 'plus rapide à vendre' },
      ],
    },
    garagiste: {
      icon: Wrench,
      title: 'Garagiste',
      headline: 'Fidélisez vos clients et digitalisez votre atelier.',
      description: 'Rejoignez le réseau des garages certifiés OKAR. Offrez un service premium à vos clients et développez votre notoriété.',
      cta: 'Devenir partenaire',
      stats: [
        { value: '500+', label: 'garages partenaires' },
        { value: '4.9/5', label: 'note moyenne' },
      ],
    },
  };

  return (
    <section id="qui" className="relative py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-4">
            OKAR pour{' '}
            <span className="bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
              Qui ?
            </span>
          </h2>
          <p className="text-gray-600 text-lg">Une solution adaptée à chaque profil</p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-16"
        >
          <div className="inline-flex p-1.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200 shadow-lg">
            {Object.entries(tabs).map(([key, tab]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`relative px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === key 
                    ? 'text-white' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {activeTab === key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#FF9900] to-[#FF007F] rounded-xl shadow-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  {tab.title}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Text Content */}
            <div className="text-center lg:text-left">
              <h3 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6">
                {tabs[activeTab].headline}
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                {tabs[activeTab].description}
              </p>

              {/* Stats */}
              <div className="flex gap-8 justify-center lg:justify-start mb-8">
                {tabs[activeTab].stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl font-black bg-gradient-to-r from-[#FF9900] to-[#FF007F] bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-[#FF9900] to-[#FF007F] rounded-full text-white font-bold text-lg shadow-lg shadow-orange-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tabs[activeTab].cta}
              </motion.button>
            </div>

            {/* Illustration */}
            <div className="relative flex justify-center">
              <div className="relative w-72 h-72 lg:w-80 lg:h-80">
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF9900]/20 to-[#FF007F]/20 rounded-full blur-3xl" />
                {/* Icon container */}
                <div className="relative w-full h-full rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-2xl flex items-center justify-center">
                  {(() => {
                    const Icon = tabs[activeTab].icon;
                    return <Icon className="w-24 h-24 text-gray-300" />;
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 CTA FOOTER SECTION - Vibrant Gradient
// ═══════════════════════════════════════════════════════════════════════════════

function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Vibrant gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF9900] via-[#FF007F] to-[#8B5CF6]">
        {/* Animated overlay */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Floating shapes */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10 backdrop-blur-sm"
            style={{
              width: 60 + Math.random() * 140,
              height: 60 + Math.random() * 140,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight">
            Prêt à transformer
            <br />
            votre expérience automobile ?
          </h2>

          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Rejoignez les milliers de Sénégalais qui protègent leur véhicule avec OKAR
          </p>

          {/* Big CTA Button */}
          <motion.button
            className="group relative inline-flex items-center gap-3 px-12 py-6 bg-white rounded-full text-gray-900 font-bold text-xl shadow-2xl shadow-white/30"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="bg-gradient-to-r from-[#FF9900] to-[#FF007F] bg-clip-text text-transparent">
              Commencer Gratuitement
            </span>
            <ChevronRight className="w-6 h-6 text-[#FF9900] group-hover:translate-x-1 transition-transform" />
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-white/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📜 FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9900] to-[#FF007F] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-[#FF9900] to-[#FF007F] bg-clip-text text-transparent">
              OKAR
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/a-propos" className="hover:text-gray-900 transition-colors">À propos</Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
            <Link href="/cgu" className="hover:text-gray-900 transition-colors">CGU</Link>
            <Link href="/confidentialite" className="hover:text-gray-900 transition-colors">Confidentialité</Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} OKAR. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LuxuryLightPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <AnimatedBackground />
      <Navigation />
      <HeroSection />
      <TrustSection />
      <DemoSection />
      <SegmentationSection />
      <CTASection />
      <Footer />
    </main>
  );
}
