'use client';

import { useState } from 'react';
import { Plus, Trash2, Wrench, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Interface pour une pièce
export interface PartItem {
  id: string;
  name: string;           // Nom de la pièce (ex: "Filtre Huile")
  reference: string;      // Référence constructeur (ex: "TOY-123")
  quantity: number;       // Quantité
  unitPrice: number;      // Prix unitaire
  totalPrice: number;     // Prix total (calculé)
  brand?: string;         // Marque (optionnel)
  notes?: string;         // Notes (optionnel)
}

// Props du composant
interface PartsListInputProps {
  value: PartItem[];
  onChange: (parts: PartItem[]) => void;
  totalCost: number;
  onTotalCostChange: (total: number) => void;
  disabled?: boolean;
}

// Pièces communes suggérées
const COMMON_PARTS = [
  { name: 'Filtre à huile', category: 'Filtration' },
  { name: 'Filtre à air', category: 'Filtration' },
  { name: 'Filtre à carburant', category: 'Filtration' },
  { name: 'Filtre habitacle', category: 'Filtration' },
  { name: 'Huile moteur', category: 'Lubrifiants' },
  { name: 'Plaquettes de frein AV', category: 'Freinage' },
  { name: 'Plaquettes de frein AR', category: 'Freinage' },
  { name: 'Disques de frein AV', category: 'Freinage' },
  { name: 'Disques de frein AR', category: 'Freinage' },
  { name: 'Bougies d\'allumage', category: 'Allumage' },
  { name: 'Bougies de préchauffage', category: 'Allumage' },
  { name: 'Kit de distribution', category: 'Distribution' },
  { name: 'Courroie de distribution', category: 'Distribution' },
  { name: 'Pompe à eau', category: 'Refroidissement' },
  { name: 'Radiateur', category: 'Refroidissement' },
  { name: 'Thermostat', category: 'Refroidissement' },
  { name: 'Amortisseurs AV', category: 'Suspension' },
  { name: 'Amortisseurs AR', category: 'Suspension' },
  { name: 'Rotule de direction', category: 'Direction' },
  { name: 'Kit d\'embrayage', category: 'Transmission' },
  { name: 'Batterie', category: 'Électrique' },
  { name: 'Alternateur', category: 'Électrique' },
  { name: 'Démarreur', category: 'Électrique' },
  { name: 'Essuie-glaces', category: 'Accessoires' },
  { name: 'Ampoule phare', category: 'Éclairage' },
];

// Générer un ID unique
const generateId = () => `part_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export default function PartsListInput({
  value,
  onChange,
  totalCost,
  onTotalCostChange,
  disabled = false,
}: PartsListInputProps) {
  // Ajouter une pièce
  const addPart = () => {
    const newPart: PartItem = {
      id: generateId(),
      name: '',
      reference: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    onChange([...value, newPart]);
  };

  // Supprimer une pièce
  const removePart = (id: string) => {
    const updatedParts = value.filter(p => p.id !== id);
    onChange(updatedParts);
    recalculateTotal(updatedParts);
  };

  // Mettre à jour une pièce
  const updatePart = (id: string, field: keyof PartItem, newValue: string | number) => {
    const updatedParts = value.map(part => {
      if (part.id === id) {
        const updated = { ...part, [field]: newValue };
        
        // Recalculer le total si quantité ou prix unitaire change
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        
        return updated;
      }
      return part;
    });
    
    onChange(updatedParts);
    recalculateTotal(updatedParts);
  };

  // Recalculer le total
  const recalculateTotal = (parts: PartItem[]) => {
    const total = parts.reduce((sum, part) => sum + part.totalPrice, 0);
    onTotalCostChange(total);
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Exporter en JSON
  const exportToJSON = (): string => {
    return JSON.stringify(value, null, 2);
  };

  // Importer depuis JSON (pour usage futur)
  const importFromJSON = (jsonString: string) => {
    try {
      const parts = JSON.parse(jsonString);
      if (Array.isArray(parts)) {
        onChange(parts.map((p: any) => ({
          ...p,
          id: p.id || generateId(),
        })));
        recalculateTotal(parts);
      }
    } catch (e) {
      console.error('Invalid JSON:', e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-500" />
          Pièces utilisées
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            Total: <span className="font-bold text-orange-500">{formatPrice(totalCost)}</span>
          </span>
        </div>
      </div>

      {/* Liste des pièces */}
      {value.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Aucune pièce ajoutée</p>
            <Button
              type="button"
              variant="outline"
              onClick={addPart}
              disabled={disabled}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une pièce
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {value.map((part, index) => (
            <Card key={part.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-3 items-end">
                  {/* Numéro */}
                  <div className="col-span-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>

                  {/* Nom de la pièce */}
                  <div className="col-span-3">
                    <Label className="text-xs text-slate-500">Nom de la pièce</Label>
                    <Select
                      value={part.name}
                      onValueChange={(val) => updatePart(part.id, 'name', val)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_PARTS.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">+ Autre (saisir)</SelectItem>
                      </SelectContent>
                    </Select>
                    {part.name === '__custom__' && (
                      <Input
                        className="mt-1"
                        placeholder="Nom de la pièce"
                        value={part.name === '__custom__' ? '' : part.name}
                        onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                        disabled={disabled}
                      />
                    )}
                  </div>

                  {/* Référence */}
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-500">Référence</Label>
                    <Input
                      className="mt-1 font-mono text-sm"
                      placeholder="ex: TOY-123"
                      value={part.reference}
                      onChange={(e) => updatePart(part.id, 'reference', e.target.value)}
                      disabled={disabled}
                    />
                  </div>

                  {/* Quantité */}
                  <div className="col-span-1">
                    <Label className="text-xs text-slate-500">Qté</Label>
                    <Input
                      type="number"
                      min="1"
                      className="mt-1"
                      value={part.quantity}
                      onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 1)}
                      disabled={disabled}
                    />
                  </div>

                  {/* Prix unitaire */}
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-500">Prix unitaire</Label>
                    <Input
                      type="number"
                      min="0"
                      className="mt-1"
                      value={part.unitPrice || ''}
                      onChange={(e) => updatePart(part.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="XOF"
                      disabled={disabled}
                    />
                  </div>

                  {/* Total */}
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-500">Total</Label>
                    <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-right font-semibold text-orange-500">
                      {formatPrice(part.totalPrice)}
                    </div>
                  </div>

                  {/* Supprimer */}
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePart(part.id)}
                      disabled={disabled}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      {value.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={addPart}
          disabled={disabled}
          className="w-full gap-2 border-dashed"
        >
          <Plus className="w-4 h-4" />
          Ajouter une autre pièce
        </Button>
      )}

      {/* Résumé */}
      {value.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {value.length} pièce{value.length > 1 ? 's' : ''} • Quantité totale: {value.reduce((s, p) => s + p.quantity, 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total pièces:</span>
            <span className="text-orange-500">{formatPrice(totalCost)}</span>
          </div>
        </div>
      )}

      {/* Hidden input for form submission - JSON format */}
      <input
        type="hidden"
        name="partsListJson"
        value={exportToJSON()}
      />
    </div>
  );
}

// Helper pour convertir le JSON en texte legacy (pour compatibilité)
export function partsListToText(parts: PartItem[]): string {
  if (!parts || parts.length === 0) return '';
  
  return parts.map(p => 
    `${p.name} (Réf: ${p.reference || 'N/A'}) x${p.quantity} - ${p.totalPrice} XOF`
  ).join('\n');
}

// Helper pour parser le texte legacy en JSON
export function textToPartsList(text: string): PartItem[] {
  if (!text || text.trim() === '') return [];
  
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const match = line.match(/(.+?) \(Réf: (.+?)\) x(\d+) - (\d+)/);
    if (match) {
      return {
        id: generateId(),
        name: match[1].trim(),
        reference: match[2],
        quantity: parseInt(match[3]) || 1,
        unitPrice: parseInt(match[4]) / (parseInt(match[3]) || 1),
        totalPrice: parseInt(match[4]) || 0,
      };
    }
    return {
      id: generateId(),
      name: line.trim(),
      reference: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
  });
}
