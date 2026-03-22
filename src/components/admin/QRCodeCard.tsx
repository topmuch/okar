'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ExternalLink,
  Copy,
  Check,
  Printer,
  Eye,
  User,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ========================================
// TYPES
// ========================================
export interface QRCodeData {
  id: string;
  codeUnique: string;
  shortCode: string;
  status: 'STOCK' | 'ACTIVE' | 'REVOKED' | 'LOST';
  lotId: string;
  lotPrefix: string;
  assignedGarageId?: string;
  assignedGarageName?: string;
  linkedVehicleId?: string;
  activationDate?: string;
  createdAt: string;
  // Relations (populated when activated)
  vehicle?: {
    id: string;
    reference: string;
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    licensePlate?: string;
    mainPhoto?: string;
    currentMileage?: number;
    okarScore?: number;
    okarBadge?: string;
    vtEndDate?: string;
    insuranceEndDate?: string;
    owner?: {
      id: string;
      name?: string;
      phone?: string;
      email?: string;
    };
    maintenanceCount?: number;
  };
  garage?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface QRCodeCardProps {
  qrCode: QRCodeData;
  onViewDetails?: (qr: QRCodeData) => void;
  onPrint?: (qr: QRCodeData) => void;
  onSuspend?: (qr: QRCodeData) => void;
}

// ========================================
// QR CODE CARD COMPONENT
// ========================================
export default function QRCodeCard({ qrCode, onViewDetails, onPrint, onSuspend }: QRCodeCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // URL du QR Code
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn';
  const scanUrl = `${appUrl}/v/${qrCode.shortCode}`;
  const activateUrl = `${appUrl}/activate/${qrCode.shortCode}`;

  // Configuration du statut
  const statusConfig = {
    STOCK: {
      label: 'En Stock',
      color: 'bg-slate-500',
      textColor: 'text-slate-500',
      bgColor: 'bg-slate-50 dark:bg-slate-800',
      borderColor: 'border-slate-200 dark:border-slate-700',
      icon: Clock
    },
    ACTIVE: {
      label: 'Activé',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle
    },
    REVOKED: {
      label: 'Révoqué',
      color: 'bg-red-500',
      textColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: XCircle
    },
    LOST: {
      label: 'Perdu',
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      icon: AlertTriangle
    }
  };

  const status = statusConfig[qrCode.status] || statusConfig.STOCK;
  const StatusIcon = status.icon;

  // Copier dans le presse-papier
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  // Format du code court (ex: XYZ-123)
  const formattedCode = qrCode.shortCode.length > 3
    ? `${qrCode.shortCode.slice(0, 3)}-${qrCode.shortCode.slice(3)}`
    : qrCode.shortCode;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      status.borderColor
    )}>
      <CardContent className="p-0">
        {/* Header avec statut */}
        <div className={cn(
          "px-4 py-2 flex items-center justify-between",
          status.bgColor
        )}>
          <Badge className={cn(status.color, "text-white text-xs")}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Lot: {qrCode.lotPrefix}
          </span>
        </div>

        {/* Contenu principal */}
        <div className="p-4">
          <div className="flex gap-4">
            {/* QR Code Image */}
            <div className="flex-shrink-0 bg-white p-2 rounded-xl shadow-inner dark:bg-slate-100">
              <QRCodeSVG
                value={scanUrl}
                size={100}
                level="H"
                includeMargin={false}
                fgColor="#1e293b"
              />
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              {/* Code alphanumérique */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white">
                  {formattedCode}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => copyToClipboard(qrCode.shortCode, 'code')}
                >
                  {copied === 'code' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Lien QR Code - Affiche le lien de scan si activé, sinon le lien d'activation */}
              <div className="mb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {qrCode.status === 'ACTIVE' ? 'Lien du QR Code:' : 'Lien d\'activation:'}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded truncate max-w-[180px]">
                    {qrCode.status === 'ACTIVE' ? scanUrl : activateUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(qrCode.status === 'ACTIVE' ? scanUrl : activateUrl, '_blank')}
                    title={qrCode.status === 'ACTIVE' ? 'Ouvrir le passeport véhicule' : 'Ouvrir le lien d\'activation'}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(qrCode.status === 'ACTIVE' ? scanUrl : activateUrl, 'url')}
                    title="Copier le lien"
                  >
                    {copied === 'url' ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Garage assigné (si applicable) */}
              {qrCode.assignedGarageName && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Garage:</span>
                  <span>{qrCode.assignedGarageName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Véhicule lié (si activé) */}
          {qrCode.status === 'ACTIVE' && qrCode.vehicle && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3">
                {/* Photo véhicule ou placeholder */}
                <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                  {qrCode.vehicle.mainPhoto ? (
                    <img
                      src={qrCode.vehicle.mainPhoto}
                      alt="Véhicule"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 dark:text-white truncate">
                    {qrCode.vehicle.make} {qrCode.vehicle.model} {qrCode.vehicle.year}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {qrCode.vehicle.licensePlate || 'Immatriculation non renseignée'}
                  </p>

                  {/* Propriétaire */}
                  {qrCode.vehicle.owner && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <User className="w-3 h-3" />
                      <span>{qrCode.vehicle.owner.name || 'Propriétaire'}</span>
                    </div>
                  )}
                </div>

                {/* Score OKAR */}
                {qrCode.vehicle.okarScore !== undefined && qrCode.vehicle.okarScore !== null && (
                  <div className="text-center">
                    <div className={cn(
                      "text-lg font-bold",
                      qrCode.vehicle.okarScore >= 80 ? 'text-emerald-500' :
                      qrCode.vehicle.okarScore >= 50 ? 'text-amber-500' : 'text-red-500'
                    )}>
                      {qrCode.vehicle.okarScore}
                    </div>
                    <p className="text-xs text-slate-500">Score</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          {qrCode.status === 'ACTIVE' && qrCode.vehicle && onViewDetails && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
              onClick={() => onViewDetails(qrCode)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Fiche Véhicule
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPrint?.(qrCode)}
          >
            <Printer className="w-4 h-4 mr-1" />
            Imprimer
          </Button>

          {qrCode.status === 'ACTIVE' && onSuspend && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => onSuspend(qrCode)}
              title="Suspendre ce QR Code"
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
