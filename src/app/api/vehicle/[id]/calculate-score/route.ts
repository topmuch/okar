import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ========================================
// TYPES & INTERFACES
// ========================================
interface ScoreBreakdown {
  certifiedInterventions: number;
  verifiedPaperHistory: number;
  regularMaintenance: number;
  vtExpired: number;
  insuranceExpired: number;
  technicalControlMissing: number;
  total: number;
}

interface ScoreResult {
  score: number;
  badge: 'BRONZE' | 'SILVER' | 'GOLD';
  breakdown: ScoreBreakdown;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate the OKAR health score for a vehicle
 * 
 * Scoring Algorithm:
 * - +10 pts per certified intervention (status: VALIDATED, source: OKAR)
 * - +5 pts per verified paper history (source: PRE_OKAR_PAPER, isVerified: true)
 * - +5 pts if regular history (≥1 intervention per 6 months)
 * - -20 pts if VT expired
 * - -15 pts if Assurance expired
 * - -10 pts if technical control not done in 2 years
 * 
 * Badge attribution:
 * - BRONZE: 0-39
 * - SILVER: 40-69
 * - GOLD: 70-100
 */
async function calculateVehicleScore(vehicleId: string): Promise<ScoreResult> {
  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

  // Get vehicle with all maintenance records and documents
  const vehicles = await db.$queryRawUnsafe<any[]>(`
    SELECT 
      v.id, v.vtEndDate, v.insuranceEndDate, v.activatedAt,
      (SELECT COUNT(*) FROM MaintenanceRecord mr 
       WHERE mr.vehicleId = v.id 
       AND mr.status = 'VALIDATED' 
       AND mr.source = 'OKAR'
       AND mr.ownerValidation = 'VALIDATED') as certifiedCount,
      (SELECT COUNT(*) FROM MaintenanceRecord mr 
       WHERE mr.vehicleId = v.id 
       AND mr.source = 'PRE_OKAR_PAPER' 
       AND mr.isVerified = 1) as verifiedPaperCount,
      (SELECT COUNT(*) FROM MaintenanceRecord mr 
       WHERE mr.vehicleId = v.id 
       AND mr.interventionDate >= ?) as recentInterventions
    FROM Vehicle v
    WHERE v.id = ?
  `, sixMonthsAgo.toISOString(), vehicleId);

  if (!vehicles || vehicles.length === 0) {
    throw new Error('Vehicle not found');
  }

  const vehicle = vehicles[0];
  const breakdown: ScoreBreakdown = {
    certifiedInterventions: 0,
    verifiedPaperHistory: 0,
    regularMaintenance: 0,
    vtExpired: 0,
    insuranceExpired: 0,
    technicalControlMissing: 0,
    total: 0,
  };

  let score = 0;

  // +10 pts per certified intervention (max 50 pts)
  const certifiedCount = vehicle.certifiedCount || 0;
  const certifiedPoints = Math.min(certifiedCount * 10, 50);
  score += certifiedPoints;
  breakdown.certifiedInterventions = certifiedPoints;

  // +5 pts per verified paper history (max 25 pts)
  const verifiedPaperCount = vehicle.verifiedPaperCount || 0;
  const verifiedPaperPoints = Math.min(verifiedPaperCount * 5, 25);
  score += verifiedPaperPoints;
  breakdown.verifiedPaperHistory = verifiedPaperPoints;

  // +5 pts if regular maintenance (≥1 intervention per 6 months)
  const recentInterventions = vehicle.recentInterventions || 0;
  if (recentInterventions >= 1) {
    score += 5;
    breakdown.regularMaintenance = 5;
  }

  // -20 pts if VT expired
  if (vehicle.vtEndDate) {
    const vtEndDate = new Date(vehicle.vtEndDate);
    if (vtEndDate < now) {
      score -= 20;
      breakdown.vtExpired = -20;
    }
  }

  // -15 pts if Insurance expired
  if (vehicle.insuranceEndDate) {
    const insuranceEndDate = new Date(vehicle.insuranceEndDate);
    if (insuranceEndDate < now) {
      score -= 15;
      breakdown.insuranceExpired = -15;
    }
  }

  // -10 pts if technical control not done in 2 years
  // Check if there's a technical control intervention in the last 2 years
  const technicalControls = await db.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count
    FROM MaintenanceRecord
    WHERE vehicleId = ?
    AND category = 'controle_technique'
    AND status = 'VALIDATED'
    AND interventionDate >= ?
  `, vehicleId, twoYearsAgo.toISOString());

  const technicalControlCount = technicalControls?.[0]?.count || 0;
  if (technicalControlCount === 0) {
    score -= 10;
    breakdown.technicalControlMissing = -10;
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  breakdown.total = score;

  // Determine badge
  let badge: 'BRONZE' | 'SILVER' | 'GOLD';
  if (score >= 70) {
    badge = 'GOLD';
  } else if (score >= 40) {
    badge = 'SILVER';
  } else {
    badge = 'BRONZE';
  }

  return { score, badge, breakdown };
}

// ========================================
// API HANDLERS
// ========================================

/**
 * POST /api/vehicle/[id]/calculate-score
 * Calculate and update the OKAR health score for a vehicle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Calculate the score
    const result = await calculateVehicleScore(id);
    const now = new Date().toISOString();

    // Update the vehicle with the new score and badge
    await db.$executeRawUnsafe(`
      UPDATE Vehicle
      SET okarScore = ?, okarBadge = ?, scoreUpdatedAt = ?, updatedAt = ?
      WHERE id = ?
    `, result.score, result.badge, now, now, id);

    return NextResponse.json({
      success: true,
      score: result.score,
      badge: result.badge,
      breakdown: result.breakdown,
    });

  } catch (error) {
    console.error('Calculate score error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * GET /api/vehicle/[id]/calculate-score
 * Get the current score without recalculating
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the current vehicle score
    const vehicles = await db.$queryRawUnsafe<any[]>(`
      SELECT id, okarScore, okarBadge, scoreUpdatedAt
      FROM Vehicle
      WHERE id = ?
    `, id);

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Vehicle not found',
      }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // If no score calculated yet, calculate it
    if (!vehicle.scoreUpdatedAt) {
      const result = await calculateVehicleScore(id);
      const now = new Date().toISOString();

      await db.$executeRawUnsafe(`
        UPDATE Vehicle
        SET okarScore = ?, okarBadge = ?, scoreUpdatedAt = ?, updatedAt = ?
        WHERE id = ?
      `, result.score, result.badge, now, now, id);

      return NextResponse.json({
        success: true,
        score: result.score,
        badge: result.badge,
        breakdown: result.breakdown,
        newlyCalculated: true,
      });
    }

    return NextResponse.json({
      success: true,
      score: vehicle.okarScore || 0,
      badge: vehicle.okarBadge || 'BRONZE',
      scoreUpdatedAt: vehicle.scoreUpdatedAt,
      newlyCalculated: false,
    });

  } catch (error) {
    console.error('Get score error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
