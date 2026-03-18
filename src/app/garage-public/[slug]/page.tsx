import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Car, MapPin, Clock, CheckCircle, QrCode, Phone, Mail, Globe, Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Page params type
interface PageProps {
  params: Promise<{ slug: string }>;
}

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

// Vehicle type for raw query (columns that exist in production DB)
interface VehicleRow {
  id: string;
  reference: string;
  type: string;
  lotId: string | null;
  garageId: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerPhone: string | null;
  vehicleType: string;
  status: string;
  createdAt: string;
}

// Generate static params for known garages
export async function generateStaticParams() {
  try {
    const garages = await db.garage.findMany({
      select: { slug: true },
    });

    return garages.map((garage) => ({
      slug: garage.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Error display component
function ErrorDisplay({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
          Erreur de chargement
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {message}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#ff7f00] hover:bg-[#ff6600] text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

// Public Garage Page - Shows active/scanned/found vehicles for a garage
export default async function PublicGaragePage({ params }: PageProps) {
  // Get slug from params
  const resolvedParams = await params;
  const garageSlug = resolvedParams.slug;

  let garage = null;
  let dbError: string | null = null;

  try {
    // Try to fetch garage with basic info first
    garage = await db.garage.findUnique({
      where: { slug: garageSlug },
    });

    if (garage) {
      // Fetch vehicles using raw SQL to avoid missing column errors
      try {
        const vehicles = await db.$queryRaw<VehicleRow[]>`
          SELECT
            id, reference, type, lotId, garageId,
            ownerFirstName, ownerLastName, ownerPhone,
            vehicleType, status, createdAt
          FROM Vehicle
          WHERE garageId = ${garage.id}
            AND status IN ('active', 'scanned', 'found')
          ORDER BY createdAt DESC
          LIMIT 100
        `;

        // Attach vehicles to garage object
        (garage as any).vehicles = vehicles;
      } catch (vehicleError) {
        console.error('Error fetching vehicles:', vehicleError);
        (garage as any).vehicles = [];
      }

      // Try to fetch garage user for contact info
      try {
        const users = await db.user.findMany({
          where: {
            garageId: garage.id,
            role: 'garage'
          },
          take: 1,
        });
        (garage as any).users = users;
      } catch (userError) {
        console.error('Error fetching users:', userError);
        (garage as any).users = [];
      }
    }
  } catch (error) {
    console.error('Error fetching garage:', error);
    dbError = 'Impossible de charger les données du garage. Veuillez réessayer plus tard.';
  }

  // If there was a database error, show error page
  if (dbError) {
    return <ErrorDisplay message={dbError} />;
  }

  // If garage doesn't exist, show 404
  if (!garage) {
    notFound();
  }

  // Stats
  const vehicles = (garage as any).vehicles || [];
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v: VehicleRow) => v.status === 'active' || v.status === 'scanned').length;
  const foundVehicles = vehicles.filter((v: VehicleRow) => v.status === 'found').length;
  const scannedVehicles = vehicles.filter((v: VehicleRow) => v.status === 'scanned').length;

  // Get contact info from garage profile
  const users = (garage as any).users || [];
  const contactUser = users[0];
  const displayPhone = garage.phone || null;
  const displayEmail = garage.email || contactUser?.email || null;
  const displayAddress = garage.address || null;
  const displayLogo = garage.logo;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo du garage ou fallback */}
              {displayLogo ? (
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-lg border border-slate-200 flex items-center justify-center">
                  <img
                    src={displayLogo}
                    alt={garage.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-[#ff7f00] to-[#ff9f00] rounded-2xl flex items-center justify-center shadow-lg">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{garage.name}</h1>
                {displayAddress && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {displayAddress}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                  Partenaire OKAR
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
              <Car className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalVehicles}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Véhicules suivis</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeVehicles}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Actifs</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{scannedVehicles}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Scannés</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{foundVehicles}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Retrouvés</p>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Véhicules suivis
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {totalVehicles} véhicule{totalVehicles > 1 ? 's' : ''} affiché{totalVehicles > 1 ? 's' : ''}
            </span>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Aucun véhicule actif</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                Les véhicules suivis apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {vehicles.map((vehicle: VehicleRow) => (
                <div
                  key={vehicle.id}
                  className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#ff7f00]/10 to-[#ff7f00]/5 rounded-xl flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-[#ff7f00]" />
                      </div>
                      <div>
                        <p className="font-mono font-medium text-slate-800 dark:text-white">
                          {vehicle.reference}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {vehicle.ownerFirstName} {vehicle.ownerLastName}
                          {vehicle.type === 'hajj' && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs">
                              Hajj
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        vehicle.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : vehicle.status === 'found'
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {vehicle.status === 'active' ? 'Actif' : vehicle.status === 'found' ? 'Retrouvé' : 'Scanné'}
                      </span>
                      <span className="text-sm text-slate-400 dark:text-slate-500 hidden sm:block">
                        {vehicle.vehicleType === 'moto' ? 'Moto' : 'Voiture'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Contacter le garage
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {displayPhone && (
              <a
                href={`tel:${displayPhone}`}
                className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 bg-[#ff7f00]/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#ff7f00]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Téléphone</p>
                  <p className="text-slate-800 dark:text-white font-medium">{displayPhone}</p>
                </div>
              </a>
            )}
            {displayEmail && (
              <a
                href={`mailto:${displayEmail}`}
                className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 bg-[#ff7f00]/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#ff7f00]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                  <p className="text-slate-800 dark:text-white font-medium">{displayEmail}</p>
                </div>
              </a>
            )}
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="w-10 h-10 bg-[#ff7f00]/10 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#ff7f00]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Statut</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">Partenaire vérifié</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-slate-400 dark:text-slate-500 text-sm pb-8">
          <p className="flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4" />
            Propulsé par <span className="font-semibold text-[#ff7f00]">OKAR</span>
          </p>
          <p className="mt-1 text-xs">
            Passeport numérique automobile pour le Sénégal
          </p>
        </footer>
      </div>
    </main>
  );
}
