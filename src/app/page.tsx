'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Car,
  Wrench,
  Search,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Award,
  Zap,
  FileText,
  CheckCircle2,
  QrCode,
  Star,
  Sparkles,
  Clock,
  Gauge,
  BadgeCheck,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 LUXE ÉDITORIAL - COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════
// Background: #FDFBF7 (Cream White)
// Primary: #0F172A (Night Blue)
// Gold: #D4AF37 (Metallic Gold)
// Action: #FB5607 (Burnt Orange)
// Accent: #E63946 (Vermeil Red)

// ═══════════════════════════════════════════════════════════════════════════════
// 🧭 HEADER - Minimal, Glassmorphism Luxe
// ═══════════════════════════════════════════════════════════════════════════════

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#FDFBF7]/95 backdrop-blur-xl shadow-sm shadow-[#0F172A]/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 group-hover:shadow-[#D4AF37]/30 transition-shadow duration-300">
                <QrCode className="w-5 h-5 text-white" />
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#0F172A] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </div>
              <span className="text-2xl font-serif font-bold tracking-tight text-[#0F172A]">
                OKAR
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              {[
                { href: '#excellence', label: 'Excellence' },
                { href: '#confiance', label: 'Confiance' },
                { href: '#rapport', label: 'Rapport' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#0F172A]/70 hover:text-[#0F172A] tracking-wide uppercase transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/garage/connexion">
                <span className="text-sm font-medium text-[#0F172A]/70 hover:text-[#0F172A] transition-colors">
                  Connexion
                </span>
              </Link>
              <Link href="/inscrire">
                <span className="px-5 py-2.5 rounded-full bg-[#0F172A] text-white text-sm font-medium hover:bg-[#D4AF37] hover:text-[#0F172A] transition-all duration-300 shadow-lg shadow-[#0F172A]/10">
                  S&apos;inscrire
                </span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2.5 rounded-xl bg-white/80 backdrop-blur border border-[#D4AF37]/20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Fermer' : 'Menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-[#0F172A]" /> : <Menu className="w-5 h-5 text-[#0F172A]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#FDFBF7] md:hidden pt-24"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <nav className="flex flex-col items-center gap-8 p-8">
            {[
              { href: '#excellence', label: 'Excellence' },
              { href: '#confiance', label: 'Confiance' },
              { href: '#rapport', label: 'Rapport' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-serif text-[#0F172A]"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/inscrire" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="mt-8 px-8 py-4 bg-[#0F172A] text-white rounded-full font-medium">
                Commencer
              </span>
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 MESH GRADIENT BACKGROUND - Ink in Water Effect
// ═══════════════════════════════════════════════════════════════════════════════

function LuxeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Cream base */}
      <div className="absolute inset-0 bg-[#FDFBF7]" />
      
      {/* Animated mesh gradient - Ink in water */}
      <div className="absolute inset-0 mesh-gradient-luxe" />
      
      {/* Grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F172A]/5" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚗 HERO SECTION - Editorial Magazine Style
// ═══════════════════════════════════════════════════════════════════════════════

function HeroSection() {
  const [plate, setPlate] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim()) {
      window.location.href = `/rapport/${plate.trim()}`;
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 w-full">
        
        {/* Main Content - Centered */}
        <div className="relative z-10 text-center">
          
          {/* Overline */}
          <div className="inline-flex items-center gap-3 mb-8 animate-fade-up">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#0F172A]/50">
              Le Passeport Automobile Premium
            </span>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
          </div>
          
          {/* Title - Serif, Massive, Editorial */}
          <h1 className="relative mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-[#0F172A] leading-[0.9] tracking-tight">
              L&apos;Excellence
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif italic font-light text-[#0F172A]/30 leading-[0.9] tracking-tight mt-2">
              Automobile,
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold leading-[0.9] tracking-tight mt-4">
              <span className="text-[#0F172A]">Certifiée</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37]">.</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-[#0F172A]/60 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
            L&apos;histoire vraie de votre véhicule. Vérifiée. Certifiée. Inaltérable.
          </p>

          {/* ═══════════════════════════════════════════════════════════════════
            🔍 SEARCH BAR - Glassmorphism Art Object
            Floating, golden border, colored shadow
          ═══════════════════════════════════════════════════════════════════ */}
          <form onSubmit={handleSearch} className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative max-w-2xl mx-auto">
              
              {/* Massive colored shadow (floating effect) */}
              <div className={`absolute -inset-4 rounded-[2rem] transition-all duration-500 ${
                isFocused 
                  ? 'bg-gradient-to-r from-[#D4AF37]/20 via-[#0F172A]/10 to-[#FB5607]/20 blur-2xl scale-105' 
                  : 'bg-gradient-to-r from-[#D4AF37]/10 via-[#0F172A]/5 to-[#FB5607]/10 blur-3xl'
              }`} />
              
              {/* Glassmorphism container */}
              <div className={`relative backdrop-blur-xl bg-white/70 rounded-[1.5rem] border transition-all duration-500 ${
                isFocused 
                  ? 'border-[#D4AF37]/50 shadow-[0_0_0_1px_rgba(212,175,55,0.3)]' 
                  : 'border-[#D4AF37]/20'
              }`}>
                
                {/* Animated border glow */}
                {isFocused && (
                  <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden">
                    <div className="absolute inset-0 animate-border-glow" />
                  </div>
                )}
                
                <div className="relative flex items-center p-2 sm:p-3">
                  <div className="pl-5 sm:pl-6">
                    <Search className="w-5 h-5 text-[#0F172A]/40" />
                  </div>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="DK-123-AB"
                    className="flex-1 px-4 sm:px-6 py-4 sm:py-5 text-lg sm:text-xl md:text-2xl text-[#0F172A] placeholder:text-[#0F172A]/25 focus:outline-none bg-transparent font-mono tracking-wider"
                    aria-label="Plaque d'immatriculation"
                  />
                  <button
                    type="submit"
                    className="m-1.5 sm:m-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0F172A] font-semibold rounded-xl sm:rounded-2xl text-base sm:text-lg flex items-center gap-2 shadow-lg shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/50 hover:scale-[1.02] transition-all duration-300"
                  >
                    <Search className="w-4 h-4 sm:hidden" />
                    <span className="hidden sm:inline">Vérifier</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
              
              {/* Helper text */}
              <p className="mt-4 text-xs tracking-wide text-[#0F172A]/40 font-mono">
                EX: AA-123-BC • DK-456-EF • SN-789-GH
              </p>
            </div>
          </form>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 mt-12 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A]">15,000+</p>
              <p className="text-xs tracking-widest uppercase text-[#0F172A]/50 mt-1">Véhicules</p>
            </div>
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent" />
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A]">500+</p>
              <p className="text-xs tracking-widest uppercase text-[#0F172A]/50 mt-1">Garages</p>
            </div>
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent" />
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A]">🇸🇳</p>
              <p className="text-xs tracking-widest uppercase text-[#0F172A]/50 mt-1">Sénégal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
        <div className="w-5 h-8 rounded-full border border-[#D4AF37]/50 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 bg-[#D4AF37] rounded-full animate-scroll-dot" />
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ CONFIANCE SECTION - Bento Grid Asymétrique
// ═══════════════════════════════════════════════════════════════════════════════

function ConfianceSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Historique',
      subtitle: 'Certifié',
      description: 'Jamais modifiable, jamais falsifiable. Horodatage vérifiable à vie.',
      color: 'from-[#0F172A]',
      accent: '#D4AF37',
      size: 'large',
    },
    {
      icon: Wrench,
      title: 'Garages',
      subtitle: 'Partenaires',
      description: 'Réseau certifié de 500+ professionnels.',
      color: 'from-[#D4AF37]',
      accent: '#0F172A',
      size: 'small',
    },
    {
      icon: Award,
      title: 'Vente',
      subtitle: 'Sécurisée',
      description: 'Transparence totale pour vos transactions.',
      color: 'from-[#FB5607]',
      accent: '#D4AF37',
      size: 'small',
    },
    {
      icon: BadgeCheck,
      title: 'Score OKAR',
      subtitle: 'Transparence',
      description: 'Évaluation objective de la qualité du véhicule.',
      color: 'from-[#0F172A]',
      accent: '#D4AF37',
      size: 'medium',
    },
  ];

  return (
    <section id="confiance" ref={sectionRef} className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#D4AF37]">
            La Confiance
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-[#0F172A] mt-4">
            Pourquoi <span className="italic font-light text-[#0F172A]/40">OKAR</span>
          </h2>
        </div>

        {/* Bento Grid - Asymétrique */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`
                relative group p-6 sm:p-8 rounded-2xl sm:rounded-3xl
                backdrop-blur-xl bg-white/50 border border-[#D4AF37]/10
                hover:border-[#D4AF37]/30 hover:bg-white/70
                transition-all duration-500
                ${feature.size === 'large' ? 'md:col-span-2 lg:col-span-1 lg:row-span-2' : ''}
                ${feature.size === 'medium' ? 'md:col-span-1' : ''}
                ${isVisible ? 'animate-fade-up' : 'opacity-0'}
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Iridescent background on hover */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-[#0F172A]/5" />
              
              {/* Icon */}
              <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} to-transparent flex items-center justify-center mb-6 shadow-lg`}>
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" style={{ color: feature.accent === '#D4AF37' ? '#D4AF37' : 'white' }} />
              </div>
              
              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0F172A] mb-1">
                {feature.title}
              </h3>
              <p className="text-sm tracking-widest uppercase text-[#D4AF37] mb-4">
                {feature.subtitle}
              </p>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-[#0F172A]/60 leading-relaxed">
                {feature.description}
              </p>
              
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#D4AF37]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 RAPPORT SECTION - Floating PDF Object
// ═══════════════════════════════════════════════════════════════════════════════

function RapportSection() {
  return (
    <section id="rapport" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#D4AF37]">
              Le Rapport
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-[#0F172A] mt-4 mb-6 leading-tight">
              Un rapport
              <br />
              <span className="italic font-light text-[#0F172A]/40">style Carfax</span>
            </h2>
            <p className="text-base sm:text-lg text-[#0F172A]/60 mb-8 leading-relaxed">
              Pour seulement <span className="font-mono font-bold text-[#0F172A]">1,000 FCFA</span>, 
              accédez à l&apos;historique complet de n&apos;importe quel véhicule immatriculé au Sénégal.
            </p>

            {/* Features list */}
            <div className="space-y-4 mb-10">
              {[
                { icon: Zap, text: 'Résultat instantané en 2 minutes' },
                { icon: Shield, text: 'Données certifiées par les garages' },
                { icon: Clock, text: 'Alertes VT & Assurance' },
                { icon: Gauge, text: 'Score OKAR exclusif' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 justify-center lg:justify-start">
                  <div className="w-10 h-10 rounded-xl bg-[#0F172A]/5 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <span className="text-[#0F172A]/70">{item.text}</span>
                </div>
              ))}
            </div>

            <Link
              href="/rapport/AA-123-BC"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#0F172A] text-white rounded-full font-medium hover:bg-[#D4AF37] hover:text-[#0F172A] transition-all duration-300 shadow-lg shadow-[#0F172A]/10 group"
            >
              Voir un exemple gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Floating PDF */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative perspective-[1000px]">
              {/* Glow */}
              <div className="absolute -inset-12 bg-gradient-to-r from-[#D4AF37]/20 via-[#0F172A]/10 to-[#FB5607]/20 rounded-3xl blur-3xl" />
              
              {/* PDF Stack - 3D floating effect */}
              <div className="relative transform hover:rotate-y-2 transition-transform duration-700" style={{ transformStyle: 'preserve-3d' }}>
                
                {/* Back pages */}
                <div className="absolute top-4 left-4 w-64 sm:w-72 h-80 sm:h-96 bg-white/80 backdrop-blur rounded-xl shadow-xl transform rotate-2" />
                <div className="absolute top-2 left-2 w-64 sm:w-72 h-80 sm:h-96 bg-white/90 backdrop-blur rounded-xl shadow-xl transform rotate-1" />
                
                {/* Front page - Main report */}
                <div className="relative w-64 sm:w-72 h-80 sm:h-96 bg-white rounded-xl shadow-2xl overflow-hidden transform hover:-rotate-1 transition-transform duration-500">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#0F172A] to-[#D4AF37] p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Rapport Véhicule</p>
                        <p className="text-xs text-white/70">Certifié OKAR</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      Véhicule vérifié
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">Plaque</span>
                      <span className="font-mono font-bold text-[#0F172A]">DK-456-AB</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">Marque</span>
                      <span className="font-semibold text-[#0F172A]">Toyota Corolla</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">Interventions</span>
                      <span className="font-bold text-green-600">12 certifiées</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-gray-500">Score OKAR</span>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-serif font-bold text-[#D4AF37]">92</span>
                        <span className="text-gray-400">/100</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-50 p-4 text-center">
                    <div className="inline-flex items-center gap-2 text-xs text-gray-600">
                      <Shield className="w-4 h-4 text-[#D4AF37]" />
                      Certifié par OKAR
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📣 CTA SECTION - Dark Luxe
// ═══════════════════════════════════════════════════════════════════════════════

function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Dark luxe background */}
      <div className="absolute inset-0 bg-[#0F172A]" />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FB5607]/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-4xl mx-auto px-6 sm:px-8 text-center">
        <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#D4AF37]">
          Prêt ?
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mt-4 mb-6">
          Sécurisez votre
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37]">
            prochain achat
          </span>
        </h2>
        <p className="text-base sm:text-lg text-white/60 mb-10 max-w-xl mx-auto">
          Rejoignez les milliers de Sénégalais qui protègent leur véhicule avec OKAR
        </p>
        
        {/* Golden CTA */}
        <Link
          href="/inscrire"
          className="inline-flex items-center gap-3 px-10 sm:px-14 py-5 sm:py-6 bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] text-[#0F172A] rounded-full font-bold text-lg shadow-2xl shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/50 hover:scale-105 transition-all duration-300"
        >
          Commencer maintenant
          <ArrowRight className="w-6 h-6" />
        </Link>
        
        {/* Trust */}
        <div className="flex items-center justify-center gap-8 mt-10">
          {[
            { icon: Shield, text: 'Sécurisé' },
            { icon: CheckCircle2, text: 'Certifié' },
            { icon: Star, text: '4.9/5' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-white/50">
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 FOOTER - Editorial
// ═══════════════════════════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-[#FDFBF7] border-t border-[#D4AF37]/10 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#D4AF37] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold text-[#0F172A]">OKAR</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-[#0F172A]/60">
            <Link href="/a-propos" className="hover:text-[#0F172A] transition-colors tracking-wide uppercase text-xs">
              À propos
            </Link>
            <Link href="/contact" className="hover:text-[#0F172A] transition-colors tracking-wide uppercase text-xs">
              Contact
            </Link>
            <Link href="/cgu" className="hover:text-[#0F172A] transition-colors tracking-wide uppercase text-xs">
              CGU
            </Link>
            <Link href="/confidentialite" className="hover:text-[#0F172A] transition-colors tracking-wide uppercase text-xs">
              Confidentialité
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-[#0F172A]/40 font-mono">
            © {new Date().getFullYear()} OKAR
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
    <main className="min-h-screen bg-[#FDFBF7]">
      {/* Luxe animated background */}
      <LuxeBackground />
      
      {/* Header */}
      <Header />
      
      {/* Hero - Editorial */}
      <HeroSection />
      
      {/* Confiance - Bento Grid */}
      <ConfianceSection />
      
      {/* Rapport - Floating PDF */}
      <RapportSection />
      
      {/* CTA - Dark Luxe */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
