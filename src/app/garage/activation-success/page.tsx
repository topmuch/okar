'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  User,
  Car,
  Phone,
  Key,
  QrCode,
  ExternalLink,
  MessageCircle,
  Printer,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Share2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Types
interface TicketData {
  id: string;
  driverName: string;
  driverPhone: string;
  driverEmail?: string | null;
  vehicleInfo: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  licensePlate?: string | null;
  qrReference: string;
  tempPassword: string;
  loginUrl: string;
  garageName?: string;
  generatedAt: string;
}

// WhatsApp message generator
function generateWhatsAppMessage(data: TicketData): string {
  const formattedDate = new Date(data.generatedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `🚗 *Bienvenue sur OKAR !*

Votre passeport numérique automobile a été activé avec succès.

━━━━━━━━━━━━━━━━━━━━━
📋 *VOS INFORMATIONS*

👤 *Nom:* ${data.driverName}
📱 *Téléphone:* ${data.driverPhone}
🚙 *Véhicule:* ${data.vehicleInfo}
🏷️ *Référence QR:* ${data.qrReference}

━━━━━━━━━━━━━━━━━━━━━
🔐 *VOS ACCÈS*

📌 *Lien de connexion:*
${data.loginUrl}

📞 *Login (Téléphone):*
${data.driverPhone}

🔑 *Mot de passe provisoire:*
\`${data.tempPassword}\`

⚠️ _À changer à la première connexion_

━━━━━━━━━━━━━━━━━━━━━

📅 Activé le: ${formattedDate}

Téléchargez l'app OKAR pour gérer votre véhicule:
- Historique d'entretien
- Rappels visite technique & assurance
- Transfert de propriété simplifié
- Et bien plus encore !

_OKAR - Le passeport numérique automobile du Sénégal_`;
}

function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '221' + cleaned.substring(1);
  }
  if (cleaned.length === 9) {
    cleaned = '221' + cleaned;
  }
  return cleaned;
}

function ActivationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticketId');
  const vehicleId = searchParams.get('vehicleId');

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Load ticket data from localStorage or API
  useEffect(() => {
    const loadTicketData = async () => {
      // First try to load from localStorage (set during activation)
      const storedTicket = localStorage.getItem('activationTicket');
      if (storedTicket) {
        try {
          const parsed = JSON.parse(storedTicket);
          setTicket(parsed);
          setLoading(false);
          // Clear from localStorage after loading
          localStorage.removeItem('activationTicket');
          return;
        } catch {
          // Invalid data, continue to API
        }
      }

      // If we have ticketId or vehicleId, fetch from API
      if (ticketId || vehicleId) {
        try {
          const params = new URLSearchParams();
          if (ticketId) params.append('ticketId', ticketId);
          if (vehicleId) params.append('vehicleId', vehicleId);

          const res = await fetch(`/api/garage/access-ticket?${params.toString()}`);
          const data = await res.json();

          if (data.success && data.ticket) {
            setTicket(data.ticket);
          } else {
            setError(data.error || 'Impossible de charger le ticket');
          }
        } catch (err) {
          setError('Erreur de chargement');
        }
      }

      setLoading(false);
    };

    loadTicketData();
  }, [ticketId, vehicleId]);

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copié !`);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleWhatsApp = useCallback(() => {
    if (!ticket) return;

    const message = generateWhatsAppMessage(ticket);
    const phone = cleanPhoneNumber(ticket.driverPhone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Mark as sent via WhatsApp
    fetch('/api/garage/access-ticket', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: ticket.id, channel: 'whatsapp' }),
    }).catch(() => {});

    window.open(url, '_blank');
  }, [ticket]);

  const handlePrint = useCallback(() => {
    if (!ticket) return;

    // Mark as printed
    fetch('/api/garage/access-ticket', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: ticket.id, channel: 'print' }),
    }).catch(() => {});

    // Generate print HTML
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintHtml(ticket));
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }, [ticket]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error || 'Aucun ticket trouvé'}</p>
            <Button asChild>
              <Link href="/garage/vehicules">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux véhicules
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = new Date(ticket.generatedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/garage/vehicules" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">Activation réussie</h1>
            <p className="text-sm text-gray-500">Ticket d'accès client</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">QR Code activé avec succès !</h2>
              <p className="text-white/90 text-sm">Le passeport numérique du véhicule est maintenant actif</p>
            </div>
          </div>
        </div>

        {/* Ticket Card */}
        <Card className="overflow-hidden shadow-xl border-0 mb-6">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-orange-500 p-6 text-white relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }} />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-wider">OKAR</h3>
                  <p className="text-xs text-white/70 uppercase tracking-wider">Passeport Numérique</p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">
                Ticket d'Accès
              </Badge>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Client Section */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informations Client
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nom</span>
                  <span className="font-semibold text-gray-900">{ticket.driverName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Téléphone
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{ticket.driverPhone}</span>
                    <button
                      onClick={() => handleCopy(ticket.driverPhone, 'Téléphone')}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copied === 'Téléphone' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {ticket.driverEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email</span>
                    <span className="font-semibold text-gray-900">{ticket.driverEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Section */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Véhicule
              </h4>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-900 font-bold text-lg">
                    {ticket.vehicleMake} {ticket.vehicleModel}
                  </span>
                </div>
                {ticket.licensePlate && (
                  <div className="inline-flex items-center">
                    <span className="bg-slate-800 text-white font-mono font-bold px-3 py-1.5 rounded-lg text-sm tracking-wider">
                      {ticket.licensePlate}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* QR Reference */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Référence QR
              </h4>
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white text-center">
                <span className="font-mono font-bold text-2xl tracking-wider">{ticket.qrReference}</span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Credentials Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Accès au Compte
              </h4>
              <div className="bg-slate-50 rounded-xl p-4 border-2 border-orange-200">
                {/* Login URL */}
                <div className="bg-slate-800 text-white rounded-lg p-3 mb-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">Lien de connexion</p>
                  <a
                    href={ticket.loginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center justify-center gap-1"
                  >
                    {ticket.loginUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Login */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 block mb-1">Login (Téléphone)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono font-semibold">
                      {ticket.driverPhone}
                    </div>
                    <button
                      onClick={() => handleCopy(ticket.driverPhone, 'Login')}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copied === 'Login' ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 block mb-1">Mot de passe provisoire</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono font-semibold text-lg tracking-wider">
                      {ticket.tempPassword}
                    </div>
                    <button
                      onClick={() => handleCopy(ticket.tempPassword, 'Mot de passe')}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copied === 'Mot de passe' ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-red-500 text-center font-medium flex items-center justify-center gap-1">
                  ⚠️ À changer à la première connexion
                </p>
              </div>
            </div>
          </CardContent>

          {/* Ticket Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Généré le {formattedDate}</span>
              {ticket.garageName && <span>Par {ticket.garageName}</span>}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={handleWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white h-14 text-lg"
            size="lg"
          >
            <MessageCircle className="w-6 h-6 mr-2" />
            WhatsApp
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="h-14 text-lg border-2"
            size="lg"
          >
            <Printer className="w-6 h-6 mr-2" />
            Imprimer PDF
          </Button>
        </div>

        {/* Additional Actions */}
        <div className="flex gap-4">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/garage/vehicules">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux véhicules
            </Link>
          </Button>
          <Button asChild className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500">
            <Link href="/garage/activate">
              <QrCode className="w-4 h-4 mr-2" />
              Activer un autre QR
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

// Print HTML generator
function generatePrintHtml(data: TicketData): string {
  const formattedDate = new Date(data.generatedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket d'Accès OKAR - ${data.driverName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    @page { size: 80mm auto; margin: 0; }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .ticket {
      width: 80mm;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .ticket-header {
      background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #f97316 100%);
      color: white;
      padding: 16px 12px;
      text-align: center;
    }
    
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .logo-icon {
      width: 32px;
      height: 32px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2px;
    }
    
    .ticket-subtitle {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
    }
    
    .ticket-body {
      padding: 12px;
    }
    
    .section {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #e2e8f0;
    }
    
    .section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    .section-title {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .info-label {
      font-size: 10px;
      color: #64748b;
    }
    
    .info-value {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .vehicle-badge {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-radius: 6px;
      padding: 8px 10px;
      margin-top: 4px;
    }
    
    .vehicle-name {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 2px;
    }
    
    .vehicle-plate {
      display: inline-block;
      background: #1e293b;
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    
    .credentials-box {
      background: #f8fafc;
      border: 2px solid #f97316;
      border-radius: 8px;
      padding: 10px;
    }
    
    .login-url {
      background: #1e293b;
      color: white;
      font-size: 9px;
      padding: 6px 8px;
      border-radius: 4px;
      text-align: center;
      margin-bottom: 8px;
      word-break: break-all;
    }
    
    .credential-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .credential-label {
      font-size: 9px;
      color: #64748b;
      min-width: 40px;
    }
    
    .credential-value {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
      font-family: 'Courier New', monospace;
      background: white;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      flex: 1;
    }
    
    .password-warning {
      font-size: 8px;
      color: #dc2626;
      font-weight: 500;
      margin-top: 6px;
      text-align: center;
    }
    
    .qr-reference {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    
    .qr-label {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
    }
    
    .qr-value {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    
    .ticket-footer {
      background: #f8fafc;
      padding: 10px 12px;
      text-align: center;
    }
    
    .footer-date {
      font-size: 9px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .footer-garage {
      font-size: 9px;
      color: #1e293b;
      font-weight: 500;
    }
    
    .footer-brand {
      font-size: 8px;
      color: #94a3b8;
      margin-top: 6px;
    }
    
    @media print {
      body { background: none; padding: 0; }
      .ticket { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="logo-text">OKAR</span>
      </div>
      <div class="ticket-subtitle">Passeport Numérique Automobile</div>
    </div>
    
    <div class="ticket-body">
      <div class="section">
        <div class="section-title">👤 Client</div>
        <div class="info-row">
          <span class="info-label">Nom</span>
          <span class="info-value">${data.driverName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Téléphone</span>
          <span class="info-value">${data.driverPhone}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">🚗 Véhicule</div>
        <div class="vehicle-badge">
          <div class="vehicle-name">${data.vehicleMake || ''} ${data.vehicleModel || ''}</div>
          ${data.licensePlate ? '<div class="vehicle-plate">' + data.licensePlate + '</div>' : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="qr-reference">
          <div class="qr-label">Référence QR</div>
          <div class="qr-value">${data.qrReference}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">🔐 Vos Accès</div>
        <div class="credentials-box">
          <div class="login-url">${data.loginUrl}</div>
          <div class="credential-row">
            <span class="credential-label">Login</span>
            <div class="credential-value">${data.driverPhone}</div>
          </div>
          <div class="credential-row">
            <span class="credential-label">MDP</span>
            <div class="credential-value">${data.tempPassword}</div>
          </div>
          <div class="password-warning">⚠️ À changer à la première connexion</div>
        </div>
      </div>
    </div>
    
    <div class="ticket-footer">
      <div class="footer-date">Généré le ${formattedDate}</div>
      ${data.garageName ? '<div class="footer-garage">Par ' + data.garageName + '</div>' : ''}
      <div class="footer-brand">OKAR.sn - Le passeport numérique automobile</div>
    </div>
  </div>
</body>
</html>
  `;
}

export default function ActivationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    }>
      <ActivationSuccessContent />
    </Suspense>
  );
}
