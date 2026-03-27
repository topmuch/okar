'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, Car } from 'lucide-react';

// ============================================
// Login Content Component
// ============================================
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login } = useAuth();
  const role = searchParams.get('role') || 'garage';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ============================================
  // REDIRECTION - PATIENTE
  // ============================================
  useEffect(() => {
    console.log('[LOGIN] Effect:', { loading, hasUser: !!user, userRole: user?.role });

    // 1. SI ÇA CHARGE ENCORE : On ne fait RIEN
    if (loading) {
      console.log('[LOGIN] ⏳ En attente du chargement...');
      return;
    }

    // 2. SI USER EXISTE APRÈS CHARGEMENT = REDIRECTION
    if (!loading && user) {
      console.log('[LOGIN] ✅ Utilisateur déjà connecté:', user.email, user.role);
      
      let dashboardPath = '/';
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        dashboardPath = '/admin/tableau-de-bord';
      } else if (user.role === 'garage') {
        dashboardPath = '/garage/tableau-de-bord';
      } else if (user.role === 'agency') {
        dashboardPath = '/agence/tableau-de-bord';
      } else if (user.role === 'driver') {
        dashboardPath = '/driver/tableau-de-bord';
      }
      
      console.log('[LOGIN] 🔀 Redirection vers:', dashboardPath);
      router.replace(dashboardPath);
    }
  }, [user, loading, router]);

  // ============================================
  // Handle login form submission
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    console.log('[LOGIN] 📝 Soumission du formulaire pour:', email);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRUCIAL pour recevoir le cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('[LOGIN] 📨 Réponse:', { success: data.success, role: data.user?.role });

      if (response.ok && data.success) {
        // Mettre à jour le contexte
        login(data.user);
        
        // Déterminer la destination
        let dashboardPath = '/';
        if (['superadmin', 'admin', 'agent'].includes(data.user.role)) {
          dashboardPath = '/admin/tableau-de-bord';
        } else if (data.user.role === 'garage') {
          dashboardPath = '/garage/tableau-de-bord';
        } else if (data.user.role === 'agency') {
          dashboardPath = '/agence/tableau-de-bord';
        } else if (data.user.role === 'driver') {
          dashboardPath = '/driver/tableau-de-bord';
        }
        
        console.log('[LOGIN] 🔀 Redirection après login vers:', dashboardPath);
        router.push(dashboardPath);
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('[LOGIN] ❌ Erreur:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // AFFICHAGE PENDANT LE CHARGEMENT
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Vérification de votre session...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // SI USER EXISTE = REDIRECTION EN COURS
  // ============================================
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Redirection vers votre espace...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // FORMULAIRE DE LOGIN
  // ============================================
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
                autoComplete="email"
                disabled={submitting}
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
                  autoComplete="current-password"
                  disabled={submitting}
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
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF0080] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
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

// ============================================
// Loading Fallback
// ============================================
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
        <p className="mt-4 text-slate-600 font-medium">Chargement...</p>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}
