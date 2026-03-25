'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRightLeft,
  AlertTriangle,
  Car,
  User,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Shield,
  Info
} from 'lucide-react';
import { useDriver } from '../layout';

export default function TransferVehiclePage() {
  const router = useRouter();
  const { vehicle } = useDriver();
  
  const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: Success
  const [formData, setFormData] = useState({
    newOwnerName: '',
    newOwnerPhone: '',
    newOwnerEmail: '',
    transferType: 'sale',
    salePrice: '',
    confirmTransfer: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [transferId, setTransferId] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      maximumFractionDigits: 0
    }).format(price) + ' FCFA';
  };

  const handleInitiateTransfer = async () => {
    if (!formData.newOwnerName || !formData.newOwnerPhone) {
      alert('Veuillez remplir le nom et le téléphone du nouveau propriétaire');
      return;
    }

    if (!formData.confirmTransfer) {
      alert('Veuillez confirmer le transfert');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/driver/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle?.id,
          currentOwnerId: 'demo-driver-id',
          newOwnerName: formData.newOwnerName,
          newOwnerPhone: formData.newOwnerPhone,
          newOwnerEmail: formData.newOwnerEmail || null,
          transferType: formData.transferType,
          salePrice: formData.salePrice ? parseInt(formData.salePrice) : null,
        })
      });

      const data = await response.json();
      if (data.success) {
        setTransferId(data.transferId);
        setStep(3);
      } else {
        alert(data.error || 'Erreur lors du transfert');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Erreur lors du transfert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <ArrowRightLeft className="w-7 h-7 text-orange-500" />
          Transférer mon véhicule
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Transférez le passeport numérique à l'acheteur. L'historique reste accessible.
        </p>
      </div>

      {/* Step 1: Warning & Form */}
      {step === 1 && (
        <>
          {/* Warning Card */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Transfert définitif
                </h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  Le transfert de propriété est définitif. Vous conserverez un accès en lecture seule à l'historique passé du véhicule.
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Card */}
          {vehicle && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6">
              <h3 className="font-medium text-slate-500 text-sm mb-3">Véhicule à transférer</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Car className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-lg">
                    {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-slate-500">
                    {vehicle.licensePlate} • {vehicle.mileage?.toLocaleString()} km
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-500" />
              Informations du nouveau propriétaire
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.newOwnerName}
                  onChange={(e) => setFormData({ ...formData, newOwnerName: e.target.value })}
                  placeholder="Fatou Diop"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone WhatsApp *
                </label>
                <div className="flex gap-2">
                  <span className="px-4 py-4 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500">
                    +221
                  </span>
                  <input
                    type="tel"
                    value={formData.newOwnerPhone}
                    onChange={(e) => setFormData({ ...formData, newOwnerPhone: e.target.value })}
                    placeholder="78 987 65 43"
                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={formData.newOwnerEmail}
                  onChange={(e) => setFormData({ ...formData, newOwnerEmail: e.target.value })}
                  placeholder="fatou.diop@email.com"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            <h3 className="font-semibold text-slate-800 dark:text-white mt-6 mb-4">
              Type de transfert
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'sale', label: 'Vente', icon: '💰' },
                { id: 'donation', label: 'Donation', icon: '🎁' },
                { id: 'inheritance', label: 'Héritage', icon: '📜' },
                { id: 'other', label: 'Autre', icon: '📝' },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, transferType: type.id })}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    formData.transferType === type.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{type.icon}</span>
                  <span className="font-medium text-slate-800 dark:text-white">{type.label}</span>
                </button>
              ))}
            </div>

            {formData.transferType === 'sale' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Prix de vente (optionnel, confidentiel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="5 000 000"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 pr-20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">FCFA</span>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.confirmTransfer}
                  onChange={(e) => setFormData({ ...formData, confirmTransfer: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500 mt-0.5"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Je confirme vouloir transférer ce véhicule au nouveau propriétaire désigné ci-dessus.
                </span>
              </label>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.newOwnerName || !formData.newOwnerPhone || !formData.confirmTransfer}
              className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        </>
      )}

      {/* Step 2: Confirmation */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
            Récapitulatif du transfert
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Véhicule</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {vehicle?.make} {vehicle?.model} • {vehicle?.licensePlate}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Nouveau propriétaire</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {formData.newOwnerName}
              </p>
              <p className="text-sm text-slate-500">+221 {formData.newOwnerPhone}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Type de transfert</p>
              <p className="font-medium text-slate-800 dark:text-white capitalize">
                {formData.transferType === 'sale' ? 'Vente' : 
                 formData.transferType === 'donation' ? 'Donation' :
                 formData.transferType === 'inheritance' ? 'Héritage' : 'Autre'}
              </p>
            </div>

            {formData.salePrice && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Prix de vente (confidentiel)</p>
                <p className="font-medium text-slate-800 dark:text-white">
                  {formatPrice(parseInt(formData.salePrice))}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Retour
            </button>
            <button
              onClick={handleInitiateTransfer}
              disabled={submitting}
              className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {submitting ? 'Transfert en cours...' : 'Initier le transfert'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowRightLeft className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Transfert initié !
          </h2>
          <p className="text-slate-500 mb-6">
            Un SMS/WhatsApp a été envoyé à <strong>{formData.newOwnerName}</strong> au +221 {formData.newOwnerPhone}.
          </p>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  En attente de confirmation...
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  Le nouveau propriétaire a 7 jours pour confirmer le transfert.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left space-y-3">
            <h4 className="font-medium text-slate-800 dark:text-white">
              Une fois confirmé :
            </h4>
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Le passeport sera transféré au nouveau propriétaire</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Vous conserverez l'accès à l'historique en mode "lecture seule"</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Un justificatif de transfert vous sera envoyé par email</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/driver/tableau-de-bord')}
            className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      )}
    </div>
  );
}
