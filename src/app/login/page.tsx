'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, QrCode, Eye, EyeOff, Car } from 'lucide-react';

// Inner component that uses useSearchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();
  const role = searchParams.get('role') || 'garage';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If already logged in, redirect to appropriate dashboard
    if (user) {
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        router.replace('/admin/tableau-de-bord');
      } else if (user.role === 'garage') {
        router.replace('/garage/tableau-de-bord');
      } else if (user.role === 'agency') {
        router.replace('/agence/tableau-de-bord');
      } else if (user.role === 'driver') {
        router.replace('/driver/tableau-de-bord');
      } else {
        router.replace('/');
      }
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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        
        // Redirect based on role
        if (['superadmin', 'admin', 'agent'].includes(data.user.role)) {
          router.push('/admin/tableau-de-bord');
        } else if (data.user.role === 'garage') {
          router.push('/garage/tableau-de-bord');
        } else if (data.user.role === 'agency') {
          router.push('/agence/tableau-de-bord');
        } else if (data.user.role === 'driver') {
          router.push('/driver/tableau-de-bord');
        } else {
          router.push('/');
        }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          <span className="text-slate-500">Vérification...</span>
        </div>
      </div>
    );
  }

  // Don't show login form if already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          <span className="text-slate-500">Redirection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B00] to-[#FF0080] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-800">OKAR</span>
          </Link>
          <p className="text-slate-500 mt-2">Connectez-vous à votre espace</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          {/* Role Tabs */}
          <div className="flex gap-2 mb-6">
            <Link 
              href="/login?role=garage"
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium text-center transition-all ${
                role === 'garage' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Garage
            </Link>
            <Link 
              href="/login?role=admin"
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium text-center transition-all ${
                role === 'admin' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admin
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF0080] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link href="/forgot-password" className="text-sm text-slate-500 hover:text-orange-500">
              Mot de passe oublié ?
            </Link>
            <p className="text-sm text-slate-500">
              Pas encore de compte ?{' '}
              <Link href="/devenir-partenaire" className="text-orange-500 font-medium hover:underline">
                Devenir partenaire
              </Link>
            </p>
          </div>
        </div>

        {/* Quick Access Links */}
        <div className="mt-6 flex justify-center gap-4 text-sm">
          <Link href="/admin/connexion" className="text-slate-500 hover:text-purple-500">
            Espace Admin
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/garage/connexion" className="text-slate-500 hover:text-orange-500">
            Espace Garage
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        <span className="text-slate-500">Chargement...</span>
      </div>
    </div>
  );
}

// Main page with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}
