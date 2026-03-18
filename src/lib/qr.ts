import { db } from './db';

// Generate random alphanumeric string
export function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate unique reference for vehicle (AutoPass format)
export async function generateVehicleReference(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = 'AUTO';
  
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const reference = `${prefix}${year}-${generateRandomCode(6)}`;
    
    try {
      // Simple check - if query returns any row, reference exists
      const result = await db.$queryRaw<any[]>`
        SELECT id FROM Vehicle WHERE reference = ${reference} LIMIT 1
      `;
      
      // If no result, reference is unique
      if (!result || result.length === 0) {
        return reference;
      }
      
      // Reference exists, try again
      attempts++;
    } catch (error) {
      // If error, assume reference is unique and return it
      console.error('Error checking reference, assuming unique:', error);
      return reference;
    }
  }
  
  // If we exhausted attempts, return a reference with timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}${year}-${timestamp.slice(-6)}`;
}

// Backward compatibility alias
export const generateReference = generateVehicleReference;

// Generate unique set ID (for backwards compatibility)
export function generateSetId(): string {
  const year = new Date().getFullYear();
  const random = generateRandomCode(4);
  return `AUTO-${year}-${random}`;
}

// Alias for backwards compatibility
export const generateSetIdAlias = generateSetId;

// Generate multiple QR codes for a lot
export interface GenerateQRLotOptions {
  prefix?: string;
  count: number;
  createdBy?: string;
  notes?: string;
}

// Generate QR lot with unique references
export async function generateQRLot(options: GenerateQRLotOptions): Promise<{ lotId: string; references: string[] }> {
  const { prefix = 'AUTO', count, createdBy, notes } = options;
  
  // Create lot ID
  const lotId = generateCuid();
  const year = new Date().getFullYear();
  const lotPrefix = `${prefix}-${year}-${generateRandomCode(4)}`;
  
  const references: string[] = [];
  const now = new Date().toISOString();
  
  // Create the lot record
  await db.$executeRaw`
    INSERT INTO QRCodeLot (id, prefix, count, status, createdBy, createdAt, notes)
    VALUES (${lotId}, ${lotPrefix}, ${count}, 'CREATED', ${createdBy || null}, ${now}, ${notes || null})
  `;
  
  // Generate individual QR codes (stored in Vehicle table with INACTIVE status)
  for (let i = 0; i < count; i++) {
    const reference = await generateVehicleReference();
    const vehicleId = generateCuid();
    
    await db.$executeRaw`
      INSERT INTO Vehicle (id, reference, lotId, qrStatus, status, createdAt)
      VALUES (${vehicleId}, ${reference}, ${lotId}, 'INACTIVE', 'pending_activation', ${now})
    `;
    
    references.push(reference);
  }
  
  return { lotId, references };
}

// Assign lot to garage
export async function assignLotToGarage(lotId: string, garageId: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Update lot
    await db.$executeRaw`
      UPDATE QRCodeLot 
      SET assignedToId = ${garageId}, assignedAt = ${now}, status = 'ASSIGNED'
      WHERE id = ${lotId}
    `;
    
    // Update all vehicles in the lot
    await db.$executeRaw`
      UPDATE Vehicle 
      SET garageId = ${garageId}
      WHERE lotId = ${lotId}
    `;
    
    return true;
  } catch (error) {
    console.error('Error assigning lot to garage:', error);
    return false;
  }
}

// Activate a QR code for a vehicle
export interface ActivateQROptions {
  reference: string;
  garageId: string;
  vehicleData: {
    vin?: string;
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    licensePlate?: string;
    engineType?: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerId?: string;
  };
}

export async function activateQRCode(options: ActivateQROptions): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
  const { reference, garageId, vehicleData } = options;
  
  try {
    // Check if QR exists and belongs to this garage
    const vehicle = await db.$queryRaw<any[]>`
      SELECT id, garageId, qrStatus, lotId FROM Vehicle WHERE reference = ${reference} LIMIT 1
    `;
    
    if (!vehicle || vehicle.length === 0) {
      return { success: false, error: 'QR code non trouvé' };
    }
    
    const v = vehicle[0];
    
    if (v.garageId !== garageId) {
      return { success: false, error: 'Ce QR code n\'est pas assigné à votre garage' };
    }
    
    if (v.qrStatus === 'ACTIVE') {
      return { success: false, error: 'Ce QR code est déjà activé' };
    }
    
    // Activate the vehicle
    const now = new Date().toISOString();
    const vehicleId = v.id;
    
    await db.$executeRaw`
      UPDATE Vehicle 
      SET 
        qrStatus = 'ACTIVE',
        status = 'active',
        activatedAt = ${now},
        vin = ${vehicleData.vin || null},
        make = ${vehicleData.make || null},
        model = ${vehicleData.model || null},
        year = ${vehicleData.year || null},
        color = ${vehicleData.color || null},
        licensePlate = ${vehicleData.licensePlate || null},
        engineType = ${vehicleData.engineType || 'essence'},
        ownerName = ${vehicleData.ownerName || null},
        ownerPhone = ${vehicleData.ownerPhone || null},
        ownerId = ${vehicleData.ownerId || null},
        updatedAt = ${now}
      WHERE id = ${vehicleId}
    `;
    
    // Update lot status if needed
    if (v.lotId) {
      await updateLotStatus(v.lotId);
    }
    
    return { success: true, vehicleId };
  } catch (error) {
    console.error('Error activating QR code:', error);
    return { success: false, error: 'Erreur lors de l\'activation' };
  }
}

// Update lot status based on usage
async function updateLotStatus(lotId: string): Promise<void> {
  try {
    // Count activated vehicles in lot
    const result = await db.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN qrStatus = 'ACTIVE' THEN 1 ELSE 0 END) as activated
      FROM Vehicle WHERE lotId = ${lotId}
    `;
    
    if (result && result.length > 0) {
      const { total, activated } = result[0];
      let status = 'ASSIGNED';
      
      if (activated > 0 && activated < total) {
        status = 'PARTIALLY_USED';
      } else if (activated === total) {
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

// Calculate expiration date based on subscription
export function calculateExpirationDate(plan: 'basic' | 'premium' | 'enterprise' = 'basic'): Date {
  const now = new Date();
  
  switch (plan) {
    case 'basic':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 year
    case 'premium':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 year
    case 'enterprise':
      return new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000); // +2 years
    default:
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  }
}

// Validate reference format
export function isValidReferenceFormat(reference: string): boolean {
  const autoPattern = /^AUTO\d{2}-[A-Z0-9]{6}$/;
  // Legacy patterns for backwards compatibility
  const hajjPattern = /^HAJJ\d{2}-[A-Z0-9]{6}$/;
  const volPattern = /^VOL\d{2}-[A-Z0-9]{6}$/;
  return autoPattern.test(reference) || hajjPattern.test(reference) || volPattern.test(reference);
}

// Get QR/vehicle status info
export function getVehicleStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    pending_activation: {
      label: 'En attente d\'activation',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    active: {
      label: 'Actif',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    blocked: {
      label: 'Bloqué',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  };
  
  return statusMap[status] || {
    label: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  };
}

// Get QR status info
export function getQRStatusInfo(qrStatus: string) {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    INACTIVE: {
      label: 'QR Inactif',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    ACTIVE: {
      label: 'QR Actif',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    BLOCKED: {
      label: 'QR Bloqué',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  };
  
  return statusMap[qrStatus] || {
    label: qrStatus,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  };
}

// Get maintenance record status info
export function getMaintenanceStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    DRAFT: {
      label: 'Brouillon',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    SUBMITTED: {
      label: 'Soumis',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    VALIDATED: {
      label: 'Validé',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    REJECTED: {
      label: 'Rejeté',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  };
  
  return statusMap[status] || {
    label: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  };
}

// Get validation status info
export function getValidationStatusInfo(validationStatus: string) {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: {
      label: 'En attente',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    VALIDATED: {
      label: 'Validé',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    REJECTED: {
      label: 'Rejeté',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  };
  
  return statusMap[validationStatus] || {
    label: validationStatus,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  };
}

// Generate CUID-like ID
export function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}
