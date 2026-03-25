'use client';

import { useState, useRef } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Shield,
  Wrench,
  X,
  FileImage
} from 'lucide-react';
import {
  MAJOR_ORGANS,
  PART_CONDITIONS,
  ACCIDENT_SEVERITY,
  IMPACT_ZONES,
  MajorRepairDetails,
  getOrganLabel,
  getPartConditionLabel
} from '@/types/maintenance';

interface MajorRepairSubFormProps {
  value: MajorRepairDetails;
  onChange: (details: MajorRepairDetails) => void;
  category: string;
  isCarrosserie?: boolean;
}

const defaultMajorRepairDetails: MajorRepairDetails = {
  affectedOrgans: [],
  partCondition: 'neuf_adaptable',
  accidentRelated: false,
  repairPhotos: [],
};

export default function MajorRepairSubForm({
  value,
  onChange,
  category,
  isCarrosserie = false
}: MajorRepairSubFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Merge default values with provided value
  const details: MajorRepairDetails = { ...defaultMajorRepairDetails, ...value };
  
  const handleChange = (field: keyof MajorRepairDetails, newValue: any) => {
    onChange({ ...details, [field]: newValue });
  };

  const toggleOrgan = (organValue: string) => {
    const current = details.affectedOrgans || [];
    const updated = current.includes(organValue)
      ? current.filter(o => o !== organValue)
      : [...current, organValue];
    handleChange('affectedOrgans', updated);
  };

  const toggleImpactZone = (zoneValue: string) => {
    const current = details.impactZones || [];
    const updated = current.includes(zoneValue)
      ? current.filter(z => z !== zoneValue)
      : [...current, zoneValue];
    handleChange('impactZones', updated);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result && details.repairPhotos.length < 6) {
          handleChange('repairPhotos', [...details.repairPhotos, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const updated = details.repairPhotos.filter((_, i) => i !== index);
    handleChange('repairPhotos', updated);
  };

  const photoCount = details.repairPhotos.length;
  const minPhotos = 2;
  const photoWarning = photoCount < minPhotos;

  return (
    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-4 mt-4">
      {/* Header with Warning */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg">
          <Wrench className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
            {isCarrosserie ? 'Réparation Carrosserie' : 'Réparation Majeure'}
          </h4>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            ⚠️ Pour les {isCarrosserie ? 'réparations carrosserie' : 'grosses réparations'}, les photos sont obligatoires pour la certification OKAR.
          </p>
        </div>
      </div>

      {/* Affected Organs */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Organes touchés *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MAJOR_ORGANS.map((organ) => {
            const isSelected = details.affectedOrgans?.includes(organ.value);
            return (
              <button
                key={organ.value}
                type="button"
                onClick={() => toggleOrgan(organ.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-red-500 bg-red-100 dark:bg-red-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-red-300 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{organ.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${
                      isSelected ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {organ.label}
                    </p>
                    {organ.critical && (
                      <span className="text-xs text-red-500">Critique</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {details.affectedOrgans && details.affectedOrgans.length > 0 && (
          <p className="text-sm text-slate-500 mt-2">
            {details.affectedOrgans.length} organe(s) sélectionné(s)
          </p>
        )}
      </div>

      {/* Part Condition */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          État des pièces utilisées *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PART_CONDITIONS.map((condition) => {
            const isSelected = details.partCondition === condition.value;
            return (
              <button
                key={condition.value}
                type="button"
                onClick={() => handleChange('partCondition', condition.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg w-6 h-6 flex items-center justify-center rounded-full ${condition.badge}`}>
                    {condition.icon}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${
                      isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {condition.label}
                    </p>
                    <p className="text-xs text-slate-400">{condition.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accident Related */}
      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={details.accidentRelated}
            onChange={(e) => handleChange('accidentRelated', e.target.checked)}
            className="w-5 h-5 text-orange-500 rounded border-orange-300 focus:ring-orange-500"
          />
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-orange-800 dark:text-orange-200">
              Cette réparation est liée à un accident
            </span>
          </div>
        </label>

        {/* Accident Details - Show if accident related */}
        {details.accidentRelated && (
          <div className="mt-4 space-y-4 pl-8">
            {/* Accident Severity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Gravité de l&apos;accident
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCIDENT_SEVERITY.map((severity) => {
                  const isSelected = details.accidentSeverity === severity.value;
                  return (
                    <button
                      key={severity.value}
                      type="button"
                      onClick={() => handleChange('accidentSeverity', severity.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? severity.color + ' ring-2 ring-offset-1'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {severity.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impact Zones */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Zones d&apos;impact
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {IMPACT_ZONES.map((zone) => {
                  const isSelected = details.impactZones?.includes(zone.value);
                  return (
                    <button
                      key={zone.value}
                      type="button"
                      onClick={() => toggleImpactZone(zone.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {zone.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accident Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description neutre de l&apos;accident
              </label>
              <textarea
                value={details.accidentDescription || ''}
                onChange={(e) => handleChange('accidentDescription', e.target.value)}
                placeholder="Ex: Choc avant droit suite à collision, réparé dans les règles..."
                rows={2}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                Décrivez l&apos;accident de manière factuelle et neutre
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Photos - Required for major repairs */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Photos de la réparation *
          </label>
          <span className={`text-sm ${photoWarning ? 'text-red-500' : 'text-emerald-500'}`}>
            {photoCount}/{minPhotos} min.
          </span>
        </div>
        
        {photoWarning && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-3 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-700 dark:text-amber-300">
              Ajoutez au moins {minPhotos} photos (pièce neuve + montage) pour la certification
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {/* Existing photos */}
          {details.repairPhotos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              {index < 2 && (
                <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-xs py-0.5 text-center">
                  {index === 0 ? 'Pièce' : 'Montage'}
                </div>
              )}
            </div>
          ))}
          
          {/* Add photo button */}
          {photoCount < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:border-red-500 hover:text-red-500 transition-colors"
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs mt-1">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Options */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2"
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

      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
          {/* Warranty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                Garantie (mois)
              </label>
              <input
                type="number"
                value={details.warrantyMonths || ''}
                onChange={(e) => handleChange('warrantyMonths', parseInt(e.target.value) || undefined)}
                placeholder="Ex: 12"
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                Garantie (km)
              </label>
              <input
                type="number"
                value={details.warrantyKm || ''}
                onChange={(e) => handleChange('warrantyKm', parseInt(e.target.value) || undefined)}
                placeholder="Ex: 20000"
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Organ Mileage */}
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
              Kilométrage de l&apos;organe (si différent du véhicule)
            </label>
            <input
              type="number"
              value={details.organMileage || ''}
              onChange={(e) => handleChange('organMileage', parseInt(e.target.value) || undefined)}
              placeholder="Ex: 50000 (pour une pièce d'occasion)"
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* Technical Notes */}
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
              Observations techniques
            </label>
            <textarea
              value={details.technicalNotes || ''}
              onChange={(e) => handleChange('technicalNotes', e.target.value)}
              placeholder="Détails techniques supplémentaires..."
              rows={2}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 resize-none"
            />
          </div>
        </div>
      )}

      {/* Summary Preview */}
      {details.affectedOrgans && details.affectedOrgans.length > 0 && (
        <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Résumé: </span>
            {details.affectedOrgans.map(o => getOrganLabel(o)).join(', ')}
            {' '}→ {getPartConditionLabel(details.partCondition)}
            {details.accidentRelated && ' ⚠️ Accident'}
          </p>
        </div>
      )}

      {/* Certification Info */}
      {photoCount >= minPhotos && details.affectedOrgans && details.affectedOrgans.length > 0 && details.partCondition && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300">
            Documentation complète pour certification OKAR ✓
          </span>
        </div>
      )}
    </div>
  );
}
