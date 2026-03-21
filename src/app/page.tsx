'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Car,
  Wrench,
  Handshake,
  QrCode,
  ChevronRight,
  Menu,
  X,
  Search,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  Zap,
  Award,
  Lock,
  FileText,
  CheckCircle2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PERFORMANCE DESIGN CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
// Animations respectueuses de prefers-reduced-motion

// Check reduced motion preference - SSR safe
const getPrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Use a microtask to avoid synchronous setState
    const checkPreference = () => {
      queueMicrotask(() => setPrefersReducedMotion(mediaQuery.matches));
    };
    checkPreference();
    
    const handleChange = () => {
      queueMicrotask(() => setPrefersReducedMotion(mediaQuery.matches));
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧭 HEADER - Stable & Accessible (NO complex animations)
// ═══════════════════════════════════════════════════════════════════════════════

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Passive scroll listener for performance
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#fonctionnalites', label: 'Fonctionnalités' },
    { href: '#recherche', label: 'Recherche' },
    { href: '#qui', label: 'Pour qui' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo - STATIC */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#FF9900] via-[#FFD700] to-[#FF007F] flex items-center justify-center shadow-md shadow-orange-500/20 transition-transform duration-200 group-active:scale-95">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
                OKAR
              </span>
            </Link>

            {/* Desktop Navigation - NO animations */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative py-2"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF9900] to-[#FF007F] transition-all duration-200 hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* CTA Buttons - Simple hover only */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/garage/connexion">
                <span className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Connexion
                </span>
              </Link>
              <Link href="/inscrire">
                <span className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF9900] to-[#FF007F] text-white font-semibold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-shadow active:scale-[0.98]">
                  S&apos;inscrire
                </span>
              </Link>
            </div>

            {/* Mobile Menu Button - Instant response */}
            <button
              className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Simple fade only */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-white md:hidden pt-20"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <nav className="flex flex-col items-center gap-6 p-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl text-gray-700 hover:text-gray-900 font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
              <Link href="/garage/connexion" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="block w-full px-6 py-3 text-center border-2 border-gray-200 rounded-full text-gray-800 font-medium hover:bg-gray-50 transition-colors">
                  Connexion
                </span>
              </Link>
              <Link href="/inscrire" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="block w-full px-6 py-3 text-center bg-gradient-to-r from-[#FF9900] to-[#FF007F] rounded-full text-white font-semibold">
                  S&apos;inscrire
                </span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 BACKGROUND - Subtle CSS-only gradient animation
// ═══════════════════════════════════════════════════════════════════════════════

function SubtleBackground() {
  const reducedMotion = useReducedMotion();
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base white */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/30 to-white" />
      
      {/* Subtle animated mesh gradient - CSS only, GPU accelerated */}
      <div 
        className={`absolute inset-0 ${reducedMotion ? '' : 'animate-mesh-gradient'}`}
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(255,153,0,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 30%, rgba(255,0,127,0.06) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 50% 80%, rgba(255,215,0,0.05) 0%, transparent 50%)
          `,
          ...(reducedMotion ? {} : {
            animation: 'meshGradient 20s ease-in-out infinite alternate',
          })
        }}
      />
      
      {/* Subtle grid pattern - static */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚗 HERO SECTION - Clean, Search-focused, NO heavy animations
// ═══════════════════════════════════════════════════════════════════════════════

function HeroSection() {
  const [plate, setPlate] = useState('');
  const reducedMotion = useReducedMotion();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim()) {
      window.location.href = `/v/${plate.trim()}`;
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left - Text + Search */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-100 mb-6 sm:mb-8">
              <Sparkles className="w-4 h-4 text-[#FF9900]" />
              <span className="text-sm font-medium text-gray-700">Le futur de l&apos;automobile commence ici</span>
            </div>
            
            {/* Title - NO animation, instant readability */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-4 sm:mb-6">
              <span className="text-gray-900">L&apos;Histoire</span>
              <br />
              <span className="bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
                Réelle
              </span>
              <span className="text-gray-900"> de Votre Voiture.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0 mb-6 sm:mb-8">
              Le passeport numérique certifié de votre véhicule au Sénégal. 
              Historique infalsifiable accessible via QR Code.
            </p>

            {/* ═══════════════════════════════════════════════════════════════════
              🔍 SEARCH BAR - CENTRAL, STATIC, IMMEDIATELY USABLE
              NO animations on the input itself - ready to type instantly
            ═══════════════════════════════════════════════════════════════════ */}
            <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
              <div className="relative max-w-md mx-auto lg:mx-0">
                {/* Search Input - White, clean, accessible */}
                <div className="relative bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                  <div className="flex items-center">
                    <div className="pl-4 sm:pl-5">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      placeholder="Entrez une plaque d&apos;immatriculation..."
                      className="flex-1 px-3 sm:px-4 py-4 sm:py-5 text-base sm:text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
                      aria-label="Rechercher par plaque d'immatriculation"
                    />
                    <button
                      type="submit"
                      className="m-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#FF9900] to-[#FF007F] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow active:scale-[0.98] will-change-transform"
                    >
                      <span className="hidden sm:inline">Vérifier</span>
                      <ArrowRight className="w-5 h-5 sm:hidden" />
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Secondary CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-orange-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition-colors font-medium text-gray-800"
              >
                <QrCode className="w-5 h-5 text-[#FF9900]" />
                Scanner un QR Code
              </Link>
              <Link
                href="/devenir-partenaire"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-gray-700"
              >
                <Building2 className="w-5 h-5" />
                Devenir Partenaire
              </Link>
            </div>

            {/* Social Proof - Static */}
            <div className="mt-8 sm:mt-10 flex items-center justify-center lg:justify-start gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#FF9900] to-[#FF007F] flex items-center justify-center">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-gray-800">500+</p>
                  <p className="text-xs text-gray-500">garages</p>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-gray-800">2000+</p>
                  <p className="text-xs text-gray-500">véhicules</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Static Car Visual with subtle breathing only */}
          <div className="relative order-1 lg:order-2">
            <div className="relative max-w-sm sm:max-w-md lg:max-w-lg mx-auto">
              {/* Subtle glow - static */}
              <div 
                className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,153,0,0.3), rgba(255,0,127,0.2))' }}
              />
              
              {/* Car Image - Very subtle breathing animation (GPU accelerated) */}
              <div 
                className={`relative ${reducedMotion ? '' : 'animate-subtle-breathe'}`}
                style={reducedMotion ? {} : { willChange: 'transform' }}
              >
                <Image
                  src="/hero-car-luxury.png"
                  alt="Passeport numérique véhicule OKAR"
                  width={450}
                  height={280}
                  className="w-full h-auto object-contain drop-shadow-xl"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 450px"
                />
              </div>

              {/* QR Badge - Static, positioned */}
              <div className="absolute -right-2 sm:right-0 top-1/4">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-2xl opacity-40 blur-xl bg-gradient-to-br from-amber-400 to-orange-500" />
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                    <Image
                      src="/hero-qr-gold.png"
                      alt="QR Code OKAR"
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator - Simple bounce */}
      {!reducedMotion && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 bg-gradient-to-b from-[#FF9900] to-[#FF007F] rounded-full" />
          </div>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ FEATURES SECTION - Static cards, fade-in on scroll ONLY
// ═══════════════════════════════════════════════════════════════════════════════

function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Intersection Observer for fade-in (more performant than scroll listener)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Use requestAnimationFrame to avoid synchronous setState warning
          requestAnimationFrame(() => {
            setIsVisible(true);
          });
          observer.disconnect(); // Only animate once
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => observer.disconnect();
  }, []);

  const cards = [
    {
      icon: Shield,
      title: 'Historique Certifié',
      description: 'Jamais modifiable, jamais falsifiable. Chaque intervention est horodatée et vérifiable.',
      gradient: 'from-amber-400 to-orange-500',
      shadowColor: 'shadow-orange-100',
    },
    {
      icon: Wrench,
      title: 'Garages Partenaires',
      description: 'Réseau de garages certifiés OKAR. Qualité de service garantie et vérifiable.',
      gradient: 'from-[#4facfe] to-[#00f2fe]',
      shadowColor: 'shadow-blue-100',
    },
    {
      icon: Handshake,
      title: 'Vente Sécurisée',
      description: 'Transparence totale pour acheter ou vendre en toute confiance. Plus de mauvaises surprises.',
      gradient: 'from-[#FF9900] to-[#FF007F]',
      shadowColor: 'shadow-pink-100',
    },
  ];

  return (
    <section id="fonctionnalites" ref={sectionRef} className="relative py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Pourquoi{' '}
            <span className="bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
              OKAR
            </span>
            {' '}?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Une technologie qui protège votre investissement automobile avec une transparence absolue
          </p>
        </div>

        {/* Cards Grid - STATIC after fade-in */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`
                relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl
                bg-white border border-gray-100
                shadow-sm hover:shadow-md ${card.shadowColor}
                transition-shadow duration-200
                ${!reducedMotion && isVisible ? 'animate-fade-in-up' : 'opacity-0'}
              `}
              style={!reducedMotion ? { animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' } : { opacity: 1 }}
            >
              {/* Icon - Static */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 sm:mb-6 shadow-md`}>
                <card.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                {card.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 SEARCH/TEASING SECTION - Clear CTA
// ═══════════════════════════════════════════════════════════════════════════════

function SearchSection() {
  const [showExample, setShowExample] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <section id="recherche" className="relative py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Report Preview */}
          <div className="relative order-2 lg:order-1">
            <div className="relative max-w-md mx-auto">
              {/* Glow */}
              <div className="absolute -inset-4 rounded-2xl opacity-20 blur-2xl bg-gradient-to-r from-[#FF9900] to-[#FF007F]" />
              
              {/* Report Card Preview */}
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#FF9900] to-[#FF007F] p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold">Rapport Véhicule</p>
                      <p className="text-white/70 text-sm">Certifié OKAR</p>
                    </div>
                  </div>
                </div>
                
                {/* Content Preview */}
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Immatriculation</span>
                    <span className="font-semibold text-gray-900">AA-123-BB</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Marque / Modèle</span>
                    <span className="font-semibold text-gray-900">Toyota Corolla</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Interventions</span>
                    <span className="font-semibold text-green-600">12 enregistées</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-500 text-sm">Score OKAR</span>
                    <span className="font-bold text-[#FF9900]">92/100</span>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-gray-50 p-4 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Certifié par OKAR</span>
                </div>
              </div>
            </div>
            
            {/* Example Button */}
            <div className="text-center mt-6">
              <button
                onClick={() => setShowExample(true)}
                className="inline-flex items-center gap-2 text-[#FF9900] font-medium hover:underline"
              >
                <ChevronRight className="w-4 h-4" />
                Voir un exemple complet
              </button>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left order-1 lg:order-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 sm:mb-6 leading-tight">
              Vérifiez en{' '}
              <span className="bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
                2 minutes
              </span>
              <br className="hidden sm:block" /> l&apos;historique complet
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Entrez simplement le numéro de plaque pour accéder à l&apos;historique 
              certifié du véhicule : entretiens, accidents, kilométrage vérifié.
            </p>

            {/* Feature List */}
            <div className="space-y-3 sm:space-y-4">
              {[
                { icon: Zap, text: 'Résultat instantané' },
                { icon: Award, text: 'Données certifiées par les garages' },
                { icon: Lock, text: 'Alertes VT & Assurance' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#FF9900] to-[#FF007F] flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Modal for Example */}
      {showExample && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowExample(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Exemple de Rapport OKAR</h3>
              <button 
                onClick={() => setShowExample(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Véhicule Certifié OKAR
                </div>
                <p className="text-sm text-green-600">Ce véhicule a un historique complet et vérifié</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Interventions</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Score OKAR</p>
                  <p className="text-2xl font-bold text-[#FF9900]">92/100</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 SEGMENTATION SECTION - Simple tabs
// ═══════════════════════════════════════════════════════════════════════════════

function SegmentationSection() {
  const [activeTab, setActiveTab] = useState<'acheteur' | 'proprietaire' | 'garagiste'>('acheteur');

  const tabs = {
    acheteur: {
      icon: Car,
      title: 'Acheteur',
      headline: 'Évitez les arnaques. Voyez la vraie histoire.',
      description: 'Scannez le QR OKAR pour accéder à l&apos;historique complet : entretiens, accidents, kilométrage vérifié.',
      cta: 'Vérifier un véhicule',
      ctaLink: '/scan',
      stats: [
        { value: '85%', label: 'arnaques évitées' },
        { value: '2 min', label: 'pour vérifier' },
      ],
    },
    proprietaire: {
      icon: Users,
      title: 'Propriétaire',
      headline: 'Boostez la valeur de revente de 20%.',
      description: 'Un véhicule avec un carnet OKAR certifié se vend plus cher et plus vite.',
      cta: 'Créer mon carnet',
      ctaLink: '/inscrire',
      stats: [
        { value: '+20%', label: 'valeur à la revente' },
        { value: '3x', label: 'plus rapide à vendre' },
      ],
    },
    garagiste: {
      icon: Wrench,
      title: 'Garagiste',
      headline: 'Fidélisez vos clients. Digitalisez votre atelier.',
      description: 'Rejoignez le réseau des garages certifiés OKAR et développez votre notoriété.',
      cta: 'Devenir partenaire',
      ctaLink: '/devenir-partenaire',
      stats: [
        { value: '500+', label: 'garages partenaires' },
        { value: '4.9/5', label: 'note moyenne' },
      ],
    },
  };

  const currentTab = tabs[activeTab];

  return (
    <section id="qui" className="relative py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4">
            OKAR pour{' '}
            <span className="bg-gradient-to-r from-[#FF9900] via-[#FFD700] to-[#FF007F] bg-clip-text text-transparent">
              Qui
            </span>
            {' '}?
          </h2>
          <p className="text-base sm:text-lg text-gray-600">Une solution adaptée à chaque profil</p>
        </div>

        {/* Tab Buttons - Simple active state */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="inline-flex p-1 rounded-xl sm:rounded-2xl bg-gray-100 border border-gray-200">
            {Object.entries(tabs).map(([key, tab]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`
                  flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium transition-all duration-200
                  ${activeTab === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              {currentTab.headline}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              {currentTab.description}
            </p>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-8 justify-center lg:justify-start mb-6 sm:mb-8">
              {currentTab.stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#FF9900] to-[#FF007F] bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <Link
              href={currentTab.ctaLink}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#FF9900] to-[#FF007F] rounded-full text-white font-semibold shadow-md hover:shadow-lg transition-shadow active:scale-[0.98]"
            >
              {currentTab.cta}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>

          {/* Visual */}
          <div className="relative flex justify-center">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF9900]/20 to-[#FF007F]/20 rounded-full blur-3xl" />
              <div className="relative w-full h-full rounded-3xl bg-white/80 backdrop-blur border border-white shadow-xl flex items-center justify-center">
                <currentTab.icon className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📣 CTA SECTION - Final call to action
// ═══════════════════════════════════════════════════════════════════════════════

function CTASection() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF9900] via-[#FF007F] to-[#8B5CF6]" />
      
      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight">
          Prêt à transformer
          <br />
          votre expérience automobile ?
        </h2>
        <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-10 max-w-2xl mx-auto">
          Rejoignez les milliers de Sénégalais qui protègent leur véhicule avec OKAR
        </p>
        <Link
          href="/inscrire"
          className="inline-flex items-center gap-3 px-8 sm:px-12 py-4 sm:py-6 bg-white rounded-full text-gray-900 font-bold text-lg shadow-2xl hover:shadow-white/20 transition-shadow active:scale-[0.98]"
        >
          <span className="bg-gradient-to-r from-[#FF9900] to-[#FF007F] bg-clip-text text-transparent">
            Commencer Gratuitement
          </span>
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF9900]" />
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 FOOTER - Simple & Useful
// ═══════════════════════════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600">
            <Link href="/a-propos" className="hover:text-gray-900 transition-colors py-2">
              À propos
            </Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors py-2">
              Contact
            </Link>
            <Link href="/cgu" className="hover:text-gray-900 transition-colors py-2">
              CGU
            </Link>
            <Link href="/confidentialite" className="hover:text-gray-900 transition-colors py-2">
              Confidentialité
            </Link>
          </nav>

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
// 🏠 MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Subtle animated background */}
      <SubtleBackground />
      
      {/* Header - Fixed, stable */}
      <Header />
      
      {/* Hero - Search-focused */}
      <HeroSection />
      
      {/* Features - Static cards */}
      <FeaturesSection />
      
      {/* Search/Teasing */}
      <SearchSection />
      
      {/* Segmentation */}
      <SegmentationSection />
      
      {/* CTA */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
