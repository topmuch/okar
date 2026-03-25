'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { 
  Car, 
  Wrench, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Building,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react'

export default function DevenirPartenairePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const validateForm = (): boolean => {
    if (!formData.businessName || !formData.address || !formData.city || !formData.phone || !formData.email) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/garage/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de l\'inscription.')
      }

      setApplicationId(data.data?.id || null)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
        <Card className="w-full max-w-lg border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
            <p className="text-gray-600 mb-4">
              Votre demande de partenariat a été envoyée avec succès. Notre équipe va l&apos;examiner et vous contactera dans les plus brefs délais.
            </p>
            {applicationId && (
              <p className="text-sm text-gray-500 mb-6">
                Référence: <span className="font-mono font-semibold">{applicationId}</span>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push('/')} variant="outline">
                Retour à l&apos;accueil
              </Button>
              <Button onClick={() => router.push('/dashboard')} className="bg-primary-600 hover:bg-primary-700">
                Accéder au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Info */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Car className="h-8 w-8 text-primary-600" />
                <span className="text-2xl font-bold text-gray-900">OKAR</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Devenir Garage Partenaire
              </h1>
              <p className="text-lg text-gray-600">
                Rejoignez notre réseau de garages partenaires et développez votre activité avec OKAR.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Avantages partenaires</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <Building className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Visibilité accrue</h3>
                    <p className="text-sm text-gray-600">Apparaissez dans les recherches de milliers de conducteurs</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Gestion simplifiée</h3>
                    <p className="text-sm text-gray-600">Gérez vos rendez-vous et historiques clients en un clic</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Documents numériques</h3>
                    <p className="text-sm text-gray-600">Accédez à l&apos;historique complet des véhicules de vos clients</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Process */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Processus d&apos;inscription</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-600">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Soumettez votre demande</p>
                    <p className="text-sm text-gray-600">Remplissez le formulaire ci-contre</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-gray-300" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-400">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Validation</p>
                    <p className="text-sm text-gray-600">Notre équipe examine votre demande (24-48h)</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-gray-300" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-400">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Activation</p>
                    <p className="text-sm text-gray-600">Recevez vos accès et commencez</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-gray-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary-600" />
                Formulaire d&apos;inscription
              </CardTitle>
              <CardDescription>
                Remplissez les informations de votre garage pour devenir partenaire
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nom du garage *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessName"
                      name="businessName"
                      type="text"
                      placeholder="Garage Auto Plus"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="123 Rue de la République"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Paris"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+33 1 23 45 67 89"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="contact@garage.fr"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Décrivez votre garage, vos spécialités, vos horaires..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Contact principal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Nom du contact</Label>
                      <Input
                        id="contactName"
                        name="contactName"
                        type="text"
                        placeholder="Jean Dupont"
                        value={formData.contactName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Téléphone contact</Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Soumettre ma demande'
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  En soumettant ce formulaire, vous acceptez nos{' '}
                  <Link href="#" className="text-primary-600 hover:underline">
                    conditions d&apos;utilisation
                  </Link>{' '}
                  et notre{' '}
                  <Link href="#" className="text-primary-600 hover:underline">
                    politique de confidentialité
                  </Link>
                  .
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
