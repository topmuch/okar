import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleQRScan } from '@/lib/qr-system';

/**
 * GET - Public scan of vehicle QR code
 * 
 * Redirect Logic:
 * - INACTIVE QR: Show activation required page (if garage) or info page (public)
 * - ACTIVE QR + Public: Show public passport (validated records only)
 * - ACTIVE QR + Owner: Show full dashboard with all records
 * - ACTIVE QR + Garage: Show intervention form
 * - BLOCKED/REVOKED: Show blocked page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    
    // Get user context from headers (if authenticated)
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.cookies.get('session')?.value;
    
    // Determine user role if authenticated
    let userContext: { userId: string; role: string; garageId?: string } | null = null;
    
    if (sessionToken) {
      try {
        const session = await db.$queryRaw<any[]>`
          SELECT 
            s.userId, 
            u.role, 
            u.garageId
          FROM Session s
          JOIN User u ON s.userId = u.id
          WHERE s.id = ${sessionToken} AND s.expiresAt > datetime('now')
          LIMIT 1
        `;
        
        if (session && session.length > 0) {
          userContext = {
            userId: session[0].userId,
            role: session[0].role,
            garageId: session[0].garageId
          };
        }
      } catch (e) {
        // Session invalid, treat as public user
      }
    }

    // Find vehicle by reference with full data
    const vehicles = await db.$queryRaw<any[]>`
      SELECT 
        v.*,
        g.name as garageName,
        g.phone as garagePhone,
        g.email as garageEmail,
        g.isCertified as garageCertified,
        g.address as garageAddress,
        l.prefix as lotPrefix
      FROM Vehicle v
      LEFT JOIN Garage g ON v.garageId = g.id
      LEFT JOIN QRCodeLot l ON v.lotId = l.id
      WHERE v.reference = ${reference}
      LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ 
        status: 'not_found',
        message: 'Code QR non reconnu dans le système AutoPass',
        code: 'QR_NOT_FOUND'
      }, { status: 404 });
    }

    const vehicle = vehicles[0];

    // Handle different QR statuses
    switch (vehicle.qrStatus) {
      case 'INACTIVE':
        return handleInactiveQR(vehicle, userContext);
      
      case 'BLOCKED':
        return NextResponse.json({
          status: 'blocked',
          code: 'QR_BLOCKED',
          message: 'Ce passeport véhicule a été bloqué pour des raisons de sécurité',
          reference: vehicle.reference,
        });
      
      case 'REVOKED':
        return NextResponse.json({
          status: 'revoked',
          code: 'QR_REVOKED',
          message: 'Ce QR code a été remplacé. Veuillez utiliser le nouveau code.',
          reference: vehicle.reference,
        });
      
      case 'ACTIVE':
        return handleActiveQR(vehicle, userContext);
      
      default:
        return NextResponse.json({
          status: 'unknown',
          message: 'Statut QR inconnu',
          reference: vehicle.reference,
        });
    }

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ 
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Erreur serveur lors de la lecture du QR code' 
    }, { status: 500 });
  }
}

/**
 * Handle INACTIVE QR code scan
 */
async function handleInactiveQR(
  vehicle: any, 
  userContext: { userId: string; role: string; garageId?: string } | null
) {
  // Check if user is garage owner of this QR
  const isGarageOwner = userContext?.role === 'garage' && 
                        userContext?.garageId === vehicle.garageId;
  
  // Check if user is superadmin
  const isSuperAdmin = userContext?.role === 'superadmin';

  if (isGarageOwner || isSuperAdmin) {
    // Return activation form data
    return NextResponse.json({
      status: 'inactive',
      code: 'QR_INACTIVE_GARAGE',
      message: 'Ce QR code est disponible pour activation',
      reference: vehicle.reference,
      garageId: vehicle.garageId,
      garageName: vehicle.garageName,
      canActivate: true,
      redirectTo: '/garage/activer-qr',
      vehicle: {
        id: vehicle.id,
        reference: vehicle.reference,
        lotPrefix: vehicle.lotPrefix
      }
    });
  }

  // Public user - show info page
  return NextResponse.json({
    status: 'inactive',
    code: 'QR_INACTIVE',
    message: 'Ce QR code n\'a pas encore été activé',
    reference: vehicle.reference,
    canActivate: false,
    helpMessage: 'Ce véhicule n\'a pas encore été enregistré dans le système AutoPass. Le propriétaire doit se rendre dans un garage certifié pour activer son passeport numérique.'
  });
}

/**
 * Handle ACTIVE QR code scan
 */
async function handleActiveQR(
  vehicle: any, 
  userContext: { userId: string; role: string; garageId?: string } | null
) {
  const isOwner = userContext?.userId === vehicle.ownerId;
  const isGaragePartner = userContext?.role === 'garage' && 
                          userContext?.garageId === vehicle.garageId;
  const isSuperAdmin = userContext?.role === 'superadmin';

  // Get maintenance records based on user role
  let maintenanceRecords: any[];
  
  if (isOwner || isSuperAdmin) {
    // Owner sees all records including pending
    maintenanceRecords = await db.$queryRaw<any[]>`
      SELECT 
        m.id,
        m.category,
        m.description,
        m.mileage,
        m.totalCost,
        m.interventionDate,
        m.ownerValidation,
        m.status,
        g.name as garageName,
        g.isCertified as garageCertified
      FROM MaintenanceRecord m
      LEFT JOIN Garage g ON m.garageId = g.id
      WHERE m.vehicleId = ${vehicle.id}
      ORDER BY m.interventionDate DESC
      LIMIT 100
    `;
  } else {
    // Public only sees validated records
    maintenanceRecords = await db.$queryRaw<any[]>`
      SELECT 
        m.id,
        m.category,
        m.description,
        m.mileage,
        m.totalCost,
        m.interventionDate,
        g.name as garageName,
        g.isCertified as garageCertified
      FROM MaintenanceRecord m
      LEFT JOIN Garage g ON m.garageId = g.id
      WHERE m.vehicleId = ${vehicle.id} 
        AND m.ownerValidation = 'VALIDATED'
      ORDER BY m.interventionDate DESC
      LIMIT 50
    `;
  }

  // Build response based on user role
  const baseResponse = {
    status: 'active',
    code: 'QR_ACTIVE',
    reference: vehicle.reference,
    vehicle: {
      id: vehicle.id,
      reference: vehicle.reference,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      mileage: vehicle.mileage,
      engineType: vehicle.engineType,
      activatedAt: vehicle.activatedAt,
    },
    garage: vehicle.garageId ? {
      id: vehicle.garageId,
      name: vehicle.garageName,
      phone: vehicle.garagePhone,
      email: vehicle.garageEmail,
      address: vehicle.garageAddress,
      isCertified: vehicle.garageCertified === 1
    } : null,
    maintenanceRecords: maintenanceRecords || [],
    stats: {
      totalRecords: maintenanceRecords?.length || 0,
      validatedRecords: maintenanceRecords?.filter((r: any) => r.ownerValidation === 'VALIDATED').length || 0
    }
  };

  // Add role-specific data
  if (isOwner) {
    return NextResponse.json({
      ...baseResponse,
      userRole: 'owner',
      ownerView: true,
      owner: {
        name: vehicle.ownerName,
        phone: vehicle.ownerPhone
      },
      redirectTo: '/driver/tableau-de-bord',
      pendingValidations: maintenanceRecords?.filter((r: any) => r.ownerValidation === 'PENDING').length || 0
    });
  }

  if (isGaragePartner) {
    return NextResponse.json({
      ...baseResponse,
      userRole: 'garage',
      garageView: true,
      canAddIntervention: true,
      redirectTo: '/garage/interventions/nouvelle'
    });
  }

  if (isSuperAdmin) {
    return NextResponse.json({
      ...baseResponse,
      userRole: 'superadmin',
      adminView: true,
      owner: {
        id: vehicle.ownerId,
        name: vehicle.ownerName,
        phone: vehicle.ownerPhone
      },
      lotInfo: {
        id: vehicle.lotId,
        prefix: vehicle.lotPrefix
      }
    });
  }

  // Public view (potential buyer, etc.)
  // Hide sensitive info
  return NextResponse.json({
    ...baseResponse,
    userRole: 'public',
    publicView: true,
    vehicle: {
      ...baseResponse.vehicle,
      // Don't show owner phone to public
    },
    owner: vehicle.ownerName ? {
      name: vehicle.ownerName
      // Phone hidden for privacy
    } : null,
    trustScore: calculateTrustScore(maintenanceRecords, vehicle.garageCertified)
  });
}

/**
 * Calculate trust score for public view
 */
function calculateTrustScore(records: any[], garageCertified: boolean): {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'limited';
  factors: string[];
} {
  const factors: string[] = [];
  let score = 50; // Base score

  if (garageCertified) {
    score += 20;
    factors.push('Garage certifié AutoPass');
  }

  const validatedRecords = records?.filter((r: any) => r.ownerValidation === 'VALIDATED').length || 0;
  
  if (validatedRecords >= 10) {
    score += 20;
    factors.push('Historique complet (10+ interventions)');
  } else if (validatedRecords >= 5) {
    score += 10;
    factors.push('Bon historique (5+ interventions)');
  } else if (validatedRecords >= 1) {
    factors.push('Premier entretien enregistré');
  }

  // Check for recent maintenance
  const recentRecords = records?.filter((r: any) => {
    const date = new Date(r.interventionDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return date > sixMonthsAgo;
  }).length || 0;

  if (recentRecords >= 2) {
    score += 10;
    factors.push('Entretien régulier récent');
  }

  let level: 'excellent' | 'good' | 'fair' | 'limited';
  if (score >= 80) level = 'excellent';
  else if (score >= 60) level = 'good';
  else if (score >= 40) level = 'fair';
  else level = 'limited';

  return { score: Math.min(100, score), level, factors };
}

/**
 * POST - Log a scan for analytics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { location, scannerType, latitude, longitude } = body;

    // Find vehicle
    const vehicles = await db.$queryRaw<any[]>`
      SELECT id FROM Vehicle WHERE reference = ${reference} LIMIT 1
    `;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Log scan for analytics
    const now = new Date().toISOString();
    
    // Create scan log entry (could be a separate table in production)
    // For now, just update last scan info
    await db.$executeRaw`
      UPDATE Vehicle SET
        updatedAt = ${now}
      WHERE id = ${vehicles[0].id}
    `;

    return NextResponse.json({ 
      success: true, 
      timestamp: now 
    });

  } catch (error) {
    console.error('Log scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
