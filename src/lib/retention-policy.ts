/**
 * OKAR - Politique de Rétention des Données RGPD
 * 
 * Ce fichier définit les durées de conservation des données personnelles
 * conformément au RGPD et à la réglementation sénégalaise.
 * 
 * Catégories de données:
 * - Documents d'identité (CNI, passeport): 30 jours après validation
 * - Factures et justificatifs: 5 ans (obligation légale)
 * - Données véhicule: Durée de vie du véhicule + 2 ans
 * - Logs d'audit: 3 ans
 * - Sessions: 7 jours d'inactivité
 * - Notifications: 90 jours
 */

export const RETENTION_POLICIES = {
  // ============================================
  // DOCUMENTS D'IDENTITÉ
  // ============================================
  // Les CNI et passeports doivent être supprimés après validation
  // car ils ne sont nécessaires que pour vérifier l'identité
  IDENTITY_DOCUMENTS: {
    retentionDays: 30,
    description: 'Documents d\'identité (CNI, passeport) - supprimés 30 jours après validation',
    fields: ['idDocumentUrl', 'agreementDocumentUrl'],
    action: 'DELETE' as const,
    afterEvent: 'VALIDATION', // Supprimer après validation du garage
  },

  // ============================================
  // PHOTOS DE FAÇADE DE GARAGE
  // ============================================
  GARAGE_PHOTOS: {
    retentionDays: 365,
    description: 'Photos de façade des garages',
    fields: ['shopPhoto'],
    action: 'DELETE' as const,
  },

  // ============================================
  // FACTURES ET JUSTIFICATIFS
  // ============================================
  // Obligation légale de conservation 5 ans (Code de commerce)
  INVOICES: {
    retentionDays: 1825, // 5 ans
    description: 'Factures et justificatifs - obligation légale 5 ans',
    fields: ['invoicePhoto', 'paperDocumentUrl'],
    action: 'ARCHIVE' as const, // Archiver après 5 ans, pas supprimer
  },

  // ============================================
  // DONNÉES VÉHICULE
  // ============================================
  VEHICLE_DATA: {
    retentionDays: null, // Durée de vie du véhicule + 2 ans
    description: 'Données du véhicule - conservées pendant la vie du véhicule + 2 ans',
    action: 'ANONYMIZE' as const, // Anonymiser après suppression
    anonymizeAfterYears: 2,
  },

  // ============================================
  // LOGS D'AUDIT
  // ============================================
  AUDIT_LOGS: {
    retentionDays: 1095, // 3 ans
    description: 'Logs d\'audit - 3 ans pour les besoins de sécurité',
    action: 'DELETE' as const,
  },

  // ============================================
  // LOGS DE CONNEXION
  // ============================================
  LOGIN_LOGS: {
    retentionDays: 365,
    description: 'Logs de connexion - 1 an',
    action: 'DELETE' as const,
  },

  // ============================================
  // SESSIONS EXPIRÉES
  // ============================================
  SESSIONS: {
    retentionDays: 7,
    description: 'Sessions expirées - nettoyage hebdomadaire',
    action: 'DELETE' as const,
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  NOTIFICATIONS: {
    retentionDays: 90,
    description: 'Notifications lues - 90 jours',
    action: 'DELETE' as const,
    onlyRead: true,
  },

  // ============================================
  // CODES DE TRANSFERT EXPIRÉS
  // ============================================
  TRANSFER_CODES: {
    retentionDays: 30,
    description: 'Codes de transfert expirés - 30 jours après expiration',
    action: 'DELETE' as const,
  },

  // ============================================
  // SIGNALEMENTS RÉSOLUS
  // ============================================
  REPORTS: {
    retentionDays: 365,
    description: 'Signalements résolus - 1 an',
    action: 'ARCHIVE' as const,
    onlyResolved: true,
  },

  // ============================================
  // HISTORIQUE DE PROPRIÉTÉ
  // ============================================
  OWNERSHIP_HISTORY: {
    retentionDays: null, // Conservation permanente
    description: 'Historique de propriété - conservé en permanence',
    action: 'KEEP' as const,
  },
} as const;

// ============================================
// TYPES
// ============================================
export type RetentionPolicyKey = keyof typeof RETENTION_POLICIES;
export type RetentionPolicy = typeof RETENTION_POLICIES[RetentionPolicyKey];

// ============================================
// UTILITAIRES
// ============================================

/**
 * Get retention policy by key
 */
export function getRetentionPolicy(key: RetentionPolicyKey): RetentionPolicy {
  return RETENTION_POLICIES[key];
}

/**
 * Get all retention policies
 */
export function getAllRetentionPolicies(): Record<RetentionPolicyKey, RetentionPolicy> {
  return RETENTION_POLICIES;
}

/**
 * Calculate expiration date for a policy
 */
export function calculateExpirationDate(policy: RetentionPolicy): Date | null {
  if (!policy.retentionDays) return null;
  return new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
}

/**
 * Get human-readable retention description
 */
export function getRetentionDescription(days: number | null): string {
  if (days === null) return 'Conservation permanente';
  if (days < 30) return `${days} jours`;
  if (days < 365) return `${Math.round(days / 30)} mois`;
  return `${Math.round(days / 365 * 10) / 10} ans`;
}
