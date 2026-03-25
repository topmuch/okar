'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeData } from './QRCodeCard';
import {
  Car,
  User,
  Phone,
  Mail,
  Gauge,
  Shield,
  Wrench,
  ExternalLink,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  Calendar,
  MapPin,
  FileText,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaintenanceRecord {
  id: string;
  category: string;
  subCategory?: string;
  description?: string;
  mileage?: number;
  totalCost?: number;
  status: string;
  interventionDate: string;
  garage?: {
    name: string;
  };
}

interface VehicleDetailModalProps {
  open: boolean;
  onClose: () => void;
  qrCode: QRCodeData | null;
  onViewPublicProfile?: () => void;
  onSuspendQR?: () => void;
  onTransferOwnership?: () => void;
}

export default function VehicleDetailModal({
  open,
  onClose,
  qrCode,
  onViewPublicProfile,
  onSuspendQR,
  onTransferOwnership
}: VehicleDetailModalProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  const vehicle = qrCode?.vehicle;
  const owner = vehicle?.owner;

  // Charger l'historique d'entretien
  useEffect(() => {
    if (open && qrCode?.linkedVehicleId) {
      fetchMaintenanceRecords(qrCode.linkedVehicleId);
    }
  }, [open, qrCode?.linkedVehicleId]);

  const fetchMaintenanceRecords = async (vehicleId: string) => {
    setLoadingMaintenance(true);
    try {
      const res = await fetch(`/api/maintenance-records?vehicleId=${vehicleId}&limit=20`);
      const data = await res.json();
      if (data.records) {
        setMaintenanceRecords(data.records);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  if (!qrCode) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Non renseigné';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (dateStr?: string) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const vtDays = getDaysUntilExpiry(vehicle?.vtEndDate);
  const insuranceDays = getDaysUntilExpiry(vehicle?.insuranceEndDate);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'VIDANGE': 'Vidange',
      'FREINS': 'Freins',
      'PNEUS': 'Pneus',
      'BATTERIE': 'Batterie',
      'MOTEUR': 'Moteur',
      'TRANSMISSION': 'Transmission',
      'SUSPENSION': 'Suspension',
      'CLIMATISATION': 'Climatisation',
      'ELECTRIQUE': 'Électrique',
      'CARROSSERIE': 'Carrosserie',
      'CONTROLE_TECHNIQUE': 'Contrôle Technique',
      'ASSURANCE': 'Assurance',
      'AUTRE': 'Autre'
    };
    return labels[category] || category;
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn';
  const publicProfileUrl = `${appUrl}/v/${qrCode.shortCode}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-500" />
            Fiche Véhicule - {qrCode.shortCode}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête Véhicule */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Photo */}
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
              {vehicle?.mainPhoto ? (
                <img src={vehicle.mainPhoto} alt="Véhicule" className="w-full h-full object-cover" />
              ) : (
                <Car className="w-16 h-16 text-slate-300" />
              )}
            </div>

            {/* Infos principales */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {vehicle?.make || 'Marque'} {vehicle?.model || 'Modèle'} {vehicle?.year || ''}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Immatriculation: <span className="font-semibold text-slate-700 dark:text-slate-300">{vehicle?.licensePlate || 'Non renseignée'}</span>
                </p>
                {qrCode.activationDate && (
                  <p className="text-xs text-slate-400 mt-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Activé le {formatDate(qrCode.activationDate)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kilométrage</p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {vehicle?.currentMileage?.toLocaleString() || 0} km
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Score OKAR</p>
                  <p className={cn(
                    "font-bold text-lg",
                    (vehicle?.okarScore || 0) >= 80 ? 'text-emerald-500' :
                    (vehicle?.okarScore || 0) >= 50 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {vehicle?.okarScore || 0}/100
                  </p>
                </div>
              </div>

              {/* Propriétaire */}
              {owner && (
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Propriétaire</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{owner.name || 'Non renseigné'}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                        {owner.phone && (
                          <a href={`tel:${owner.phone}`} className="flex items-center gap-1 hover:text-orange-500">
                            <Phone className="w-3 h-3" /> {owner.phone}
                          </a>
                        )}
                        {owner.email && (
                          <a href={`mailto:${owner.email}`} className="flex items-center gap-1 hover:text-orange-500">
                            <Mail className="w-3 h-3" /> {owner.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Garage activateur */}
              {qrCode.assignedGarageName && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span>Garage activateur: <strong>{qrCode.assignedGarageName}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Santé du véhicule */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
              <Shield className="w-4 h-4 text-orange-500" />
              Santé du Véhicule
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* CT */}
              <div className={cn(
                "rounded-lg p-4 border",
                vtDays === null ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' :
                vtDays < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                vtDays < 30 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Contrôle Technique</span>
                  {vtDays !== null && vtDays < 30 && (
                    <AlertTriangle className={cn("w-4 h-4", vtDays < 0 ? 'text-red-500' : 'text-amber-500')} />
                  )}
                </div>
                <p className="text-lg font-bold mt-1 text-slate-800 dark:text-white">
                  {vehicle?.vtEndDate ? formatDate(vehicle.vtEndDate) : 'Non renseigné'}
                </p>
                {vtDays !== null && (
                  <p className={cn(
                    "text-xs mt-1",
                    vtDays < 0 ? 'text-red-500' : vtDays < 30 ? 'text-amber-500' : 'text-emerald-500'
                  )}>
                    {vtDays < 0 ? `Expiré depuis ${Math.abs(vtDays)} jours` : `${vtDays} jours restants`}
                  </p>
                )}
              </div>

              {/* Assurance */}
              <div className={cn(
                "rounded-lg p-4 border",
                insuranceDays === null ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' :
                insuranceDays < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                insuranceDays < 30 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Assurance</span>
                  {insuranceDays !== null && insuranceDays < 30 && (
                    <AlertTriangle className={cn("w-4 h-4", insuranceDays < 0 ? 'text-red-500' : 'text-amber-500')} />
                  )}
                </div>
                <p className="text-lg font-bold mt-1 text-slate-800 dark:text-white">
                  {vehicle?.insuranceEndDate ? formatDate(vehicle.insuranceEndDate) : 'Non renseigné'}
                </p>
                {insuranceDays !== null && (
                  <p className={cn(
                    "text-xs mt-1",
                    insuranceDays < 0 ? 'text-red-500' : insuranceDays < 30 ? 'text-amber-500' : 'text-emerald-500'
                  )}>
                    {insuranceDays < 0 ? `Expirée depuis ${Math.abs(insuranceDays)} jours` : `${insuranceDays} jours restants`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Historique d'entretien */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
              <Wrench className="w-4 h-4 text-orange-500" />
              Carnet d'Entretien ({vehicle?.maintenanceCount || maintenanceRecords.length} interventions)
            </h4>

            {loadingMaintenance ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <span className="ml-2 text-slate-500">Chargement de l'historique...</span>
              </div>
            ) : maintenanceRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Wrench className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Aucune intervention enregistrée</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4 max-h-80 overflow-y-auto">
                {maintenanceRecords.map((record, index) => (
                  <div key={record.id} className="relative">
                    <div className={cn(
                      "absolute -left-8 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900",
                      record.status === 'VALIDATED' ? 'bg-emerald-500' :
                      record.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'
                    )} />
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {getCategoryLabel(record.category)}
                            {record.subCategory && ` - ${record.subCategory}`}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatShortDate(record.interventionDate)}
                            {record.garage?.name && ` • ${record.garage.name}`}
                          </p>
                          {record.description && (
                            <p className="text-xs text-slate-400 mt-1">{record.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {record.totalCost !== undefined && record.totalCost > 0 && (
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                              {record.totalCost.toLocaleString()} FCFA
                            </p>
                          )}
                          {record.mileage && (
                            <p className="text-xs text-slate-400">{record.mileage.toLocaleString()} km</p>
                          )}
                          <Badge className={cn(
                            "text-xs mt-1",
                            record.status === 'VALIDATED' ? 'bg-emerald-500' :
                            record.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-500'
                          )}>
                            {record.status === 'VALIDATED' ? 'Validé' :
                             record.status === 'PENDING' ? 'En attente' : record.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Superadmin */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => window.open(publicProfileUrl, '_blank')}
              className="flex-1 min-w-[150px]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir le Profil Public
            </Button>
            <Button
              variant="outline"
              onClick={onTransferOwnership}
              className="flex-1 min-w-[150px]"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transférer Propriété
            </Button>
            <Button
              variant="destructive"
              onClick={onSuspendQR}
              className="min-w-[120px]"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Suspendre QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
