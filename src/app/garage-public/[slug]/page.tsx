import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { 
  Car, MapPin, Clock, CheckCircle, QrCode, Phone, Mail, Globe, 
  Search, AlertTriangle, Star, Shield, Award, Wrench, Users,
  Calendar, MessageCircle, Navigation, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// Page params type
interface PageProps {
  params: Promise<{ slug: string }>;
}

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

// Types
interface VehicleRow {
  id: string;
  reference: string;
  type: string;
  lotId: string | null;
  garageId: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  licensePlate: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerPhone: string | null;
  status: string;
  createdAt: string;
}

interface MaintenanceRow {
  id: string;
  category: string;
  description: string | null;
  totalCost: number | null;
  mileage: number | null;
  interventionDate: string;
  vehicle: {
    reference: string;
    make: string | null;
    model: string | null;
  };
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  userName: string | null;
  createdAt: string;
}

// Generate static params for known garages
export async function generateStaticParams() {
  try {
    const garages = await db.garage.findMany({
      where: { active: true },
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

// Category labels
const categoryLabels: Record<string, string> = {
  vidange: 'Vidange',
  freins: 'Freins',
  pneus: 'Pneus',
  moteur: 'Moteur',
  electricite: 'Électricité',
  carrosserie: 'Carrosserie',
  climatisation: 'Climatisation',
  suspension: 'Suspension',
  transmission: 'Transmission',
  autre: 'Autre',
};

// Error display component
function ErrorDisplay({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          Erreur de chargement
        </h1>
        <p className="text-slate-500 mb-6">
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

// Badge component
function Badge({ type, label }: { type: 'top' | 'reactif' | 'certifie' }) {
  const styles = {
    top: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
    reactif: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
    certifie: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
  };

  const icons = {
    top: Star,
    reactif: Clock,
    certifie: Shield,
  };

  const Icon = icons[type];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${styles[type]}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}

// Public Garage Page - Marketing Profile
export default async function PublicGaragePage({ params }: PageProps) {
  // Get slug from params
  const resolvedParams = await params;
  const garageSlug = resolvedParams.slug;

  let garage = null;
  let dbError: string | null = null;
  let vehicles: VehicleRow[] = [];
  let maintenanceHistory: MaintenanceRow[] = [];
  let reviews: ReviewRow[] = [];
  let profile = null;

  try {
    // Try to fetch garage with basic info first
    garage = await db.garage.findUnique({
      where: { slug: garageSlug },
    });

    if (garage) {
      // Fetch garage profile
      try {
        const profiles = await db.$queryRaw<any[]>`
          SELECT * FROM GarageProfile WHERE garageId = ${garage.id} LIMIT 1
        `;
        profile = profiles?.[0] || null;
      } catch (e) {
        console.error('Error fetching profile:', e);
      }

      // Fetch vehicles
      try {
        vehicles = await db.$queryRaw<VehicleRow[]>`
          SELECT
            id, reference, type, lotId, garageId,
            make, model, year, color, licensePlate,
            ownerFirstName, ownerLastName, ownerPhone,
            status, createdAt
          FROM Vehicle
          WHERE garageId = ${garage.id}
            AND status IN ('active', 'scanned', 'found')
          ORDER BY createdAt DESC
          LIMIT 20
        `;
      } catch (vehicleError) {
        console.error('Error fetching vehicles:', vehicleError);
      }

      // Fetch maintenance history (public, validated records only)
      try {
        maintenanceHistory = await db.$queryRaw<MaintenanceRow[]>`
          SELECT 
            m.id, m.category, m.description, m.totalCost, m.mileage, m.interventionDate,
            v.reference, v.make, v.model
          FROM MaintenanceRecord m
          JOIN Vehicle v ON m.vehicleId = v.id
          WHERE m.garageId = ${garage.id}
            AND m.ownerValidation = 'VALIDATED'
          ORDER BY m.interventionDate DESC
          LIMIT 10
        `;
      } catch (maintError) {
        console.error('Error fetching maintenance:', maintError);
      }

      // Fetch reviews (if any)
      try {
        reviews = await db.$queryRaw<ReviewRow[]>`
          SELECT id, rating, comment, userName, createdAt
          FROM GarageReview
          WHERE garageId = ${garage.id}
          ORDER BY createdAt DESC
          LIMIT 5
        `;
      } catch (reviewError) {
        // Table might not exist yet
        console.log('Reviews table not available');
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
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'active' || v.status === 'scanned').length;
  const foundVehicles = vehicles.filter((v) => v.status === 'found').length;
  const totalInterventions = maintenanceHistory.length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Contact info
  const displayPhone = garage.phone || null;
  const displayEmail = garage.email || null;
  const displayAddress = garage.address || null;
  const displayLogo = garage.logo;
  const whatsappNumber = garage.whatsappNumber || garage.phone;

  // Badges
  const badges = {
    topGarage: profile?.badgeTopRated || false,
    reactif: profile?.badgeRecommended || false,
    certifie: garage.isCertified || false,
  };

  // Services (from profile specialties or default)
  const services = profile?.specialties 
    ? JSON.parse(profile.specialties) 
    : ['Diagnostic', 'Réparation mécanique', 'Entretien courant'];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-12 lg:py-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/recherche" className="hover:text-white transition-colors">Garages</Link>
            <span>/</span>
            <span className="text-white">{garage.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Garage Info */}
            <div>
              {/* Logo & Name */}
              <div className="flex items-center gap-4 mb-6">
                {displayLogo ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-xl flex items-center justify-center">
                    <img src={displayLogo} alt={garage.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FF6600] to-[#FF8533] rounded-2xl flex items-center justify-center shadow-xl">
                    <QrCode className="w-10 h-10 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold">{garage.name}</h1>
                  {displayAddress && (
                    <p className="text-slate-400 flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {displayAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Partenaire OKAR
                </span>
                {badges.certifie && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6600]/20 text-[#FF6600] rounded-full text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Certifié
                  </span>
                )}
                {badges.topGarage && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                    <Star className="w-4 h-4" />
                    Top Garage
                  </span>
                )}
              </div>

              {/* Rating */}
              {avgRating && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(parseFloat(avgRating))
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{avgRating}</span>
                  <span className="text-slate-400">({reviews.length} avis)</span>
                </div>
              )}

              {/* Services */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">SERVICES</h3>
                <div className="flex flex-wrap gap-2">
                  {services.map((service: string, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-slate-700/50 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contacter via WhatsApp
                  </a>
                )}
                {displayPhone && (
                  <a
                    href={`tel:${displayPhone}`}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FF6600] hover:bg-[#FF8533] text-white rounded-xl font-medium transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Appeler
                  </a>
                )}
              </div>
            </div>

            {/* Right: Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Car className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-3xl font-bold">{totalVehicles}</p>
                <p className="text-slate-400 text-sm">Véhicules suivis</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Wrench className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold">{totalInterventions}</p>
                <p className="text-slate-400 text-sm">Interventions OKAR</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-3xl font-bold">{activeVehicles}</p>
                <p className="text-slate-400 text-sm">Clients actifs</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-3xl font-bold">100%</p>
                <p className="text-slate-400 text-sm">Interventions certifiées</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OKAR History Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              Historique OKAR Certifié
            </h2>
            <span className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Interventions vérifiées
            </span>
          </div>

          {maintenanceHistory.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600">Aucune intervention certifiée enregistrée</p>
              <p className="text-slate-400 text-sm mt-1">Les interventions validées apparaîtront ici</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {maintenanceHistory.map((record) => (
                  <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#FF6600]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-6 h-6 text-[#FF6600]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-slate-800">
                            {categoryLabels[record.category] || record.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(record.interventionDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {record.vehicle.make} {record.vehicle.model} • {record.vehicle.reference}
                        </p>
                        {record.description && (
                          <p className="text-sm text-slate-600 mt-2">{record.description}</p>
                        )}
                        {record.mileage && (
                          <p className="text-xs text-slate-400 mt-1">{record.mileage.toLocaleString()} km</p>
                        )}
                      </div>
                      {record.totalCost && (
                        <div className="text-right">
                          <p className="font-bold text-slate-800">
                            {record.totalCost.toLocaleString()} FCFA
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-8">
              Avis clients
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-slate-600 mb-3">&quot;{review.comment}&quot;</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{review.userName || 'Client anonyme'}</span>
                    <span>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map & Contact Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Contacter le garage</h2>
              
              <div className="space-y-4">
                {displayPhone && (
                  <a
                    href={`tel:${displayPhone}`}
                    className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#FF6600]/20 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-[#FF6600]" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Téléphone</p>
                      <p className="font-medium">{displayPhone}</p>
                    </div>
                  </a>
                )}
                
                {displayEmail && (
                  <a
                    href={`mailto:${displayEmail}`}
                    className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="font-medium">{displayEmail}</p>
                    </div>
                  </a>
                )}
                
                {displayAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(garage.name + ' ' + displayAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-400">Adresse</p>
                      <p className="font-medium">{displayAddress}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Horaires d&apos;ouverture</h2>
              
              <div className="bg-slate-800 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Lundi - Vendredi</span>
                    <span className="font-medium">08:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Samedi</span>
                    <span className="font-medium">08:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Dimanche</span>
                    <span className="text-slate-500">Fermé</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Ouvert maintenant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-8 text-center text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p className="flex items-center justify-center gap-2 mb-2">
            <QrCode className="w-5 h-5 text-[#FF6600]" />
            <span className="font-semibold text-white">OKAR</span>
            <span className="text-slate-400">— Passeport numérique automobile</span>
          </p>
          <p>
            Cette page est générée automatiquement à partir des données certifiées OKAR
          </p>
        </div>
      </footer>
    </main>
  );
}
