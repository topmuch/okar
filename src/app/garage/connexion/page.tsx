'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Eye,
  EyeOff,
  Loader2,
  Wrench,
  Car,
  Smartphone
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

// Garage Login Features
const garageFeatures = [
  { icon: "📷", title: "Scan Rapide", desc: "Scannez les QR codes des véhicules instantanément" },
  { icon: "🔧", title: "Interventions", desc: "Enregistrez toutes vos réparations et entretiens" },
  { icon: "📋", title: "Historique complet", desc: "Suivez l'historique de chaque véhicule" },
  { icon: "📱", title: "PWA Mobile", desc: "Interface optimisée pour tablettes et mobiles" }
];

export default function GarageLoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in as garage
  useEffect(() => {
    if (!authLoading && user && user.role === 'garage') {
      router.replace('/garage/tableau-de-bord');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          role: 'garage'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Use the auth context login function
        login(data.user);
        
        // Redirect to dashboard
        router.push('/garage/tableau-de-bord');
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Left Column - Orange Demo Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#ff7f00] to-[#ff5500] text-white p-8 md:p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            AutoPass — Garage
          </h2>
          
          {/* Demo Illustration */}
          <div className="relative mb-8">
            <div className="w-full h-80 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <div className="text-center p-6">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/20">
                    <Wrench className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold">Gestion Simplifiée</span>
                </div>
                <p className="text-white/90 max-w-sm text-lg">
                  Gérez vos interventions, vos clients et vos stocks de QR codes depuis un seul endroit.
                </p>
              </div>
            </div>
            
            {/* Badge */}
            <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Optimisé Mobile • Hors-ligne
            </div>
          </div>

          {/* Features List */}
          <ul className="space-y-4 text-white/90">
            {garageFeatures.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm opacity-80">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#ff7f00] flex items-center justify-center">
                <Car className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Espace Garage</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">Connexion sécurisée pour les garages certifiés</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00] focus:border-transparent transition"
                placeholder="garage@autopass.sn"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00] focus:border-transparent transition pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-slate-300 accent-[#ff7f00]"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Se souvenir de moi</span>
              </label>
              <Link 
                href="/forgot-password" 
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#ff7f00] dark:hover:text-[#ff7f00]"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff7f00] text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-[#e67300] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Admin */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vous êtes administrateur ?{' '}
              <Link href="/admin/connexion" className="font-medium text-slate-900 dark:text-white hover:text-[#ff7f00]">
                Connexion Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
