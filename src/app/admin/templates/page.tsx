'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Smartphone,
  Mail,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  RefreshCw,
  FileText,
  Clock,
  Send
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Types
interface Template {
  id: string;
  name: string;
  slug: string;
  type: string;
  category: string;
  subject: string | null;
  content: string;
  variables: string | null;
  isActive: boolean;
  isDefault: boolean;
  language: string;
  sentCount: number;
  lastSentAt: string | null;
  createdAt: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'WELCOME', label: 'Bienvenue' },
  { value: 'VALIDATION', label: 'Validation' },
  { value: 'REMINDER', label: 'Rappel' },
  { value: 'ALERT', label: 'Alerte' },
  { value: 'TRANSFER', label: 'Transfert' },
  { value: 'MARKETING', label: 'Marketing' },
];

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'SMS',
    category: 'WELCOME',
    subject: '',
    content: '',
    variables: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const url = editingTemplate 
        ? `/api/admin/templates/${editingTemplate.id}`
        : '/api/admin/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingTemplate ? 'Template mis à jour' : 'Template créé');
        setShowModal(false);
        resetForm();
        fetchTemplates();
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Template supprimé');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      type: 'SMS',
      category: 'WELCOME',
      subject: '',
      content: '',
      variables: '',
      isActive: true,
    });
    setEditingTemplate(null);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject || '',
      content: template.content,
      variables: template.variables || '',
      isActive: template.isActive,
    });
    setShowModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SMS': return <Smartphone className="w-4 h-4" />;
      case 'WHATSAPP': return <MessageSquare className="w-4 h-4" />;
      case 'EMAIL': return <Mail className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesType && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Templates de Messages
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gérez les modèles de SMS et WhatsApp
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="SMS">SMS</SelectItem>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {TEMPLATE_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-40 bg-slate-200 rounded"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Aucun template trouvé
            </h3>
            <p className="text-slate-500 mb-4">
              Créez votre premier template de message
            </p>
            <Button onClick={() => { resetForm(); setShowModal(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Créer un template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className={`overflow-hidden ${!template.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      template.type === 'SMS' ? 'bg-green-100 text-green-600' :
                      template.type === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getTypeIcon(template.type)}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <p className="text-xs text-slate-500">{template.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
                  {template.content}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                    </Badge>
                    {template.isDefault && (
                      <Badge className="bg-orange-500 text-xs">Par défaut</Badge>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    {template.sentCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
            <DialogDescription>
              Créez un modèle de message réutilisable
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Nom *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Bienvenue nouveau garage"
              />
            </div>

            {/* Type & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <Select 
                  value={form.type} 
                  onValueChange={(v) => setForm(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <Select 
                  value={form.category} 
                  onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject (for email) */}
            {form.type === 'EMAIL' && (
              <div>
                <label className="block text-sm font-medium mb-2">Sujet</label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Sujet de l'email"
                />
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">Contenu *</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Bonjour {{name}}, bienvenue sur OKAR..."
                rows={6}
              />
              <p className="text-xs text-slate-500 mt-1">
                Utilisez {'{{variable}'} pour les variables dynamiques
              </p>
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-medium mb-2">Variables disponibles</label>
              <Input
                value={form.variables}
                onChange={(e) => setForm(prev => ({ ...prev, variables: e.target.value }))}
                placeholder="name, phone, garage_name, vehicle_model..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Séparez les variables par des virgules
              </p>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm font-medium">Template actif</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
