import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateCuid } from '@/lib/qr';
import { db } from '@/lib/db';

// Schema for generating vehicles with QR codes
const generateVehiclesSchema = z.object({
  garageId: z.string().min(1),
  count: z.number().min(1).max(100),
  lotId: z.string().optional(),
});

// Generate a unique vehicle reference (OKAR-XXXXX format)
function generateVehicleReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OKAR-${code}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateVehiclesSchema.parse(body);

    const references: string[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < validatedData.count; i++) {
      const reference = generateVehicleReference();
      const id = generateCuid();

      // Insert vehicle with INACTIVE qrStatus
      await db.$executeRaw`
        INSERT INTO Vehicle (
          id, reference, garageId, lotId, qrStatus, status, createdAt
        ) VALUES (
          ${id}, ${reference}, ${validatedData.garageId}, 
          ${validatedData.lotId || null}, 'INACTIVE', 'pending_activation', ${now}
        )
      `;

      references.push(reference);
    }

    return NextResponse.json({
      success: true,
      generated: references.length,
      references
    });

  } catch (error) {
    console.error('Generate vehicles error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Erreur serveur', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET - Get all vehicles (for QR codes list)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garageId');
    const qrStatus = searchParams.get('qrStatus');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '500');

    // Build where clause for raw query
    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (garageId) {
      whereClause += ' AND garageId = ?';
      params.push(garageId);
    }

    if (qrStatus && qrStatus !== 'all') {
      whereClause += ' AND qrStatus = ?';
      params.push(qrStatus);
    }

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const query = `
      SELECT
        id, reference, vin, make, model, year, color,
        licensePlate, qrStatus, status, ownerName, ownerPhone,
        garageId, lotId, activatedAt, createdAt
      FROM Vehicle
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ?
    `;
    params.push(limit);

    const vehicles = await db.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    return NextResponse.json(
      { error: 'Internal server error', vehicles: [] },
      { status: 500 }
    );
  }
}
