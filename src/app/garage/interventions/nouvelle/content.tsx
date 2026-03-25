'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  ArrowLeft,
  Car,
  Camera,
  FileText,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Send,
  PenLine,
  Trash2
} from 'lucide-react';
import VidangeSubForm from '@/components/maintenance/VidangeSubForm';
import MajorRepairSubForm from '@/components/maintenance/MajorRepairSubForm';
import AccidentSubForm from '@/components/maintenance/AccidentSubForm';
import { VidangeDetails, MajorRepairDetails, INTERVENTION_TYPES, InterventionType, getInterventionType } from '@/types/maintenance';

// Intervention Types (A, B, C)
const interventionTypes = [
  { 
    id: 'entretien_courant', 
    code: 'A',
    label: 'Entretien Courant', 
    description: 'Vidange, Filtres, Niveaux',
    icon: '🟢',
    categories: ['vidange', 'freins', 'pneus', 'batterie', 'climatisation', 'electricite']
  },
  { 
    id: 'mecanique_majeure', 
    code: 'B',
    label: 'Réparation Mécanique Majeure', 
    description: 'Moteur, Boîte, Distribution, Turbo...',
    icon: '🟠',
    categories: ['moteur', 'distribution', 'embrayage', 'boite', 'turbo', 'transmission']
  },
  { 
    id: 'carrosserie_accident', 
    code: 'C',
    label: 'Carrosserie / Accident', 
    description: 'Choc, Redressage, Peinture',
    icon: '🔴',
    categories: ['carrosserie', 'chassis', 'peinture']
  },
];

// Sub-categories per type
const subCategories: Record<string, { id: string; label: string; icon: string }[]> = {
  entretien_courant: [
    { id: 'vidange', label: 'Vidange', icon: '🛢️' },
    { id: 'freins', label: 'Freins', icon: '🛑' },
    { id: 'pneus', label: 'Pneus', icon: '🛞' },
    { id: 'batterie', label: 'Batterie', icon: '🔋' },
    { id: 'climatisation', label: 'Climatisation', icon: '❄️' },
    { id: 'electricite', label: 'Électricité', icon: '⚡' },
  ],
  mecanique_majeure: [
    { id: 'moteur', label: 'Moteur', icon: '⚙️' },
    { id: 'distribution', label: 'Distribution', icon: '🔗' },
    { id: 'embrayage', label: 'Embrayage', icon: '🎚️' },
    { id: 'boite', label: 'Boîte de vitesses', icon: '🔧' },
    { id: 'turbo', label: 'Turbo', icon: '🌪️' },
    { id: 'transmission', label: 'Transmission', icon: '⛓️' },
  ],
  carrosserie_accident: [
    { id: 'carrosserie', label: 'Carrosserie', icon: '🚗' },
    { id: 'chassis', label: 'Châssis', icon: '🚙' },
    { id: 'peinture', label: 'Peinture', icon: '🎨' },
  ],
};

interface Part {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Vehicle {
  id: string;
  reference: string;
  make: string | null;
  model: string | null;
  licensePlate: string | null;
  mileage: number | null;
  ownerName: string | null;
  ownerPhone: string | null;
}

export default function NouvelleInterventionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleIdParam = searchParams.get('vehicleId');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [step, setStep] = useState(vehicleIdParam ? 2 : 1);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedInterventionType, setSelectedInterventionType] = useState<InterventionType | null>(null);
  const primaryCategory = selectedCategories[0] || '';
  const [description, setDescription] = useState('');
  const [mileage, setMileage] = useState('');
  const [parts, setParts] = useState<Part[]>([]);
  const [laborCost, setLaborCost] = useState('');
  const [invoicePhoto, setInvoicePhoto] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  
  // Maintenance details for structured categories
  const [maintenanceDetails, setMaintenanceDetails] = useState<VidangeDetails | null>(null);
  const [majorRepairDetails, setMajorRepairDetails] = useState<MajorRepairDetails | null>(null);
  const [lastOilChange, setLastOilChange] = useState<{
    oilViscosity?: string;
    oilBrand?: string;
    oilType?: string;
  } | null>(null);
  const [loadingLastOilChange, setLoadingLastOilChange] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitMode, setSubmitMode] = useState<'draft' | 'submit'>('submit');
  const [garageId, setGarageId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get garage ID from session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.garageId) {
          setGarageId(data.garageId);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    };
    fetchSession();
  }, []);

  // Load vehicle if ID provided
  useEffect(() => {
    if (vehicleIdParam) {
      fetchVehicle(vehicleIdParam);
    }
  }, [vehicleIdParam]);

  // Search vehicles
  useEffect(() => {
    if (step === 1 && vehicleSearch.length >= 2) {
      searchVehicles();
    }
  }, [vehicleSearch]);

  const fetchVehicle = async (id: string) => {
    try {
      const response = await fetch(`/api/vehicles/${id}`);
      const data = await response.json();
      if (data.vehicle) {
        setVehicle(data.vehicle);
        setMileage(data.vehicle.mileage?.toString() || '');
        setStep(2);
      }
    } catch (err) {
      console.error('Error fetching vehicle:', err);
    }
  };

  const searchVehicles = async () => {
    if (!garageId) return;
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/garage/vehicles?search=${vehicleSearch}`);
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.error('Error searching vehicles:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectVehicle = (v: Vehicle) => {
    setVehicle(v);
    setMileage(v.mileage?.toString() || '');
    setStep(2);
  };

  // Fetch last oil change data for the vehicle
  const fetchLastOilChange = async (vehicleId: string) => {
    setLoadingLastOilChange(true);
    try {
      const response = await fetch(`/api/maintenance-records?vehicleId=${vehicleId}&category=vidange&limit=1`);
      const data = await response.json();
      
      if (data.records && data.records.length > 0) {
        const lastRecord = data.records[0];
        // Parse maintenanceDetails if it's a string
        let details = lastRecord.maintenanceDetails;
        if (typeof details === 'string') {
          try {
            details = JSON.parse(details);
          } catch {
            details = null;
          }
        }
        
        if (details) {
          setLastOilChange({
            oilViscosity: details.oilViscosity,
            oilBrand: details.oilBrand,
            oilType: details.oilType,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching last oil change:', err);
    } finally {
      setLoadingLastOilChange(false);
    }
  };

  // Fetch last oil change when vehicle is selected
  useEffect(() => {
    if (vehicle?.id) {
      fetchLastOilChange(vehicle.id);
    }
  }, [vehicle?.id]);

  // Parts management
  const addPart = () => {
    setParts([...parts, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: keyof Part, value: string | number) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const totalPartsCost = parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const totalCost = totalPartsCost + (parseFloat(laborCost) || 0);

  // Photo handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress and convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setInvoicePhoto(compressed);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature handling
  const initSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (step === 4) {
      initSignatureCanvas();
    }
  }, [step]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    setHasSigned(true);
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    initSignatureCanvas();
    setHasSigned(false);
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL('image/png');
    setSignature(signatureData);
    setStep(5);
  };

  // Toggle category selection
  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(c => c !== catId)
        : [...prev, catId]
    );
  };

  // Form validation
  const validateForm = () => {
    if (!vehicle) return false;
    if (!selectedInterventionType) return false;
    if (selectedCategories.length === 0) return false;
    if (!description.trim()) return false;
    if (parts.length === 0 && !laborCost) return false;
    
    return true;
  };

  // Submit
  const handleSubmit = async (mode: 'draft' | 'submit') => {
    if (!vehicle) {
      setError('Aucun véhicule sélectionné');
      return;
    }

    if (!garageId) {
      setError('Session non valide. Veuillez vous reconnecter.');
      return;
    }

    if (!selectedInterventionType) {
      setError('Veuillez sélectionner un type d\'intervention');
      return;
    }

    setLoading(true);
    setError(null);
    setSubmitMode(mode);

    // Determine if this is a major repair based on intervention type
    const isMajorRepair = selectedInterventionType === 'mecanique_majeure' || selectedInterventionType === 'carrosserie_accident';

    try {
      const response = await fetch('/api/maintenance-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          category: selectedCategories[0], // Primary category
          categories: selectedCategories, // All selected categories
          interventionType: selectedInterventionType, // A, B, or C
          description,
          mileage: mileage ? parseInt(mileage) : null,
          partsList: JSON.stringify(parts.filter(p => p.name)),
          partsCost: totalPartsCost,
          laborCost: parseFloat(laborCost) || 0,
          totalCost,
          invoicePhoto,
          invoiceNumber,
          mechanicName,
          mechanicSignature: signature,
          status: mode === 'submit' ? 'SUBMITTED' : 'DRAFT',
          ownerValidation: mode === 'submit' ? 'PENDING' : null,
          // Include maintenanceDetails if vidange is selected
          maintenanceDetails: selectedCategories.includes('vidange') && maintenanceDetails 
            ? JSON.stringify(maintenanceDetails) 
            : null,
          // Major repair fields
          isMajorRepair,
          affectedOrgans: majorRepairDetails?.affectedOrgans 
            ? JSON.stringify(majorRepairDetails.affectedOrgans) 
            : null,
          partCondition: majorRepairDetails?.partCondition || null,
          accidentRelated: selectedInterventionType === 'carrosserie_accident' || majorRepairDetails?.accidentRelated || false,
          accidentDescription: majorRepairDetails?.accidentDescription || null,
          accidentSeverity: majorRepairDetails?.accidentSeverity || null,
          impactZones: majorRepairDetails?.impactZones 
            ? JSON.stringify(majorRepairDetails.impactZones) 
            : null,
          chassisVerified: majorRepairDetails?.chassisVerified || false,
          repairPhotos: majorRepairDetails?.repairPhotos 
            ? JSON.stringify(majorRepairDetails.repairPhotos) 
            : null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Erreur lors de l\'enregistrement');
        return;
      }

      // Success - redirect with success message
      setSuccess(true);
      // Small delay to show success state
      setTimeout(() => {
        router.push('/garage/interventions?success=1');
      }, 1000);

    } catch (err) {
      setError('Erreur lors de l\'enregistrement de l\'intervention');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/garage/interventions"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux interventions
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Wrench className="w-8 h-8 text-orange-500" />
          Nouvelle Intervention
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { num: 1, label: 'Véhicule' },
          { num: 2, label: 'Intervention' },
          { num: 3, label: 'Coûts' },
          { num: 4, label: 'Signature' },
          { num: 5, label: 'Confirmation' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm ${
              step >= s.num
                ? 'bg-orange-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
            </div>
            <span className={`ml-2 text-sm hidden sm:inline ${step >= s.num ? 'text-orange-500 font-medium' : 'text-slate-400'}`}>
              {s.label}
            </span>
            {i < 4 && (
              <div className={`w-8 h-0.5 mx-2 ${step > s.num ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Step 1: Select Vehicle */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Car className="w-6 h-6 text-orange-500" />
            Sélectionner le véhicule
          </h2>

          <div className="relative mb-4">
            <input
              type="text"
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              placeholder="Rechercher par référence, immatriculation..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              </div>
            )}
          </div>

          {/* Vehicle List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {vehicles.length === 0 && vehicleSearch.length >= 2 && !searchLoading ? (
              <div className="text-center py-8 text-slate-500">
                <Car className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Aucun véhicule trouvé</p>
                <Link
                  href="/garage/activer-qr"
                  className="text-orange-500 text-sm hover:underline"
                >
                  Activer un nouveau QR
                </Link>
              </div>
            ) : (
              vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => selectVehicle(v)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Car className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-orange-500 text-sm">{v.reference}</p>
                    <p className="text-slate-800 dark:text-white font-medium truncate">
                      {v.make || v.model ? `${v.make || ''} ${v.model || ''}`.trim() : 'Véhicule non renseigné'}
                    </p>
                    {v.licensePlate && (
                      <p className="text-sm text-slate-500 font-mono">{v.licensePlate}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    {v.ownerName && <p>{v.ownerName}</p>}
                  </div>
                </button>
              ))
            )}
          </div>

          {vehicleSearch.length < 2 && (
            <p className="text-center text-slate-400 text-sm mt-4">
              Tapez au moins 2 caractères pour rechercher
            </p>
          )}
        </div>
      )}

      {/* Step 2: Intervention Details */}
      {step === 2 && vehicle && (
        <div className="space-y-6">
          {/* Selected Vehicle */}
          <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <Car className="w-6 h-6 text-orange-500" />
              <div className="flex-1">
                <p className="font-mono text-orange-500 text-sm">{vehicle.reference}</p>
                <p className="text-slate-800 dark:text-white font-medium">
                  {vehicle.make || vehicle.model ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : 'Véhicule'}
                  {vehicle.licensePlate && ` - ${vehicle.licensePlate}`}
                </p>
              </div>
              <button
                onClick={() => { setVehicle(null); setStep(1); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Intervention Type Selection (A, B, C) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Type d&apos;intervention *
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Sélectionnez le type principal d&apos;intervention
            </p>
            
            {/* Type Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {interventionTypes.map((type) => {
                const isSelected = selectedInterventionType === type.id;
                const typeConfig = INTERVENTION_TYPES[type.id as InterventionType];
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedInterventionType(type.id as InterventionType);
                      setSelectedCategories([]);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                      isSelected
                        ? type.id === 'entretien_courant'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                          : type.id === 'mecanique_majeure'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                          : 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <p className={`font-semibold ${
                          isSelected
                            ? type.id === 'entretien_courant'
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : type.id === 'mecanique_majeure'
                              ? 'text-orange-700 dark:text-orange-300'
                              : 'text-red-700 dark:text-red-300'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{type.description}</p>
                      </div>
                      {isSelected && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          type.id === 'entretien_courant'
                            ? 'bg-emerald-500'
                            : type.id === 'mecanique_majeure'
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}>
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Sub-categories based on selected type */}
            {selectedInterventionType && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Catégorie(s) spécifique(s)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subCategories[selectedInterventionType]?.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                          isSelected
                            ? selectedInterventionType === 'entretien_courant'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : selectedInterventionType === 'mecanique_majeure'
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <span className={`text-sm font-medium ${
                          isSelected
                            ? selectedInterventionType === 'entretien_courant'
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : selectedInterventionType === 'mecanique_majeure'
                              ? 'text-orange-700 dark:text-orange-300'
                              : 'text-red-700 dark:text-red-300'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {cat.label}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 ml-auto text-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Vidange Sub-Form - Show for Type A (Entretien Courant) when vidange is selected */}
            {selectedInterventionType === 'entretien_courant' && selectedCategories.includes('vidange') && (
              <VidangeSubForm
                value={maintenanceDetails || {
                  oilViscosity: '',
                  oilBrand: '',
                  oilType: 'synthetic',
                  oilQuantity: 0,
                  oilFilterChanged: false,
                }}
                onChange={setMaintenanceDetails}
                lastOilChange={lastOilChange}
                showRecommendation={true}
              />
            )}
            
            {/* Major Repair Sub-Form - Show for Type B (Mécanique Majeure) */}
            {selectedInterventionType === 'mecanique_majeure' && selectedCategories.length > 0 && (
              <MajorRepairSubForm
                value={majorRepairDetails || {
                  affectedOrgans: [],
                  partCondition: 'neuf_adaptable',
                  accidentRelated: false,
                  repairPhotos: [],
                }}
                onChange={setMajorRepairDetails}
                category={primaryCategory}
                isCarrosserie={false}
              />
            )}
            
            {/* Accident Sub-Form - Show for Type C (Carrosserie/Accident) */}
            {selectedInterventionType === 'carrosserie_accident' && selectedCategories.length > 0 && (
              <AccidentSubForm
                value={majorRepairDetails || {
                  affectedOrgans: [],
                  partCondition: 'neuf_adaptable',
                  accidentRelated: true,
                  repairPhotos: [],
                }}
                onChange={setMajorRepairDetails}
              />
            )}
          </div>

          {/* Description & Mileage */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description de l'intervention *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Décrivez les travaux effectués..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kilométrage actuel
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="Ex: 125000"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Retour
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedCategories.length === 0 || !description.trim()}
              className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Costs */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Parts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Pièces utilisées
              </h3>
              <button
                onClick={addPart}
                className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {parts.map((part, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <input
                    type="text"
                    value={part.name}
                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                    placeholder="Nom de la pièce"
                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400"
                  />
                  <input
                    type="number"
                    value={part.quantity}
                    onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Qté"
                    className="w-20 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 text-center"
                  />
                  <input
                    type="number"
                    value={part.unitPrice}
                    onChange={(e) => updatePart(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Prix unitaire"
                    className="w-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400"
                  />
                  <button
                    onClick={() => removePart(index)}
                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {parts.length === 0 && (
                <p className="text-slate-400 text-center py-4">
                  Aucune pièce ajoutée
                </p>
              )}
            </div>
          </div>

          {/* Labor & Total */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Main d'œuvre (FCFA)
                </label>
                <input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  placeholder="Ex: 25000"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Invoice Photo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Photo de la facture
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                {invoicePhoto ? (
                  <div className="relative">
                    <img
                      src={invoicePhoto}
                      alt="Facture"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() => setInvoicePhoto(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center gap-2 text-slate-400 hover:border-orange-500 hover:text-orange-500 transition-colors"
                  >
                    <Camera className="w-8 h-8" />
                    <span>Prendre une photo</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  N° Facture (optionnel)
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="FAC-2024-001"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nom du mécanicien
                </label>
                <input
                  type="text"
                  value={mechanicName}
                  onChange={(e) => setMechanicName(e.target.value)}
                  placeholder="Amadou Diallo"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
                <span>Pièces:</span>
                <span>{totalPartsCost.toLocaleString('fr-SN')} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
                <span>Main d'œuvre:</span>
                <span>{(parseFloat(laborCost) || 0).toLocaleString('fr-SN')} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-slate-800 dark:text-white">
                <span>Total:</span>
                <span className="text-orange-500">{totalCost.toLocaleString('fr-SN')} FCFA</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Retour
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={parts.length === 0 && !laborCost}
              className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Signature */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <PenLine className="w-5 h-5 text-orange-500" />
              Signature du mécanicien
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2 mb-4">
              <canvas
                ref={signatureCanvasRef}
                width={400}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg cursor-crosshair touch-none"
                style={{ height: '200px' }}
              />
            </div>

            <button
              onClick={clearSignature}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <Trash2 className="w-4 h-4" />
              Effacer et recommencer
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Retour
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasSigned}
              className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmer la signature
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && !success && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Récapitulatif
            </h3>

            <div className="space-y-4">
              {/* Vehicle */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Car className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-slate-500">Véhicule</p>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {vehicle?.make} {vehicle?.model} - {vehicle?.licensePlate}
                  </p>
                </div>
              </div>

              {/* Categories */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Wrench className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Types d'intervention</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedCategories.map(catId => {
                      const cat = categories.find(c => c.id === catId);
                      return cat ? (
                        <span key={catId} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
                          {cat.icon} {cat.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                <span className="text-slate-600 dark:text-slate-300">Montant total</span>
                <span className="text-2xl font-bold text-orange-500">
                  {totalCost.toLocaleString('fr-SN')} FCFA
                </span>
              </div>

              {/* Signature Preview */}
              {signature && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 mb-2">Signature</p>
                  <img src={signature} alt="Signature" className="h-16 bg-white rounded" />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleSubmit('submit')}
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && submitMode === 'submit' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Envoyer pour validation
                </>
              )}
            </button>
            
            <button
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="w-full py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && submitMode === 'draft' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer comme brouillon
                </>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-slate-500">
            En envoyant, le rapport sera automatiquement validé car votre garage est certifié OKAR.
          </p>
        </div>
      )}

      {/* Success State */}
      {success && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Intervention enregistrée ! 🎉
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-md">
            L'intervention a été validée automatiquement et ajoutée au passeport OKAR du véhicule.
          </p>
          <div className="flex items-center gap-2 text-emerald-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirection vers vos interventions...</span>
          </div>
        </div>
      )}
    </div>
  );
}
