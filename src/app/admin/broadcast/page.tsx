'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone,
  Send,
  Users,
  Building2,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Smartphone,
  Mail,
  Bell,
  Edit3,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Types
interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  targetScope: string;
  channels: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  sentCount: number;
  createdAt: string;
}

export default function AdminBroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New broadcast form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('INFO');
  const [targetScope, setTargetScope] = useState('ALL');
  const [channels, setChannels] = useState({
    sms: false,
    whatsapp: false,
    email: false,
    push: false,
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/broadcast');
      const data = await res.json();
      setBroadcasts(data.broadcasts || []);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const selectedChannels = Object.entries(channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel);

    if (selectedChannels.length === 0) {
      toast.error('Sélectionnez au moins un canal');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          targetScope,
          channels: JSON.stringify(selectedChannels),
          scheduledAt: scheduleDate || null,
        }),
      });

      if (res.ok) {
        toast.success('Notification envoyée avec succès');
        setShowCreateModal(false);
        resetForm();
        fetchBroadcasts();
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('INFO');
    setTargetScope('ALL');
    setChannels({ sms: false, whatsapp: false, email: false, push: false });
    setScheduleDate('');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Brouillon', className: 'bg-gray-500' },
      SCHEDULED: { label: 'Programmé', className: 'bg-blue-500' },
      SENDING: { label: 'Envoi...', className: 'bg-amber-500' },
      SENT: { label: 'Envoyé', className: 'bg-emerald-500' },
      FAILED: { label: 'Échec', className: 'bg-red-500' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      INFO: { label: 'Info', className: 'bg-blue-100 text-blue-700' },
      WARNING: { label: 'Alerte', className: 'bg-amber-100 text-amber-700' },
      MAINTENANCE: { label: 'Maintenance', className: 'bg-purple-100 text-purple-700' },
      PROMO: { label: 'Promo', className: 'bg-green-100 text-green-700' },
      FEATURE: { label: 'Nouveauté', className: 'bg-pink-100 text-pink-700' },
    };
    const c = config[type] || { label: type, className: 'bg-gray-100' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  // Stats
  const sentCount = broadcasts.filter(b => b.status === 'SENT').length;
  const scheduledCount = broadcasts.filter(b => b.status === 'SCHEDULED').length;
  const totalRecipients = broadcasts.reduce((sum, b) => sum + b.totalRecipients, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Notifications Globales
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Envoyez des messages à tous les garages et propriétaires
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-gradient-to-r from-orange-500 to-pink-500">
          <Send className="w-4 h-4" />
          Nouvelle notification
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{sentCount}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Envoyées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{scheduledCount}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Programmées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{totalRecipients}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Destinataires</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{broadcasts.length}</p>
                <p className="text-sm text-orange-600 dark:text-orange-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broadcasts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-20 bg-slate-200 rounded"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Aucune notification
            </h3>
            <p className="text-slate-500 mb-4">
              Créez votre première notification globale
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Send className="w-4 h-4" />
              Créer une notification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((broadcast) => (
            <Card key={broadcast.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 dark:text-white">{broadcast.title}</h3>
                      {getStatusBadge(broadcast.status)}
                      {getTypeBadge(broadcast.type)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {broadcast.message}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Cible: {broadcast.targetScope}</span>
                      <span>•</span>
                      <span>Canaux: {broadcast.channels}</span>
                      <span>•</span>
                      <span>Envoyés: {broadcast.sentCount}/{broadcast.totalRecipients}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{new Date(broadcast.createdAt).toLocaleDateString('fr-FR')}</p>
                    {broadcast.scheduledAt && (
                      <p className="text-blue-600">Programmé: {new Date(broadcast.scheduledAt).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Nouvelle notification globale
            </DialogTitle>
            <DialogDescription>
              Envoyez un message à tous les garages et/ou propriétaires
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Titre *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la notification"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-2">Message *</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contenu du message..."
                rows={4}
              />
            </div>

            {/* Type & Target */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Information</SelectItem>
                    <SelectItem value="WARNING">Alerte</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="PROMO">Promotion</SelectItem>
                    <SelectItem value="FEATURE">Nouveauté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cible</label>
                <Select value={targetScope} onValueChange={setTargetScope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous</SelectItem>
                    <SelectItem value="GARAGES">Garages uniquement</SelectItem>
                    <SelectItem value="DRIVERS">Propriétaires uniquement</SelectItem>
                    <SelectItem value="FLEETS">Flottes uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium mb-2">Canaux de diffusion</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'sms', label: 'SMS', icon: Smartphone },
                  { key: 'whatsapp', label: 'WhatsApp', icon: Bell },
                  { key: 'email', label: 'Email', icon: Mail },
                  { key: 'push', label: 'Push', icon: Bell },
                ].map(({ key, label, icon: Icon }) => (
                  <label 
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      channels[key as keyof typeof channels] 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Switch
                      checked={channels[key as keyof typeof channels]}
                      onCheckedChange={(checked) => 
                        setChannels(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Programmation (optionnel)
              </label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Laissez vide pour envoyer immédiatement
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSendBroadcast}
              disabled={sending}
              className="bg-gradient-to-r from-orange-500 to-pink-500"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
