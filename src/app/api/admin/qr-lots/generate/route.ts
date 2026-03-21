import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const generateQRLotSchema = z.object({
  count: z.number().min(1).max(1000).default(50),
  garageId: z.string().optional(),
  prefix: z.string().min(2).max(10).default('OKAR'),
  notes: z.string().optional(),
});

// ========================================
// GÉNÉRATION DE CODES SÉCURISÉS
// ========================================

/**
 * Génère un code unique UUID v4 sécurisé (32 chars hex)
 * Utilisé pour le codeUnique (interne, sécurisé)
 */
function generateSecureCode(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Génère un code court pour URL (8 chars)
 * Format: [A-Z0-9]{8} - facile à taper, difficile à deviner
 * Entropie: 8 * log2(36) ≈ 41 bits (2^41 combinaisons)
 */
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1 pour éviter confusion
  let code = '';
  const randomBytesBuffer = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytesBuffer[i] % chars.length];
  }
  return code;
}

/**
 * Génère un ID de lot unique
 */
function generateLotId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

/**
 * Vérifie si un code court existe déjà
 */
async function isShortCodeUnique(shortCode: string): Promise<boolean> {
  const existing = await db.$queryRawUnsafe<any[]>(
    'SELECT id FROM QRCodeStock WHERE shortCode = ? LIMIT 1',
    shortCode
  );
  return existing.length === 0;
}

/**
 * Vérifie si un code unique existe déjà
 */
async function isCodeUniqueUnique(codeUnique: string): Promise<boolean> {
  const existing = await db.$queryRawUnsafe<any[]>(
    'SELECT id FROM QRCodeStock WHERE codeUnique = ? LIMIT 1',
    codeUnique
  );
  return existing.length === 0;
}

// ========================================
// API: GÉNÉRATION DE LOT DE QR CODES
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateQRLotSchema.parse(body);

    const { count, garageId, prefix, notes } = validatedData;
    const now = new Date().toISOString();

    // 1. Créer le lot
    const lotId = generateLotId(prefix);
    const lotDbId = `lot-${randomBytes(8).toString('hex')}`;

    await db.$executeRawUnsafe(
      `INSERT INTO QRCodeLot (id, prefix, count, status, assignedToId, notes, createdAt)
       VALUES (?, ?, ?, 'CREATED', ?, ?, ?)`,
      lotDbId, prefix, count, garageId || null, notes || null, now
    );

    // 2. Générer les QR codes individuels
    const qrCodes: Array<{ codeUnique: string; shortCode: string }> = [];
    let generatedCount = 0;
    let attempts = 0;
    const maxAttempts = count * 3; // Protection contre boucle infinie

    while (generatedCount < count && attempts < maxAttempts) {
      attempts++;

      const codeUnique = generateSecureCode();
      const shortCode = generateShortCode();

      // Vérifier l'unicité des deux codes
      const [uniqueCode, uniqueShort] = await Promise.all([
        isCodeUniqueUnique(codeUnique),
        isShortCodeUnique(shortCode)
      ]);

      if (!uniqueCode || !uniqueShort) {
        continue; // Régénérer si collision
      }

      // Insérer le QR code
      const qrId = `qr-${randomBytes(8).toString('hex')}`;

      await db.$executeRawUnsafe(
        `INSERT INTO QRCodeStock (id, codeUnique, shortCode, lotId, status, assignedGarageId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'STOCK', ?, ?, ?)`,
        qrId, codeUnique, shortCode, lotDbId, garageId || null, now, now
      );

      qrCodes.push({ codeUnique, shortCode });
      generatedCount++;
    }

    // 3. Mettre à jour le statut du lot
    if (garageId) {
      await db.$executeRawUnsafe(
        `UPDATE QRCodeLot SET status = 'ASSIGNED', assignedAt = ? WHERE id = ?`,
        now, lotDbId
      );
    }

    // 4. Retourner les résultats
    return NextResponse.json({
      success: true,
      lot: {
        id: lotId,
        dbId: lotDbId,
        prefix,
        count: generatedCount,
        status: garageId ? 'ASSIGNED' : 'CREATED',
        garageId,
        createdAt: now
      },
      qrCodes: qrCodes.map((qr, index) => ({
        index: index + 1,
        shortCode: qr.shortCode,
        scanUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn'}/v/${qr.shortCode}`,
      })),
      printablePdf: `/api/admin/qr-lots/${lotDbId}/pdf`
    });

  } catch (error) {
    console.error('Generate QR lot error:', error);

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

// ========================================
// API: LISTE DES LOTS
// ========================================

/**
 * Convertit une valeur en nombre (gère les BigInt SQLite)
 */
function toNumber(value: any): number {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const garageId = searchParams.get('garageId');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (status && status !== 'all') {
      whereClause += ' AND l.status = ?';
      params.push(status);
    }

    if (garageId && garageId !== 'all') {
      whereClause += ' AND l.assignedToId = ?';
      params.push(garageId);
    }

    const query = `
      SELECT
        l.id, l.prefix, l.count, l.status, l.notes,
        l.assignedToId as garageId, l.assignedAt, l.createdAt,
        g.name as garageName,
        (SELECT COUNT(*) FROM QRCodeStock qs WHERE qs.lotId = l.id) as generatedCount,
        (SELECT COUNT(*) FROM QRCodeStock qs WHERE qs.lotId = l.id AND qs.status = 'ACTIVE') as activatedCount,
        (SELECT COUNT(*) FROM QRCodeStock qs WHERE qs.lotId = l.id AND qs.status = 'STOCK') as stockCount
      FROM QRCodeLot l
      LEFT JOIN Garage g ON l.assignedToId = g.id
      ${whereClause}
      ORDER BY l.createdAt DESC
    `;

    const lots = await db.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json({
      success: true,
      lots: lots.map(lot => {
        const count = toNumber(lot.count);
        const activatedCount = toNumber(lot.activatedCount);
        const stockCount = toNumber(lot.stockCount);
        const generatedCount = toNumber(lot.generatedCount);

        return {
          id: lot.id,
          prefix: lot.prefix,
          count: count,
          status: lot.status,
          notes: lot.notes,
          garageId: lot.garageId,
          garageName: lot.garageName,
          assignedAt: lot.assignedAt,
          createdAt: lot.createdAt,
          generatedCount: generatedCount,
          activatedCount: activatedCount,
          stockCount: stockCount,
          utilizationRate: count > 0 
            ? Math.round((activatedCount / count) * 100) 
            : 0
        };
      })
    });

  } catch (error) {
    console.error('Get QR lots error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', lots: [] },
      { status: 500 }
    );
  }
}
