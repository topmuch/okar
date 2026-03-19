'use client';

import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Car, 
  Wrench, 
  Handshake, 
  QrCode, 
  ChevronRight, 
  Play,
  Smartphone,
  CheckCircle2,
  Star,
  Users,
  Building2,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

// ============================================
// NAVIGATION - Fixed Header
// ============================================
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
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
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-fuchsia-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white">OKAR</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/70 hover:text-white transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <button className="px-4 py-2 text-white/80 hover:text-white transition-colors font-medium">
                  Connexion
                </button>
              </Link>
              <Link href="/inscrire">
                <button className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-fuchsia-500 rounded-full text-white font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all">
                  S&apos;inscrire
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl md:hidden pt-24"
        >
          <div className="flex flex-col items-center gap-6 p-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl text-white/80 hover:text-white transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-4 mt-8 w-full max-w-xs">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full px-6 py-3 border border-white/30 rounded-full text-white font-semibold">
                  Connexion
                </button>
              </Link>
              <Link href="/inscrire" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-fuchsia-500 rounded-full text-white font-semibold">
                  S&apos;inscrire
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

// ============================================
// HERO SECTION - Cinematic Experience
// ============================================
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden bg-black">
      {/* Video Background with Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-transparent to-fuchsia-600/10 z-10" />
        {/* Video placeholder - replace with actual video */}
        <div className="absolute inset-0 bg-[url('/hero-car.jpg')] bg-cover bg-center bg-no-repeat" />
        {/* Animated particles */}
        <div className="absolute inset-0 z-5">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-orange-400/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="relative z-20 min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              style={{ opacity }}
              className="text-center lg:text-left"
            >
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight"
              >
                <span className="bg-gradient-to-r from-orange-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
                  OKAR.
                </span>
                <br />
                <span className="text-white/90">La Mémoire de</span>
                <br />
                <span className="text-white/90">Votre Automobile.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto lg:mx-0 font-light"
              >
                Le premier carnet d&apos;entretien immuable, certifié par les garages 
                et protégé par la blockchain de la confiance.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                {/* Primary CTA */}
                <Link href="/scan">
                  <button className="group relative px-8 py-4 rounded-full overflow-hidden w-full sm:w-auto">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-fuchsia-500 to-orange-500 bg-[length:200%_100%] animate-gradient" />
                    {/* Glow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/20" />
                    {/* Button content */}
                    <span className="relative flex items-center justify-center gap-2 text-white font-bold text-lg">
                      <QrCode className="w-5 h-5" />
                      Scanner un Véhicule
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>

                {/* Secondary CTA */}
                <Link href="/devenir-partenaire">
                  <button className="group px-8 py-4 rounded-full border-2 border-white/30 backdrop-blur-sm hover:border-white/60 transition-all duration-300 hover:bg-white/10 w-full sm:w-auto">
                    <span className="flex items-center justify-center gap-2 text-white font-semibold">
                      <Building2 className="w-5 h-5" />
                      Devenir Partenaire
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  </button>
                </Link>
              </motion.div>

              {/* Social Proof Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="mt-12 flex items-center justify-center lg:justify-start gap-6 md:gap-8 text-white/50 text-sm md:text-base"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-400" />
                  <span><strong className="text-white">500+</strong> garages</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-fuchsia-400" />
                  <span><strong className="text-white">2000+</strong> véhicules</span>
                </div>
                <div className="w-px h-4 bg-white/20 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span><strong className="text-white">4.9/5</strong></span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Floating 3D QR Code */}
            <motion.div 
              className="hidden lg:flex justify-center items-center"
              style={{ y }}
            >
              <motion.div
                className="relative"
                animate={{ 
                  y: [0, -15, 0],
                  rotateY: [0, 5, 0, -5, 0],
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                {/* Glassmorphism QR Container */}
                <div className="relative w-72 h-72 xl:w-80 xl:h-80 rounded-3xl overflow-hidden">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 via-fuchsia-500 to-orange-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
                  
                  {/* Glass card */}
                  <div className="relative h-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
                    {/* QR Code Visual */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                      <QrCode className="w-32 h-32 xl:w-40 xl:h-40 text-white/90" strokeWidth={1} />
                      {/* Scanning line animation */}
                      <motion.div
                        className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                        animate={{ top: ["20%", "80%", "20%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    {/* OKAR Logo in QR */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <span className="text-2xl font-black bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
                        OKAR
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-2 bg-white/60 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

// ============================================
// TRUST SECTION - Animated Cards
// ============================================
function TrustSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const pathLength = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  const cards = [
    {
      icon: Shield,
      title: "Historique Certifié",
      description: "Jamais modifiable. Jamais falsifiable.",
      gradient: "from-amber-400 to-orange-500",
      delay: 0
    },
    {
      icon: Wrench,
      title: "Garages Partenaires",
      description: "Validé par les meilleurs mécaniciens du Sénégal.",
      gradient: "from-fuchsia-400 to-purple-500",
      delay: 0.2
    },
    {
      icon: Handshake,
      title: "Vente Sécurisée",
      description: "Vendez plus cher, achetez en paix.",
      gradient: "from-cyan-400 to-blue-500",
      delay: 0.4
    }
  ];

  return (
    <section id="confiance" ref={containerRef} className="relative py-32 bg-gradient-to-b from-black via-gray-950 to-black overflow-hidden">
      {/* Animated Road Line */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg className="w-full h-full max-w-6xl" viewBox="0 0 1200 400">
          <motion.path
            d="M0,200 Q300,100 600,200 T1200,200"
            fill="none"
            stroke="url(#roadGradient)"
            strokeWidth="2"
            style={{ pathLength }}
          />
          <defs>
            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6600" />
              <stop offset="50%" stopColor="#FF007F" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Section Title */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            La Confiance en{' '}
            <span className="bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
              Mouvement
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Une technologie qui protège votre investissement automobile
          </p>
        </motion.div>
      </div>

      {/* Floating Cards */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: card.delay }}
              whileHover={{ y: -10, rotateX: 5, rotateY: -5 }}
              className="group perspective-1000"
            >
              <div className="relative h-full p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10">
                {/* Glow effect */}
                <div className={`absolute -inset-px rounded-3xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
                
                {/* Icon */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-r ${card.gradient} p-4 mb-6`}>
                  <card.icon className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 group-hover:bg-clip-text transition-all duration-300">
                  {card.title}
                </h3>
                <p className="text-white/50 group-hover:text-white/70 transition-colors duration-300">
                  {card.description}
                </p>

                {/* Decorative corner */}
                <div className={`absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-r ${card.gradient} opacity-10 blur-2xl group-hover:opacity-30 transition-opacity duration-500`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// DEMO SECTION - Interactive QR Scan
// ============================================
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
    <section id="demo" className="relative py-32 bg-gradient-to-b from-black via-gray-950 to-black overflow-hidden">
      {/* Circuit Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] bg-repeat" />
      </div>

      {/* Animated Grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,102,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,102,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center"
          >
            {/* Phone Frame */}
            <motion.div
              className="relative w-72 md:w-80"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Glow behind phone */}
              <div className="absolute -inset-8 bg-gradient-to-r from-orange-500/20 via-fuchsia-500/20 to-orange-500/20 rounded-[60px] blur-3xl" />
              
              {/* Phone body */}
              <div className="relative bg-gray-900 rounded-[40px] p-3 border border-gray-700 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
                
                {/* Screen */}
                <div className="relative bg-gray-950 rounded-[32px] overflow-hidden aspect-[9/19]">
                  {/* App Interface */}
                  <div className="absolute inset-0 flex flex-col">
                    {/* Header */}
                    <div className="p-4 pt-10 bg-gradient-to-r from-orange-500 to-fuchsia-500">
                      <p className="text-white font-bold text-lg">OKAR Scanner</p>
                      <p className="text-white/70 text-xs">Scannez le QR du véhicule</p>
                    </div>

                    {/* Scanner Area */}
                    <div className="flex-1 relative flex items-center justify-center p-8">
                      {/* QR Scanner Frame */}
                      <div className="relative w-48 h-48">
                        {/* Corner brackets */}
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos, i) => (
                          <div
                            key={pos}
                            className={`absolute w-8 h-8 border-4 border-orange-500 ${
                              pos.includes('top') ? 'top-0' : 'bottom-0'
                            } ${pos.includes('left') ? 'left-0' : 'right-0'} ${
                              pos.includes('left') ? 'border-r-0' : 'border-l-0'
                            } ${pos.includes('top') ? 'border-b-0' : 'border-t-0'}`}
                          />
                        ))}

                        {/* Scanning line */}
                        {isScanning && (
                          <motion.div
                            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                            animate={{ top: ["10%", "90%", "10%"] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}

                        {/* QR Code placeholder */}
                        <div className="absolute inset-4 flex items-center justify-center">
                          <QrCode className="w-24 h-24 text-white/30" />
                        </div>
                      </div>
                    </div>

                    {/* Success State */}
                    {isScanned && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-green-600/20 backdrop-blur-xl flex flex-col items-center justify-center p-8"
                      >
                        {/* Confetti */}
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: ['#FF6600', '#FF007F', '#FFD700', '#00FF88'][i % 4],
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
                          transition={{ type: "spring", delay: 0.2 }}
                          className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4"
                        >
                          <CheckCircle2 className="w-12 h-12 text-white" />
                        </motion.div>
                        <p className="text-white font-bold text-xl text-center">VÉHICULE CERTIFIÉ</p>
                        <p className="text-white/70 text-sm mt-2">Toyota Corolla 2019</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Demo Button */}
            <button
              onClick={startDemo}
              disabled={isScanning || isScanned}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-orange-500 to-fuchsia-500 rounded-full text-white font-semibold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Voir la démo
            </button>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Un simple scan.
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
                Une vérité absolue.
              </span>
            </h2>
            <p className="text-xl text-white/60 mb-8">
              Accédez à tout l&apos;historique d&apos;entretien en moins de 3 secondes. 
              Vérifiez l&apos;authenticité d&apos;un véhicule avant achat.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              {[
                "Historique complet des interventions",
                "Certification garage vérifiable",
                "Alertes expiration VT & Assurance",
                "Transfert de propriété digitalisé"
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-fuchsia-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/80">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// SEGMENTATION SECTION - Dynamic Tabs
// ============================================
function SegmentationSection() {
  const [activeTab, setActiveTab] = useState<'acheteur' | 'proprietaire' | 'garagiste'>('acheteur');

  const tabs = {
    acheteur: {
      icon: Car,
      title: "Acheteur",
      headline: "Évitez les arnaques. Voyez la vraie histoire.",
      description: "Avant d'acheter un véhicule d'occasion, scannez son QR OKAR pour accéder à l'historique complet : entretiens, accidents, kilométrage vérifié. Prenez une décision éclairée.",
      cta: "Vérifier un véhicule",
      image: "/buyer-illustration.svg",
      stats: [
        { value: "85%", label: "des arnaques évitées" },
        { value: "2 min", label: "pour vérifier" }
      ]
    },
    proprietaire: {
      icon: Users,
      title: "Propriétaire",
      headline: "Boostez la valeur de revente de 20%.",
      description: "Un véhicule avec un carnet OKAR certifié se vend plus cher et plus vite. Prouvez l'historique d'entretien à vos acheteurs potentiels et gagnez leur confiance instantanément.",
      cta: "Créer mon carnet",
      image: "/owner-illustration.svg",
      stats: [
        { value: "+20%", label: "valeur à la revente" },
        { value: "3x", label: "plus rapide à vendre" }
      ]
    },
    garagiste: {
      icon: Wrench,
      title: "Garagiste",
      headline: "Fidélisez vos clients et digitalisez votre atelier.",
      description: "Rejoignez le réseau des garages certifiés OKAR. Offrez un service premium à vos clients, suivez les interventions numériquement et développez votre notoriété.",
      cta: "Devenir partenaire",
      image: "/mechanic-illustration.svg",
      stats: [
        { value: "500+", label: "garages partenaires" },
        { value: "4.9/5", label: "note moyenne" }
      ]
    }
  };

  return (
    <section id="qui" className="relative py-32 bg-gradient-to-b from-black via-gray-950 to-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            OKAR pour{' '}
            <span className="bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
              Qui ?
            </span>
          </h2>
          <p className="text-white/50 text-lg">Une solution adaptée à chaque profil</p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-16"
        >
          <div className="relative inline-flex p-1.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
            {Object.entries(tabs).map(([key, tab]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`relative px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === key 
                    ? 'text-white' 
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {activeTab === key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 to-fuchsia-500 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
        <div className="relative min-h-[400px]">
          {Object.entries(tabs).map(([key, tab]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 50 }}
              animate={{
                opacity: activeTab === key ? 1 : 0,
                x: activeTab === key ? 0 : 50,
                scale: activeTab === key ? 1 : 0.95,
              }}
              transition={{ duration: 0.4 }}
              className={`${activeTab === key ? 'relative' : 'absolute inset-0 pointer-events-none'}`}
            >
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <div className="text-center lg:text-left">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    {tab.headline}
                  </h3>
                  <p className="text-lg text-white/60 mb-8">
                    {tab.description}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-8 justify-center lg:justify-start mb-8">
                    {tab.stats.map((stat, i) => (
                      <div key={i} className="text-center">
                        <p className="text-3xl font-black bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
                          {stat.value}
                        </p>
                        <p className="text-sm text-white/50">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button className="px-8 py-4 bg-gradient-to-r from-orange-500 to-fuchsia-500 rounded-full text-white font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-orange-500/25">
                    {tab.cta}
                  </button>
                </div>

                {/* Illustration */}
                <div className="relative flex justify-center">
                  <div className="relative w-80 h-80">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-fuchsia-500/20 rounded-full blur-3xl" />
                    {/* Placeholder for illustration */}
                    <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                      <tab.icon className="w-24 h-24 text-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// PARTNERS SECTION - Marquee
// ============================================
function PartnersSection() {
  const partners = [
    { name: "Total Energies", logo: "/logos/total.svg" },
    { name: "Oryx", logo: "/logos/oryx.svg" },
    { name: "AXA Assurances", logo: "/logos/axa.svg" },
    { name: "SAHAM", logo: "/logos/saham.svg" },
    { name: "Auto Plus", logo: "/logos/autoplus.svg" },
    { name: "Garage Moderne", logo: "/logos/moderne.svg" },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-black to-gray-950 overflow-hidden">
      {/* Glass overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/50" />
      
      <div className="relative max-w-7xl mx-auto px-6 mb-12">
        <p className="text-center text-white/40 text-sm uppercase tracking-widest">
          Ils nous font confiance
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative overflow-hidden">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

        {/* Scrolling logos */}
        <motion.div
          className="flex gap-16 items-center py-8"
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...partners, ...partners, ...partners].map((partner, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-32 h-12 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <div className="text-white/60 font-bold text-sm">{partner.name}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// CTA FOOTER SECTION
// ============================================
function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-fuchsia-600 to-purple-900">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(255,102,0,0.4) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(255,0,127,0.4) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(255,102,0,0.4) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Floating shapes */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10 backdrop-blur-sm"
            style={{
              width: 100 + Math.random() * 200,
              height: 100 + Math.random() * 200,
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

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight">
            Prêt à rouler
            <br />
            en toute confiance ?
          </h2>

          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Rejoignez les milliers de Sénégalais qui protègent leur véhicule avec OKAR
          </p>

          {/* Big CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="relative group inline-flex items-center gap-3 px-12 py-6 bg-white rounded-full text-gray-900 font-bold text-xl shadow-2xl shadow-white/30 hover:shadow-white/50 transition-shadow"
          >
            {/* Neon glow */}
            <div className="absolute -inset-2 bg-white rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            
            <span className="relative">Commencer Gratuitement</span>
            <Sparkles className="relative w-6 h-6" />
          </motion.button>

          {/* Secondary actions */}
          <div className="mt-8 flex items-center justify-center gap-6 text-white/60 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Sans carte de crédit
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              30 jours d&apos;essai
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Annulation facile
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN HOMEPAGE COMPONENT
// ============================================
export default function HomePage() {
  return (
    <main className="bg-black">
      <Navigation />
      <HeroSection />
      <TrustSection />
      <DemoSection />
      <SegmentationSection />
      <PartnersSection />
      <CTASection />
      
      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-fuchsia-500 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white">OKAR</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-white/40">
              <a href="/a-propos" className="hover:text-white transition-colors">À propos</a>
              <a href="/cgu" className="hover:text-white transition-colors">CGU</a>
              <a href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-white/30">
              © 2024 OKAR. Fait au Sénégal 🇸🇳
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
