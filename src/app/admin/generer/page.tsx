'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  RefreshCw,
  CheckCircle,
  Building2,
  Package,
  AlertCircle,
  Shield,
  Download,
  Eye,
  Copy,
  Check,
  User,
  ShoppingCart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types
interface Garage {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  isCertified: boolean;
  active: boolean;
}

interface QRLot {
  id: string;
  dbId: string;
  prefix: string;
  count: number;
  status: string;
  garageId: string | null;
  createdAt: string;
}

interface QRCodeItem {
  index: number;
  shortCode: string;
  scanUrl: string;
}

export default function GenererQRPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedLot, setGeneratedLot] = useState<QRLot | null>(null);
  const [generatedQRCodes, setGeneratedQRCodes] = useState<QRCodeItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    count: 50,
    garageId: 'none',
    prefix: 'OKAR',
    notes: '',
    type: 'garage', // 'garage' or 'individual'
  });

  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/garages');
      const data = await res.json();
      setGarages(data.garages || []);
    } catch (error) {
      console.error('Error fetching garages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    setErrorMessage('');
    setGeneratedLot(null);
    setGeneratedQRCodes([]);

    // Validation
    if (form.count < 1 || form.count > 1000) {
      setErrorMessage('Le nombre de QR doit être entre 1 et 1000');
      return;
    }

    if (form.type === 'garage' && form.garageId === 'none') {
      setErrorMessage('Veuillez sélectionner un garage pour les QR codes assignés');
      return;
    }

    setQrGenerating(true);

    try {
      const response = await fetch('/api/admin/qr-lots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: form.count,
          garageId: form.type === 'garage' ? form.garageId : undefined,
          prefix: form.prefix,
          notes: form.notes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedLot(data.lot);
        setGeneratedQRCodes(data.qrCodes);
        setSuccessMessage(`✅ ${data.qrCodes.length} codes QR générés avec succès !`);

        // Reset form
        setForm({
          count: 50,
          garageId: 'none',
          prefix: 'OKAR',
          notes: '',
          type: 'garage',
        });

        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      setErrorMessage('Erreur lors de la génération des QR codes');
    } finally {
      setQrGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, code: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQRList = () => {
    if (!generatedQRCodes.length) return;

    const csvContent = [
      'Index,Code Court,URL Scan',
      ...generatedQRCodes.map(qr => `${qr.index},${qr.shortCode},${qr.scanUrl}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-lot-${generatedLot?.id || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Génération de QR Codes
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Créez des lots de QR Codes pour les garages ou pour la vente aux particuliers
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Generation Form */}
        <Card className="lg:col-span-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-500" />
              Nouveau Lot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Type de QR Code *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'garage', garageId: 'none' })}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all",
                    form.type === 'garage'
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-orange-300"
                  )}
                >
                  <Building2 className={cn("w-5 h-5 mb-1", form.type === 'garage' ? 'text-orange-500' : 'text-slate-400')} />
                  <p className="font-medium text-sm">Garage</p>
                  <p className="text-xs text-slate-500">Assigné à un garage partenaire</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'individual' })}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all",
                    form.type === 'individual'
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                  )}
                >
                  <ShoppingCart className={cn("w-5 h-5 mb-1", form.type === 'individual' ? 'text-purple-500' : 'text-slate-400')} />
                  <p className="font-medium text-sm">Particulier</p>
                  <p className="text-xs text-slate-500">Vente directe aux clients</p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Préfixe</Label>
              <Input
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase().slice(0, 10) })}
                placeholder="OKAR"
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Nombre de QR Codes *</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={form.count}
                onChange={(e) => setForm({ ...form, count: parseInt(e.target.value) || 1 })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
              <p className="text-xs text-slate-500">Entre 1 et 1000 QR codes par lot</p>
            </div>

            {/* Garage Selection - Only for garage type */}
            {form.type === 'garage' && (
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Garage partenaire *</Label>
                <Select
                  value={form.garageId}
                  onValueChange={(v) => setForm({ ...form, garageId: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                    <SelectValue placeholder="Sélectionner un garage" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="none">Sélectionner un garage...</SelectItem>
                    {garages.filter(g => g.active && g.isCertified).map((garage) => (
                      <SelectItem key={garage.id} value={garage.id}>
                        {garage.name} {garage.isCertified && '✓'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Individual Info */}
            {form.type === 'individual' && (
              <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-2">
                  <User className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-800 dark:text-purple-300">QR Codes Non Assignés</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      Ces QR codes pourront être vendus à des particuliers. Ils seront activés par n'importe quel garage certifié lors de l'enregistrement du véhicule.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Commande #123, Campagne..."
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            <Button
              className={cn(
                "w-full text-white rounded-xl",
                form.type === 'individual'
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  : "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              )}
              onClick={handleGenerateQR}
              disabled={qrGenerating}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", qrGenerating ? 'animate-spin' : '')} />
              {qrGenerating ? 'Génération...' : `Générer ${form.count} QR Codes`}
            </Button>
          </CardContent>
        </Card>

        {/* Generated QR Codes List */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-600" />
              QR Codes Générés
            </CardTitle>
            {generatedQRCodes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRList}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {generatedLot ? (
              <div>
                {/* Lot Info */}
                <div className={cn(
                  "rounded-xl p-4 mb-4",
                  generatedLot.garageId
                    ? "bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-500/10 dark:to-pink-500/10"
                    : "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{generatedLot.id}</span>
                    <Badge className={generatedLot.garageId ? "bg-orange-500" : "bg-purple-500"}>
                      {generatedLot.garageId ? 'Assigné au garage' : 'Vente Particuliers'}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {generatedQRCodes.length} codes • Créé le {new Date(generatedLot.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>

                {/* QR Codes List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {generatedQRCodes.slice(0, 100).map((qr) => (
                    <div
                      key={qr.shortCode}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-8">#{qr.index}</span>
                        <code className="text-sm font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded">
                          {qr.shortCode}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 hidden sm:block">
                          {qr.scanUrl}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(qr.scanUrl, qr.shortCode)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedCode === qr.shortCode ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {generatedQRCodes.length > 100 && (
                    <div className="text-center text-sm text-slate-500 py-2">
                      ... et {generatedQRCodes.length - 100} autres codes
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Les QR Codes générés apparaîtront ici</p>
                <p className="text-sm mt-1">Configurez et lancez la génération</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{garages.filter(g => g.active && g.isCertified).length}</p>
              <p className="text-sm text-white/80">Garages certifiés</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            <div>
              <p className="text-lg font-bold">Vente Directe</p>
              <p className="text-sm text-white/80">QR pour particuliers</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <p className="text-lg font-bold">UUID Sécurisé</p>
              <p className="text-sm text-white/80">Anti-fraude</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <Card className="mt-6 bg-slate-900 text-white rounded-2xl">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Workflow des QR Codes
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-orange-400" />
                <p className="font-medium text-white">QR Codes Garage</p>
              </div>
              <p>Assignés à un garage spécifique. Seul ce garage peut les activer pour ses clients.</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-purple-400" />
                <p className="font-medium text-white">QR Codes Particuliers</p>
              </div>
              <p>Non assignés, vendus directement aux clients. Activables par n'importe quel garage certifié.</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Statut STOCK</p>
              <p>QR Code créé mais non activé - En attente d'activation par un garage.</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Statut ACTIVE</p>
              <p>QR Code lié à un véhicule - Affiche le passeport automobile lors du scan.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
