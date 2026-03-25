/**
 * ================================================
 * OKAR Security Utilities
 * ================================================
 * 
 * Sécurité et fiabilité:
 * - Rate limiting
 * - Audit logging
 * - Signature HMAC
 * - Input validation
 */

import prisma from './prisma';
import crypto from 'crypto';

// Rate limiting configuration
const RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  'payment:initiate': { windowMs: 60 * 1000, maxRequests: 5 },        // 5 req/min
  'payment:webhook': { windowMs: 60 * 1000, maxRequests: 100 },       // 100 req/min
  'pdf:generate': { windowMs: 60 * 60 * 1000, maxRequests: 10 },      // 10 req/hour
  'api:general': { windowMs: 60 * 1000, maxRequests: 100 },           // 100 req/min
  'auth:login': { windowMs: 15 * 60 * 1000, maxRequests: 5 },         // 5 req/15min
  'auth:register': { windowMs: 60 * 60 * 1000, maxRequests: 3 },      // 3 req/hour
};

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function checkRateLimit(
  identifier: string,
  action: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[action] || RATE_LIMITS['api:general'];
  const key = `${action}:${identifier}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + config.windowMs };
  }

  record.count++;
  rateLimitStore.set(key, record);

  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  };
}

/**
 * Clean up expired rate limit entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Audit log types
export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_RESET'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PDF_GENERATED'
  | 'VEHICLE_CREATED'
  | 'VEHICLE_UPDATED'
  | 'MAINTENANCE_ADDED'
  | 'MAINTENANCE_VALIDATED'
  | 'QR_GENERATED'
  | 'QR_ASSIGNED'
  | 'QR_ACTIVATED'
  | 'LEAD_CREATED'
  | 'LEAD_DISTRIBUTED'
  | 'FLEET_CREATED'
  | 'FLEET_VEHICLE_ADDED'
  | 'SUBSCRIPTION_STARTED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'ADMIN_ACTION'
  | 'API_ACCESS';

export interface AuditLogParams {
  action: AuditAction;
  userId?: string;
  garageId?: string;
  vehicleId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status?: 'SUCCESS' | 'FAILURE' | 'PENDING';
  errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    // Create audit log in database
    // Using Notification model as a temporary audit store
    // In production, create a dedicated AuditLog table
    
    await prisma.notification.create({
      data: {
        type: `AUDIT_${params.action}`,
        userId: params.userId,
        garageId: params.garageId,
        vehicleId: params.vehicleId,
        message: params.errorMessage || params.action,
        data: JSON.stringify({
          action: params.action,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          details: params.details,
          status: params.status || 'SUCCESS',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUDIT]', {
        action: params.action,
        userId: params.userId,
        status: params.status,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Audit Log Error]', error);
  }
}

/**
 * Verify HMAC signature for webhooks
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  const expectedSignature = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate HMAC signature
 */
export function generateHmacSignature(
  payload: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  return crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a sensitive value (for storage)
 */
export function hashValue(value: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(value, actualSalt, 10000, 64, 'sha512')
    .toString('hex');
  return `${actualSalt}:${hash}`;
}

/**
 * Verify a hashed value
 */
export function verifyHashedValue(value: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = crypto
    .pbkdf2Sync(value, salt, 10000, 64, 'sha512')
    .toString('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(verifyHash)
  );
}

/**
 * Mask sensitive data for display
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 9) {
    return `${cleaned.slice(0, 3)}***${cleaned.slice(-2)}`;
  }
  return phone;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  const masked = localPart.slice(0, 2) + '***';
  return `${masked}@${domain}`;
}

export function maskPlateNumber(plate: string): string {
  if (!plate) return '';
  const cleaned = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (cleaned.length >= 4) {
    return `${cleaned.slice(0, 2)}***${cleaned.slice(-2)}`;
  }
  return plate;
}

/**
 * Input sanitization
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate phone number (Senegal format)
 */
export function isValidSenegalPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  const regex = /^(\+221|221)?[37][0-9]{8}$/;
  return regex.test(cleaned);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate license plate (Senegal format)
 */
export function isValidSenegalPlate(plate: string): boolean {
  const cleaned = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  // Format: AB123CD or 1234AB5 (old format)
  const regex = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$|^[0-9]{4}[A-Z]{2}[0-9]$/;
  return regex.test(cleaned);
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Security headers for responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
