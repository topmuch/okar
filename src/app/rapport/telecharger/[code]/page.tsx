'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  CheckCircle,
  Loader2,
  QrCode,
  FileText,
  Shield,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  Share2,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Types
interface DownloadData {
  success: boolean;
  download: {
    transactionId: string;
    vehicleId: string;
    vehicle: {
      id: string;
      reference: string;
      make: string | null;
      model: string | null;
      licensePlate: string | null;
    };
    verificationCode: string;
    htmlContent: string;
    generatedAt: string;
    validUntil: string;
  };
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function DownloadReportPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DownloadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (code) {
      fetchDownloadData();
    }
  }, [code]);

  const fetchDownloadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/download/${code}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setData(result);
      } else {
        setError(result.error || 'Erreur lors du chargement du rapport');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (data?.download.verificationCode) {
      await navigator.clipboard.writeText(data.download.verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    
    // Utiliser window.print() pour générer le PDF
    setTimeout(() => {
      window.print();
      setDownloading(false);
    }, 500);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/verifier/${data?.download.verificationCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rapport OKAR - ${data?.download.vehicle.make} ${data?.download.vehicle.model}`,
          text: `Rapport certifié OKAR pour ${data?.download.vehicle.licensePlate}`,
          url: shareUrl,
        });
      } catch {
        // Share cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Lien de vérification copié !');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl animate-pulse opacity-20" />
            <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-800">Préparation du rapport...</p>
          <p className="text-sm text-slate-500 mt-2">Génération du PDF en cours</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.download) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Erreur</h1>
            <p className="text-slate-500 mb-6">{error || 'Impossible de charger le rapport'}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button onClick={fetchDownloadData}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { download } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50 print:hidden">
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
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Payé
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Banner */}
        <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 print:hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-800">
                  Rapport débloqué avec succès !
                </h1>
                <p className="text-slate-600">
                  Votre rapport complet pour le véhicule {download.vehicle.licensePlate} est prêt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="mb-6 print:hidden">
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="h-14 text-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                Télécharger le PDF
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="h-14"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Partager le rapport
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Verification Code */}
        <Card className="mb-6 print:hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Code de vérification</p>
                <p className="text-2xl font-mono font-bold text-slate-800">
                  {download.verificationCode}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copied ? 'Copié' : 'Copier'}
                </Button>
                <Link href={`/verifier/${download.verificationCode}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Vérifier
                  </Button>
                </Link>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Valide jusqu&apos;au {new Date(download.validUntil).toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-500" />
                Certifié OKAR
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="overflow-hidden" ref={reportRef}>
          <CardContent className="p-0">
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: download.htmlContent }}
            />
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500 print:hidden">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            Ce rapport est certifié par OKAR et peut être vérifié à tout moment
          </p>
          <p className="mt-2">
            Code: <span className="font-mono font-semibold">{download.verificationCode}</span>
          </p>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
