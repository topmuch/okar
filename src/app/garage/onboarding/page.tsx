'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  Phone,
  MapPin,
  Loader2,
  CheckCircle,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Play,
} from 'lucide-react';

// Senegal cities
const CITIES = [
  'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor',
  'Touba', 'Rufisque', 'Mbour', 'Diourbel', 'Tambacounda',
  'Kolda', 'Sédhiou', 'Kédougou', 'Matam', 'Fatick',
  'Louga', 'Kaffrine', 'Autre'
];

export default function SimplifiedGarageOnboarding() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: 'Dakar',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [demoCredentials, setDemoCredentials] = useState<{
    email: string;
    password: string;
    garageId: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Le nom du garage est obligatoire');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Le numéro de téléphone est obligatoire');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/garage/demo-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }
      
      setDemoCredentials({
        email: data.credentials.email,
        password: data.credentials.password,
        garageId: data.garageId,
      });
      setSuccess(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  // Success state - Demo Mode activated
  if (success && demoCredentials) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Success Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-[#FF6600] to-[#FF8533] p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Compte créé !
              </h1>
              <p className="text-white/80">
                Votre garage est en mode démonstration
              </p>
            </div>
            
            {/* Demo Mode Badge */}
            <div className="px-6 pt-6">
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Play className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-amber-400">MODE DÉMO ACTIF</span>
              </div>
            </div>
            
            {/* Credentials */}
            <div className="p-6 space-y-4">
              <p className="text-zinc-400 text-center text-sm">
                Vos identifiants de connexion temporaires :
              </p>
              
              <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Email</p>
                  <p className="font-mono text-white">{demoCredentials.email}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Mot de passe temporaire</p>
                  <p className="font-mono text-white text-lg">{demoCredentials.password}</p>
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Note :</strong> Pour accéder à toutes les fonctionnalités et certifier vos interventions, 
                  un administrateur doit valider votre compte sous 24-48h.
                </p>
              </div>
              
              <button
                onClick={() => router.push('/garage/connexion')}
                className="w-full py-4 bg-gradient-to-r from-[#FF6600] to-[#FF8533] text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                Accéder à mon espace
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF6600] to-[#FF8533] py-12 px-6">
        <div className="max-w-md mx-auto text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="text-4xl font-black text-white">OKAR</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Rejoignez OKAR
          </h1>
          <p className="text-white/80">
            Créez votre compte garage en 30 secondes
          </p>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-4">
        <div className="max-w-2xl mx-auto px-6 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <Zap className="w-5 h-5 text-[#FF6600]" />
            <span className="text-sm">Accès immédiat</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <Shield className="w-5 h-5 text-[#FF6600]" />
            <span className="text-sm">Mode démo sécurisé</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-5 h-5 text-[#FF6600]" />
            <span className="text-sm">Validation rapide</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Garage Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Nom du garage *
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Garage Auto Plus"
                  className="w-full p-4 pl-12 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Téléphone WhatsApp *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+221 78 123 45 67"
                  className="w-full p-4 pl-12 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Ville *
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-4 pl-12 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#FF6600] to-[#FF8533] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Démarrer en mode démo
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-amber-400 text-sm text-center">
            <strong>Mode Démo :</strong> Explorez OKAR avec des données fictives. 
            Votre compte sera validé par notre équipe sous 24-48h.
          </p>
        </div>

        {/* Full registration link */}
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            Déjà vos documents ?{' '}
            <Link href="/register/garage" className="text-[#FF6600] hover:underline font-medium">
              Inscription complète
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-zinc-600">
          <p>
            Déjà inscrit ?{' '}
            <Link href="/garage/connexion" className="text-[#FF6600] hover:underline">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
