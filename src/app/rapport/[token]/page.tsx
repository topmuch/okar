'use client'

import { useState, useEffect, use } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Download, FileText, CheckCircle, Clock, AlertTriangle,
  Loader2, Share2, Printer, Shield, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const OKAR_ORANGE = '#FF6600'

interface ReportInfo {
  id: string
  verificationCode: string
  vehicle: {
    make: string | null
    model: string | null
    year: number | null
    licensePlate: string | null
    score: number
  }
  generatedAt: string
  expiresAt?: string
  downloadCount: number
  maxDownloads: number
}

export default function RapportPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  
  const [report, setReport] = useState<ReportInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const code = searchParams.get('code') || resolvedParams.token

  useEffect(() => {
    fetchReportInfo()
  }, [code])

  const fetchReportInfo = async () => {
    try {
      const response = await fetch(`/api/reports/download?code=${code}`)
      const data = await response.json()

      if (data.success) {
        // Extraire les infos du HTML ou des données
        setReport({
          id: code,
          verificationCode: code,
          vehicle: {
            make: data.report?.vehicle?.make || 'Véhicule',
            model: data.report?.vehicle?.model || '',
            year: data.report?.vehicle?.year,
            licensePlate: data.report?.vehicle?.licensePlate,
            score: data.report?.vehicle?.score || 0
          },
          generatedAt: data.report?.generatedAt || new Date().toISOString(),
          downloadCount: 0,
          maxDownloads: 5
        })
      } else {
        setError(data.error || 'Rapport non trouvé')
      }
    } catch (err) {
      setError('Erreur lors du chargement du rapport')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    
    try {
      // Ouvrir le rapport dans un nouvel onglet pour impression/PDF
      const reportUrl = `/api/reports/download?code=${code}`
      window.open(reportUrl, '_blank')
      
      // Mettre à jour le compteur localement
      if (report) {
        setReport({
          ...report,
          downloadCount: report.downloadCount + 1
        })
      }
    } catch (err) {
      setError('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = async () => {
    setDownloading(true)
    
    try {
      const reportUrl = `/api/reports/download?code=${code}`
      const printWindow = window.open(reportUrl, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } catch (err) {
      setError('Erreur lors de l\'impression')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/rapport/${code}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rapport OKAR - ${report?.vehicle.licensePlate || 'Véhicule'}`,
          text: `Consultez le rapport d'historique de ce véhicule`,
          url: shareUrl
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      alert('Lien copié dans le presse-papier!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: OKAR_ORANGE }} />
          <p className="text-gray-600">Chargement du rapport...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/">
                <Button style={{ backgroundColor: OKAR_ORANGE }} className="text-white">
                  Retour à l'accueil
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
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Rapport Certifié
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <Card className="border-0 shadow-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Rapport disponible!</h1>
                <p className="text-green-100">
                  Votre rapport d'historique véhicule est prêt à être téléchargé
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Vehicle Summary */}
        {report && (
          <Card className="border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {report.vehicle.make} {report.vehicle.model}
                  </h2>
                  {report.vehicle.licensePlate && (
                    <p className="text-2xl font-mono font-bold text-gray-700 mt-1">
                      {report.vehicle.licensePlate}
                    </p>
                  )}
                  {report.vehicle.year && (
                    <p className="text-gray-500">Année: {report.vehicle.year}</p>
                  )}
                </div>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  report.vehicle.score >= 80 ? 'bg-green-100 text-green-600' :
                  report.vehicle.score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <div className="text-center">
                    <span className="text-2xl font-bold">{report.vehicle.score}</span>
                    <span className="text-xs block">Score</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Download Options */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Télécharger votre rapport
            </CardTitle>
            <CardDescription>
              Le rapport inclut l'historique complet, le score OKAR, et les alertes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full h-14 text-lg"
              style={{ backgroundColor: OKAR_ORANGE }}
            >
              {downloading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              Télécharger le rapport PDF
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="h-12"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="h-12"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            </div>

            {report && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Téléchargements restants: {report.maxDownloads - report.downloadCount} / {report.maxDownloads}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Verification Info */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Code de vérification</h3>
                <p className="font-mono text-lg font-bold text-gray-700 mb-2">
                  {code.toUpperCase()}
                </p>
                <p className="text-sm text-gray-500">
                  Ce code unique permet de vérifier l'authenticité du rapport sur okar.sn/verifier
                </p>
                <a 
                  href={`/v/${code}`}
                  className="inline-flex items-center gap-1 text-sm text-orange-600 hover:underline mt-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  Vérifier l'authenticité
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiration Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Ce rapport est valide pendant 30 jours à partir de sa génération
        </div>
      </main>
    </div>
  )
}
