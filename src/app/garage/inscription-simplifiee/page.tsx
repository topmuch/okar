'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, User, Phone, MapPin, ArrowRight, 
  Loader2, CheckCircle, Sparkles, Play, Shield,
  Clock, Star, MessageCircle
} from 'lucide-react'

const OKAR_ORANGE = '#FF6600'

// Senegal cities
const senegalCities = [
  'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor',
  'Touba', 'Rufisque', 'Mbour', 'Diourbel', 'Louga',
  'Tambacounda', 'Kolda', 'Sédhiou', 'Kédougou', 'Matam'
]

export default function GarageSimplifiedOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Quick form, 2: Demo mode
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Minimal form data
  const [formData, setFormData] = useState({
    garageName: '',
    managerPhone: '',
    city: 'Dakar'
  })

  // Demo data generated after quick signup
  const [demoAccount, setDemoAccount] = useState<{
    email: string
    tempPassword: string
    garageId: string
  } | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validatePhone = (phone: string): boolean => {
    // Senegal phone format: +221 XX XXX XX XX or 77/78/76/70 XXX XX XX
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 9 && cleaned.length <= 12
  }

  const submitQuickOnboarding = async () => {
    if (!formData.garageName.trim()) {
      setError('Le nom du garage est requis')
      return
    }

    if (!validatePhone(formData.managerPhone)) {
      setError('Numéro de téléphone invalide')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/register/garage/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.garageName.trim(),
          phone: formData.managerPhone.replace(/\D/g, ''),
          city: formData.city
        })
      })

      const data = await response.json()

      if (data.success) {
        setDemoAccount({
          email: data.credentials.email,
          tempPassword: data.credentials.tempPassword,
          garageId: data.garage.id
        })
        setStep(2) // Show demo mode
      } else {
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const startDemo = () => {
    // Store demo credentials in sessionStorage
    sessionStorage.setItem('demo_email', demoAccount?.email || '')
    sessionStorage.setItem('demo_password', demoAccount?.tempPassword || '')
    
    // Redirect to demo dashboard
    router.push('/garage/tableau-de-bord?demo=true')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center"
          >
            <Building2 className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Inscription Garage</h1>
            <p className="text-xs text-zinc-500">3 minutes pour commencer</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Step 1: Quick Form */}
        {step === 1 && (
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF6600] to-[#FF8533] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Bienvenue chez OKAR
              </h2>
              <p className="text-zinc-400">
                Rejoignez le réseau de garages certifiés du Sénégal
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-sm text-zinc-500 mb-4">Ce que vous obtenez:</p>
              <div className="space-y-3">
                {[
                  { icon: Play, text: 'Accès immédiat en mode Démo' },
                  { icon: Shield, text: 'Certification OKAR gratuite' },
                  { icon: Star, text: 'Profil public avec SEO inclus' },
                  { icon: MessageCircle, text: 'Alertes clients automatiques' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#FF6600]/10 rounded-lg flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-[#FF6600]" />
                    </div>
                    <span className="text-zinc-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Garage Name */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Nom du garage *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.garageName}
                    onChange={(e) => handleChange('garageName', e.target.value)}
                    placeholder="Ex: Garage AutoPro"
                    className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Téléphone (WhatsApp) *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => handleChange('managerPhone', e.target.value)}
                    placeholder="77 123 45 67"
                    className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Ville</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <select
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] outline-none appearance-none"
                  >
                    {senegalCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-5 h-5 text-red-400">⚠️</div>
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={submitQuickOnboarding}
                disabled={loading || !formData.garageName || !formData.managerPhone}
                className="w-full py-4 bg-gradient-to-r from-[#FF6600] to-[#FF8533] rounded-xl text-white font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    Commencer en mode Démo
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Already have account */}
            <p className="text-center text-zinc-500 text-sm">
              Déjà inscrit?{' '}
              <Link href="/garage/connexion" className="text-[#FF6600] font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Demo Mode Activated */}
        {step === 2 && demoAccount && (
          <div className="space-y-8">
            {/* Success Animation */}
            <div className="text-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Compte créé !
              </h2>
              <p className="text-zinc-400">
                Votre garage est en mode Démo pendant la validation
              </p>
            </div>

            {/* Demo Badge */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded">
                    MODE DÉMO
                  </span>
                  <p className="text-zinc-400 text-sm mt-1">Accès immédiat pendant la validation</p>
                </div>
              </div>
              
              <p className="text-zinc-300 text-sm">
                Explorez toutes les fonctionnalités OKAR avec des données fictives. 
                Votre compte sera validé sous 24-48h.
              </p>
            </div>

            {/* Credentials */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-sm text-zinc-500 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Vos identifiants de connexion
              </p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Email</p>
                  <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                    <span className="font-mono text-white">{demoAccount.email}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(demoAccount.email)}
                      className="text-xs text-[#FF6600] hover:underline"
                    >
                      Copier
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Mot de passe temporaire</p>
                  <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                    <span className="font-mono text-white">{demoAccount.tempPassword}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(demoAccount.tempPassword)}
                      className="text-xs text-[#FF6600] hover:underline"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-sm text-zinc-500 mb-4">Prochaines étapes</p>
              <div className="space-y-3">
                {[
                  { num: 1, text: 'Testez OKAR en mode Démo', done: true },
                  { num: 2, text: 'Notre équipe vous contacte par WhatsApp', done: false },
                  { num: 3, text: 'Validation et certification', done: false }
                ].map((item) => (
                  <div key={item.num} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.done 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {item.done ? <CheckCircle className="w-4 h-4" /> : item.num}
                    </div>
                    <span className={item.done ? 'text-zinc-300' : 'text-zinc-500'}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={startDemo}
              className="w-full py-4 bg-gradient-to-r from-[#FF6600] to-[#FF8533] rounded-xl text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Démarrer le Mode Démo
            </button>

            {/* Validation time */}
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
              <Clock className="w-4 h-4" />
              Validation sous 24-48h ouvrées
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
