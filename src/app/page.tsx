'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Shield,
  CheckCircle,
  Smartphone,
  Car,
  Wrench,
  ArrowRight,
  Menu,
  X,
  Star,
  Sparkles,
  ChevronRight,
  Play,
  Zap,
  Award,
  Users,
  Clock,
  MessageCircle
} from "lucide-react";

// ========================================
// PREMIUM ANIMATED BACKGROUND COMPONENT
// ========================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-200/40 via-pink-200/30 to-transparent rounded-full blur-3xl animate-blob" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-200/40 via-orange-100/30 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-yellow-100/40 via-orange-100/30 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-50" />
    </div>
  );
}

// ========================================
// PREMIUM NAVIGATION
// ========================================
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-gray-200/50 border-b border-gray-100' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-pink-500 to-orange-400 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 opacity-80" />
              <div className="absolute inset-0 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <QrCode className="w-7 h-7 text-transparent bg-gradient-to-br from-orange-500 to-pink-500 bg-clip-text" style={{stroke: 'url(#gradient)'}} />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-orange-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              OKAR
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#solutions" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Solutions</a>
            <a href="#comment" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Comment ça marche</a>
            <a href="#tarifs" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Tarifs</a>
            <Link href="/contact" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Contact</Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/garage/connexion">
              <Button variant="ghost" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 font-medium">
                <Wrench className="w-4 h-4 mr-2" />
                Espace Garage
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-400 hover:from-orange-600 hover:via-pink-600 hover:to-orange-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5">
                Devenir Partenaire
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-gray-100 bg-white/95 backdrop-blur-xl rounded-b-3xl">
            <div className="flex flex-col gap-4">
              <a href="#solutions" className="text-gray-700 hover:text-orange-500 font-medium py-2" onClick={() => setIsOpen(false)}>Solutions</a>
              <a href="#comment" className="text-gray-700 hover:text-orange-500 font-medium py-2" onClick={() => setIsOpen(false)}>Comment ça marche</a>
              <a href="#tarifs" className="text-gray-700 hover:text-orange-500 font-medium py-2" onClick={() => setIsOpen(false)}>Tarifs</a>
              <Link href="/contact" className="text-gray-700 hover:text-orange-500 font-medium py-2" onClick={() => setIsOpen(false)}>Contact</Link>
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <Link href="/garage/connexion" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full font-medium">Espace Garage</Button>
                </Link>
                <Link href="/devenir-partenaire" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold">Devenir Partenaire</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ========================================
// HERO SECTION - THE WOW EFFECT
// ========================================
function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section ref={heroRef} className="min-h-screen flex items-center pt-20 pb-10 px-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 animate-fade-in-up">
              <span className="px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200 text-orange-600 text-sm rounded-full font-semibold shadow-sm">
                🚗 Le passeport numérique automobile du Sénégal
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 mb-6 leading-tight animate-fade-in-up animation-delay-100">
              <span className="block">L&apos;Histoire Réelle</span>
              <span className="block bg-gradient-to-r from-orange-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                de Votre Voiture.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-gray-600 text-lg sm:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up animation-delay-200">
              Le premier passeport numérique certifié par les garages. 
              <span className="font-semibold text-gray-800"> Transparence totale, valeur garantie.</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-300">
              <Link href="/scan/demo">
                <Button className="group bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-gray-900 px-8 py-7 rounded-2xl font-bold text-lg shadow-xl shadow-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/40 transition-all hover:-translate-y-1">
                  <QrCode className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Scanner un Véhicule
                </Button>
              </Link>
              <Link href="/devenir-partenaire">
                <Button className="group bg-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-pink-500 text-gray-700 hover:text-white px-8 py-7 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-transparent shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  Devenir Garage Partenaire
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Trust Pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-8 animate-fade-in-up animation-delay-400">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2.5 rounded-full shadow-sm border border-gray-100">
                <Shield className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600 text-sm font-medium">Infalsifiable</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2.5 rounded-full shadow-sm border border-gray-100">
                <CheckCircle className="w-4 h-4 text-pink-500" />
                <span className="text-gray-600 text-sm font-medium">Certifié</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2.5 rounded-full shadow-sm border border-gray-100">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600 text-sm font-medium">+200 Garages</span>
              </div>
            </div>
          </div>

          {/* Right Content - 3D Hero Visual */}
          <div className="relative order-1 lg:order-2 animate-fade-in-up">
            {/* Main Container */}
            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px]">
              {/* Floating Car */}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-80 lg:w-96 animate-float"
                style={{
                  transform: `translate(-50%, -50%) perspective(1000px) rotateY(${(mousePosition.x - 0.5) * 10}deg) rotateX(${(mousePosition.y - 0.5) * -5}deg)`
                }}
              >
                <Image
                  src="/hero-car.png"
                  alt="OKAR - Vehicle Passport"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>

              {/* Floating QR Code */}
              <div 
                className="absolute right-0 sm:right-4 top-1/4 w-28 sm:w-36 animate-float animation-delay-2000"
                style={{
                  transform: `perspective(500px) rotateY(${(mousePosition.x - 0.5) * 15}deg)`
                }}
              >
                <Image
                  src="/hero-qr.png"
                  alt="QR Code OKAR"
                  fill
                  className="object-contain drop-shadow-xl"
                />
              </div>

              {/* Glowing Ring */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px]">
                <div className="absolute inset-0 rounded-full border-2 border-orange-200/50 animate-spin-slow" />
                <div className="absolute inset-4 rounded-full border border-pink-200/40 animate-spin-slow animation-delay-1000" />
                <div className="absolute inset-8 rounded-full border border-orange-100/30 animate-spin-slow animation-delay-2000" />
              </div>

              {/* Floating Stats Cards */}
              <div className="absolute left-0 bottom-1/4 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/50 animate-float animation-delay-1000 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">5K+</p>
                    <p className="text-xs text-gray-500">Véhicules suivis</p>
                  </div>
                </div>
              </div>

              <div className="absolute right-0 sm:right-8 bottom-1/3 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/50 animate-float animation-delay-3000 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">200+</p>
                    <p className="text-xs text-gray-500">Garages certifiés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-gradient-to-b from-orange-400 to-pink-400 rounded-full animate-scroll" />
        </div>
      </div>
    </section>
  );
}

// ========================================
// TRUST SECTION - GLASSMORPHISM CARDS
// ========================================
function TrustSection() {
  const features = [
    {
      icon: Shield,
      title: "Historique Certifié",
      description: "Chaque intervention est enregistrée, signée électroniquement et horodatée. Impossible à falsifier.",
      gradient: "from-orange-500 to-pink-500",
      image: "/icon-certified.png"
    },
    {
      icon: Wrench,
      title: "Garages Partenaires",
      description: "Un réseau de garages certifiés et vérifiés à travers tout le Sénégal.",
      gradient: "from-pink-500 to-orange-400",
      image: "/icon-garage.png"
    },
    {
      icon: CheckCircle,
      title: "Vente Sécurisée",
      description: "Achetez en confiance avec un historique complet et vérifiable du véhicule.",
      gradient: "from-orange-400 to-yellow-400",
      image: "/icon-trust.png"
    }
  ];

  return (
    <section id="solutions" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
            Pourquoi OKAR ?
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            La confiance au cœur de chaque
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent"> transaction</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Une technologie innovante pour une transparence totale dans l&apos;automobile
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className="relative mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>

              {/* Decorative Element */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-full blur-xl`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========================================
// DEMO SECTION - INTERACTIVE SHOWCASE
// ========================================
function DemoSection() {
  return (
    <section id="comment" className="py-24 px-4 relative overflow-hidden">
      {/* Circuit Pattern Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Phone Mockup */}
          <div className="relative flex justify-center order-2 lg:order-1">
            {/* Phone Container */}
            <div className="relative w-64 sm:w-72 lg:w-80 animate-float">
              {/* Phone Frame */}
              <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                {/* Screen */}
                <div className="bg-white rounded-[2.25rem] overflow-hidden aspect-[9/19]">
                  {/* Status Bar */}
                  <div className="bg-gray-100 px-6 py-2 flex justify-between items-center text-xs text-gray-600">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-gray-400 rounded-sm" />
                      <div className="w-4 h-2 bg-gray-400 rounded-sm" />
                      <div className="w-4 h-2 bg-green-500 rounded-sm" />
                    </div>
                  </div>
                  
                  {/* App Content */}
                  <div className="p-4 bg-gradient-to-b from-white to-gray-50 h-full">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">OKAR</p>
                        <p className="text-xs text-gray-500">Passeport Auto</p>
                      </div>
                    </div>

                    {/* Scan Area */}
                    <div className="relative bg-gray-100 rounded-2xl p-4 mb-4 border-2 border-dashed border-orange-300">
                      <div className="flex justify-center mb-3">
                        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-inner">
                          <QrCode className="w-12 h-12 text-orange-500 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-center text-sm text-gray-600">Scannez un QR Code</p>
                    </div>

                    {/* Vehicle Preview */}
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center">
                          <Car className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Toyota Corolla</p>
                          <p className="text-xs text-gray-500">AA-1234-BB</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>

                    {/* Confetti Effect */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full animate-confetti"
                          style={{
                            backgroundColor: ['#f97316', '#ec4899', '#facc15', '#22c55e'][i % 4],
                            left: `${20 + i * 10}%`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -right-4 top-1/4 bg-white rounded-xl p-3 shadow-xl animate-float animation-delay-1000">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="absolute -left-4 bottom-1/4 bg-white rounded-xl p-3 shadow-xl animate-float animation-delay-2000">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="order-1 lg:order-2">
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
              Technologie Simple
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Scannez. Vérifiez.
              <span className="block bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Roulez en confiance.</span>
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Une technologie simple mais puissante. En un scan, accédez à l&apos;historique complet d&apos;un véhicule : entretiens, réparations, kilométrage certifié.
            </p>

            {/* Steps */}
            <div className="space-y-4">
              {[
                { num: "01", title: "Scannez le QR", desc: "Flash le code OKAR sur le véhicule" },
                { num: "02", title: "Consultez l'historique", desc: "Toutes les interventions certifiées" },
                { num: "03", title: "Achetez en confiance", desc: "Transparence totale garantie" }
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                    {step.num}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ========================================
// STATS SECTION
// ========================================
function StatsSection() {
  const stats = [
    { value: "5,000+", label: "Véhicules suivis", icon: Car, color: "from-orange-500 to-pink-500" },
    { value: "200+", label: "Garages certifiés", icon: Wrench, color: "from-pink-500 to-orange-400" },
    { value: "50,000+", label: "Interventions", icon: CheckCircle, color: "from-orange-400 to-yellow-400" },
    { value: "24/7", label: "Disponible", icon: Clock, color: "from-yellow-400 to-orange-400" }
  ];

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-orange-400" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
      
      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-white/80 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========================================
// PRICING SECTION
// ========================================
function PricingSection() {
  const plans = [
    {
      title: "Basique",
      price: "25 000",
      unit: "FCFA/mois",
      features: ["50 QR codes/mois", "Rapports d'entretien", "Support email", "Dashboard garage"],
      cta: "Commencer",
      popular: false
    },
    {
      title: "Premium",
      price: "75 000",
      unit: "FCFA/mois",
      features: ["200 QR codes/mois", "Signature numérique", "Support prioritaire", "Statistiques avancées", "Multi-utilisateurs"],
      cta: "Choisir Premium",
      popular: true
    },
    {
      title: "Entreprise",
      price: "Sur devis",
      unit: "",
      features: ["QR codes illimités", "API dédiée", "Account manager", "Formation sur site"],
      cta: "Nous contacter",
      popular: false
    }
  ];

  return (
    <section id="tarifs" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
            Tarifs
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent"> formule</span>
          </h2>
          <p className="text-gray-600 text-lg">Des tarifs adaptés à tous les garages</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-orange-200 shadow-xl shadow-orange-500/10' 
                  : 'border-gray-100 shadow-lg hover:shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg">
                  ⭐ Populaire
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.title}</h3>
              
              <div className="mb-6">
                <span className="text-4xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  {plan.price}
                </span>
                <span className="text-gray-500 text-sm ml-1">{plan.unit}</span>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/devenir-partenaire">
                <Button className={`w-full py-4 rounded-xl font-bold transition-all ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-500/25' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========================================
// CTA SECTION - VIBRANT GRADIENT
// ========================================
function CTASection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Vibrant Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-pink-500 to-orange-400" />
      
      {/* Animated Shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
      
      {/* Floating 3D Elements */}
      <div className="absolute top-1/4 left-10 w-16 h-16 bg-white/20 backdrop-blur rounded-xl rotate-12 animate-float hidden lg:block" />
      <div className="absolute bottom-1/4 right-10 w-20 h-20 bg-white/10 backdrop-blur rounded-full animate-float animation-delay-1000 hidden lg:block" />
      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/15 backdrop-blur rounded-lg -rotate-12 animate-float animation-delay-2000 hidden lg:block" />

      <div className="max-w-4xl mx-auto text-center relative">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Prêt à transformer votre
          <span className="block">expérience automobile ?</span>
        </h2>
        <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
          Rejoignez les centaines de garages et conducteurs qui font confiance à OKAR pour la transparence automobile au Sénégal.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/devenir-partenaire">
            <Button className="group bg-white text-orange-500 px-10 py-7 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/25 transition-all hover:-translate-y-1 hover:bg-gray-50">
              <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              Devenir Partenaire
            </Button>
          </Link>
          <Link href="/contact">
            <Button className="bg-white/20 backdrop-blur-xl text-white border-2 border-white/30 px-10 py-7 rounded-2xl font-bold text-lg hover:bg-white/30 transition-all hover:-translate-y-1">
              <MessageCircle className="w-5 h-5 mr-2" />
              Contactez-nous
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          <div className="flex items-center gap-2 text-white/80">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Sans engagement</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Shield className="w-5 h-5" />
            <span className="text-sm">100% sécurisé</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Support 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ========================================
// FOOTER
// ========================================
function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">OKAR</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Le passeport numérique automobile de référence au Sénégal. Transparence, confiance et certification.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Produit</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><a href="#solutions" className="hover:text-orange-400 transition-colors">Solutions</a></li>
              <li><a href="#comment" className="hover:text-orange-400 transition-colors">Comment ça marche</a></li>
              <li><a href="#tarifs" className="hover:text-orange-400 transition-colors">Tarifs</a></li>
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Entreprise</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><Link href="/a-propos" className="hover:text-orange-400 transition-colors">À propos</Link></li>
              <li><Link href="/devenir-partenaire" className="hover:text-orange-400 transition-colors">Partenaires</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-orange-400 transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-orange-400 transition-colors">Confidentialité</Link></li>
            </ul>
          </div>

          {/* Spaces */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Espaces</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><Link href="/garage/connexion" className="hover:text-orange-400 transition-colors">Espace Garage</Link></li>
              <li><Link href="/driver/tableau-de-bord" className="hover:text-orange-400 transition-colors">Espace Conducteur</Link></li>
              <li><Link href="/admin/connexion" className="hover:text-orange-400 transition-colors">SuperAdmin</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} OKAR. Tous droits réservés. Made in Senegal 🇸🇳
          </p>
          <div className="flex items-center gap-4">
            <a href="https://facebook.com/okar.sn" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-orange-500 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://instagram.com/okar.sn" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-pink-500 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://wa.me/22178123456" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-green-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      <AnimatedBackground />
      <Navigation />
      <HeroSection />
      <TrustSection />
      <DemoSection />
      <StatsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
