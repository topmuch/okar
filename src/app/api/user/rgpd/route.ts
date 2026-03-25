import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomBytes } from 'crypto';

/**
 * GET /api/user/rgpd
 * 
 * Exercice du droit d'accès RGPD (Article 15)
 * Retourne toutes les données personnelles de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication requise' 
      }, { status: 401 });
    }

    // Collecter toutes les données personnelles
    const userData: Record<string, any> = {};

    // 1. Données utilisateur
    const user = await db.$queryRaw<any[]>`
      SELECT id, email, name, phone, role, emailVerified, phoneVerified, createdAt, updatedAt
      FROM User WHERE id = ${sessionUser.id}
    `;
    userData.account = user[0] || null;

    // 2. Véhicules possédés
    const vehicles = await db.$queryRaw<any[]>`
      SELECT id, reference, make, model, year, color, licensePlate, 
             ownerName, ownerPhone, status, createdAt
      FROM Vehicle WHERE ownerId = ${sessionUser.id}
    `;
    userData.vehicles = vehicles;

    // 3. Historique de propriété
    const ownershipHistory = await db.$queryRaw<any[]>`
      SELECT oh.*, v.reference, v.make, v.model
      FROM OwnershipHistory oh
      JOIN Vehicle v ON oh.vehicleId = v.id
      WHERE oh.previousOwnerId = ${sessionUser.id} OR oh.newOwnerId = ${sessionUser.id}
    `;
    userData.ownershipHistory = ownershipHistory;

    // 4. Interventions (validations)
    const interventions = await db.$queryRaw<any[]>`
      SELECT mr.id, mr.category, mr.description, mr.totalCost, mr.status, 
             mr.ownerValidation, mr.createdAt,
             v.reference as vehicleReference, v.make, v.model
      FROM MaintenanceRecord mr
      JOIN Vehicle v ON mr.vehicleId = v.id
      WHERE v.ownerId = ${sessionUser.id}
    `;
    userData.interventions = interventions;

    // 5. Notifications
    const notifications = await db.$queryRaw<any[]>`
      SELECT id, type, title, message, read, createdAt
      FROM UserNotification WHERE userId = ${sessionUser.id}
      ORDER BY createdAt DESC
      LIMIT 100
    `;
    userData.notifications = notifications;

    // 6. Logs de connexion
    const loginLogs = await db.$queryRaw<any[]>`
      SELECT id, success, failureReason, ipAddress, userAgent, createdAt
      FROM LoginLog WHERE userId = ${sessionUser.id}
      ORDER BY createdAt DESC
      LIMIT 50
    `;
    userData.loginHistory = loginLogs;

    // 7. Sessions actives
    const sessions = await db.$queryRaw<any[]>`
      SELECT id, userAgent, ipAddress, lastActivity, expiresAt
      FROM Session WHERE userId = ${sessionUser.id}
    `;
    userData.activeSessions = sessions;

    // Métadonnées
    const metadata = {
      exportDate: new Date().toISOString(),
      dataController: 'OKAR',
      contact: 'privacy@okar.sn',
      rights: [
        'Droit d\'accès (Article 15 RGPD)',
        'Droit de rectification (Article 16 RGPD)',
        'Droit à l\'effacement (Article 17 RGPD)',
        'Droit à la portabilité (Article 20 RGPD)',
        'Droit d\'opposition (Article 21 RGPD)',
      ],
      howToExerciseRights: 'Envoyez un email à privacy@okar.sn avec votre demande.',
    };

    // Audit log de l'accès
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, entityId, userId, userEmail, details, createdAt)
      VALUES (
        ${`log-${randomBytes(8).toString('hex')}`},
        'RGPD_DATA_ACCESS',
        'USER',
        ${sessionUser.id},
        ${sessionUser.id},
        ${sessionUser.email},
        ${JSON.stringify({ exportDate: metadata.exportDate })},
        ${new Date().toISOString()}
      )
    `;

    return NextResponse.json({
      success: true,
      metadata,
      data: userData,
    });

  } catch (error) {
    console.error('RGPD data access error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des données' 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/user/rgpd
 * 
 * Exercice du droit à l'effacement RGPD (Article 17 - Droit à l'oubli)
 * Supprime ou anonymise les données personnelles de l'utilisateur
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication requise' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const confirmation = searchParams.get('confirm');

    // Double confirmation requise
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json({
        success: false,
        error: 'Confirmation requise',
        message: 'Pour confirmer la suppression, ajoutez ?confirm=DELETE_MY_ACCOUNT à l\'URL',
        warning: 'Cette action est IRRÉVERSIBLE et supprimera toutes vos données personnelles.'
      }, { status: 400 });
    }

    const userId = sessionUser.id;
    const now = new Date();

    // ============================================
    // 1. Vérifier s'il y a des véhicules actifs
    // ============================================
    const activeVehicles = await db.$queryRaw<any[]>`
      SELECT id, reference, make, model FROM Vehicle 
      WHERE ownerId = ${userId} AND status = 'active'
    `;

    if (activeVehicles && activeVehicles.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de supprimer le compte',
        message: `Vous avez ${activeVehicles.length} véhicule(s) actif(s). Transférez ou supprimez d'abord vos véhicules.`,
        vehicles: activeVehicles.map((v: any) => ({
          reference: v.reference,
          name: `${v.make} ${v.model}`
        }))
      }, { status: 400 });
    }

    // ============================================
    // 2. Anonymiser les données véhicule
    // ============================================
    await db.$executeRaw`
      UPDATE Vehicle 
      SET ownerName = '[ANONYMIZED]',
          ownerPhone = '[ANONYMIZED]',
          ownerId = NULL,
          updatedAt = ${now.toISOString()}
      WHERE ownerId = ${userId}
    `;

    // ============================================
    // 3. Anonymiser l'historique de propriété
    // ============================================
    await db.$executeRaw`
      UPDATE OwnershipHistory 
      SET previousOwnerName = '[ANONYMIZED]'
      WHERE previousOwnerId = ${userId}
    `;

    // ============================================
    // 4. Supprimer les notifications
    // ============================================
    await db.$executeRaw`
      DELETE FROM UserNotification WHERE userId = ${userId}
    `;

    // ============================================
    // 5. Supprimer les sessions
    // ============================================
    await db.$executeRaw`
      DELETE FROM Session WHERE userId = ${userId}
    `;

    // ============================================
    // 6. Anonymiser les logs de connexion
    // ============================================
    await db.$executeRaw`
      UPDATE LoginLog 
      SET userId = NULL
      WHERE userId = ${userId}
    `;

    // ============================================
    // 7. Supprimer les codes de transfert
    // ============================================
    await db.$executeRaw`
      DELETE FROM TransferCode WHERE sellerId = ${userId}
    `;

    // ============================================
    // 8. Anonymiser l'utilisateur
    // ============================================
    await db.$executeRaw`
      UPDATE User 
      SET email = ${`deleted_${randomBytes(8).toString('hex')}@okar.deleted`},
          name = '[DELETED]',
          phone = NULL,
          password = NULL,
          emailVerified = 0,
          phoneVerified = 0,
          updatedAt = ${now.toISOString()}
      WHERE id = ${userId}
    `;

    // ============================================
    // 9. Audit log de la suppression
    // ============================================
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, entityId, details, createdAt)
      VALUES (
        ${`log-${randomBytes(8).toString('hex')}`},
        'RGPD_ACCOUNT_DELETION',
        'USER',
        ${userId},
        ${JSON.stringify({
          deletedAt: now.toISOString(),
          originalEmail: sessionUser.email,
          reason: 'User requested account deletion (RGPD Article 17)'
        })},
        ${now.toISOString()}
      )
    `;

    console.log(`[RGPD] Account deleted for user ${sessionUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Votre compte et vos données personnelles ont été supprimés.',
      deletedAt: now.toISOString(),
      note: 'Certaines données peuvent être conservées anonymisées pour des raisons légales (factures, historique de propriété).'
    });

  } catch (error) {
    console.error('RGPD account deletion error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la suppression du compte' 
    }, { status: 500 });
  }
}

/**
 * POST /api/user/rgpd
 * 
 * Demande de portabilité des données (Article 20 RGPD)
 * Exporte les données dans un format structuré (JSON)
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication requise' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { format = 'json' } = body;

    // Pour l'instant, on retourne les données en JSON
    // TODO: Implémenter l'export CSV si demandé

    const userData = await db.$queryRaw<any[]>`
      SELECT 
        u.id, u.email, u.name, u.phone, u.role, u.createdAt,
        (SELECT COUNT(*) FROM Vehicle WHERE ownerId = u.id) as vehicleCount,
        (SELECT COUNT(*) FROM MaintenanceRecord mr 
         JOIN Vehicle v ON mr.vehicleId = v.id 
         WHERE v.ownerId = u.id) as interventionCount
      FROM User u
      WHERE u.id = ${sessionUser.id}
    `;

    // Audit log
    await db.$executeRaw`
      INSERT INTO AuditLog (id, action, entityType, entityId, userId, details, createdAt)
      VALUES (
        ${`log-${randomBytes(8).toString('hex')}`},
        'RGPD_DATA_PORTABILITY',
        'USER',
        ${sessionUser.id},
        ${sessionUser.id},
        ${JSON.stringify({ format, exportedAt: new Date().toISOString() })},
        ${new Date().toISOString()}
      )
    `;

    return NextResponse.json({
      success: true,
      exportFormat: format,
      exportedAt: new Date().toISOString(),
      data: userData[0] || {},
      downloadUrl: null, // TODO: Generate downloadable file
      note: 'Vos données sont prêtes à être transférées vers un autre service.'
    });

  } catch (error) {
    console.error('RGPD portability error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de l\'export des données' 
    }, { status: 500 });
  }
}
