'use client';

import { useState, useEffect } from 'react';
import {
  Droplet,
  Filter,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import {
  OIL_VISCOSITY_OPTIONS,
  OIL_BRANDS,
  OIL_TYPES,
  VidangeDetails,
  getOilTypeLabel
} from '@/types/maintenance';

interface VidangeSubFormProps {
  value: VidangeDetails;
  onChange: (details: VidangeDetails) => void;
  lastOilChange?: {
    oilViscosity?: string;
    oilBrand?: string;
    oilType?: string;
  } | null;
  showRecommendation?: boolean;
}

const defaultVidangeDetails: VidangeDetails = {
  oilViscosity: '',
  oilBrand: '',
  oilType: 'synthetic',
  oilQuantity: 0,
  oilFilterChanged: false,
  oilFilterReference: '',
  oilFilterBrand: '',
  cartridgeChanged: false,
  cartridgeReference: '',
  airFilterChanged: false,
  airFilterReference: '',
  fuelFilterChanged: false,
  fuelFilterReference: '',
  oilLevelAfter: 'ok',
  notes: '',
};

export default function VidangeSubForm({
  value,
  onChange,
  lastOilChange,
  showRecommendation = true
}: VidangeSubFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Merge default values with provided value
  const details: VidangeDetails = { ...defaultVidangeDetails, ...value };
  
  const handleChange = (field: keyof VidangeDetails, newValue: any) => {
    onChange({ ...details, [field]: newValue });
  };

  // Auto-fill recommendation from last oil change
  useEffect(() => {
    if (lastOilChange && !details.oilViscosity && !details.oilBrand) {
      // Only pre-fill if fields are empty
    }
  }, [lastOilChange]);

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-4 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Droplet className="w-5 h-5 text-amber-500" />
        <h4 className="font-semibold text-amber-800 dark:text-amber-200">
          Détails Vidange
        </h4>
      </div>

      {/* Recommendation Banner */}
      {showRecommendation && lastOilChange && (lastOilChange.oilViscosity || lastOilChange.oilBrand) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">Dernière vidange: </span>
            {lastOilChange.oilViscosity && (
              <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded">
                {lastOilChange.oilViscosity}
              </span>
            )}
            {lastOilChange.oilBrand && (
              <span className="ml-1">({lastOilChange.oilBrand})</span>
            )}
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...details,
                  oilViscosity: lastOilChange.oilViscosity || details.oilViscosity,
                  oilBrand: lastOilChange.oilBrand || details.oilBrand,
                  oilType: (lastOilChange.oilType as any) || details.oilType,
                });
              }}
              className="ml-2 text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              Utiliser ces valeurs
            </button>
          </div>
        </div>
      )}

      {/* Main Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Oil Viscosity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Viscosité d&apos;huile *
          </label>
          <select
            value={details.oilViscosity}
            onChange={(e) => handleChange('oilViscosity', e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="">Sélectionner...</option>
            {OIL_VISCOSITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} - {opt.description}
              </option>
            ))}
          </select>
        </div>

        {/* Oil Brand */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Marque d&apos;huile *
          </label>
          <select
            value={details.oilBrand}
            onChange={(e) => handleChange('oilBrand', e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="">Sélectionner...</option>
            {OIL_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Oil Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Type d&apos;huile
          </label>
          <select
            value={details.oilType}
            onChange={(e) => handleChange('oilType', e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            {OIL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
        </div>

        {/* Oil Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Quantité (litres) *
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={details.oilQuantity || ''}
            onChange={(e) => handleChange('oilQuantity', parseFloat(e.target.value) || 0)}
            placeholder="Ex: 4.5"
            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Oil Filter Section */}
      <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3 mb-3">
          <Filter className="w-4 h-4 text-amber-600" />
          <span className="font-medium text-slate-700 dark:text-slate-300">Filtre à huile</span>
          <label className="flex items-center gap-2 ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={details.oilFilterChanged}
              onChange={(e) => handleChange('oilFilterChanged', e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Changé</span>
            {details.oilFilterChanged && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </label>
        </div>
        
        {details.oilFilterChanged && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
            <input
              type="text"
              value={details.oilFilterReference || ''}
              onChange={(e) => handleChange('oilFilterReference', e.target.value)}
              placeholder="Référence filtre (ex: OC 47)"
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
            />
            <input
              type="text"
              value={details.oilFilterBrand || ''}
              onChange={(e) => handleChange('oilFilterBrand', e.target.value)}
              placeholder="Marque (ex: Mann, Bosch)"
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        {showAdvanced ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Masquer les options avancées
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Afficher plus d&apos;options
          </>
        )}
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-4 space-y-4 pt-4 border-t border-amber-200 dark:border-amber-800">
          {/* Cartridge */}
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Cartouche</span>
            <label className="flex items-center gap-2 ml-auto cursor-pointer">
              <input
                type="checkbox"
                checked={details.cartridgeChanged || false}
                onChange={(e) => handleChange('cartridgeChanged', e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Changée</span>
            </label>
          </div>
          {details.cartridgeChanged && (
            <input
              type="text"
              value={details.cartridgeReference || ''}
              onChange={(e) => handleChange('cartridgeReference', e.target.value)}
              placeholder="Référence cartouche"
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 ml-7"
            />
          )}

          {/* Air Filter */}
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-sm text-slate-600 dark:text-slate-400">Filtre à air</span>
            <label className="flex items-center gap-2 ml-auto cursor-pointer">
              <input
                type="checkbox"
                checked={details.airFilterChanged || false}
                onChange={(e) => handleChange('airFilterChanged', e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Changé</span>
            </label>
          </div>
          {details.airFilterChanged && (
            <input
              type="text"
              value={details.airFilterReference || ''}
              onChange={(e) => handleChange('airFilterReference', e.target.value)}
              placeholder="Référence filtre à air"
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 ml-7"
            />
          )}

          {/* Fuel Filter */}
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            <span className="text-sm text-slate-600 dark:text-slate-400">Filtre à carburant</span>
            <label className="flex items-center gap-2 ml-auto cursor-pointer">
              <input
                type="checkbox"
                checked={details.fuelFilterChanged || false}
                onChange={(e) => handleChange('fuelFilterChanged', e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Changé</span>
            </label>
          </div>
          {details.fuelFilterChanged && (
            <input
              type="text"
              value={details.fuelFilterReference || ''}
              onChange={(e) => handleChange('fuelFilterReference', e.target.value)}
              placeholder="Référence filtre à carburant"
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 ml-7"
            />
          )}

          {/* Oil Level After */}
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
              Niveau d&apos;huile après intervention
            </label>
            <div className="flex gap-2">
              {(['min', 'ok', 'max'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleChange('oilLevelAfter', level)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    details.oilLevelAfter === level
                      ? 'bg-amber-500 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-amber-50'
                  }`}
                >
                  {level === 'min' ? 'Mini' : level === 'ok' ? 'OK' : 'Maxi'}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
              Notes complémentaires
            </label>
            <textarea
              value={details.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Observations, recommandations..."
              rows={2}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 resize-none"
            />
          </div>
        </div>
      )}

      {/* Summary Preview */}
      {details.oilViscosity && details.oilBrand && (
        <div className="mt-4 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Résumé: </span>
            {details.oilQuantity}L de {details.oilViscosity} ({details.oilBrand}) - 
            {details.oilType && ` ${getOilTypeLabel(details.oilType)}`}
            {details.oilFilterChanged && ' + Filtre à huile'}
          </p>
        </div>
      )}
    </div>
  );
}
