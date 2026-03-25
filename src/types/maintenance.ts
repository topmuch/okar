// ============================================
// TYPES POUR L'HISTORIQUE TECHNIQUE STRUCTURÉ
// Passeport Numérique OKAR
// ============================================

// ============================================
// TYPES D'INTERVENTION PRINCIPAUX (A, B, C)
// ============================================

/**
 * Types d'intervention avec configuration visuelle
 * A = Entretien Courant (Vert)
 * B = Réparation Mécanique Majeure (Orange)
 * C = Carrosserie / Accident (Rouge)
 */
export const INTERVENTION_TYPES = {
  entretien_courant: {
    id: 'entretien_courant',
    code: 'A',
    label: 'Entretien Courant',
    shortLabel: 'Entretien',
    description: 'Vidange, Filtres, Niveaux',
    icon: '🟢',
    color: 'emerald',
    borderClass: 'border-l-emerald-500',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/10',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    categories: ['vidange', 'freins', 'pneus', 'batterie', 'climatisation', 'electricite'],
  },
  mecanique_majeure: {
    id: 'mecanique_majeure',
    code: 'B',
    label: 'Réparation Mécanique Majeure',
    shortLabel: 'Mécanique Lourde',
    description: 'Moteur, Boîte, Distribution, Turbo...',
    icon: '🟠',
    color: 'orange',
    borderClass: 'border-l-orange-500 border-l-4',
    bgClass: 'bg-orange-50 dark:bg-orange-900/10',
    textClass: 'text-orange-700 dark:text-orange-300',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    categories: ['moteur', 'distribution', 'embrayage', 'boite', 'turbo', 'transmission', 'direction', 'radiateur'],
  },
  carrosserie_accident: {
    id: 'carrosserie_accident',
    code: 'C',
    label: 'Carrosserie / Accident',
    shortLabel: 'Carrosserie',
    description: 'Choc, Redressage, Peinture',
    icon: '🔴',
    color: 'red',
    borderClass: 'border-l-red-500 border-l-4',
    bgClass: 'bg-red-50 dark:bg-red-900/10',
    textClass: 'text-red-700 dark:text-red-300',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    categories: ['carrosserie', 'chassis', 'peinture'],
  },
} as const;

export type InterventionType = keyof typeof INTERVENTION_TYPES;

/**
 * Détermine le type d'intervention basé sur la catégorie
 */
export function getInterventionType(category: string): InterventionType {
  const cat = category.toLowerCase();
  
  // Type C - Carrosserie / Accident
  if (['carrosserie', 'chassis', 'peinture'].includes(cat)) {
    return 'carrosserie_accident';
  }
  
  // Type B - Mécanique Majeure
  if (['moteur', 'distribution', 'embrayage', 'boite', 'turbo', 'transmission', 'direction', 'radiateur'].includes(cat)) {
    return 'mecanique_majeure';
  }
  
  // Type A - Entretien Courant (default)
  return 'entretien_courant';
}

/**
 * Configuration pour les filtres de timeline
 */
export const TIMELINE_FILTERS = [
  { id: 'all', label: 'Tout Voir', icon: '📋' },
  { id: 'entretien_courant', label: 'Entretiens', icon: '🟢' },
  { id: 'mecanique_majeure', label: 'Mécanique Lourde', icon: '🟠' },
  { id: 'carrosserie_accident', label: 'Carrosserie', icon: '🔴' },
] as const;

// Catégories d'intervention avec configuration
export const INTERVENTION_CATEGORIES = {
  vidange: {
    id: 'vidange',
    label: 'Vidange',
    icon: '🛢️',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    hasSubForm: true,
    subFormType: 'vidange',
  },
  freins: {
    id: 'freins',
    label: 'Freinage',
    icon: '🛑',
    color: 'bg-red-100 text-red-700 border-red-300',
    hasSubForm: true,
    subFormType: 'freinage',
  },
  pneus: {
    id: 'pneus',
    label: 'Pneus',
    icon: '🛞',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    hasSubForm: true,
    subFormType: 'pneus',
  },
  moteur: {
    id: 'moteur',
    label: 'Moteur',
    icon: '⚙️',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    hasSubForm: false,
  },
  electricite: {
    id: 'electricite',
    label: 'Électricité',
    icon: '⚡',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    hasSubForm: false,
  },
  carrosserie: {
    id: 'carrosserie',
    label: 'Carrosserie',
    icon: '🚗',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    hasSubForm: false,
  },
  distribution: {
    id: 'distribution',
    label: 'Distribution',
    icon: '🔗',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    hasSubForm: true,
    subFormType: 'distribution',
  },
  batterie: {
    id: 'batterie',
    label: 'Batterie',
    icon: '🔋',
    color: 'bg-green-100 text-green-700 border-green-300',
    hasSubForm: true,
    subFormType: 'batterie',
  },
  climatisation: {
    id: 'climatisation',
    label: 'Climatisation',
    icon: '❄️',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    hasSubForm: true,
    subFormType: 'climatisation',
  },
  amortisseurs: {
    id: 'amortisseurs',
    label: 'Amortisseurs',
    icon: '🔧',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    hasSubForm: false,
  },
  embrayage: {
    id: 'embrayage',
    label: 'Embrayage',
    icon: '⚙️',
    color: 'bg-zinc-100 text-zinc-700 border-zinc-300',
    hasSubForm: false,
  },
  autre: {
    id: 'autre',
    label: 'Autre',
    icon: '🔧',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    hasSubForm: false,
  },
} as const;

// Types de viscosité d'huile courants
export const OIL_VISCOSITY_OPTIONS = [
  { value: '0W16', label: '0W-16', description: 'Économie carburant, véhicules récents' },
  { value: '0W20', label: '0W-20', description: 'Économie carburant, moteurs modernes' },
  { value: '5W20', label: '5W-20', description: 'Standard, polyvalent' },
  { value: '5W30', label: '5W-30', description: 'Standard, polyvalent' },
  { value: '5W40', label: '5W-40', description: 'Sportif, haute performance' },
  { value: '10W30', label: '10W-30', description: 'Véhicules anciens, climat chaud' },
  { value: '10W40', label: '10W-40', description: 'Standard, véhicules classiques' },
  { value: '10W50', label: '10W-50', description: 'Haute performance, compétition' },
  { value: '15W40', label: '15W-40', description: 'Véhicules anciens, diesel' },
  { value: '15W50', label: '15W-50', description: 'Sportif, usage intensif' },
  { value: '20W50', label: '20W-50', description: 'Véhicules très anciens, climat chaud' },
  { value: '75W80', label: '75W-80', description: 'Boîte de vitesses' },
  { value: '75W90', label: '75W-90', description: 'Pont/ différentiel' },
  { value: '80W90', label: '80W-90', description: 'Usage agricole/industriel' },
  { value: 'other', label: 'Autre', description: 'Spécification personnalisée' },
] as const;

// Marques d'huile populaires
export const OIL_BRANDS = [
  'TotalEnergies',
  'Shell',
  'Mobil',
  'Castrol',
  'Elf',
  'Motul',
  'Liqui Moly',
  'Valvoline',
  'Petronas',
  'Eni',
  'Gulf',
  'Repsol',
  'Autre',
] as const;

// Types d'huile moteur
export const OIL_TYPES = [
  { value: 'mineral', label: 'Minérale', description: 'Huile basique, voiture ancienne' },
  { value: 'semisynthetic', label: 'Semi-synthétique', description: 'Rapport qualité/prix' },
  { value: 'synthetic', label: 'Synthétique', description: 'Haute performance' },
  { value: 'fullsynthetic', label: '100% Synthétique', description: 'Excellence, sport' },
] as const;

// ============================================
// INTERFACES PRINCIPALES
// ============================================

/**
 * Détails spécifiques pour une intervention de vidange
 */
export interface VidangeDetails {
  // Informations huile
  oilViscosity: string;           // Ex: "5W30"
  oilBrand: string;               // Ex: "TotalEnergies"
  oilType: 'mineral' | 'semisynthetic' | 'synthetic' | 'fullsynthetic';
  oilQuantity: number;            // En litres
  
  // Filtres
  oilFilterChanged: boolean;
  oilFilterReference?: string;    // Référence du filtre
  oilFilterBrand?: string;        // Marque du filtre
  
  // Cartouche (pour certains véhicules)
  cartridgeChanged?: boolean;
  cartridgeReference?: string;
  
  // Filtre à air (optionnel)
  airFilterChanged?: boolean;
  airFilterReference?: string;
  
  // Filtre à carburant (optionnel)
  fuelFilterChanged?: boolean;
  fuelFilterReference?: string;
  
  // Jauge d'huile après intervention
  oilLevelAfter?: 'min' | 'ok' | 'max';
  
  // Notes
  notes?: string;
  
  // Prochaine échéance (calculée ou suggérée)
  nextChangeKm?: number;          // KM prévu pour prochaine vidange
  nextChangeDate?: string;        // Date prévue ISO
}

/**
 * Détails pour intervention de freinage
 */
export interface FreinageDetails {
  // Freins avant
  frontPadsChanged: boolean;
  frontPadsReference?: string;
  frontDiscsChanged: boolean;
  frontDiscsReference?: string;
  
  // Freins arrière
  rearPadsChanged: boolean;
  rearPadsReference?: string;
  rearDiscsChanged: boolean;
  rearDiscsReference?: string;
  
  // Liquide de frein
  brakeFluidChanged: boolean;
  brakeFluidType?: string;        // DOT3, DOT4, DOT5
  brakeFluidBrand?: string;
  
  // Plaquettes de frein à main
  handbrakeShoesChanged?: boolean;
  
  notes?: string;
}

/**
 * Détails pour intervention de pneus
 */
export interface PneusDetails {
  // Pneus avant
  frontTiresChanged: boolean;
  frontTireBrand?: string;
  frontTireModel?: string;
  frontTireSize?: string;         // Ex: "205/55 R16"
  frontTireQuantity?: number;
  
  // Pneus arrière
  rearTiresChanged: boolean;
  rearTireBrand?: string;
  rearTireModel?: string;
  rearTireSize?: string;
  rearTireQuantity?: number;
  
  // Roue de secours
  spareTireChanged?: boolean;
  
  // Équilibrage et géométrie
  balancingDone?: boolean;
  alignmentDone?: boolean;
  
  // Pression
  frontPressure?: number;         // En bars
  rearPressure?: number;
  
  notes?: string;
}

/**
 * Détails pour intervention de distribution
 */
export interface DistributionDetails {
  kitType: 'courroie' | 'chaine' | 'kit_complet';
  
  // Pièces changées
  beltChanged: boolean;
  waterPumpChanged: boolean;
  tensionerChanged: boolean;
  idlerPulleysChanged: boolean;
  
  // Références
  beltReference?: string;
  waterPumpReference?: string;
  kitReference?: string;
  
  // Prochaine échéance
  nextChangeKm?: number;
  nextChangeYears?: number;
  
  notes?: string;
}

/**
 * Détails pour intervention batterie
 */
export interface BatterieDetails {
  batteryChanged: boolean;
  batteryBrand?: string;
  batteryModel?: string;
  batteryCapacity?: number;       // En Ah
  batteryVoltage?: number;        // En V (généralement 12V)
  coldCrankingAmps?: number;      // CCA
  warrantyMonths?: number;
  
  // Diagnostic
  oldBatteryDiagnostic?: string;
  
  notes?: string;
}

/**
 * Détails pour intervention climatisation
 */
export interface ClimatisationDetails {
  // Type d'intervention
  serviceType: 'recharge' | 'reparation' | 'remplacement';
  
  // Recharge
  gasType?: 'R134a' | 'R1234yf';
  gasQuantity?: number;           // En grammes
  oilAdded?: boolean;
  
  // Réparation
  compressorChanged?: boolean;
  condenserChanged?: boolean;
  evaporatorChanged?: boolean;
  
  // Diagnostic
  leakDetected?: boolean;
  leakLocation?: string;
  
  notes?: string;
}

/**
 * Union type pour tous les types de détails
 */
export type MaintenanceDetails = 
  | VidangeDetails 
  | FreinageDetails 
  | PneusDetails 
  | DistributionDetails 
  | BatterieDetails 
  | ClimatisationDetails;

// ============================================
// INTERFACES POUR L'HISTORIQUE
// ============================================

/**
 * Élément d'historique de vidange pour affichage
 */
export interface VidangeHistoryItem {
  id: string;
  date: string;                   // ISO date
  mileage: number;
  oilViscosity: string;
  oilBrand: string;
  oilType: string;
  oilQuantity: number;
  filterChanged: boolean;
  filterReference?: string;
  garageName: string;
  garageCertified: boolean;
  totalCost?: number;
  source: 'OKAR' | 'PRE_OKAR_PAPER';
  isVerified: boolean;
  
  // Calculé
  nextChangeKm?: number;
  nextChangeDate?: string;
  daysUntilNext?: number;
  kmUntilNext?: number;
}

/**
 * Alerte de maintenance
 */
export interface MaintenanceAlert {
  type: 'vidange' | 'freins' | 'pneus' | 'distribution' | 'batterie' | 'general';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  lastInterventionDate?: string;
  lastInterventionMileage?: number;
  currentMileage: number;
  kmSinceLast?: number;
  daysSinceLast?: number;
  recommendedAction?: string;
}

/**
 * Résumé de l'historique fluides pour un véhicule
 */
export interface FluidHistorySummary {
  vehicleId: string;
  currentMileage: number;
  
  // Dernière vidange
  lastOilChange: VidangeHistoryItem | null;
  
  // Toutes les vidanges
  oilChangeHistory: VidangeHistoryItem[];
  
  // Alertes actives
  alerts: MaintenanceAlert[];
  
  // Statistiques
  totalOilChanges: number;
  averageIntervalKm: number;
  averageIntervalDays: number;
  
  // Recommandations
  recommendedOilType?: string;
  recommendedOilViscosity?: string;
}

// ============================================
// CONSTANTES DE CALCUL
// ============================================

/**
 * Configuration des seuils d'alerte
 */
export const ALERT_THRESHOLDS = {
  vidange: {
    warningKm: 8000,              // Alerte à 8000 km
    criticalKm: 10000,            // Critique à 10000 km
    warningDays: 330,             // Alerte à 330 jours (~11 mois)
    criticalDays: 365,            // Critique à 365 jours (1 an)
    defaultIntervalKm: 10000,     // Intervalle par défaut
    defaultIntervalDays: 365,     // Intervalle par défaut
  },
  freins: {
    warningKm: 30000,
    criticalKm: 50000,
    defaultIntervalKm: 40000,
  },
  pneus: {
    warningKm: 30000,
    criticalKm: 50000,
    defaultIntervalKm: 40000,
  },
  distribution: {
    warningKm: 80000,
    criticalKm: 120000,
    warningYears: 4,
    criticalYears: 6,
    defaultIntervalKm: 120000,
    defaultIntervalYears: 5,
  },
} as const;

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Calcule la prochaine échéance de vidange
 */
export function calculateNextOilChange(
  lastMileage: number,
  lastDate: string,
  intervalKm: number = ALERT_THRESHOLDS.vidange.defaultIntervalKm,
  intervalDays: number = ALERT_THRESHOLDS.vidange.defaultIntervalDays
): { nextKm: number; nextDate: string } {
  const nextKm = lastMileage + intervalKm;
  
  const lastDateObj = new Date(lastDate);
  const nextDateObj = new Date(lastDateObj);
  nextDateObj.setDate(nextDateObj.getDate() + intervalDays);
  
  return {
    nextKm,
    nextDate: nextDateObj.toISOString(),
  };
}

/**
 * Génère une alerte de vidange si nécessaire
 */
export function generateOilChangeAlert(
  lastOilChange: VidangeHistoryItem | null,
  currentMileage: number
): MaintenanceAlert | null {
  if (!lastOilChange) {
    return {
      type: 'vidange',
      severity: 'info',
      title: 'Aucune vidange enregistrée',
      message: 'Aucune vidange certifiée OKAR n\'a été enregistrée pour ce véhicule.',
      currentMileage,
      recommendedAction: 'Effectuez une vidange et enregistrez-la via OKAR pour un suivi optimal.',
    };
  }
  
  const kmSinceLast = currentMileage - lastOilChange.mileage;
  const daysSinceLast = Math.floor(
    (Date.now() - new Date(lastOilChange.date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const { warningKm, criticalKm, warningDays, criticalDays } = ALERT_THRESHOLDS.vidange;
  
  // Alerte critique
  if (kmSinceLast >= criticalKm || daysSinceLast >= criticalDays) {
    return {
      type: 'vidange',
      severity: 'critical',
      title: '🚨 VIDANGE RECOMMANDÉE',
      message: `Dernière vidange il y a ${kmSinceLast.toLocaleString()} km ou ${daysSinceLast} jours. Dépassement des seuils recommandés.`,
      lastInterventionDate: lastOilChange.date,
      lastInterventionMileage: lastOilChange.mileage,
      currentMileage,
      kmSinceLast,
      daysSinceLast,
      recommendedAction: lastOilChange.oilViscosity 
        ? `Utilisez de l'huile ${lastOilChange.oilViscosity} (${lastOilChange.oilBrand || 'marque non spécifiée'}) comme lors de la dernière intervention.`
        : 'Consultez un garagiste certifié OKAR.',
    };
  }
  
  // Alerte warning
  if (kmSinceLast >= warningKm || daysSinceLast >= warningDays) {
    return {
      type: 'vidange',
      severity: 'warning',
      title: '⚠️ Vidange à prévoir',
      message: `Dernière vidange il y a ${kmSinceLast.toLocaleString()} km ou ${daysSinceLast} jours. Prochaine vidange recommandée prochainement.`,
      lastInterventionDate: lastOilChange.date,
      lastInterventionMileage: lastOilChange.mileage,
      currentMileage,
      kmSinceLast,
      daysSinceLast,
      recommendedAction: lastOilChange.oilViscosity 
        ? `Continuez avec de l'huile ${lastOilChange.oilViscosity} pour la cohérence de l'entretien.`
        : undefined,
    };
  }
  
  return null;
}

/**
 * Label lisible pour le type d'huile
 */
export function getOilTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    mineral: 'Minérale',
    semisynthetic: 'Semi-synthétique',
    synthetic: 'Synthétique',
    fullsynthetic: '100% Synthétique',
  };
  return labels[type] || type;
}

// ============================================
// GROSSES RÉPARATIONS ET INCIDENTS MAJEURS
// ============================================

/**
 * Organes mécaniques majeurs
 */
export const MAJOR_ORGANS = [
  { value: 'moteur', label: 'Moteur', icon: '⚙️', critical: true },
  { value: 'boite', label: 'Boîte de vitesses', icon: '🔧', critical: true },
  { value: 'distribution', label: 'Distribution (Courroie/Chaîne)', icon: '🔗', critical: true },
  { value: 'turbo', label: 'Turbo / Compresseur', icon: '🌪️', critical: true },
  { value: 'embrayage', label: 'Embrayage', icon: '🎚️', critical: false },
  { value: 'chassis', label: 'Châssis', icon: '🚗', critical: true },
  { value: 'suspension', label: 'Suspension', icon: '🔩', critical: false },
  { value: 'freinage', label: 'Freinage (Système complet)', icon: '🛑', critical: true },
  { value: 'electricite_lourde', label: 'Électricité lourde', icon: '⚡', critical: false },
  { value: 'direction', label: 'Direction assistée', icon: '🎯', critical: false },
  { value: 'transmission', label: 'Transmission', icon: '⛓️', critical: true },
  { value: 'radiateur', label: 'Radiateur / Refroidissement', icon: '🌡️', critical: false },
  { value: 'pot_echappement', label: "Pot d'échappement", icon: '💨', critical: false },
  { value: 'autre', label: 'Autre organe majeur', icon: '🔧', critical: false },
] as const;

/**
 * Types de conditions des pièces
 */
export const PART_CONDITIONS = [
  { 
    value: 'neuf_origine', 
    label: 'Neuf - Pièce d\'origine (OEM)', 
    description: 'Pièce neuve du constructeur',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: '✓'
  },
  { 
    value: 'neuf_adaptable', 
    label: 'Neuf - Adaptable (Équipementier)', 
    description: 'Pièce neuve compatible',
    badge: 'bg-blue-100 text-blue-700',
    icon: '◎'
  },
  { 
    value: 'reconditionne', 
    label: 'Reconditionnée', 
    description: 'Pièce refaite à neuf',
    badge: 'bg-purple-100 text-purple-700',
    icon: '🔄'
  },
  { 
    value: 'occasion', 
    label: 'Occasion / Casse', 
    description: 'Pièce de seconde main',
    badge: 'bg-amber-100 text-amber-700',
    icon: '⚠'
  },
] as const;

/**
 * Types de gravité d'accident
 */
export const ACCIDENT_SEVERITY = [
  { value: 'mineur', label: 'Mineur', description: 'Dommages cosmétiques légers', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'modere', label: 'Modéré', description: 'Réparation carrosserie nécessaire', color: 'bg-orange-100 text-orange-700' },
  { value: 'important', label: 'Important', description: 'Structure touchée', color: 'bg-red-100 text-red-700' },
  { value: 'grave', label: 'Grave', description: 'Véhicule déclaré épave', color: 'bg-red-200 text-red-800' },
] as const;

/**
 * Zones d'impact pour accidents
 */
export const IMPACT_ZONES = [
  { value: 'avant_gauche', label: 'Avant gauche' },
  { value: 'avant_droit', label: 'Avant droit' },
  { value: 'avant_centre', label: 'Avant centre' },
  { value: 'arriere_gauche', label: 'Arrière gauche' },
  { value: 'arriere_droit', label: 'Arrière droit' },
  { value: 'arriere_centre', label: 'Arrière centre' },
  { value: 'flanc_gauche', label: 'Flanc gauche' },
  { value: 'flanc_droit', label: 'Flanc droit' },
  { value: 'toit', label: 'Toit' },
  { value: 'chassis', label: 'Châssis' },
] as const;

/**
 * Détails pour une réparation majeure
 */
export interface MajorRepairDetails {
  // Organes touchés
  affectedOrgans: string[];
  
  // État des pièces utilisées
  partCondition: 'neuf_origine' | 'neuf_adaptable' | 'reconditionne' | 'occasion';
  
  // Lié à un accident
  accidentRelated: boolean;
  accidentDescription?: string;
  accidentSeverity?: string;
  impactZones?: string[];
  
  // Photos obligatoires (minimum 2 pour certification)
  repairPhotos: string[];
  
  // Garantie
  warrantyMonths?: number;
  warrantyKm?: number;
  
  // Observations techniques
  technicalNotes?: string;
  
  // Kilométrage de l'organe (si différent du véhicule)
  organMileage?: number;
  
  // Champs spécifiques carrosserie/accident
  hasExpertReport?: boolean;
  chassisVerified?: boolean;
}

/**
 * Élément d'historique pour réparation majeure
 */
export interface MajorRepairHistoryItem {
  id: string;
  date: string;
  mileage: number;
  category: string;
  affectedOrgans: string[];
  partCondition: string;
  accidentRelated: boolean;
  accidentDescription?: string;
  accidentSeverity?: string;
  impactZones?: string[];
  repairPhotos: string[];
  garageName: string;
  garageCertified: boolean;
  totalCost?: number;
  source: 'OKAR' | 'PRE_OKAR_PAPER';
  isVerified: boolean;
  
  // Calculé
  yearsAgo: number;
  kmAgo: number;
  warrantyValid: boolean;
  warrantyEndDate?: string;
}

/**
 * Alerte pour réparation majeure
 */
export interface MajorRepairAlert {
  type: 'distribution_check' | 'organ_replaced' | 'accident_history' | 'warranty_expiring';
  severity: 'info' | 'warning' | 'critical' | 'positive';
  title: string;
  message: string;
  organ?: string;
  lastInterventionDate?: string;
  lastInterventionMileage?: number;
  recommendedAction?: string;
  isPositive?: boolean; // For "organ replaced" - positive for resale
}

/**
 * Résumé de l'historique des réparations majeures
 */
export interface MajorRepairsSummary {
  vehicleId: string;
  currentMileage: number;
  
  // Toutes les réparations majeures
  majorRepairs: MajorRepairHistoryItem[];
  
  // Accident(s)
  hasAccidentHistory: boolean;
  accidentCount: number;
  
  // Organes remplacés (argument de vente)
  replacedOrgans: string[];
  
  // Alertes actives
  alerts: MajorRepairAlert[];
  
  // Statistiques
  totalMajorRepairs: number;
  totalRepairCost: number;
}

// ============================================
// FONCTIONS UTILITAIRES - RÉPARATIONS MAJEURES
// ============================================

/**
 * Seuils d'alerte pour les réparations majeures
 */
export const MAJOR_REPAIR_THRESHOLDS = {
  distribution: {
    warningYears: 4,
    criticalYears: 5,
    warningKm: 100000,
    criticalKm: 120000,
  },
  moteur: {
    positiveYears: 5, // "Moteur récent" pendant 5 ans
    positiveKm: 100000,
  },
  boite: {
    positiveYears: 5,
    positiveKm: 100000,
  },
} as const;

/**
 * Génère une alerte pour vérification de distribution
 */
export function generateDistributionAlert(
  lastDistribution: MajorRepairHistoryItem | null,
  currentMileage: number
): MajorRepairAlert | null {
  if (!lastDistribution) return null;
  
  const yearsAgo = Math.floor(
    (Date.now() - new Date(lastDistribution.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const kmAgo = currentMileage - lastDistribution.mileage;
  
  const { warningYears, criticalYears, warningKm, criticalKm } = MAJOR_REPAIR_THRESHOLDS.distribution;
  
  if (yearsAgo >= criticalYears || kmAgo >= criticalKm) {
    return {
      type: 'distribution_check',
      severity: 'critical',
      title: '⚠️ Distribution à vérifier impérativement',
      message: `La distribution a été changée il y a ${yearsAgo} ans ou ${kmAgo.toLocaleString()} km. Vérification recommandée.`,
      organ: 'distribution',
      lastInterventionDate: lastDistribution.date,
      lastInterventionMileage: lastDistribution.mileage,
      recommendedAction: 'Faites vérifier l\'état de la courroie/chaîne de distribution par un professionnel.',
    };
  }
  
  if (yearsAgo >= warningYears || kmAgo >= warningKm) {
    return {
      type: 'distribution_check',
      severity: 'warning',
      title: '⏰ Distribution à prévoir',
      message: `La distribution a été changée il y a ${yearsAgo} ans ou ${kmAgo.toLocaleString()} km. Pensez à la prochaine échéance.`,
      organ: 'distribution',
      lastInterventionDate: lastDistribution.date,
      lastInterventionMileage: lastDistribution.mileage,
      recommendedAction: 'Planifiez un remplacement de la distribution dans les prochains mois.',
    };
  }
  
  return null;
}

/**
 * Génère un message positif pour organe majeur remplacé
 */
export function generateOrganReplacedMessage(
  repair: MajorRepairHistoryItem
): MajorRepairAlert {
  const yearsAgo = Math.floor(
    (Date.now() - new Date(repair.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  
  const organLabel = MAJOR_ORGANS.find(o => o.value === repair.affectedOrgans[0])?.label || 'Organe majeur';
  const conditionLabel = PART_CONDITIONS.find(c => c.value === repair.partCondition)?.label || '';
  
  return {
    type: 'organ_replaced',
    severity: 'positive',
    title: `✅ ${organLabel} remplacé récemment`,
    message: `${organLabel} remplacé il y a ${yearsAgo} an${yearsAgo > 1 ? 's' : ''} (${conditionLabel})`,
    organ: repair.affectedOrgans[0],
    lastInterventionDate: repair.date,
    lastInterventionMileage: repair.mileage,
    isPositive: true,
  };
}

/**
 * Label lisible pour la condition de pièce
 */
export function getPartConditionLabel(condition: string): string {
  const found = PART_CONDITIONS.find(c => c.value === condition);
  return found?.label || condition;
}

/**
 * Label lisible pour un organe
 */
export function getOrganLabel(organ: string): string {
  const found = MAJOR_ORGANS.find(o => o.value === organ);
  return found?.label || organ;
}

/**
 * Vérifie si une catégorie nécessite le formulaire de réparation majeure
 */
export function isMajorRepairCategory(category: string): boolean {
  const majorCategories = ['moteur', 'boite', 'distribution', 'carrosserie', 'chassis', 'turbo'];
  return majorCategories.includes(category.toLowerCase());
}
