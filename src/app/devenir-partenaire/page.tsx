'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  QrCode,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Send,
  Wrench,
  Users,
  TrendingUp,
  Shield,
  Star,
  Award,
  Clock,
  ArrowRight
} from "lucide-react";

// Navigation Component
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">OKAR</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#avantages" className="text-white/70 hover:text-white transition-colors text-sm">
              Avantages
            </a>
            <a href="#temoignages" className="text-white/70 hover:text-white transition-colors text-sm">
              Témoignages
            </a>
            <a href="#tarifs" className="text-white/70 hover:text-white transition-colors text-sm">
              Tarifs
            </a>
            <a href="#formulaire" className="text-white/70 hover:text-white transition-colors text-sm">
              Contact
            </a>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <button className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                Connexion
              </button>
            </Link>
            <a href="#formulaire">
              <button className="bg-gradient-to-r from-orange-500 to-fuchsia-500 text-white px-5 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-orange-500/25 transition text-sm">
                Devenir Partenaire
              </button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-4">
              <a href="#avantages" className="text-white/70 hover:text-white" onClick={() => setIsOpen(false)}>
                Avantages
              </a>
              <a href="#temoignages" className="text-white/70 hover:text-white" onClick={() => setIsOpen(false)}>
                Témoignages
              </a>
              <a href="#tarifs" className="text-white/70 hover:text-white" onClick={() => setIsOpen(false)}>
                Tarifs
              </a>
              <a href="#formulaire" onClick={() => setIsOpen(false)}>
                <button className="w-full bg-gradient-to-r from-orange-500 to-fuchsia-500 text-white px-5 py-2 rounded-full font-medium">
                  Devenir Partenaire
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="pt-24 pb-20 px-4 bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <span className="px-4 py-2 bg-gradient-to-r from-orange-500/20 to-fuchsia-500/20 border border-orange-500/50 text-orange-400 text-sm rounded-full font-medium">
            🤝 Programme Partenaire OKAR
          </span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6"
        >
          Devenez Garage{' '}
          <span className="bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
            Certifié OKAR
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/60 max-w-2xl mx-auto mb-8 text-lg"
        >
          Rejoignez le réseau de garages certifiés qui révolutionnent la confiance automobile au Sénégal. 
          Offrez un service premium à vos clients et développez votre notoriété.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href="#formulaire">
            <button className="group bg-gradient-to-r from-orange-500 to-fuchsia-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all hover:scale-105 inline-flex items-center gap-2">
              <Send className="w-5 h-5" />
              Demander l&apos;agrément
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </a>
          <a href="#avantages">
            <button className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all inline-flex items-center gap-2">
              Découvrir les avantages
            </button>
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8"
        >
          <div>
            <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">500+</p>
            <p className="text-white/50 text-sm mt-1">Garages certifiés</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">2000+</p>
            <p className="text-white/50 text-sm mt-1">Véhicules suivis</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">4.9/5</p>
            <p className="text-white/50 text-sm mt-1">Note moyenne</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Why Partner Section
function WhyPartnerSection() {
  const cards = [
    {
      icon: TrendingUp,
      title: "Développez votre CA",
      desc: "Attirez de nouveaux clients grâce à votre visibilité sur la plateforme OKAR. Les conducteurs recherchent des garages certifiés.",
      gradient: "from-orange-400 to-amber-500"
    },
    {
      icon: Shield,
      title: "Badge de Confiance",
      desc: "Le label OKAR Certified vous démarque de la concurrence. Gagnez la confiance instantanée de vos clients.",
      gradient: "from-fuchsia-400 to-purple-500"
    },
    {
      icon: Users,
      title: "Fidélisez vos Clients",
      desc: "Chaque intervention est tracée dans le carnet numérique. Vos clients reviennent chez vous pour l'historique complet.",
      gradient: "from-cyan-400 to-blue-500"
    },
    {
      icon: Clock,
      title: "Gain de Temps",
      desc: "Digitalisez vos interventions en 2 minutes. Plus de paperasse, tout est automatiquement enregistré.",
      gradient: "from-green-400 to-emerald-500"
    }
  ];

  return (
    <section id="avantages" className="py-24 px-4 bg-gradient-to-b from-black to-gray-950">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            Pourquoi devenir{' '}
            <span className="bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
              partenaire OKAR ?
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Rejoignez le réseau des garages de confiance au Sénégal
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10"
            >
              {/* Glow effect */}
              <div className={`absolute -inset-px rounded-3xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-r ${card.gradient} p-3 mb-6`}>
                <card.icon className="w-full h-full text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-white/50 group-hover:text-white/70 transition-colors">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Demandez votre agrément",
      desc: "Remplissez le formulaire ci-dessous avec les informations de votre garage."
    },
    {
      step: "02",
      title: "Validation OKAR",
      desc: "Notre équipe vérifie votre dossier et vous contacte sous 48h."
    },
    {
      step: "03",
      title: "Formation rapide",
      desc: "Une session de 30 minutes pour maîtriser la plateforme OKAR."
    },
    {
      step: "04",
      title: "Vous êtes certifié !",
      desc: "Recevez votre badge OKAR et commencez à attirer de nouveaux clients."
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-gray-950 to-black">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-white/50 text-lg">
            4 étapes simples pour rejoindre le réseau OKAR
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-orange-500/50 to-transparent z-0" />
              )}
              
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 text-white font-black text-xl">
                {item.step}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Mamadou Sy",
      role: "Gérant, Auto Plus Dakar",
      text: "Depuis que je suis certifié OKAR, j'ai gagné 40% de nouveaux clients. Le badge de confiance fait la différence.",
      avatar: "MS",
      rating: 5
    },
    {
      name: "Fatou Ndiaye",
      role: "Directrice, Garage Moderne",
      text: "La plateforme est simple et rapide. Mes clients sont rassurés de voir l'historique de leurs véhicules.",
      avatar: "FN",
      rating: 5
    },
    {
      name: "Ibrahima Fall",
      role: "Mécanicien, Auto Service",
      text: "Fini les carnets papier perdus ! Tout est digital et mes clients me font confiance aveuglément.",
      avatar: "IF",
      rating: 5
    }
  ];

  return (
    <section id="temoignages" className="py-24 px-4 bg-gradient-to-b from-black to-gray-950">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ce que disent nos partenaires
          </h2>
          <p className="text-white/50 text-lg">
            Des garagistes satisfaits partout au Sénégal
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-white/50 text-sm">{t.role}</div>
                </div>
              </div>
              <p className="text-white/70 italic mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex gap-1">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Gratuit",
      period: "",
      features: [
        "Profil garage sur OKAR",
        "10 QR codes/mois",
        "Historique basique",
        "Support email"
      ],
      cta: "Commencer",
      popular: false
    },
    {
      name: "Pro",
      price: "25 000",
      period: "FCFA/mois",
      features: [
        "Tout Starter inclus",
        "QR codes illimités",
        "Statistiques avancées",
        "Badge certifié visible",
        "Support prioritaire",
        "Formation incluse"
      ],
      cta: "Choisir Pro",
      popular: true
    },
    {
      name: "Premium",
      price: "75 000",
      period: "FCFA/mois",
      features: [
        "Tout Pro inclus",
        "Mise en avant recherche",
        "Page garage personnalisée",
        "API pour votre logiciel",
        "Account manager dédié",
        "Publicité sur OKAR"
      ],
      cta: "Nous contacter",
      popular: false
    }
  ];

  return (
    <section id="tarifs" className="py-24 px-4 bg-gradient-to-b from-gray-950 to-black">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Nos offres
          </h2>
          <p className="text-white/50 text-lg">
            Choisissez le plan adapté à votre garage
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-3xl border ${
                plan.popular 
                  ? 'bg-gradient-to-b from-orange-500/20 to-fuchsia-500/20 border-orange-500/50' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-500 to-fuchsia-500 rounded-full text-white text-xs font-bold">
                  POPULAIRE
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-white/50 ml-1">{plan.period}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-white/70">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-3 rounded-full font-bold transition-all ${
                plan.popular
                  ? 'bg-gradient-to-r from-orange-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                  : 'border border-white/30 text-white hover:bg-white/10'
              }`}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Form Section
function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    garage: '',
    city: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partenaire_okar',
          senderName: formData.name,
          senderEmail: formData.email,
          senderPhone: formData.phone,
          content: {
            garage: formData.garage,
            city: formData.city,
            message: formData.message,
          },
        }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="formulaire" className="py-24 px-4 bg-gradient-to-b from-black to-gray-950">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 rounded-3xl p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Demandez votre agrément OKAR</h3>
            <p className="text-white/50">
              Remplissez ce formulaire — nous vous répondrons sous 48h.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Demande envoyée !</h4>
              <p className="text-white/50">Notre équipe vous contactera sous 48h pour finaliser votre agrément.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Votre nom *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
                <input
                  type="text"
                  placeholder="Nom du garage *"
                  value={formData.garage}
                  onChange={(e) => setFormData({ ...formData, garage: e.target.value })}
                  className="w-full p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
                <input
                  type="tel"
                  placeholder="Téléphone *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Ville *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
              <textarea
                placeholder="Parlez-nous de votre garage (nombre de mécaniciens, spécialités, années d'expérience...)"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-fuchsia-500 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer ma demande
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white">OKAR</span>
            </div>
            <p className="text-white/50 text-sm">
              Le passeport numérique de votre véhicule au Sénégal.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Produit</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link href="/scan" className="hover:text-white transition-colors">Scanner un QR</Link></li>
              <li><Link href="/devenir-partenaire" className="hover:text-white transition-colors">Devenir Partenaire</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Entreprise</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/a-propos" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Légal</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8 border-t border-white/10">
          <div className="flex items-center gap-3 text-white/50">
            <MapPin className="w-5 h-5 text-orange-400" />
            <span>Dakar, Sénégal</span>
          </div>
          <div className="flex items-center gap-3 text-white/50">
            <Phone className="w-5 h-5 text-orange-400" />
            <span>+221 77 123 45 67</span>
          </div>
          <div className="flex items-center gap-3 text-white/50">
            <Mail className="w-5 h-5 text-orange-400" />
            <span>contact@okar.sn</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} OKAR. Fait au Sénégal 🇸🇳
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function DevenirPartenairePage() {
  return (
    <main className="min-h-screen bg-black">
      <Navigation />
      <HeroSection />
      <WhyPartnerSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <ContactFormSection />
      <Footer />
    </main>
  );
}
