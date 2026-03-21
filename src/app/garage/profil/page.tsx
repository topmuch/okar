'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Shield,
  Clock,
  Calendar,
  Wrench,
  Car,
  QrCode,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Camera,
  Edit2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// OKAR Brand
const OKAR_ORANGE = '#FF6600';

interface GarageStats {
  totalVehicles: number;
  totalInterventions: number;
  validatedInterventions: number;
  pendingInterventions: number;
  qrCodesUsed: number;
}

export default function ProfilOKARPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<GarageStats>({
    totalVehicles: 0,
    totalInterventions: 0,
    validatedInterventions: 0,
    pendingInterventions: 0,
    qrCodesUsed: 0
  });
  const [loading, setLoading] = useState(true);

  const garage = user?.garage;
  const garageId = user?.garageId || '';

  useEffect(() => {
    if (garageId) {
      fetchStats();
    }
  }, [garageId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicles count
      const vehiclesRes = await fetch(`/api/vehicles?garageId=${garageId}`);
      const vehiclesData = await vehiclesRes.json();
      
      // Fetch interventions count
      const interventionsRes = await fetch(`/api/maintenance-records?garageId=${garageId}`);
      const interventionsData = await interventionsRes.json();

      setStats({
        totalVehicles: vehiclesData.stats?.total || 0,
        totalInterventions: interventionsData.stats?.total || 0,
        validatedInterventions: interventionsData.stats?.validated || 0,
        pendingInterventions: interventionsData.stats?.pending || 0,
        qrCodesUsed: vehiclesData.stats?.active || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/garage/connexion');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-black text-white">Mon Profil OKAR</h1>
        <p className="text-zinc-500">Gérez les informations de votre garage</p>
      </div>

      {/* Garage Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        {/* Header with logo */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#FF6600]/10 border-2 border-[#FF6600]/30 rounded-2xl flex items-center justify-center relative group">
              {garage?.logo ? (
                <img src={garage.logo} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-10 h-10 text-[#FF6600]" />
              )}
              <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{garage?.name || 'Mon Garage'}</h2>
              {garage?.isCertified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF6600]/10 border border-[#FF6600]/30 rounded-full text-sm font-semibold text-[#FF6600] mt-2">
                  <Shield className="w-4 h-4" />
                  CERTIFIÉ OKAR
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-6 space-y-4">
          {garage?.phone && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Téléphone</p>
                <p className="text-white font-medium">{garage.phone}</p>
              </div>
            </div>
          )}

          {garage?.email && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-white font-medium">{garage.email}</p>
              </div>
            </div>
          )}

          {garage?.address && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Adresse</p>
                <p className="text-white font-medium">{garage.address}</p>
              </div>
            </div>
          )}

          {garage?.createdAt && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Membre depuis</p>
                <p className="text-white font-medium">{formatDate(garage.createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#FF6600]" />
          Statistiques
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Car className="w-4 h-4" />
              <span className="text-xs">Véhicules</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalVehicles}</p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Wrench className="w-4 h-4" />
              <span className="text-xs">Interventions</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalInterventions}</p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Validées</span>
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats.validatedInterventions}</p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <QrCode className="w-4 h-4" />
              <span className="text-xs">Pass activés</span>
            </div>
            <p className="text-2xl font-black text-[#FF6600]">{stats.qrCodesUsed}</p>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      {garage?.subscriptionPlan && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Abonnement</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold capitalize">{garage.subscriptionPlan}</p>
              <p className="text-zinc-500 text-sm">Plan actuel</p>
            </div>
            {garage.subscriptionExpiresAt && (
              <div className="text-right">
                <p className="text-white">{formatDate(garage.subscriptionExpiresAt)}</p>
                <p className="text-zinc-500 text-sm">Expiration</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase font-semibold">Compte utilisateur</p>
        </div>
        
        <div className="divide-y divide-zinc-800">
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-zinc-500 text-xs">Nom</p>
              <p className="text-white font-medium">{user?.name || 'Non renseigné'}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-zinc-500 text-xs">Email</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-zinc-500 text-xs">Téléphone</p>
              <p className="text-white font-medium">{user?.phone || 'Non renseigné'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>

      {/* Version */}
      <div className="text-center pt-4">
        <p className="text-zinc-600 text-sm">OKAR v1.0.0</p>
        <p className="text-zinc-700 text-xs mt-1">© 2024 OKAR - Tous droits réservés</p>
      </div>
    </div>
  );
}
