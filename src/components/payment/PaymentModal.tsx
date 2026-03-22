'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Check, AlertCircle, Phone, MessageCircle } from 'lucide-react';

// Types
type PaymentProvider = 'ORANGE_MONEY' | 'WAVE' | 'CINETPAY' | 'FREE_MONEY' | 'WHATSAPP';
type TransactionType = 'REPORT' | 'SUB_GARAGE' | 'BOOST' | 'VERIFICATION' | 'FLEET' | 'LEAD';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  type: TransactionType;
  amount: number;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  promoCode?: string;
  onSuccess?: (transactionId: string) => void;
}

interface PaymentSettings {
  whatsapp_number: string;
  whatsapp_message: string;
  orange_money_number: string;
  wave_number: string;
  free_money_number: string;
}

// Configuration des providers
const PROVIDERS: { id: PaymentProvider; name: string; logo: string; color: string }[] = [
  { id: 'ORANGE_MONEY', name: 'Orange Money', logo: '/icons/orange-money.svg', color: '#FF6600' },
  { id: 'WAVE', name: 'Wave', logo: '/icons/wave.svg', color: '#1DC8F2' },
  { id: 'FREE_MONEY', name: 'Free Money', logo: '/icons/free-money.svg', color: '#CD1E25' },
  { id: 'WHATSAPP', name: 'WhatsApp', logo: '/icons/whatsapp.svg', color: '#25D366' },
];

export function PaymentModal({
  open,
  onClose,
  type,
  amount,
  title,
  description,
  metadata,
  promoCode,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'whatsapp' | 'processing' | 'success' | 'error'>('details');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('WHATSAPP');
  const [phone, setPhone] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState(promoCode || '');
  const [discount, setDiscount] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [ussdCode, setUssdCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  const finalAmount = amount - discount;

  // Fetch payment settings on mount
  useEffect(() => {
    if (open) {
      fetchPaymentSettings();
    }
  }, [open]);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.settings) {
        setPaymentSettings({
          whatsapp_number: data.settings.whatsapp_number || '',
          whatsapp_message: data.settings.whatsapp_message || '',
          orange_money_number: data.settings.orange_money_number || '',
          wave_number: data.settings.wave_number || '',
          free_money_number: data.settings.free_money_number || '',
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput) return;

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput,
          type,
          amount,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setDiscount(data.discount);
      } else {
        setError(data.message || 'Code promo invalide');
      }
    } catch (err) {
      setError('Erreur lors de la validation du code promo');
    }
  };

  // Generate WhatsApp URL with pre-configured message
  const generateWhatsAppUrl = () => {
    if (!paymentSettings?.whatsapp_number) {
      return null;
    }
    
    // Get the number for the selected provider
    let paymentNumber = '';
    if (selectedProvider === 'ORANGE_MONEY') {
      paymentNumber = paymentSettings.orange_money_number || '';
    } else if (selectedProvider === 'WAVE') {
      paymentNumber = paymentSettings.wave_number || '';
    } else if (selectedProvider === 'FREE_MONEY') {
      paymentNumber = paymentSettings.free_money_number || '';
    }
    
    // Replace variables in the message
    let message = paymentSettings.whatsapp_message
      .replace('{montant}', finalAmount.toLocaleString('fr-FR'))
      .replace('{type}', title)
      .replace('{reference}', metadata?.vehicleId || metadata?.reportId || 'N/A');
    
    // Add payment method info
    const providerName = PROVIDERS.find(p => p.id === selectedProvider)?.name || selectedProvider;
    message += `\n\nMode de paiement choisi: ${providerName}`;
    if (paymentNumber) {
      message += `\nNuméro: ${paymentNumber}`;
    }
    
    // Clean phone number for WhatsApp URL
    const cleanPhone = paymentSettings.whatsapp_number.replace(/[^0-9]/g, '');
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  };

  const handleSelectPaymentMethod = () => {
    // Redirect to WhatsApp
    const whatsappUrl = generateWhatsAppUrl();
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
      setStep('whatsapp');
    } else {
      setError('Configuration WhatsApp non disponible. Veuillez contacter l\'administrateur.');
    }
  };

  const handleConfirmPayment = () => {
    // Mark as success after user confirms they sent the message
    setStep('success');
    // Generate a transaction ID for reference
    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    setTransactionId(txId);
    onSuccess?.(txId);
  };

  const handleInitiatePayment = async () => {
    if (!phone) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    // Validation du numéro sénégalais
    const phoneRegex = /^(\+221|221)?[37][0-9]{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setIsLoading(true);
    setError('');
    setStep('processing');

    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount,
          phone,
          provider: selectedProvider,
          metadata,
          promoCode: promoCodeInput || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTransactionId(data.transaction.id);
        if (data.transaction.ussdCode) {
          setUssdCode(data.transaction.ussdCode);
        }
        
        // Poll pour vérifier le statut
        pollPaymentStatus(data.transaction.id);
      } else {
        setError(data.error || 'Erreur lors de l\'initiation du paiement');
        setStep('error');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (txId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/payment/status/${txId}`);
        const data = await response.json();

        if (data.transaction?.status === 'SUCCESS') {
          setStep('success');
          onSuccess?.(txId);
          return;
        }

        if (data.transaction?.status === 'FAILED') {
          setError('Le paiement a échoué');
          setStep('error');
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setError('Délai d\'attente dépassé. Vérifiez vos notifications.');
          setStep('error');
        }
      } catch (err) {
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const resetModal = () => {
    setStep('details');
    setPhone('');
    setPromoCodeInput('');
    setDiscount(0);
    setTransactionId('');
    setUssdCode('');
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* Step: Details */}
        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Montant */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="font-medium">Montant</span>
                <span className="text-2xl font-bold text-blue-600">
                  {amount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {/* Code Promo */}
              <div className="flex gap-2">
                <Input
                  placeholder="Code promo (optionnel)"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                />
                <Button variant="outline" onClick={handleApplyPromoCode}>
                  Appliquer
                </Button>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Réduction</span>
                  <span className="font-medium">-{discount.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total à payer</span>
                <span className="text-blue-600">
                  {finalAmount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setStep('payment')}
              >
                Continuer
              </Button>
            </div>
          </>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <>
            <DialogHeader>
              <DialogTitle>Choisir le mode de paiement</DialogTitle>
              <DialogDescription>
                Montant: {finalAmount.toLocaleString('fr-FR')} FCFA
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Providers */}
              <RadioGroup
                value={selectedProvider}
                onValueChange={(v) => setSelectedProvider(v as PaymentProvider)}
                className="grid grid-cols-2 gap-3"
              >
                {PROVIDERS.map((provider) => (
                  <Label
                    key={provider.id}
                    htmlFor={provider.id}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProvider === provider.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value={provider.id} id={provider.id} className="sr-only" />
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: provider.color }}
                    >
                      {provider.name.substring(0, 2)}
                    </div>
                    <span className="text-sm font-medium">{provider.name}</span>
                  </Label>
                ))}
              </RadioGroup>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                  Retour
                </Button>
                <Button 
                  onClick={handleSelectPaymentMethod} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!paymentSettings?.whatsapp_number}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter via WhatsApp
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step: WhatsApp Redirect */}
        {step === 'whatsapp' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">WhatsApp ouvert</DialogTitle>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>

              <div className="space-y-2">
                <p className="font-medium">Une fenêtre WhatsApp a été ouverte</p>
                <p className="text-sm text-gray-500">
                  Envoyez le message pré-rempli pour confirmer votre paiement de {finalAmount.toLocaleString('fr-FR')} FCFA
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  Après avoir envoyé le message, un agent vous contactera pour confirmer le paiement.
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleConfirmPayment} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  J&apos;ai envoyé le message
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Confirmation en attente</DialogTitle>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>

              <div className="space-y-2">
                <p className="font-medium">Vérifiez votre téléphone</p>
                <p className="text-sm text-gray-500">
                  Une notification {PROVIDERS.find(p => p.id === selectedProvider)?.name} a été envoyée au {phone}
                </p>
              </div>

              {ussdCode && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Si vous ne recevez pas de notification, composez le code:
                  </p>
                  <p className="text-xl font-mono font-bold text-yellow-900 mt-2">
                    {ussdCode}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400">
                Transaction: {transactionId}
              </p>
            </div>
          </>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">Paiement en cours de vérification!</DialogTitle>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>

              <div className="space-y-2">
                <p className="font-medium">Votre demande de paiement a été envoyée</p>
                <p className="text-sm text-gray-500">
                  Montant: {finalAmount.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-sm text-gray-500">
                  Un agent vous contactera pour confirmer le paiement.
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                Terminer
              </Button>
            </div>
          </>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-red-600">Erreur de paiement</DialogTitle>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>

              <div className="space-y-2">
                <p className="font-medium">Le paiement n'a pas pu être effectué</p>
                <p className="text-sm text-red-500">{error}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={() => setStep('payment')} className="flex-1">
                  Réessayer
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Badges Components
export function PremiumBadge({ tier = 'PREMIUM' }: { tier?: 'PREMIUM' | 'ENTERPRISE' }) {
  const colors = {
    PREMIUM: 'bg-gradient-to-r from-amber-500 to-orange-500',
    ENTERPRISE: 'bg-gradient-to-r from-purple-500 to-indigo-500',
  };

  return (
    <Badge className={`${colors[tier]} text-white border-0`}>
      ⭐ {tier === 'PREMIUM' ? 'Premium Partner' : 'Enterprise'}
    </Badge>
  );
}

export function VerifiedBadge({ type = 'okar' }: { type?: 'okar' | 'garage' | 'inspection' }) {
  const labels = {
    okar: 'Vérifié OKAR',
    garage: 'Garage Certifié',
    inspection: 'Inspection Validée',
  };

  return (
    <Badge variant="outline" className="border-green-500 text-green-600">
      <Check className="h-3 w-3 mr-1" />
      {labels[type]}
    </Badge>
  );
}

export function BoostedBadge({ boostType = 'BASIC' }: { boostType?: 'BASIC' | 'PREMIUM' | 'TOP_LISTING' }) {
  const styles = {
    BASIC: 'bg-blue-500',
    PREMIUM: 'bg-amber-500',
    TOP_LISTING: 'bg-gradient-to-r from-pink-500 to-purple-500',
  };

  const labels = {
    BASIC: 'Annonce Boostée',
    PREMIUM: '⭐ Top Annonce',
    TOP_LISTING: '🔥 À la une',
  };

  return (
    <Badge className={`${styles[boostType]} text-white border-0`}>
      {labels[boostType]}
    </Badge>
  );
}

// Default export
export default PaymentModal;
