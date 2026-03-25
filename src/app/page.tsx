'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Key, 
  Wrench, 
  CheckCircle, 
  Shield, 
  Car,
  Star,
  MapPin,
  Droplets,
  Cog,
  AlertTriangle,
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react'

type TabType = 'verifier' | 'proprietaire' | 'garage'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('verifier')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [plateNumber, setPlateNumber] = useState('')

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#FF0080] rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl md:text-3xl font-serif font-bold text-[#111111]">OKAR</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#comment" className="text-sm font-medium text-[#111111] hover:text-[#FF6B00] transition-colors">Comment ça marche</a>
              <a href="#services" className="text-sm font-medium text-[#111111] hover:text-[#FF6B00] transition-colors">Services</a>
              <a href="#temoignages" className="text-sm font-medium text-[#111111] hover:text-[#FF6B00] transition-colors">Témoignages</a>
              <a href="#contact" className="text-sm font-medium text-[#111111] hover:text-[#FF6B00] transition-colors">Contact</a>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/inscrire">
                <button className="px-5 py-2.5 text-sm font-semibold text-[#111111] hover:text-[#FF6B00] transition-colors">
                  Se connecter
                </button>
              </Link>
              <Link href="/inscrire">
                <button className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#FF6B00] to-[#FF0080] rounded-full hover:shadow-lg hover:shadow-[#FF6B00]/25 transition-all duration-200">
                  Créer un compte
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4">
            <nav className="flex flex-col gap-4">
              <a href="#comment" className="text-sm font-medium text-[#111111] py-2">Comment ça marche</a>
              <a href="#services" className="text-sm font-medium text-[#111111] py-2">Services</a>
              <a href="#temoignages" className="text-sm font-medium text-[#111111] py-2">Témoignages</a>
              <a href="#contact" className="text-sm font-medium text-[#111111] py-2">Contact</a>
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <Link href="/inscrire">
                  <button className="w-full py-3 text-sm font-semibold text-[#111111] border border-gray-200 rounded-full">
                    Se connecter
                  </button>
                </Link>
                <Link href="/inscrire">
                  <button className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#FF6B00] to-[#FF0080] rounded-full">
                    Créer un compte
                  </button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Title */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-[#111111] leading-tight mb-6">
              CHECK IN AUTO :<br />
              <span className="bg-gradient-to-r from-[#FF6B00] via-[#FF0080] to-[#FFD700] bg-clip-text text-transparent">
                L&apos;histoire réelle
              </span>
              <br />de votre voiture.
            </h1>
            <p className="text-lg md:text-xl text-[#111111]/80 max-w-3xl mx-auto leading-relaxed">
              La première plateforme qui certifie l&apos;historique mécanique de votre véhicule. 
              <span className="font-semibold text-[#FF6B00]"> Achetez en confiance, vendez plus cher, entretenez mieux.</span>
            </p>
          </div>

          {/* 3 Tabs Selector */}
          <div className="max-w-4xl mx-auto">
            {/* Tab Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={() => setActiveTab('verifier')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  activeTab === 'verifier' 
                    ? 'bg-[#00E5FF] text-white shadow-lg shadow-[#00E5FF]/30' 
                    : 'bg-white text-[#111111] border-2 border-gray-100 hover:border-[#00E5FF]'
                }`}
              >
                <Search className="w-5 h-5" />
                <span>JE VEUX VÉRIFIER</span>
              </button>
              <button
                onClick={() => setActiveTab('proprietaire')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  activeTab === 'proprietaire' 
                    ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/30' 
                    : 'bg-white text-[#111111] border-2 border-gray-100 hover:border-[#FF6B00]'
                }`}
              >
                <Key className="w-5 h-5" />
                <span>JE SUIS PROPRIÉTAIRE</span>
              </button>
              <button
                onClick={() => setActiveTab('garage')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  activeTab === 'garage' 
                    ? 'bg-[#FF0080] text-white shadow-lg shadow-[#FF0080]/30' 
                    : 'bg-white text-[#111111] border-2 border-gray-100 hover:border-[#FF0080]'
                }`}
              >
                <Wrench className="w-5 h-5" />
                <span>JE SUIS GARAGE</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
              {/* Verifier Tab */}
              {activeTab === 'verifier' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-[#00E5FF]" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#111111] mb-4">
                    Vérifiez l&apos;historique d&apos;un véhicule
                  </h3>
                  <p className="text-[#111111]/70 mb-8 max-w-xl mx-auto">
                    Obtenez le rapport complet style Carfax. Entrez le numéro d&apos;immatriculation pour accéder à l&apos;historique certifié.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                    <input
                      type="text"
                      placeholder="Ex: AA-123-AB"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      className="flex-1 px-6 py-4 text-lg border-2 border-gray-200 rounded-full focus:border-[#00E5FF] focus:outline-none font-mono tracking-wider text-center sm:text-left"
                    />
                    <button className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#00E5FF] to-[#0099CC] rounded-full hover:shadow-lg hover:shadow-[#00E5FF]/30 transition-all duration-200 whitespace-nowrap">
                      Vérifier • 1000 FCFA
                    </button>
                  </div>
                </div>
              )}

              {/* Proprietaire Tab */}
              {activeTab === 'proprietaire' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Key className="w-8 h-8 text-[#FF6B00]" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#111111] mb-4">
                    Gérez votre carnet d&apos;entretien numérique
                  </h3>
                  <p className="text-[#111111]/70 mb-8 max-w-xl mx-auto">
                    Valorisez votre auto avec un passeport numérique infalsifiable. Suivez tous vos entretiens en un clic.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/inscrire">
                      <button className="px-8 py-4 text-lg font-semibold text-[#FF6B00] border-2 border-[#FF6B00] rounded-full hover:bg-[#FF6B00] hover:text-white transition-all duration-200">
                        Se connecter
                      </button>
                    </Link>
                    <Link href="/inscrire">
                      <button className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8c00] rounded-full hover:shadow-lg hover:shadow-[#FF6B00]/30 transition-all duration-200">
                        Créer mon passeport
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Garage Tab */}
              {activeTab === 'garage' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FF0080]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Wrench className="w-8 h-8 text-[#FF0080]" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#111111] mb-4">
                    Devenez Garage Partenaire Certifié
                  </h3>
                  <p className="text-[#111111]/70 mb-8 max-w-xl mx-auto">
                    Attirez des clients, certifiez vos réparations et encaissez plus. Rejoignez le réseau OKAR.
                  </p>
                  <Link href="/devenir-partenaire">
                    <button className="px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#FF0080] to-[#FF40A0] rounded-full hover:shadow-lg hover:shadow-[#FF0080]/30 transition-all duration-200">
                      Devenir Partenaire Certifié
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section id="comment" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#FFD700]/5 via-[#FF6B00]/5 to-[#FF0080]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 text-sm font-semibold text-[#FF6B00] bg-[#FF6B00]/10 rounded-full mb-4">
              SIMPLE & RAPIDE
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#111111]">
              OKAR en 3 étapes simples.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00E5FF] to-[#0099CC] rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="text-sm font-mono text-[#FF6B00] mb-2">ÉTAPE 01</div>
              <h3 className="text-xl font-bold text-[#111111] mb-3">
                Un garage certifié scanne et note l&apos;intervention.
              </h3>
              <p className="text-[#111111]/70">
                Chaque réparation est enregistrée avec photos, factures et kilométrage vérifié.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B00] to-[#FF8c00] rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div className="text-sm font-mono text-[#FF0080] mb-2">ÉTAPE 02</div>
              <h3 className="text-xl font-bold text-[#111111] mb-3">
                Vous validez la facture sur votre app.
              </h3>
              <p className="text-[#111111]/70">
                Recevez une notification et validez l&apos;intervention en un clic depuis votre smartphone.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-gradient-to-br from-[#FF0080] to-[#FF40A0] rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="text-sm font-mono text-[#FFD700] mb-2">ÉTAPE 03</div>
              <h3 className="text-xl font-bold text-[#111111] mb-3">
                L&apos;historique est gravé dans le passeport infalsifiable.
              </h3>
              <p className="text-[#111111]/70">
                Votre véhicule gagne en valeur avec un historique certifié et vérifiable par QR Code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES BENTO GRID ===== */}
      <section id="services" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 text-sm font-semibold text-[#FF0080] bg-[#FF0080]/10 rounded-full mb-4">
              NOS SERVICES
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#111111]">
              Services certifiés OKAR.
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Large Card - Rapport Historique */}
            <div className="lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-[#00E5FF]/10 to-[#0099CC]/10 rounded-3xl p-8 border-2 border-[#00E5FF]/20 hover:border-[#00E5FF] transition-all duration-200">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-[#111111] font-bold text-sm rounded-full mb-6">
                    <span className="font-mono">1 000 FCFA</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#111111] mb-4">
                    Rapport Historique Complet
                  </h3>
                  <p className="text-[#111111]/70 mb-6">
                    Obtenez un rapport détaillé style Carfax : historique des entretiens, accidents, kilométrage vérifié, et statut de certification.
                  </p>
                  <ul className="space-y-3">
                    {['Historique complet des entretiens', 'Vérification du kilométrage', 'Accidents signalés', 'Score de confiance'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#111111]/80">
                        <CheckCircle className="w-5 h-5 text-[#00E5FF] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <button className="w-full sm:w-auto px-8 py-4 font-semibold text-white bg-gradient-to-r from-[#00E5FF] to-[#0099CC] rounded-full hover:shadow-lg hover:shadow-[#00E5FF]/30 transition-all duration-200">
                    Vérifier un véhicule
                  </button>
                </div>
              </div>
            </div>

            {/* Vidange */}
            <div className="bg-white rounded-3xl p-6 border-2 border-[#FF6B00]/20 hover:border-[#FF6B00] hover:shadow-lg hover:shadow-[#FF6B00]/10 transition-all duration-200">
              <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center mb-4">
                <Droplets className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Vidange & Entretien</h3>
              <p className="text-sm text-[#111111]/70">
                Suivi complet des vidanges, filtres et révisions périodiques.
              </p>
            </div>

            {/* Grosse Mécanique */}
            <div className="bg-white rounded-3xl p-6 border-2 border-[#00E5FF]/20 hover:border-[#00E5FF] hover:shadow-lg hover:shadow-[#00E5FF]/10 transition-all duration-200">
              <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-xl flex items-center justify-center mb-4">
                <Cog className="w-6 h-6 text-[#00E5FF]" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Grosse Mécanique</h3>
              <p className="text-sm text-[#111111]/70">
                Moteur, boîte de vitesses, embrayage - toutes les réparations majeures.
              </p>
            </div>

            {/* Carrosserie */}
            <div className="bg-white rounded-3xl p-6 border-2 border-[#FF0080]/20 hover:border-[#FF0080] hover:shadow-lg hover:shadow-[#FF0080]/10 transition-all duration-200">
              <div className="w-12 h-12 bg-[#FF0080]/10 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[#FF0080]" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Carrosserie & Accident</h3>
              <p className="text-sm text-[#111111]/70">
                Historique des dommages et réparations carrosserie certifiées.
              </p>
            </div>

            {/* Contrôle Technique */}
            <div className="bg-gradient-to-br from-[#FFD700]/10 to-[#FF6B00]/10 rounded-3xl p-6 border-2 border-[#FFD700]/30 hover:border-[#FFD700] transition-all duration-200">
              <div className="w-12 h-12 bg-[#FFD700]/20 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Contrôle Technique</h3>
              <p className="text-sm text-[#111111]/70">
                Rappels automatiques et suivi des contrôles techniques.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TÉMOIGNAGES ===== */}
      <section id="temoignages" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#6200EA]/5 via-[#FF0080]/5 to-[#FF6B00]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 text-sm font-semibold text-[#6200EA] bg-[#6200EA]/10 rounded-full mb-4">
              ILS NOUS FONT CONFIANCE
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#111111] mb-6">
              Ce que disent nos utilisateurs.
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg shadow-gray-100">
              <div className="text-3xl md:text-4xl font-mono font-bold text-[#FF6B00]">15K+</div>
              <div className="text-sm text-[#111111]/70 mt-1">Véhicules enregistrés</div>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg shadow-gray-100">
              <div className="text-3xl md:text-4xl font-mono font-bold text-[#FF0080]">500+</div>
              <div className="text-sm text-[#111111]/70 mt-1">Garages partenaires</div>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg shadow-gray-100">
              <div className="text-3xl md:text-4xl font-mono font-bold text-[#00E5FF]">0%</div>
              <div className="text-sm text-[#111111]/70 mt-1">Fraude détectée</div>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg shadow-gray-100">
              <div className="text-3xl md:text-4xl font-mono font-bold text-[#6200EA]">98%</div>
              <div className="text-sm text-[#111111]/70 mt-1">Satisfaction client</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Amadou Diallo',
                role: 'Conducteur, Dakar',
                text: 'Grâce à OKAR, j\'ai vendu ma voiture 15% plus cher. L\'historique certifié a rassuré l\'acheteur en 2 minutes.',
                color: '#FF6B00',
                initials: 'AD'
              },
              {
                name: 'Fatou Sow',
                role: 'Propriétaire, Thiès',
                text: 'Plus jamais d\'oubli de révision ! Les rappels automatiques m\'ont sauvé plusieurs fois. Indispensable.',
                color: '#FF0080',
                initials: 'FS'
              },
              {
                name: 'Garage Central',
                role: 'Partenaire certifié',
                text: 'En 6 mois, nous avons attiré 200+ nouveaux clients grâce à notre certification OKAR. Excellent investissement.',
                color: '#00E5FF',
                initials: 'GC'
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 md:p-8 shadow-lg shadow-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                  ))}
                </div>
                <p className="text-[#111111]/80 mb-6 italic">&quot;{testimonial.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: testimonial.color }}
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="font-bold text-[#111111]">{testimonial.name}</div>
                    <div className="text-sm text-[#111111]/60">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FOOTER ===== */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Prêt à rouler en toute confiance ?
          </h2>
          <p className="text-lg text-white/70 mb-10">
            Rejoignez des milliers de conducteurs et garages qui font confiance à OKAR.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscrire">
              <button className="w-full sm:w-auto px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-[#FF6B00] to-[#FF0080] rounded-full hover:shadow-lg hover:shadow-[#FF6B00]/30 transition-all duration-200 flex items-center justify-center gap-2">
                Rechercher un véhicule
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/devenir-partenaire">
              <button className="w-full sm:w-auto px-10 py-5 text-lg font-semibold text-[#111111] bg-white rounded-full hover:bg-gray-100 transition-all duration-200">
                Espace Garage
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="contact" className="bg-[#0a0a0a] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B00] to-[#FF0080] rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-serif font-bold">OKAR</span>
              </div>
              <p className="text-sm text-white/60">
                Le passeport numérique automobile. Certifiez l&apos;histoire de votre véhicule.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-[#FFD700] mb-4 text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="/devenir-partenaire" className="hover:text-white transition-colors">Garages</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-[#FFD700] mb-4 text-sm">Entreprise</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Presse</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-[#FFD700] mb-4 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#00E5FF]" />
                  +221 77 123 45 67
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#FF6B00]" />
                  contact@okar.sn
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} OKAR. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF6B00] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#00E5FF] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF0080] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FFD700] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
