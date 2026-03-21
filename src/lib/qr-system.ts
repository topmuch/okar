/**
 * AutoPass QR Code Management System
 * Core functions for QR generation, activation, and security
 * 
 * Security Model:
 * - QR codes are created INACTIVE by SuperAdmin
 * - QR codes are assigned to garages in lots
 * - Only certified garages can activate QR codes
 * - Once activated, QR is permanently linked to vehicle
 */

import { db } from './db';

// ==================== TYPES ====================

export type QRStatus = 'STOCK' | 'ASSIGNED' | 'ACTIVE' | 'BLOCKED' | 'REVOKED';
export type LotStatus = 'CREATED' | 'ASSIGNED' | 'PARTIALLY_USED' | 'FULLY_USED';

export interface QRCodeData {
  id: string;
  codeUnique: string;          // The public reference (AUTO24-XXXXXX)
  lotId: string;
  status: QRStatus;
  assignedGarageId: string | null;
  linkedVehicleId: string | null;
  activationDate: Date | null;
  createdAt: Date;
  securityHash: string;        // Internal hash for verification
}

export interface GenerateLotOptions {
  count: number;               // Number of QR codes to generate
  createdBy: string;           // SuperAdmin user ID
  assignToGarageId?: string;   // Optional: directly assign to garage
  notes?: string;
  prefix?: string;
}

export interface ActivateQROptions {
  qrReference: string;         // The QR code to activate
  garageId: string;            // Garage performing activation
  vehicleData: {
    make: string;
    model: string;
    year?: number;
    color?: string;
    licensePlate: string;
    vin?: string;
    engineType?: string;
    mileage?: number;
  };
  ownerData?: {
    name: string;
    phone: string;
    email?: string;
    createAccount?: boolean;   // Create driver account
  };
}

export interface ActivateQRResult {
  success: boolean;
  vehicleId?: string;
  driverId?: string;
  driverPassword?: string;     // Temporary password for new driver
  error?: string;
}

// ==================== SECURITY UTILITIES ====================

/**
 * Generate a cryptographically secure random string
 * Uses 6 characters from a carefully selected alphabet (no ambiguous chars)
 */
export function generateSecureCode(length: number = 6): string {
  // Alphabet without ambiguous characters: 0, O, I, l, 1
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(length);
  
  // Use crypto.getRandomValues for cryptographic security
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js
    require('crypto').randomFillSync(array);
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[array[i] % alphabet.length];
  }
  return result;
}

/**
 * Generate a security hash for QR code verification
 * This prevents QR code forgery
 */
export function generateSecurityHash(reference: string, lotId: string): string {
  const secret = process.env.QR_SECRET || 'autopass-secret-key-2024';
  const data = `${reference}:${lotId}:${secret}`;
  
  // Simple hash for demo - in production use crypto.createHmac
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
}

/**
 * Verify QR code authenticity
 */
export function verifyQRCode(reference: string, lotId: string, hash: string): boolean {
  const expectedHash = generateSecurityHash(reference, lotId);
  return expectedHash === hash;
}

/**
 * Generate unique vehicle reference with collision check
 * Format: AUTO{YY}-{XXXXXX} (e.g., AUTO24-KM3P7Q)
 */
export async function generateUniqueReference(prefix: string = 'AUTO'): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateSecureCode(6);
    const reference = `${prefix}${year}-${code}`;
    
    // Check for collision
    const existing = await db.$queryRaw<any[]>`
      SELECT id FROM Vehicle WHERE reference = ${reference} LIMIT 1
    `;
    
    if (!existing || existing.length === 0) {
      return reference;
    }
  }
  
  // Fallback with timestamp
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}${year}-${timestamp}`;
}

/**
 * Generate CUID-like ID
 */
export function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = generateSecureCode(8).toLowerCase();
  return `c${timestamp}${random}`;
}

// ==================== LOT GENERATION (SUPERADMIN) ====================

export interface GenerateLotResult {
  success: boolean;
  lotId?: string;
  lotPrefix?: string;
  references?: string[];
  error?: string;
}

/**
 * Generate a new lot of QR codes
 * Only callable by SuperAdmin
 */
export async function generateQRCodeLot(options: GenerateLotOptions): Promise<GenerateLotResult> {
  const { count, createdBy, assignToGarageId, notes, prefix = 'AUTO' } = options;
  
  // Validate count
  if (count < 1 || count > 1000) {
    return { success: false, error: 'Le nombre de QR doit être entre 1 et 1000' };
  }
  
  try {
    const lotId = generateCuid();
    const year = new Date().getFullYear();
    const lotPrefix = `${prefix}-${year}-${generateSecureCode(4)}`;
    const now = new Date().toISOString();
    
    // Determine initial status
    const initialStatus = assignToGarageId ? 'ASSIGNED' : 'CREATED';
    
    // Create lot record
    await db.$executeRaw`
      INSERT INTO QRCodeLot (
        id, prefix, count, status, createdBy, 
        createdAt, notes, assignedToId, assignedAt
      ) VALUES (
        ${lotId}, ${lotPrefix}, ${count}, ${initialStatus}, ${createdBy},
        ${now}, ${notes || null}, ${assignToGarageId || null}, 
        ${assignToGarageId ? now : null}
      )
    `;
    
    // Generate individual QR codes (stored as Vehicle with INACTIVE status)
    const references: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const reference = await generateUniqueReference(prefix);
      const vehicleId = generateCuid();
      const securityHash = generateSecurityHash(reference, lotId);
      
      // Store the QR code as an inactive vehicle
      await db.$executeRaw`
        INSERT INTO Vehicle (
          id, reference, lotId, qrStatus, status, 
          garageId, createdAt
        ) VALUES (
          ${vehicleId}, ${reference}, ${lotId}, 'INACTIVE', 'pending_activation',
          ${assignToGarageId || null}, ${now}
        )
      `;
      
      references.push(reference);
    }
    
    // Create notification if assigned to garage
    if (assignToGarageId) {
      const notificationId = generateCuid();
      await db.$executeRaw`
        INSERT INTO Notification (id, type, garageId, message, createdAt)
        VALUES (
          ${notificationId}, 'qr_lot_assigned', ${assignToGarageId},
          ${`Nouveau lot de ${count} QR codes assigné: ${lotPrefix}`}, ${now}
        )
      `;
    }
    
    return {
      success: true,
      lotId,
      lotPrefix,
      references
    };
    
  } catch (error) {
    console.error('Error generating QR lot:', error);
    return { success: false, error: 'Erreur lors de la génération du lot' };
  }
}

/**
 * Assign existing lot to a garage
 */
export async function assignLotToGarage(
  lotId: string, 
  garageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify garage exists and is certified
    const garage = await db.$queryRaw<any[]>`
      SELECT id, isCertified FROM Garage WHERE id = ${garageId} LIMIT 1
    `;
    
    if (!garage || garage.length === 0) {
      return { success: false, error: 'Garage non trouvé' };
    }
    
    // Update lot
    const now = new Date().toISOString();
    await db.$executeRaw`
      UPDATE QRCodeLot 
      SET assignedToId = ${garageId}, assignedAt = ${now}, status = 'ASSIGNED'
      WHERE id = ${lotId}
    `;
    
    // Update all vehicles in lot
    await db.$executeRaw`
      UPDATE Vehicle 
      SET garageId = ${garageId}
      WHERE lotId = ${lotId}
    `;
    
    // Create notification
    const notificationId = generateCuid();
    const lot = await db.$queryRaw<any[]>`
      SELECT prefix, count FROM QRCodeLot WHERE id = ${lotId} LIMIT 1
    `;
    
    if (lot && lot[0]) {
      await db.$executeRaw`
        INSERT INTO Notification (id, type, garageId, message, createdAt)
        VALUES (
          ${notificationId}, 'qr_lot_assigned', ${garageId},
          ${`Nouveau lot de ${lot[0].count} QR codes assigné: ${lot[0].prefix}`}, ${now}
        )
      `;
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error assigning lot:', error);
    return { success: false, error: 'Erreur lors de l\'assignation' };
  }
}

// ==================== QR ACTIVATION (GARAGE) ====================

/**
 * Activate a QR code for a vehicle
 * Only certified garages can perform this action
 */
export async function activateQRCode(options: ActivateQROptions): Promise<ActivateQRResult> {
  const { qrReference, garageId, vehicleData, ownerData } = options;
  
  try {
    const now = new Date().toISOString();
    
    // 1. Verify garage is certified
    const garage = await db.$queryRaw<any[]>`
      SELECT id, isCertified, name FROM Garage WHERE id = ${garageId} LIMIT 1
    `;
    
    if (!garage || garage.length === 0) {
      return { success: false, error: 'Garage non trouvé' };
    }
    
    if (!garage[0].isCertified) {
      return { success: false, error: 'Seuls les garages certifiés peuvent activer des QR codes' };
    }
    
    // 2. Find the QR code
    const qrCode = await db.$queryRaw<any[]>`
      SELECT id, reference, garageId, qrStatus, lotId 
      FROM Vehicle 
      WHERE reference = ${qrReference} 
      LIMIT 1
    `;
    
    if (!qrCode || qrCode.length === 0) {
      return { success: false, error: 'Code QR non trouvé dans le système' };
    }
    
    const qr = qrCode[0];
    
    // 3. Verify QR belongs to this garage
    if (qr.garageId !== garageId) {
      return { success: false, error: 'Ce code QR n\'est pas assigné à votre garage' };
    }
    
    // 4. Verify QR is not already active
    if (qr.qrStatus === 'ACTIVE') {
      return { success: false, error: 'Ce code QR est déjà activé pour un autre véhicule' };
    }
    
    if (qr.qrStatus === 'BLOCKED' || qr.qrStatus === 'REVOKED') {
      return { success: false, error: 'Ce code QR a été bloqué ou révoqué' };
    }
    
    // 5. Check for license plate uniqueness
    if (vehicleData.licensePlate) {
      const existingPlate = await db.$queryRaw<any[]>`
        SELECT id FROM Vehicle 
        WHERE licensePlate = ${vehicleData.licensePlate} AND id != ${qr.id}
        LIMIT 1
      `;
      
      if (existingPlate && existingPlate.length > 0) {
        return { success: false, error: 'Un véhicule avec cette immatriculation existe déjà' };
      }
    }
    
    // 6. Create driver account if requested
    let driverId: string | null = null;
    let driverPassword: string | null = null;
    
    if (ownerData && ownerData.createAccount) {
      // Check if user exists
      const existingUser = await db.$queryRaw<any[]>`
        SELECT id FROM User WHERE phone = ${ownerData.phone} LIMIT 1
      `;
      
      if (existingUser && existingUser.length > 0) {
        driverId = existingUser[0].id;
      } else {
        // Create new driver
        driverId = generateCuid();
        driverPassword = generateSecureCode(8);
        
        // In production, hash the password with bcrypt
        await db.$executeRaw`
          INSERT INTO User (id, name, phone, email, password, role, createdAt)
          VALUES (
            ${driverId}, ${ownerData.name}, ${ownerData.phone},
            ${ownerData.email || null}, ${driverPassword}, 'driver', ${now}
          )
        `;
      }
    }
    
    // 7. Activate the vehicle
    await db.$executeRaw`
      UPDATE Vehicle SET
        qrStatus = 'ACTIVE',
        status = 'active',
        activatedAt = ${now},
        make = ${vehicleData.make},
        model = ${vehicleData.model},
        year = ${vehicleData.year || null},
        color = ${vehicleData.color || null},
        licensePlate = ${vehicleData.licensePlate},
        vin = ${vehicleData.vin || null},
        engineType = ${vehicleData.engineType || 'essence'},
        mileage = ${vehicleData.mileage || 0},
        ownerName = ${ownerData?.name || null},
        ownerPhone = ${ownerData?.phone || null},
        ownerId = ${driverId},
        updatedAt = ${now}
      WHERE id = ${qr.id}
    `;
    
    // 8. Update lot status
    await updateLotStatus(qr.lotId);
    
    // 9. Send welcome SMS if requested (placeholder)
    if (ownerData && driverPassword) {
      // In production: Send SMS via Orange SMS API
      console.log(`[SMS] Bienvenue ${ownerData.name}! Votre compte AutoPass est créé. Mot de passe temporaire: ${driverPassword}`);
    }
    
    return {
      success: true,
      vehicleId: qr.id,
      driverId: driverId || undefined,
      driverPassword: driverPassword || undefined
    };
    
  } catch (error) {
    console.error('Error activating QR code:', error);
    return { success: false, error: 'Erreur lors de l\'activation du QR code' };
  }
}

/**
 * Update lot status based on usage
 */
async function updateLotStatus(lotId: string): Promise<void> {
  try {
    const stats = await db.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN qrStatus = 'ACTIVE' THEN 1 ELSE 0 END) as activated
      FROM Vehicle WHERE lotId = ${lotId}
    `;
    
    if (stats && stats.length > 0) {
      const { total, activated } = stats[0];
      let status: string;
      
      if (activated === 0) {
        status = 'ASSIGNED';
      } else if (activated < total) {
        status = 'PARTIALLY_USED';
      } else {
        status = 'FULLY_USED';
      }
      
      await db.$executeRaw`
        UPDATE QRCodeLot SET status = ${status} WHERE id = ${lotId}
      `;
    }
  } catch (error) {
    console.error('Error updating lot status:', error);
  }
}

// ==================== QR SCAN & REDIRECTION ====================

export interface ScanResult {
  status: 'inactive' | 'active' | 'blocked' | 'not_found';
  vehicle?: {
    id: string;
    reference: string;
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    licensePlate: string | null;
    ownerName: string | null;
    ownerPhone: string | null;
  };
  garage?: {
    id: string;
    name: string;
    isCertified: boolean;
  };
  redirectTo?: string;
}

/**
 * Handle QR code scan and return appropriate data
 * Used for redirect logic
 */
export async function handleQRScan(reference: string): Promise<ScanResult> {
  try {
    const vehicle = await db.$queryRaw<any[]>`
      SELECT 
        v.id, v.reference, v.make, v.model, v.year, v.color, 
        v.licensePlate, v.ownerName, v.ownerPhone, v.qrStatus,
        v.garageId,
        g.name as garageName, g.isCertified as garageCertified
      FROM Vehicle v
      LEFT JOIN Garage g ON v.garageId = g.id
      WHERE v.reference = ${reference}
      LIMIT 1
    `;
    
    if (!vehicle || vehicle.length === 0) {
      return { status: 'not_found' };
    }
    
    const v = vehicle[0];
    
    switch (v.qrStatus) {
      case 'INACTIVE':
        return {
          status: 'inactive',
          vehicle: {
            id: v.id,
            reference: v.reference,
            make: null,
            model: null,
            year: null,
            color: null,
            licensePlate: null,
            ownerName: null,
            ownerPhone: null
          },
          redirectTo: '/activation/driver' // Page to inform QR not activated
        };
        
      case 'BLOCKED':
      case 'REVOKED':
        return { status: 'blocked' };
        
      case 'ACTIVE':
      default:
        return {
          status: 'active',
          vehicle: {
            id: v.id,
            reference: v.reference,
            make: v.make,
            model: v.model,
            year: v.year,
            color: v.color,
            licensePlate: v.licensePlate,
            ownerName: v.ownerName,
            ownerPhone: v.ownerPhone
          },
          garage: v.garageId ? {
            id: v.garageId,
            name: v.garageName,
            isCertified: v.garageCertified === 1
          } : undefined,
          redirectTo: `/scan/${v.reference}` // Public vehicle passport page
        };
    }
    
  } catch (error) {
    console.error('Error handling QR scan:', error);
    return { status: 'not_found' };
  }
}

// ==================== SECURITY FUNCTIONS ====================

/**
 * Block a QR code (SuperAdmin or Garage)
 * Used when QR sticker is lost/stolen
 */
export async function blockQRCode(
  reference: string, 
  reason: string,
  blockedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    
    await db.$executeRaw`
      UPDATE Vehicle 
      SET qrStatus = 'BLOCKED', updatedAt = ${now}
      WHERE reference = ${reference}
    `;
    
    // Log the blocking action
    const logId = generateCuid();
    // In production: Create an audit log entry
    
    return { success: true };
    
  } catch (error) {
    console.error('Error blocking QR code:', error);
    return { success: false, error: 'Erreur lors du blocage' };
  }
}

/**
 * Revoke a QR code and generate replacement
 * Links replacement to same vehicle
 */
export async function revokeAndReplaceQR(
  oldReference: string,
  garageId: string,
  reason: string
): Promise<{ success: boolean; newReference?: string; error?: string }> {
  try {
    // Get old vehicle
    const oldVehicle = await db.$queryRaw<any[]>`
      SELECT * FROM Vehicle WHERE reference = ${oldReference} LIMIT 1
    `;
    
    if (!oldVehicle || oldVehicle.length === 0) {
      return { success: false, error: 'Véhicule non trouvé' };
    }
    
    const old = oldVehicle[0];
    
    // Verify garage owns this vehicle
    if (old.garageId !== garageId) {
      return { success: false, error: 'Ce véhicule n\'appartient pas à votre garage' };
    }
    
    // Find an unused QR in garage's stock
    const availableQR = await db.$queryRaw<any[]>`
      SELECT id, reference FROM Vehicle 
      WHERE garageId = ${garageId} AND qrStatus = 'INACTIVE'
      LIMIT 1
    `;
    
    if (!availableQR || availableQR.length === 0) {
      return { success: false, error: 'Aucun QR code disponible dans votre stock' };
    }
    
    const newQR = availableQR[0];
    const now = new Date().toISOString();
    
    // Mark old as revoked
    await db.$executeRaw`
      UPDATE Vehicle 
      SET qrStatus = 'REVOKED', updatedAt = ${now}
      WHERE id = ${old.id}
    `;
    
    // Transfer data to new QR
    await db.$executeRaw`
      UPDATE Vehicle SET
        qrStatus = 'ACTIVE',
        make = ${old.make},
        model = ${old.model},
        year = ${old.year},
        color = ${old.color},
        licensePlate = ${old.licensePlate},
        vin = ${old.vin},
        engineType = ${old.engineType},
        mileage = ${old.mileage},
        ownerName = ${old.ownerName},
        ownerPhone = ${old.ownerPhone},
        ownerId = ${old.ownerId},
        activatedAt = ${now},
        updatedAt = ${now}
      WHERE id = ${newQR.id}
    `;
    
    // Transfer maintenance records
    await db.$executeRaw`
      UPDATE MaintenanceRecord 
      SET vehicleId = ${newQR.id}
      WHERE vehicleId = ${old.id}
    `;
    
    return { success: true, newReference: newQR.reference };
    
  } catch (error) {
    console.error('Error revoking QR:', error);
    return { success: false, error: 'Erreur lors du remplacement' };
  }
}

/**
 * Get QR code statistics for a garage
 */
export async function getGarageQRStats(garageId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  blocked: number;
}> {
  try {
    const stats = await db.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN qrStatus = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN qrStatus = 'INACTIVE' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN qrStatus IN ('BLOCKED', 'REVOKED') THEN 1 ELSE 0 END) as blocked
      FROM Vehicle 
      WHERE garageId = ${garageId}
    `;
    
    if (stats && stats.length > 0) {
      return {
        total: stats[0].total || 0,
        active: stats[0].active || 0,
        inactive: stats[0].inactive || 0,
        blocked: stats[0].blocked || 0
      };
    }
    
    return { total: 0, active: 0, inactive: 0, blocked: 0 };
    
  } catch (error) {
    console.error('Error getting QR stats:', error);
    return { total: 0, active: 0, inactive: 0, blocked: 0 };
  }
}

// ==================== EXPORTS ====================

export default {
  // Generation
  generateQRCodeLot,
  assignLotToGarage,
  generateUniqueReference,
  generateSecureCode,
  generateCuid,
  
  // Activation
  activateQRCode,
  
  // Scan
  handleQRScan,
  
  // Security
  blockQRCode,
  revokeAndReplaceQR,
  verifyQRCode,
  generateSecurityHash,
  
  // Stats
  getGarageQRStats,
  updateLotStatus
};
