'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Loader2,
  Wrench,
  Car
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

export default function GarageLoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        login(data.user);
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#121214' }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#FF6600] animate-spin mx-auto" />
          <p className="text-[#B0B0B0] mt-4">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#121214' }}>
      {/* Left Column - Orange Demo Section */}
      <div className="hidden lg:flex lg:w-1/2 text-white p-8 md:p-12 flex-col justify-center" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            OKAR — Espace Garage
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
          </div>

          {/* Features List */}
          <ul className="space-y-4 text-white/90">
            <li className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📷</span>
              <div>
                <h3 className="font-semibold text-white">Scan Rapide</h3>
                <p className="text-sm opacity-80">Scannez les QR codes des véhicules instantanément</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🔧</span>
              <div>
                <h3 className="font-semibold text-white">Interventions</h3>
                <p className="text-sm opacity-80">Enregistrez toutes vos réparations et entretiens</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📋</span>
              <div>
                <h3 className="font-semibold text-white">Historique complet</h3>
                <p className="text-sm opacity-80">Suivez l'historique de chaque véhicule</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10" style={{ backgroundColor: '#1E1E24' }}>
        <div className="w-full max-w-md">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)' }}>
                <Car className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Espace Garage</h1>
            </div>
            <p className="text-[#B0B0B0]">Connexion sécurisée pour les garages certifiés</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-medium text-red-400">Connexion impossible</p>
                  <p className="mt-1 text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[#B0B0B0] text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border rounded-xl text-white placeholder-[#6B6B75] focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent transition"
                style={{ backgroundColor: '#121214', borderColor: '#2A2A35' }}
                placeholder="garage@autopass.sn"
                required
              />
            </div>

            <div>
              <label className="block text-[#B0B0B0] text-sm font-medium mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border rounded-xl text-white placeholder-[#6B6B75] focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent transition pr-12"
                  style={{ backgroundColor: '#121214', borderColor: '#2A2A35' }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B75] hover:text-[#B0B0B0]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FF6600, #FF8533)', boxShadow: '0 10px 30px -5px rgba(255, 102, 0, 0.4)' }}
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

          {/* Test credentials hint */}
          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#121214', border: '1px solid #2A2A35' }}>
            <p className="text-sm text-[#6B6B75] text-center">
              <strong className="text-[#B0B0B0]">Test :</strong> garage@autopass.sn / password123
            </p>
          </div>

          {/* Switch to Admin */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B6B75]">
              Vous êtes administrateur ?{' '}
              <Link href="/admin/connexion" className="font-medium text-white hover:text-[#FF6600]">
                Connexion Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
