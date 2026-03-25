'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Car,
  Shield,
  Wrench,
  Calendar,
  Gauge,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  QrCode,
  ChevronRight,
  Lock,
  Unlock,
  Award,
  FileText,
  Clock,
  Users,
  MapPin,
  Phone,
  ArrowLeft,
  Download,
  Eye,
  Building2,
  Star,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PaymentModal } from '@/components/payment/PaymentModal';

// Types
interface VehicleData {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  licensePlate: string | null;
  mainPhoto: string | null;
  engineType: string | null;
  currentMileage: number;
  okarScore: number;
  okarBadge: string | null;
  vtEndDate: string | null;
  insuranceEndDate: string | null;
  activatedAt: string | null;
  garageId: string | null;
}

interface TeasingData {
  score: number;
  scoreColor: string;
  scoreLabel: string;
  totalInterventions: number;
  validatedInterventions: number;
  lastMileage: number;
  ownerCount: number;
  hasAlerts: boolean;
  alertsList: string[];
}

interface GarageData {
  name: string;
  isCertified: boolean;
  logo: string | null;
}

interface SearchResult {
  found: boolean;
  vehicle?: VehicleData;
  teasingData?: TeasingData;
  garage?: GarageData | null;
}

// Prix du rapport
const REPORT_PRICE = 1000; // FCFA

// ============================================
// MAIN COMPONENT
// ============================================
export default function TeasingReportPage() {
  const params = useParams();
  const router = useRouter();
  const plate = params?.plate as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [reportCode, setReportCode] = useState<string | null>(null);

  useEffect(() => {
    if (plate) {
      fetchVehicleData();
    }
  }, [plate]);

  const fetchVehicleData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/vehicles/search?plate=${encodeURIComponent(plate)}`);
      const result = await res.json();

      if (res.ok) {
        setData(result);
      } else {
        setError(result.error || 'Erreur lors de la recherche');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setPaymentSuccess(true);
    setReportCode(transactionId);
    // Rediriger vers le téléchargement après 2 secondes
    setTimeout(() => {
      router.push(`/rapport/telecharger/${transactionId}`);
    }, 2000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl animate-pulse opacity-20" />
            <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-800">Recherche en cours...</p>
          <p className="text-sm text-slate-500 mt-2">Analyse du véhicule {plate}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Erreur</h1>
            <p className="text-slate-500 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button onClick={fetchVehicleData}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vehicle not found
  if (!data?.found || !data.vehicle || !data.teasingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Aucun historique OKAR trouvé
              </h1>
              <p className="text-slate-500">
                Le véhicule avec la plaque <span className="font-semibold">{plate}</span> n&apos;est pas encore suivi par OKAR.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Conseil pour l&apos;acheteur</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Demandez au vendeur de faire un &quot;Check-up Certification&quot; chez un garage partenaire OKAR 
                    pour générer l&apos;historique vérifié du véhicule avant l&apos;achat.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full" variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Trouver un garage OKAR proche
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full" variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { vehicle, teasingData, garage } = data;

  // Payment success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Paiement réussi !</h1>
            <p className="text-slate-500 mb-4">
              Votre rapport complet est prêt.
            </p>
            <Loader2 className="w-6 h-6 text-green-500 animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-2">Redirection vers le téléchargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main teasing view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                OKAR
              </span>
            </Link>
            <Badge variant="outline" className="text-xs">
              Aperçu gratuit
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Vehicle Header Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-slate-200 to-slate-300">
            {vehicle.mainPhoto ? (
              <img 
                src={vehicle.mainPhoto} 
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-20 h-20 text-slate-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {vehicle.make || 'Marque'} {vehicle.model || 'Modèle'}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    {vehicle.year && (
                      <Badge className="bg-white/20 text-white border-0">
                        {vehicle.year}
                      </Badge>
                    )}
                    {vehicle.color && (
                      <Badge className="bg-white/20 text-white border-0">
                        {vehicle.color}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl">
                  <p className="text-2xl font-mono font-bold text-slate-800">
                    {vehicle.licensePlate || plate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Score & Stats Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Score OKAR */}
          <Card className="overflow-hidden">
            <div className={cn(
              "h-2",
              teasingData.scoreColor === 'green' ? "bg-green-500" :
              teasingData.scoreColor === 'blue' ? "bg-blue-500" :
              teasingData.scoreColor === 'orange' ? "bg-orange-500" : "bg-red-500"
            )} />
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center",
                  teasingData.scoreColor === 'green' ? "bg-green-100" :
                  teasingData.scoreColor === 'blue' ? "bg-blue-100" :
                  teasingData.scoreColor === 'orange' ? "bg-orange-100" : "bg-red-100"
                )}>
                  <Award className={cn(
                    "w-8 h-8",
                    teasingData.scoreColor === 'green' ? "text-green-500" :
                    teasingData.scoreColor === 'blue' ? "text-blue-500" :
                    teasingData.scoreColor === 'orange' ? "text-orange-500" : "text-red-500"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-slate-800">{teasingData.score}</span>
                    <span className="text-lg text-slate-400">/100</span>
                  </div>
                  <Badge className={cn(
                    "text-xs",
                    teasingData.scoreColor === 'green' ? "bg-green-500" :
                    teasingData.scoreColor === 'blue' ? "bg-blue-500" :
                    teasingData.scoreColor === 'orange' ? "bg-orange-500" : "bg-red-500"
                  )}>
                    {teasingData.scoreLabel}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                Score de Confiance OKAR
              </p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-800">{teasingData.totalInterventions}</p>
                  <p className="text-xs text-slate-500">Interventions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{teasingData.ownerCount}</p>
                  <p className="text-xs text-slate-500">Propriétaires</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {teasingData.lastMileage > 0 
                      ? `${(teasingData.lastMileage / 1000).toFixed(0)}k` 
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500">Km</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Interventions certifiées</span>
                <span className="font-semibold text-green-600">{teasingData.validatedInterventions}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts (if any) */}
        {teasingData.hasAlerts && teasingData.alertsList.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Alertes détectées</p>
                  <ul className="mt-2 space-y-1">
                    {teasingData.alertsList.map((alert, i) => (
                      <li key={i} className="text-sm text-amber-700">{alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Garage Info */}
        {garage && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                  {garage.logo ? (
                    <img src={garage.logo} alt={garage.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <Building2 className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{garage.name}</p>
                    {garage.isCertified && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Certifié
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">Garage partenaire OKAR</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BLURRED CONTENT - The Teaser */}
        <Card className="mb-6 relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Historique Détaillé
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Blurred timeline preview */}
            <div className="space-y-4 filter blur-sm select-none">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-slate-200 rounded w-16 mb-1" />
                    <div className="h-3 bg-slate-200 rounded w-12" />
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay with CTA */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-center pb-8">
              <div className="text-center px-4">
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Lock className="w-4 h-4" />
                  Contenu réservé aux acheteurs
                </div>
                <p className="text-slate-600 mb-2 max-w-md mx-auto">
                  Débloquez l&apos;historique complet avec dates, garages, kilométrages et factures certifiées.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kilometer Chart Preview (Blurred) */}
        <Card className="mb-6 relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Évolution du Kilométrage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 filter blur-sm select-none">
              <svg className="w-full h-full">
                <polyline
                  points="0,120 100,100 200,80 300,60 400,40 500,20"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3"
                />
                <circle cx="500" cy="20" r="6" fill="#f97316" />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="text-center">
                <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Graphique disponible dans le rapport complet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50">
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Unlock className="w-4 h-4" />
                Accès Premium
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Débloquez le rapport complet
              </h2>
              
              <p className="text-slate-600 mb-4 max-w-lg mx-auto">
                Obtenez l&apos;historique détaillé, les factures certifiées, le graphique de kilométrage 
                et la vérification d&apos;authenticité du véhicule.
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  {REPORT_PRICE.toLocaleString()} FCFA
                </span>
                <p className="text-sm text-slate-500 mt-1">Paiement unique • Rapport valable 30 jours</p>
              </div>

              {/* Features included */}
              <div className="grid sm:grid-cols-3 gap-3 mb-6 text-left max-w-lg mx-auto">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Timeline complète
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Factures certifiées
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Graphique km
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Historique propriétaires
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  PDF téléchargeable
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Code de vérification
                </div>
              </div>

              {/* Main CTA */}
              <Button
                onClick={() => setShowPayment(true)}
                className="w-full sm:w-auto px-8 py-6 text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg shadow-orange-500/25"
              >
                <Unlock className="w-5 h-5 mr-2" />
                Débloquer le rapport complet
              </Button>

              <p className="text-xs text-slate-400 mt-4">
                Paiement sécurisé via Orange Money ou Wave
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            Données certifiées
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" />
            Paiement sécurisé
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Disponible 24h/24
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        type="REPORT"
        amount={REPORT_PRICE}
        title="Rapport Véhicule OKAR"
        description={`${vehicle.make || 'Véhicule'} ${vehicle.model || ''} - ${vehicle.licensePlate || plate}`}
        metadata={{
          vehicleId: vehicle.id,
          plate: vehicle.licensePlate,
          reportType: 'PREMIUM',
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
