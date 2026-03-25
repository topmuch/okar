'use client';

import { useState, useRef } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  FileText,
  Info,
  Shield,
  X
} from 'lucide-react';
import {
  ACCIDENT_SEVERITY,
  IMPACT_ZONES,
  PART_CONDITIONS,
  MajorRepairDetails
} from '@/types/maintenance';

interface AccidentSubFormProps {
  value: Partial<MajorRepairDetails>;
  onChange: (details: Partial<MajorRepairDetails>) => void;
}

export default function AccidentSubForm({
  value,
  onChange
}: AccidentSubFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const details: Partial<MajorRepairDetails> = {
    affectedOrgans: [],
    partCondition: 'neuf_adaptable',
    accidentRelated: true,
    repairPhotos: [],
    ...value
  };
  
  const handleChange = (field: keyof MajorRepairDetails, newValue: any) => {
    onChange({ ...details, [field]: newValue });
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
        if (result && (details.repairPhotos?.length || 0) < 6) {
          handleChange('repairPhotos', [...(details.repairPhotos || []), result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const updated = (details.repairPhotos || []).filter((_, i) => i !== index);
    handleChange('repairPhotos', updated);
  };

  const photoCount = details.repairPhotos?.length || 0;
  const minPhotos = 2;
  const photoWarning = photoCount < minPhotos;

  return (
    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-4 mt-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
            🔴 Carrosserie / Accident
          </h4>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            Déclarez les réparations liées à un choc, accident ou intervention carrosserie.
          </p>
        </div>
      </div>

      {/* Accident Severity */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Gravité de l&apos;incident *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ACCIDENT_SEVERITY.map((severity) => {
            const isSelected = details.accidentSeverity === severity.value;
            return (
              <button
                key={severity.value}
                type="button"
                onClick={() => handleChange('accidentSeverity', severity.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? `ring-2 ring-offset-1 ${severity.color}`
                    : 'border-slate-200 dark:border-slate-700 hover:border-red-300 bg-white dark:bg-slate-800'
                }`}
              >
                <p className={`text-sm font-medium ${
                  isSelected ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {severity.label}
                </p>
                <p className="text-xs text-slate-400">{severity.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Impact Zones */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Zone(s) impactée(s) *
        </label>
        
        {/* Visual car representation */}
        <div className="mb-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="relative mx-auto" style={{ width: '120px', height: '200px' }}>
            {/* Top (avant) */}
            <button
              type="button"
              onClick={() => toggleImpactZone('avant_centre')}
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-6 rounded-t-lg border-2 text-xs font-medium transition-all ${
                details.impactZones?.includes('avant_centre')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            >
              Av
            </button>
            
            {/* Left side buttons */}
            <button
              type="button"
              onClick={() => toggleImpactZone('avant_gauche')}
              className={`absolute top-8 left-0 w-5 h-8 rounded-l-lg border-2 text-xs transition-all ${
                details.impactZones?.includes('avant_gauche')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            />
            <button
              type="button"
              onClick={() => toggleImpactZone('flanc_gauche')}
              className={`absolute top-16 left-0 w-5 h-12 rounded-l-lg border-2 text-xs transition-all ${
                details.impactZones?.includes('flanc_gauche')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            />
            <button
              type="button"
              onClick={() => toggleImpactZone('arriere_gauche')}
              className={`absolute bottom-8 left-0 w-5 h-8 rounded-l-lg border-2 text-xs transition-all ${
                details.impactZones?.includes('arriere_gauche')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            />
            
            {/* Right side buttons */}
            <button
              type="button"
              onClick={() => toggleImpactZone('avant_droit')}
              className={`absolute top-8 right-0 w-5 h-8 rounded-r-lg border-2 text-xs transition-all ${
                details.impactZones?.includes('avant_droit')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            />
            <button
              type="button"
              onClick={() => toggleImpactZone('flanc_droit')}
              className={`absolute top-16 right-0 w-5 h-12 rounded-r-lg border-2 text-xs transition-all ${
                details.impactZones?.includes('flanc_droit')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            />
            <button
              type="button"
              onClick={() => toggleImpactZone('arriere_droit')}
              className={`absolute bottom-8 right-0 w-5 h-8 rounded-r-lg border-2 text-xs transition-all ${
                details.impactZones?.includes('arriere_droit')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            />
            
            {/* Bottom (arrière) */}
            <button
              type="button"
              onClick={() => toggleImpactZone('arriere_centre')}
              className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-6 rounded-b-lg border-2 text-xs font-medium transition-all ${
                details.impactZones?.includes('arriere_centre')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            >
              Ar
            </button>
            
            {/* Roof */}
            <button
              type="button"
              onClick={() => toggleImpactZone('toit')}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 text-xs transition-all ${
                details.impactZones?.includes('toit')
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            >
              Toit
            </button>
          </div>
        </div>
        
        {/* Selected zones as chips */}
        {details.impactZones && details.impactZones.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {details.impactZones.map(zone => {
              const zoneInfo = IMPACT_ZONES.find(z => z.value === zone);
              return (
                <span 
                  key={zone} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs"
                >
                  {zoneInfo?.label}
                  <button
                    type="button"
                    onClick={() => toggleImpactZone(zone)}
                    className="hover:text-red-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
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

      {/* Expert Report */}
      <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={details.hasExpertReport || false}
            onChange={(e) => handleChange('hasExpertReport', e.target.checked)}
            className="w-5 h-5 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
          />
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Rapport d&apos;expert disponible
            </span>
          </div>
        </label>
      </div>

      {/* Chassis Verified */}
      <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={details.chassisVerified || false}
            onChange={(e) => handleChange('chassisVerified', e.target.checked)}
            className="w-5 h-5 text-emerald-500 rounded border-emerald-300 focus:ring-emerald-500"
          />
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              Châssis vérifié et conforme
            </span>
          </div>
        </label>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 ml-8">
          Cochez si le châssis a été contrôlé et ne présente pas de déformation
        </p>
      </div>

      {/* Accident Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Description neutre de l&apos;incident
        </label>
        <textarea
          value={details.accidentDescription || ''}
          onChange={(e) => handleChange('accidentDescription', e.target.value)}
          placeholder="Ex: Choc avant droit suite à collision, redressage effectué selon les normes constructeur..."
          rows={3}
          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">
          Décrivez l&apos;incident de manière factuelle et neutre pour l&apos;historique du véhicule
        </p>
      </div>

      {/* Photos */}
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
              Ajoutez au moins {minPhotos} photos (avant/après) pour la certification
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
          {details.repairPhotos?.map((photo, index) => (
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
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs py-0.5 text-center">
                  {index === 0 ? 'Avant' : 'Après'}
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

      {/* Certification Status */}
      {photoCount >= minPhotos && details.accidentSeverity && details.impactZones && details.impactZones.length > 0 && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300">
            Documentation complète pour certification OKAR ✓
          </span>
        </div>
      )}
    </div>
  );
}
