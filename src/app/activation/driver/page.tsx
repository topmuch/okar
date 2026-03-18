'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Car,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  User
} from 'lucide-react';

function DriverActivationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('p');
  
  const [step, setStep] = useState(1); // 1: Welcome, 2: Set Password, 3: Tutorial, 4: Success
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Driver and vehicle info from token
  const [driverInfo, setDriverInfo] = useState({
    name: 'Amadou Diallo',
    phone: '+221 78 123 45 67',
    garageName: 'Garage AutoMec Dakar',
  });
  
  const [vehicleInfo, setVehicleInfo] = useState({
    make: 'Toyota',
    model: 'Corolla',
    licensePlate: 'DK-4521-BJ',
    year: '2020',
  });
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '']);

  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    // In production, validate token and fetch driver/vehicle info
    const validateToken = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (err) {
        setError('Lien d\'activation invalide ou expiré');
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = () => {
    if (password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Le mot de passe doit contenir au moins une majuscule';
    }
    if (!/[0-9]/.test(password)) {
      return 'Le mot de passe doit contenir au moins un chiffre';
    }
    if (password !== confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }
    return null;
  };

  const handleActivate = async () => {
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setActivating(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep(3); // Go to tutorial
    } catch (err) {
      setError('Erreur lors de l\'activation. Veuillez réessayer.');
    } finally {
      setActivating(false);
    }
  };

  const handleOtpVerify = async () => {
    const code = otpCode.join('');
    if (code.length !== 4) {
      setError('Veuillez entrer le code complet');
      return;
    }

    setActivating(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep(3);
    } catch (err) {
      setError('Code incorrect. Veuillez réessayer.');
    } finally {
      setActivating(false);
    }
  };

  const tutorials = [
    {
      title: 'Votre Passeport Numérique',
      description: 'Scannez le QR code de votre véhicule pour voir son historique complet. Partagez-le avec un acheteur potentiel !',
      icon: Car,
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Validez Chaque Intervention',
      description: 'Votre garage vous envoie les factures. Vous les validez en un clic. Seules les interventions validées sont visibles publiquement.',
      icon: CheckCircle,
      color: 'from-emerald-500 to-green-500',
    },
    {
      title: 'Historique Sécurisé',
      description: 'Chaque intervention est horodatée, signée électroniquement et stockée de manière infalsifiable. Idéal pour la revente !',
      icon: Shield,
      color: 'from-purple-500 to-violet-500',
    },
  ];

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-500 to-amber-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Vérification du lien d&apos;activation...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error && step === 1) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Lien invalide</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </main>
    );
  }

  // Step 1: Welcome screen with password setup
  if (step === 1) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-500 to-amber-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Car className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Bienvenue sur OKAR !</h1>
            <p className="text-white/80 mt-2">Votre passeport véhicule vous attend.</p>
          </div>

          {/* Vehicle Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xl mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <Car className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {vehicleInfo.make} {vehicleInfo.model}
                </h2>
                <p className="text-slate-500">Immatriculation : {vehicleInfo.licensePlate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600">Enregistrée par {driverInfo.garageName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600">Passeport actif</span>
            </div>
          </div>

          {/* Password Setup */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-orange-500" />
              Définissez votre mot de passe
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Minimum 8 caractères, 1 majuscule, 1 chiffre
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>

            <button
              onClick={handleActivate}
              disabled={activating || !password || !confirmPassword}
              className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {activating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Activation...
                </>
              ) : (
                <>
                  Activer mon compte
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">──────── OU ────────</p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-600 mb-3 text-center">
                J&apos;ai déjà un code reçu par SMS
              </p>
              <div className="flex justify-center gap-2 mb-4">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otpCode];
                      newOtp[index] = e.target.value.toUpperCase();
                      setOtpCode(newOtp);
                      if (e.target.value && index < 3) {
                        const nextInput = document.getElementById(`otp-${index + 1}`);
                        nextInput?.focus();
                      }
                    }}
                    id={`otp-${index}`}
                    className="w-12 h-12 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                ))}
              </div>
              <button
                onClick={handleOtpVerify}
                disabled={activating || otpCode.join('').length !== 4}
                className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Vérifier le code
              </button>
            </div>
          </div>

          <p className="text-center text-white/60 text-sm mt-6">
            ⚠️ Ce lien expire dans 24 heures
          </p>
        </div>
      </main>
    );
  }

  // Step 3: Tutorial
  if (step === 3) {
    const tutorial = tutorials[tutorialStep];
    const Icon = tutorial.icon;

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {tutorials.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === tutorialStep ? 'bg-orange-500' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Tutorial card */}
          <div className={`w-24 h-24 bg-gradient-to-br ${tutorial.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <Icon className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            {tutorial.title}
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            {tutorial.description}
          </p>

          {/* Navigation */}
          <div className="flex gap-3">
            {tutorialStep > 0 && (
              <button
                onClick={() => setTutorialStep(tutorialStep - 1)}
                className="flex-1 py-4 border border-white/20 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                Précédent
              </button>
            )}
            <button
              onClick={() => {
                if (tutorialStep < tutorials.length - 1) {
                  setTutorialStep(tutorialStep + 1);
                } else {
                  setStep(4);
                }
              }}
              className={`flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                tutorialStep === 0 ? 'w-full' : ''
              }`}
            >
              {tutorialStep < tutorials.length - 1 ? (
                <>
                  Suivant
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Commencer
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Step 4: Success - Redirect to dashboard
  if (step === 4) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-500 to-green-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Compte activé !</h1>
          <p className="text-white/80 text-lg mb-8">
            Bienvenue {driverInfo.name}
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">
                  {vehicleInfo.make} {vehicleInfo.model}
                </p>
                <p className="text-white/60">{vehicleInfo.licensePlate}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/driver/tableau-de-bord')}
            className="w-full py-4 bg-white text-emerald-600 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors"
          >
            Accéder à mon passeport
          </button>
        </div>
      </main>
    );
  }

  return null;
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-500 to-amber-600 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p>Chargement...</p>
      </div>
    </main>
  );
}

export default function DriverActivationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DriverActivationContent />
    </Suspense>
  );
}
