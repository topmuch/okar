'use client'

import { useState, useEffect, use } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Car, Shield, Clock, AlertTriangle, CheckCircle, 
  FileText, CreditCard, Phone, Lock, ChevronRight,
  Loader2, Star, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

const OKAR_ORANGE = '#FF6600'

interface TeasingData {
  found: boolean
  vehicleId: string
  reference: string
  make: string
  model: string
  year: number
  color: string
  okarScore: number
  okarBadge: string | null
  interventionCount: number
  hasCertifiedGarage: boolean
  garageName: string | null
  alerts: Array<{ type: string; message: string }>
  activatedYear: number | null
  lastMileageYear: number | null
}

export default function RecherchePage({ params }: { params: Promise<{ plate: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [data, setData] = useState<TeasingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'ORANGE_MONEY' | 'WAVE'>('ORANGE_MONEY')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  const notFound = searchParams.get('notfound') === 'true'
  const vehicleId = searchParams.get('id')

  useEffect(() => {
    if (notFound) {
      setLoading(false)
      return
    }

    if (vehicleId) {
      fetchVehicleData()
    }
  }, [vehicleId, notFound])

  const fetchVehicleData = async () => {
    try {
      const response = await fetch(`/api/public/search?id=${vehicleId}`)
      const result = await response.json()
      
      if (result.success && result.found) {
        setData(result)
      } else {
        setError('Véhicule non trouvé')
      }
    } catch (err) {
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Veuillez entrer un numéro de téléphone valide')
      return
    }

    if (!data?.vehicleId) return

    setProcessingPayment(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: data.vehicleId,
          paymentMethod,
          phoneNumber: phoneNumber.replace(/\s/g, ''),
          amount: 1000
        })
      })

      const result = await response.json()

      if (result.success) {
        // Rediriger vers une page d'attente ou afficher les instructions
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl
        } else {
          // USSD Push - afficher les instructions
          alert(`Vous allez recevoir une demande de paiement ${paymentMethod === 'ORANGE_MONEY' ? 'Orange Money' : 'Wave'} sur votre téléphone. Veuillez confirmer le paiement.`)
        }
      } else {
        setError(result.error || 'Erreur lors de l\'initialisation du paiement')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setProcessingPayment(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Bon'
    if (score >= 40) return 'Moyen'
    return 'À améliorer'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: OKAR_ORANGE }} />
          <p className="text-gray-600">Recherche en cours...</p>
        </div>
      </div>
    )
  }

  // Véhicule non trouvé
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Véhicule non trouvé</h1>
              <p className="text-gray-600 mb-6">
                Le véhicule avec la plaque <strong>{decodeURIComponent(resolvedParams.plate)}</strong> n'est pas encore dans notre base de données.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Cela peut signifier que le véhicule n'a jamais été suivi par un garage partenaire OKAR, 
                ou que la plaque est mal orthographiée.
              </p>
              <Link href="/">
                <Button style={{ backgroundColor: OKAR_ORANGE }} className="text-white">
                  Nouvelle recherche
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: OKAR_ORANGE }}
            >
              O
            </div>
            <span className="text-xl font-bold text-gray-900">OKAR</span>
          </Link>
          <Badge variant="outline" className="text-sm">
            Rapport Véhicule
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Vehicle Header */}
        <Card className="border-0 shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Plaque</p>
                <h1 className="text-3xl font-bold mb-2">{decodeURIComponent(resolvedParams.plate)}</h1>
                <p className="text-xl text-gray-300">
                  {data.make} {data.model} {data.year && `(${data.year})`}
                </p>
                {data.color && (
                  <p className="text-gray-400 text-sm mt-1">{data.color}</p>
                )}
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Car className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </Card>

        {/* Score OKAR */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Score OKAR</h2>
                <p className="text-sm text-gray-500">Indicateur de santé du véhicule</p>
              </div>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getScoreColor(data.okarScore)}`}>
                <div className="text-center">
                  <span className="text-2xl font-bold">{data.okarScore}</span>
                  <span className="text-xs block">{getScoreLabel(data.okarScore)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {data.alerts.map((alert, i) => (
              <Alert key={i} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Teasing Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.interventionCount}</p>
                  <p className="text-sm text-gray-500">Interventions enregistrées</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">✓ Visible dans le rapport complet</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  {data.hasCertifiedGarage ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Building2 className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {data.hasCertifiedGarage ? data.garageName : 'Garage non certifié'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {data.hasCertifiedGarage ? 'Garage certifié OKAR' : 'Pas de garage partenaire'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blurred Preview */}
        <Card className="border-0 shadow-lg mb-8 overflow-hidden">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              Contenu du rapport complet
            </CardTitle>
            <CardDescription>
              Débloquez l'accès à toutes ces informations pour 1 000 FCFA
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              {/* Blurred content preview */}
              <div className="p-6 filter blur-sm select-none pointer-events-none">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-20 bg-gray-100 rounded-lg mt-4" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="h-16 bg-gray-100 rounded-lg" />
                    <div className="h-16 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                <div className="text-center p-4">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700 mb-1">Rapport complet verrouillé</p>
                  <p className="text-sm text-gray-500 mb-4">Accédez à l'historique complet du véhicule</p>
                  <Badge className="bg-orange-100 text-orange-700">
                    1 000 FCFA seulement
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Débloquer le rapport complet</h2>
            <p className="text-orange-100">
              Accédez à l'historique certifié du véhicule en un clic
            </p>
          </div>
          
          <CardContent className="p-6">
            {/* What's included */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Le rapport inclut :</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  'Historique complet des interventions',
                  'Timeline chronologique',
                  'Analyse du kilométrage',
                  'Factures certifiées',
                  'Historique des propriétaires',
                  'Alertes et recommandations'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method selection */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Mode de paiement</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('ORANGE_MONEY')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'ORANGE_MONEY'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      OM
                    </div>
                    <span className="font-medium">Orange Money</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('WAVE')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'WAVE'
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      W
                    </div>
                    <span className="font-medium">Wave</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Phone number */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="77 123 45 67"
                  className="w-full h-14 pl-12 pr-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Vous recevrez une demande de paiement sur votre téléphone
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Pay button */}
            <Button
              onClick={handlePayment}
              disabled={processingPayment || phoneNumber.length < 9}
              className="w-full h-14 text-lg font-semibold"
              style={{ backgroundColor: OKAR_ORANGE }}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payer 1 000 FCFA
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-400 mt-4">
              Paiement sécurisé • Rapport disponible immédiatement après paiement
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
