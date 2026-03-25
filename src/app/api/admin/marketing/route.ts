import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// Vehicle row type
interface VehicleRow {
  id: string;
  reference: string;
  type: string;
  garageId: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerPhone: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

// Garage row type
interface GarageRow {
  id: string;
  name: string;
  slug: string;
}

// GET - Get all activated clients for marketing
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Filters
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const garageId = searchParams.get('garageId');
    const dateRange = searchParams.get('dateRange');
    const search = searchParams.get('search');

    // Build query conditions
    let whereConditions = ['status = \'active\''];
    const params: (string | number)[] = [];

    if (type && type !== 'all') {
      whereConditions.push('type = ?');
      params.push(type);
    }

    if (garageId && garageId !== 'all') {
      whereConditions.push('garageId = ?');
      params.push(garageId);
    }

    // Date range filter
    if (dateRange) {
      const days = parseInt(dateRange);
      const date = new Date();
      date.setDate(date.getDate() - days);
      whereConditions.push('createdAt >= ?');
      params.push(date.toISOString());
    }

    // Search filter
    if (search) {
      whereConditions.push('(ownerFirstName LIKE ? OR ownerLastName LIKE ? OR ownerPhone LIKE ? OR reference LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get all matching vehicles using raw SQL
    const vehicles = await db.$queryRawUnsafe<VehicleRow[]>(
      `SELECT
        id, reference, type, garageId,
        ownerFirstName, ownerLastName, ownerPhone,
        status, createdAt, expiresAt
       FROM Vehicle
       WHERE ${whereClause}
       ORDER BY createdAt DESC`,
      ...params
    );

    // Get garages
    const garagesRaw = await db.$queryRaw<GarageRow[]>`
      SELECT id, name, slug FROM Garage ORDER BY name ASC
    `;

    // Build garage map
    const garageMap = new Map<string, GarageRow>();
    (garagesRaw || []).forEach(g => garageMap.set(g.id, g));

    // Calculate status based on expiration
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Filter by expiration status if provided
    let filteredVehicles = vehicles || [];
    if (status && status !== 'all') {
      filteredVehicles = filteredVehicles.filter(v => {
        if (!v.expiresAt) return false;

        const expiresAtDate = new Date(v.expiresAt);
        if (status === 'active') {
          return expiresAtDate > sevenDaysFromNow;
        } else if (status === 'expiring_soon') {
          return expiresAtDate <= sevenDaysFromNow && expiresAtDate > now;
        } else if (status === 'expired') {
          return expiresAtDate <= now;
        }
        return true;
      });
    }

    // Calculate stats
    const stats = {
      total: filteredVehicles.length,
      hajj: filteredVehicles.filter(v => v.type === 'hajj').length,
      voyageur: filteredVehicles.filter(v => v.type === 'voyageur').length,
      active: filteredVehicles.filter(v => v.expiresAt && new Date(v.expiresAt) > sevenDaysFromNow).length,
      expiringSoon: filteredVehicles.filter(v => v.expiresAt && new Date(v.expiresAt) <= sevenDaysFromNow && new Date(v.expiresAt) > now).length,
      expired: filteredVehicles.filter(v => v.expiresAt && new Date(v.expiresAt) <= now).length
    };

    // Transform data for frontend
    const clients = filteredVehicles.map(v => {
      let computedStatus = 'active';
      if (v.expiresAt) {
        const expiresAtDate = new Date(v.expiresAt);
        if (expiresAtDate <= now) {
          computedStatus = 'expired';
        } else if (expiresAtDate <= sevenDaysFromNow) {
          computedStatus = 'expiring_soon';
        }
      }

      const garage = v.garageId ? garageMap.get(v.garageId) : null;

      return {
        id: v.id,
        reference: v.reference,
        fullName: `${v.ownerFirstName || ''} ${v.ownerLastName || ''}`.trim() || 'Non renseigné',
        firstName: v.ownerFirstName || '',
        lastName: v.ownerLastName || '',
        phone: v.ownerPhone || '',
        type: v.type,
        activationDate: v.createdAt,
        expirationDate: v.expiresAt,
        status: computedStatus,
        garage: garage ? { id: garage.id, name: garage.name } : null,
        marketingOptin: false,
        lastContactedAt: null
      };
    });

    return NextResponse.json({
      clients,
      stats,
      garages: garagesRaw || []
    });
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données marketing' },
      { status: 500 }
    );
  }
}

// PUT - Update last contacted date (disabled - column doesn't exist)
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Feature disabled - column doesn't exist in production
    return NextResponse.json({
      success: true,
      message: 'Contact tracking disabled'
    });
  } catch (error) {
    console.error('Error updating contact date:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
