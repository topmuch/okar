'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// QR Code component loaded dynamically
const QRCode = dynamic(() => import('qrcode.react'), { ssr: false });

import {
  Car,
  Wrench,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Calendar,
  Gauge,
  MapPin,
  Phone,
  Clock,
  Share2,
  Download,
  QrCode as QrCodeIcon
} from 'lucide-react';

// Types
interface MaintenanceRecord {
  id: string;
  category: string;
  description: string;
  mileage: number | null;
  date: string;
  mechanic: string | null;
}

interface VehicleInfo {
  reference: string;
  make: string;
  model: string;
  licensePlate: string;
}

interface GarageInfo {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  isCertified: boolean;
  logo: string | null;
}

interface ScanResult {
  success: boolean;
  error?: string;
  message?: string;
  status?: string;
  vehicle?: VehicleInfo;
  garage?: GarageInfo;
  maintenanceHistory?: MaintenanceRecord[];
  totalRecords?: number;
  redirectTo?: string;
}

// Category labels
const categoryLabels: Record<string, string> = {
  activation: "Activation",
  vidange: "Vidange",
  freins: "Freins",
  pneus: "Pneus",
  batterie: "Batterie",
  courroie: "Courroie",
  climatisation: "Climatisation",
  suspension: "Suspension",
  echappement: "Échappement",
  carrosserie: "Carrosserie",
  electricite: "Électricité",
  autre: "Autre",
};

export default function VehiclePassportPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (code) {
      fetchVehicleData();
    }
  }, [code]);

  const fetchVehicleData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scan/${code}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      setResult({
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Impossible de charger les données'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Passeport OKAR - ${result?.vehicle?.make} ${result?.vehicle?.model}`,
          text: `Consultez l'historique certifié de ce véhicule`,
          url: url
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Lien copié !');
    }
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('#vehicle-qr canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `okar-${code}.png`;
      a.click();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Vérification du QR Code...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (!result?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
        <div className="max-w-lg mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            {result?.error === 'QR_NOT_ACTIVATED' ? (
              <>
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code non activé</h1>
                <p className="text-gray-600 mb-6">
                  Ce QR Code n'a pas encore été activé par un garage certifié.
                  Il sera fonctionnel une fois le véhicule enregistré.
                </p>
                <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
                  <p>Si vous êtes un garage, connectez-vous pour activer ce code.</p>
                  <Link href="/garage/connexion" className="text-orange-600 font-medium hover:underline">
                    Connexion Garage →
                  </Link>
                </div>
              </>
            ) : result?.error === 'QR_REVOKED' ? (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code révoqué</h1>
                <p className="text-gray-600">
                  Ce QR Code a été désactivé pour des raisons de sécurité.
                  Veuillez contacter le garage ou le support OKAR.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code non reconnu</h1>
                <p className="text-gray-600">
                  {result?.message || 'Ce QR Code n\'existe pas dans notre système.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state - Vehicle Passport
  const { vehicle, garage, maintenanceHistory, totalRecords } = result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
              <QrCodeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              OKAR
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="Partager"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Vehicle Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-400 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium opacity-90">Passeport Automobile Certifié</span>
                </div>
                <h1 className="text-3xl font-bold mb-1">
                  {vehicle?.make} {vehicle?.model}
                </h1>
                <p className="text-white/80">{vehicle?.licensePlate}</p>
              </div>
              
              <div className="text-right">
                <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-2">
                  <p className="text-xs opacity-80">Réf.</p>
                  <p className="font-mono font-bold">{vehicle?.reference}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <Car className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Marque</p>
                <p className="font-semibold">{vehicle?.make}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <Car className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Modèle</p>
                <p className="font-semibold">{vehicle?.model}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <MapPin className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Immatriculation</p>
                <p className="font-semibold">{vehicle?.licensePlate}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <Wrench className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Interventions</p>
                <p className="font-semibold">{totalRecords || 0}</p>
              </div>
            </div>
          </div>

          {/* Garage Info */}
          {garage && (
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  {garage.logo ? (
                    <img src={garage.logo} alt={garage.name} className="w-12 h-12 object-contain" />
                  ) : (
                    <Wrench className="w-8 h-8 text-orange-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{garage.name}</h3>
                    {garage.isCertified && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        ✓ Certifié
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{garage.address}</p>
                  {garage.phone && (
                    <a href={`tel:${garage.phone}`} className="text-sm text-orange-600 hover:underline">
                      {garage.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Maintenance History */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Historique des interventions
          </h2>

          {maintenanceHistory && maintenanceHistory.length > 0 ? (
            <div className="space-y-4">
              {maintenanceHistory.map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {categoryLabels[record.category] || record.category}
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{record.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {record.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {record.mileage && (
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3" />
                          {record.mileage.toLocaleString()} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune intervention enregistrée</p>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <QrCodeIcon className="w-6 h-6 text-orange-500" />
              <span className="font-semibold text-gray-900">Afficher le QR Code</span>
            </div>
            <span className="text-sm text-orange-500">
              {showQR ? 'Masquer' : 'Afficher'}
            </span>
          </button>

          {showQR && (
            <div className="mt-6 text-center">
              <div id="vehicle-qr" className="inline-block p-4 bg-white rounded-2xl shadow-lg">
                <QRCode
                  value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn'}/v/${code}`}
                  size={200}
                  level="H"
                  includeMargin
                  fgColor="#1f2937"
                />
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Scannez ce QR pour accéder au passeport
              </p>
              <button
                onClick={downloadQRCode}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Télécharger le QR Code
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <QrCodeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">OKAR</span>
          </div>
          <p className="text-gray-400 text-sm">
            Passeport numérique automobile du Sénégal
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © {new Date().getFullYear()} OKAR - Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}
