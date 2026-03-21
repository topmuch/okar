'use client';

import { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Settings,
  DollarSign,
  Clock,
  BarChart,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  avgCostMin: number | null;
  avgCostMax: number | null;
  avgDuration: number | null;
  usageCount: number;
  parent?: Category | null;
  children?: Category[];
}

const DEFAULT_CATEGORIES = [
  { name: 'Vidange', icon: '🛢️', color: '#3B82F6' },
  { name: 'Freins', icon: '🛑', color: '#EF4444' },
  { name: 'Pneumatique', icon: '🛞', color: '#10B981' },
  { name: 'Batterie', icon: '🔋', color: '#F59E0B' },
  { name: 'Climatisation', icon: '❄️', color: '#06B6D4' },
  { name: 'Électricité', icon: '⚡', color: '#8B5CF6' },
  { name: 'Moteur', icon: '🔧', color: '#EC4899' },
  { name: 'Transmission', icon: '⚙️', color: '#6366F1' },
  { name: 'Suspension', icon: '🚗', color: '#14B8A6' },
  { name: 'Échappement', icon: '💨', color: '#6B7280' },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: '',
    icon: '',
    color: '#3B82F6',
    parentId: '',
    avgCostMin: '',
    avgCostMax: '',
    avgDuration: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          avgCostMin: form.avgCostMin ? parseFloat(form.avgCostMin) : null,
          avgCostMax: form.avgCostMax ? parseFloat(form.avgCostMax) : null,
          avgDuration: form.avgDuration ? parseInt(form.avgDuration) : null,
          parentId: form.parentId || null,
        }),
      });

      if (res.ok) {
        toast.success(editingCategory ? 'Catégorie mise à jour' : 'Catégorie créée');
        setShowModal(false);
        resetForm();
        fetchCategories();
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
    if (!confirm('Supprimer cette catégorie ?')) return;
    
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Catégorie supprimée');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      icon: '',
      color: '#3B82F6',
      parentId: '',
      avgCostMin: '',
      avgCostMax: '',
      avgDuration: '',
      isActive: true,
    });
    setEditingCategory(null);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '#3B82F6',
      parentId: category.parentId || '',
      avgCostMin: category.avgCostMin?.toString() || '',
      avgCostMax: category.avgCostMax?.toString() || '',
      avgDuration: category.avgDuration?.toString() || '',
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const initDefaultCategories = async () => {
    if (!confirm('Initialiser les catégories par défaut ?')) return;
    
    try {
      const res = await fetch('/api/admin/categories/init', { method: 'POST' });
      if (res.ok) {
        toast.success('Catégories initialisées');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.isActive).length;
  const totalUsage = categories.reduce((sum, c) => sum + c.usageCount, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Catégories d&apos;Intervention
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gérez dynamiquement les types de pannes et interventions
          </p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button variant="outline" onClick={initDefaultCategories} className="gap-2">
              <Settings className="w-4 h-4" />
              Initialiser défaut
            </Button>
          )}
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle catégorie
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 dark:bg-blue-500/10 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{totalCategories}</p>
                <p className="text-sm text-blue-600">Catégories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <BarChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{activeCategories}</p>
                <p className="text-sm text-emerald-600">Actives</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-500/10 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{totalUsage}</p>
                <p className="text-sm text-purple-600">Utilisations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-24 bg-slate-200 rounded"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Aucune catégorie
            </h3>
            <p className="text-slate-500 mb-4">
              Initialisez les catégories par défaut ou créez-en de nouvelles
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={initDefaultCategories}>
                Initialiser défaut
              </Button>
              <Button onClick={() => { resetForm(); setShowModal(true); }}>
                Créer manuellement
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className={`overflow-hidden ${!category.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon || '🔧'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-xs text-slate-500">{category.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Min</p>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {category.avgCostMin ? `${category.avgCostMin.toLocaleString()} F` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Max</p>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {category.avgCostMax ? `${category.avgCostMax.toLocaleString()} F` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Durée</p>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {category.avgDuration ? `${category.avgDuration} min` : '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {category.usageCount} utilisations
                  </Badge>
                  {category.isActive ? (
                    <Badge className="bg-emerald-500 text-xs">Actif</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactif</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Nom *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Vidange"
              />
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Icône (emoji)</label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🛢️"
                  className="text-2xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Couleur</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            {/* Costs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Coût min (FCFA)</label>
                <Input
                  type="number"
                  value={form.avgCostMin}
                  onChange={(e) => setForm(prev => ({ ...prev, avgCostMin: e.target.value }))}
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Coût max (FCFA)</label>
                <Input
                  type="number"
                  value={form.avgCostMax}
                  onChange={(e) => setForm(prev => ({ ...prev, avgCostMax: e.target.value }))}
                  placeholder="15000"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">Durée moyenne (minutes)</label>
              <Input
                type="number"
                value={form.avgDuration}
                onChange={(e) => setForm(prev => ({ ...prev, avgDuration: e.target.value }))}
                placeholder="30"
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm font-medium">Catégorie active</label>
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
