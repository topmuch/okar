import { NextRequest, NextResponse } from 'next/server';
import { 
  generateQRCodeLot, 
  assignLotToGarage,
  getGarageQRStats 
} from '@/lib/qr-system';
import { db } from '@/lib/db';

// GET - List QR lots with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garageId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (garageId) {
      whereClause += ' AND l.assignedToId = ?';
      params.push(garageId);
    }

    if (status && status !== 'all') {
      whereClause += ' AND l.status = ?';
      params.push(status);
    }

    // Get lots with stats
    const lotsQuery = `
      SELECT 
        l.*,
        g.name as garageName,
        g.isCertified as garageCertified,
        (SELECT COUNT(*) FROM Vehicle v WHERE v.lotId = l.id) as totalVehicles,
        (SELECT COUNT(*) FROM Vehicle v WHERE v.lotId = l.id AND v.qrStatus = 'ACTIVE') as activatedCount,
        (SELECT COUNT(*) FROM Vehicle v WHERE v.lotId = l.id AND v.qrStatus = 'INACTIVE') as availableCount
      FROM QRCodeLot l
      LEFT JOIN Garage g ON l.assignedToId = g.id
      ${whereClause}
      ORDER BY l.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const lots = await db.$queryRawUnsafe(lotsQuery, ...params);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM QRCodeLot l ${whereClause}`;
    const countResult = await db.$queryRawUnsafe(countQuery, ...params.slice(0, -2));
    const total = (countResult as any[])?.[0]?.total || 0;

    // Get garage stats if garageId provided
    let stats = null;
    if (garageId) {
      stats = await getGarageQRStats(garageId);
    }

    return NextResponse.json({
      lots: lots.map((lot: any) => ({
        id: lot.id,
        prefix: lot.prefix,
        count: lot.count,
        status: lot.status,
        createdAt: lot.createdAt,
        assignedAt: lot.assignedAt,
        notes: lot.notes,
        garage: lot.garageId ? {
          id: lot.assignedToId,
          name: lot.garageName,
          isCertified: lot.garageCertified === 1
        } : null,
        stats: {
          total: lot.totalVehicles,
          activated: lot.activatedCount,
          available: lot.availableCount
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching QR lots:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des lots', 
      lots: [] 
    }, { status: 500 });
  }
}

// POST - Create new QR lot (SuperAdmin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count, createdBy, assignToGarageId, notes, prefix } = body;

    // Validate inputs
    if (!count || count < 1 || count > 1000) {
      return NextResponse.json({ 
        error: 'Le nombre de QR doit être entre 1 et 1000' 
      }, { status: 400 });
    }

    // Verify user is superadmin
    if (createdBy) {
      const user = await db.$queryRaw<any[]>`
        SELECT role FROM User WHERE id = ${createdBy} LIMIT 1
      `;
      
      if (!user || user.length === 0 || user[0].role !== 'superadmin') {
        return NextResponse.json({ 
          error: 'Seuls les superadministrateurs peuvent créer des lots' 
        }, { status: 403 });
      }
    }

    // Generate the lot
    const result = await generateQRCodeLot({
      count,
      createdBy,
      assignToGarageId,
      notes,
      prefix
    });

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      lot: {
        id: result.lotId,
        prefix: result.lotPrefix,
        count,
        references: result.references
      },
      message: `Lot de ${count} QR codes créé avec succès`
    });

  } catch (error) {
    console.error('Error creating QR lot:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du lot' 
    }, { status: 500 });
  }
}

// PUT - Assign lot to garage
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { lotId, garageId, action } = body;

    if (action === 'assign') {
      // Verify garage exists and is certified
      const garage = await db.$queryRaw<any[]>`
        SELECT id, isCertified FROM Garage WHERE id = ${garageId} LIMIT 1
      `;

      if (!garage || garage.length === 0) {
        return NextResponse.json({ 
          error: 'Garage non trouvé' 
        }, { status: 404 });
      }

      const result = await assignLotToGarage(lotId, garageId);

      if (!result.success) {
        return NextResponse.json({ 
          error: result.error 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Lot assigné avec succès au garage'
      });
    }

    return NextResponse.json({ 
      error: 'Action non reconnue' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating lot:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour' 
    }, { status: 500 });
  }
}
