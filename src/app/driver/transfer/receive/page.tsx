'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  ArrowLeft,
  Tag,
  User,
  Phone,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Info
} from 'lucide-react';

interface ValidationResult {
  id: string;
  vehicle: {
    reference: string;
    make: string;
    model: string;
    licensePlate: string;
  };
  sellerName: string;
  status: string;
  buyerName: string;
  buyerPhone: string;
}

export default function ReceiveVehiclePage() {
  const router = useRouter();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    phone: ''
  });
  const [step, setStep] = useState(1); // 1: Code, 2: Infos, 3: Success

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newCode = [...code];
      digits.split('').forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleValidateCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez entrer les 6 chiffres du code');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/transfer/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fullCode,
          buyerName: buyerInfo.name,
          buyerPhone: buyerInfo.phone
        })
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult(data.transfer);
        setStep(3);
      } else if (data.transfer?.vehicle) {
        // Code valid but needs buyer info
        setValidationResult(data.transfer);
        setStep(2);
      } else {
        setError(data.error || 'Code invalide');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmReception = async () => {
    if (!buyerInfo.name || !buyerInfo.phone) {
      setError('Veuillez remplir vos informations');
      return;
    }

    await handleValidateCode();
  };

  const handleFinalConfirmation = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real scenario, this would call an API to notify the seller
      // For now, we simulate success
      setSuccess(true);
    } catch (err) {
      setError('Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/driver/transfert')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Tag className="w-7 h-7 text-orange-500" />
          Recevoir un véhicule
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Saisissez le code de transfert fourni par le vendeur.
        </p>
      </div>

      {/* Step 1: Code Input */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 text-center">
            Entrez le code de transfert
          </h3>

          {/* Code Input */}
          <div className="flex justify-center gap-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-800 
                  border-2 border-slate-200 dark:border-slate-700 rounded-xl 
                  focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20
                  text-slate-800 dark:text-white"
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleValidateCode}
            disabled={validating || code.join('').length !== 6}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl 
              font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {validating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Vérifier le code
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Buyer Info */}
      {step === 2 && validationResult && (
        <div className="space-y-6">
          {/* Vehicle Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-medium text-slate-500 text-sm mb-4">Véhicule à recevoir</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Car className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-lg">
                  {validationResult.vehicle.make} {validationResult.vehicle.model}
                </p>
                <p className="text-slate-500">{validationResult.vehicle.licensePlate}</p>
                <p className="text-sm text-slate-400">Réf: {validationResult.vehicle.reference}</p>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5">
            <h4 className="font-medium text-slate-500 text-sm mb-3">Vendeur actuel</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-500/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white">
                  {validationResult.sellerName}
                </p>
              </div>
            </div>
          </div>

          {/* Buyer Info Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
              Vos informations
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Votre nom complet *
                </label>
                <input
                  type="text"
                  value={buyerInfo.name}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                  placeholder="Fatou Diop"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 
                    dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 
                    focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Votre téléphone *
                </label>
                <div className="flex gap-2">
                  <span className="px-4 py-4 bg-slate-100 dark:bg-slate-700 border border-slate-200 
                    dark:border-slate-700 rounded-xl text-slate-500">
                    +221
                  </span>
                  <input
                    type="tel"
                    value={buyerInfo.phone}
                    onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                    placeholder="78 987 65 43"
                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 
                      dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 
                      focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-xl p-3 mt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmReception}
              disabled={loading || !buyerInfo.name || !buyerInfo.phone}
              className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl 
                font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmer la réception
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success / Pending Confirmation */}
      {step === 3 && validationResult && (
        <div className="space-y-6">
          <div className={`rounded-2xl p-6 text-center ${success ? 'bg-emerald-500' : 'bg-amber-500'}`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {success ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {success ? 'Transfert confirmé !' : 'En attente de confirmation'}
            </h2>
            <p className="text-white/80">
              {success 
                ? 'Le passeport numérique a été transféré à votre nom.'
                : 'Le vendeur doit confirmer le transfert pour finaliser.'}
            </p>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-medium text-slate-500 text-sm mb-4">Véhicule</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Car className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-lg">
                  {validationResult.vehicle.make} {validationResult.vehicle.model}
                </p>
                <p className="text-slate-500">{validationResult.vehicle.licensePlate}</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {success ? 'Prochaines étapes' : 'Comment ça marche ?'}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  {success 
                    ? 'Vous pouvez maintenant consulter l\'historique complet du véhicule et ajouter des interventions.'
                    : 'Le vendeur a reçu une notification. Une fois sa confirmation reçue, vous deviendrez le nouveau propriétaire du passeport numérique.'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/driver/tableau-de-bord')}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      )}

      {/* Security Info */}
      {step !== 3 && (
        <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                Transfert sécurisé
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Le code de transfert est valide pendant 48 heures. Le vendeur doit confirmer 
                le transfert pour finaliser la transaction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
