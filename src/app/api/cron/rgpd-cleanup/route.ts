import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// ============================================
// 🔒 SÉCURITÉ: Vérification du secret cron
// ============================================
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // En développement, permettre l'exécution sans secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

// ============================================
// FONCTIONS DE NETTOYAGE
// ============================================

interface CleanupResult {
  category: string;
  deleted: number;
  archived: number;
  anonymized: number;
  errors: string[];
}

/**
 * Nettoyer les documents d'identité (CNI) après 30 jours
 */
async function cleanupIdentityDocuments(): Promise<CleanupResult> {
  const result: CleanupResult = {
    category: 'IDENTITY_DOCUMENTS',
    deleted: 0,
    archived: 0,
    anonymized: 0,
    errors: [],
  };

  try {
    // Supprimer les URLs de documents d'identité des garages validés depuis +30 jours
    const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const updated = await db.$executeRaw`
      UPDATE Garage 
      SET idDocumentUrl = NULL, 
          agreementDocumentUrl = NULL,
          updatedAt = ${new Date().toISOString()}
      WHERE validationStatus = 'APPROVED'
        AND validatedAt < ${threshold.toISOString()}
        AND (idDocumentUrl IS NOT NULL OR agreementDocumentUrl IS NOT NULL)
    `;

    result.deleted = updated;

    // Audit log
    if (updated > 0) {
      await db.$executeRaw`
        INSERT INTO AuditLog (id, action, entityType, details, createdAt)
        VALUES (
          ${`log-${randomBytes(8).toString('hex')}`},
          'RGPD_CLEANUP',
          'IDENTITY_DOCUMENTS',
          ${JSON.stringify({ deletedCount: updated, retentionDays: 30 })},
          ${new Date().toISOString()}
        )
      `;
    }

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Nettoyer les sessions expirées (7 jours d'inactivité)
 */
async function cleanupExpiredSessions(): Promise<CleanupResult> {
  const result: CleanupResult = {
    category: 'SESSIONS',
    deleted: 0,
    archived: 0,
    anonymized: 0,
    errors: [],
  };

  try {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const deleted = await db.$executeRaw`
      DELETE FROM Session 
      WHERE lastActivity < ${threshold.toISOString()}
         OR expiresAt < ${new Date().toISOString()}
    `;

    result.deleted = deleted;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Nettoyer les notifications lues (+ 90 jours)
 */
async function cleanupOldNotifications(): Promise<CleanupResult> {
  const result: CleanupResult = {
    category: 'NOTIFICATIONS',
    deleted: 0,
    archived: 0,
    anonymized: 0,
    errors: [],
  };

  try {
    const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const deleted = await db.$executeRaw`
      DELETE FROM Notification 
      WHERE read = 1 
        AND readAt < ${threshold.toISOString()}
    `;

    result.deleted = deleted;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Nettoyer les logs de connexion anciens (+ 1 an)
 */
async function cleanupLoginLogs(): Promise<CleanupResult> {
  const result: CleanupResult = {
    category: 'LOGIN_LOGS',
    deleted: 0,
    archived: 0,
    anonymized: 0,
    errors: [],
  };

  try {
    const threshold = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    
    const deleted = await db.$executeRaw`
      DELETE FROM LoginLog 
      WHERE createdAt < ${threshold.toISOString()}
    `;

    result.deleted = deleted;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Nettoyer les codes de transfert expirés
 */
async function cleanupExpiredTransferCodes(): Promise<CleanupResult> {
  const result: CleanupResult = {
    category: 'TRANSFER_CODES',
    deleted: 0,
    archived: 0,
    anonymized: 0,
    errors: [],
  };

  try {
    const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Marquer comme expirés les codes qui ont dépassé leur date d'expiration
    await db.$executeRaw`
      UPDATE TransferCode 
      SET status = 'EXPIRED'
      WHERE status = 'PENDING'
        AND expiresAt < ${new Date().toISOString()}
    `;

    // Supprimer les codes expirés depuis +30 jours
    const deleted = await db.$executeRaw`
      DELETE FROM TransferCode 
      WHERE status = 'EXPIRED'
        AND expiresAt < ${threshold.toISOString()}
    `;

    result.deleted = deleted;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Anonymiser les véhicules supprimés depuis +2 ans
 */
async function anonymizeOldVehicles(): Promise<CleanupResult> {
  const result: CleanupResult = {
    category: 'VEHICLES',
    deleted: 0,
    archived: 0,
    anonymized: 0,
    errors: [],
  };

  try {
    const threshold = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
    
    // Anonymiser les propriétaires de véhicules inactifs depuis +2 ans
    const anonymized = await db.$executeRaw`
      UPDATE Vehicle 
      SET ownerName = '[ANONYMIZED]',
          ownerPhone = '[ANONYMIZED]',
          ownerEmail = NULL,
          ownerId = NULL,
          updatedAt = ${new Date().toISOString()}
      WHERE status = 'deleted'
        AND updatedAt < ${threshold.toISOString()}
        AND ownerName != '[ANONYMIZED]'
    `;

    result.anonymized = anonymized;

    // Audit log
    if (anonymized > 0) {
      await db.$executeRaw`
        INSERT INTO AuditLog (id, action, entityType, details, createdAt)
        VALUES (
          ${`log-${randomBytes(8).toString('hex')}`},
          'RGPD_ANONYMIZATION',
          'VEHICLES',
          ${JSON.stringify({ anonymizedCount: anonymized, retentionYears: 2 })},
          ${new Date().toISOString()}
        )
      `;
    }

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Purger les anciens logs d'audit (+ 3 ans)
 */
async function cleanupAuditLogs(): Promise<CleanupResult> {
  const result: CleanupResult = {
    category: 'AUDIT_LOGS',
    deleted: 0,
    archived: 0,
    anonymized: 0,
    errors: [],
  };

  try {
    const threshold = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);
    
    const deleted = await db.$executeRaw`
      DELETE FROM AuditLog 
      WHERE createdAt < ${threshold.toISOString()}
        AND action NOT IN ('TRANSFER_COMPLETED', 'VEHICLE_CREATED')
    `;

    result.deleted = deleted;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

// ============================================
// API ENDPOINT
// ============================================

/**
 * POST /api/cron/rgpd-cleanup
 * 
 * Cron job appelé quotidiennement pour nettoyer les données
 * conformément à la politique de rétention RGPD.
 * 
 * Configuration cron:
 * - Schedule: 0 3 * * * (tous les jours à 3h du matin)
 * - Headers: Authorization: Bearer ${CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Vérification du secret cron
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { status: 401 });
  }

  console.log('[RGPD] Starting daily cleanup job...');
  
  const results: CleanupResult[] = [];

  // Exécuter tous les nettoyages
  results.push(await cleanupIdentityDocuments());
  results.push(await cleanupExpiredSessions());
  results.push(await cleanupOldNotifications());
  results.push(await cleanupLoginLogs());
  results.push(await cleanupExpiredTransferCodes());
  results.push(await anonymizeOldVehicles());
  results.push(await cleanupAuditLogs());

  // Calculer les totaux
  const summary = {
    totalDeleted: results.reduce((sum, r) => sum + r.deleted, 0),
    totalArchived: results.reduce((sum, r) => sum + r.archived, 0),
    totalAnonymized: results.reduce((sum, r) => sum + r.anonymized, 0),
    errors: results.flatMap(r => r.errors),
    duration: `${Date.now() - startTime}ms`,
  };

  // Log global
  console.log(`[RGPD] Cleanup completed in ${summary.duration}`, {
    deleted: summary.totalDeleted,
    archived: summary.totalArchived,
    anonymized: summary.totalAnonymized,
    errors: summary.errors.length,
  });

  // Créer un log d'audit global
  try {
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, details, createdAt)
      VALUES (
        ${`log-${randomBytes(8).toString('hex')}`},
        'RGPD_DAILY_CLEANUP',
        'SYSTEM',
        ${JSON.stringify({
          ...summary,
          categories: results.map(r => ({
            category: r.category,
            deleted: r.deleted,
            archived: r.archived,
            anonymized: r.anonymized,
          }))
        })},
        ${new Date().toISOString()}
      )
    `;
  } catch (e) {
    console.error('[RGPD] Failed to create audit log:', e);
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    summary,
    details: results,
  });
}

/**
 * GET /api/cron/rgpd-cleanup
 * 
 * Obtenir un aperçu des données qui seront nettoyées
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { status: 401 });
  }

  try {
    const stats = {
      sessionsExpired: await db.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM Session 
        WHERE lastActivity < ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
           OR expiresAt < ${new Date().toISOString()}
      `,
      
      notificationsOld: await db.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM Notification 
        WHERE read = 1 AND readAt < ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()}
      `,
      
      transferCodesExpired: await db.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM TransferCode 
        WHERE status = 'PENDING' AND expiresAt < ${new Date().toISOString()}
      `,
      
      loginLogsOld: await db.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM LoginLog 
        WHERE createdAt < ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()}
      `,
      
      identityDocumentsToClean: await db.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM Garage 
        WHERE validationStatus = 'APPROVED'
          AND validatedAt < ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}
          AND (idDocumentUrl IS NOT NULL OR agreementDocumentUrl IS NOT NULL)
      `,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pendingCleanup: {
        sessions: stats.sessionsExpired[0]?.count || 0,
        notifications: stats.notificationsOld[0]?.count || 0,
        transferCodes: stats.transferCodesExpired[0]?.count || 0,
        loginLogs: stats.loginLogsOld[0]?.count || 0,
        identityDocuments: stats.identityDocumentsToClean[0]?.count || 0,
      },
      policies: {
        sessions: '7 jours d\'inactivité',
        notifications: '90 jours après lecture',
        transferCodes: '48h expiration + 30 jours grâce',
        loginLogs: '1 an',
        identityDocuments: '30 jours après validation',
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques' 
    }, { status: 500 });
  }
}
