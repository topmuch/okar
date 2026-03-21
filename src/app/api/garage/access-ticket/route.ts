import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// ========================================
// SCHÉMA DE VALIDATION
// ========================================
const createTicketSchema = z.object({
  vehicleId: z.string().min(1, "ID véhicule requis"),
  garageId: z.string().optional(),
  createdBy: z.string().optional(),
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ========================================
// API: CRÉER UN TICKET D'ACCÈS
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);
    const { vehicleId, garageId, createdBy } = validatedData;

    // 1. RÉCUPÉRER LES INFOS DU VÉHICULE
    const vehicle = await db.$queryRawUnsafe<any[]>(
      `SELECT v.*, 
              u.name as ownerName, u.phone as ownerPhone, u.email as ownerEmail,
              g.name as garageName, g.id as garageId,
              qs.shortCode
       FROM Vehicle v
       LEFT JOIN User u ON v.ownerId = u.id
       LEFT JOIN Garage g ON v.garageId = g.id
       LEFT JOIN QRCodeStock qs ON qs.linkedVehicleId = v.id
       WHERE v.id = ?`,
      vehicleId
    );

    if (!vehicle || vehicle.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Véhicule non trouvé'
      }, { status: 404 });
    }

    const v = vehicle[0];

    // 2. VÉRIFIER SI UN TICKET RÉCENT EXISTE DÉJÀ (moins de 24h)
    const existingTicket = await db.$queryRawUnsafe<any[]>(
      `SELECT * FROM AccessTicket 
       WHERE vehicleId = ? 
       AND generatedAt > datetime('now', '-24 hours')
       ORDER BY generatedAt DESC LIMIT 1`,
      vehicleId
    );

    if (existingTicket && existingTicket.length > 0) {
      // Retourner le ticket existant
      const ticket = existingTicket[0];
      return NextResponse.json({
        success: true,
        ticket: {
          id: ticket.id,
          driverName: ticket.driverName,
          driverPhone: ticket.driverPhone,
          driverEmail: ticket.driverEmail,
          vehicleInfo: ticket.vehicleInfo,
          vehicleMake: v.make,
          vehicleModel: v.model,
          licensePlate: v.licensePlate,
          qrReference: ticket.qrReference,
          tempPassword: ticket.tempPassword,
          loginUrl: 'https://okar.sn/driver/connexion',
          garageName: ticket.garageName,
          generatedAt: ticket.generatedAt,
        },
        message: 'Ticket existant récupéré'
      });
    }

    // 3. CRÉER UN NOUVEAU TICKET
    const ticketId = `ticket-${randomBytes(8).toString('hex')}`;
    const tempPassword = generateTempPassword();
    const vehicleInfo = `${v.make || ''} ${v.model || ''}`.trim();
    const qrReference = v.shortCode || v.reference;
    const finalGarageId = garageId || v.garageId;
    const garageName = v.garageName;

    await db.$executeRawUnsafe(
      `INSERT INTO AccessTicket (
        id, vehicleId, garageId, driverName, driverPhone, driverEmail,
        vehicleInfo, qrReference, tempPassword, generatedAt, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
      ticketId,
      vehicleId,
      finalGarageId,
      v.ownerName || v.ownerName || 'Client',
      v.ownerPhone || v.ownerPhone || '',
      v.ownerEmail || null,
      vehicleInfo,
      qrReference,
      tempPassword,
      createdBy || null
    );

    // 4. RÉPONSE
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticketId,
        driverName: v.ownerName || 'Client',
        driverPhone: v.ownerPhone || '',
        driverEmail: v.ownerEmail || null,
        vehicleInfo,
        vehicleMake: v.make,
        vehicleModel: v.model,
        licensePlate: v.licensePlate,
        qrReference,
        tempPassword,
        loginUrl: 'https://okar.sn/driver/connexion',
        garageName,
        generatedAt: new Date().toISOString(),
      },
      message: 'Ticket créé avec succès'
    });

  } catch (error) {
    console.error('Create access ticket error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur de validation',
        details: error.errors
      }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur',
      details: errorMessage
    }, { status: 500 });
  }
}

// ========================================
// API: RÉCUPÉRER UN TICKET
// ========================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const vehicleId = searchParams.get('vehicleId');

    if (!ticketId && !vehicleId) {
      return NextResponse.json({
        success: false,
        error: 'ticketId ou vehicleId requis'
      }, { status: 400 });
    }

    let ticket;

    if (ticketId) {
      const result = await db.$queryRawUnsafe<any[]>(
        `SELECT at.*, v.make, v.model, v.licensePlate, g.name as garageName
         FROM AccessTicket at
         LEFT JOIN Vehicle v ON at.vehicleId = v.id
         LEFT JOIN Garage g ON at.garageId = g.id
         WHERE at.id = ?`,
        ticketId
      );
      ticket = result && result.length > 0 ? result[0] : null;
    } else if (vehicleId) {
      const result = await db.$queryRawUnsafe<any[]>(
        `SELECT at.*, v.make, v.model, v.licensePlate, g.name as garageName
         FROM AccessTicket at
         LEFT JOIN Vehicle v ON at.vehicleId = v.id
         LEFT JOIN Garage g ON at.garageId = g.id
         WHERE at.vehicleId = ?
         ORDER BY at.generatedAt DESC LIMIT 1`,
        vehicleId
      );
      ticket = result && result.length > 0 ? result[0] : null;
    }

    if (!ticket) {
      return NextResponse.json({
        success: false,
        error: 'Ticket non trouvé'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        driverName: ticket.driverName,
        driverPhone: ticket.driverPhone,
        driverEmail: ticket.driverEmail,
        vehicleInfo: ticket.vehicleInfo,
        vehicleMake: ticket.make,
        vehicleModel: ticket.model,
        licensePlate: ticket.licensePlate,
        qrReference: ticket.qrReference,
        tempPassword: ticket.tempPassword,
        loginUrl: 'https://okar.sn/driver/connexion',
        garageName: ticket.garageName,
        generatedAt: ticket.generatedAt,
      }
    });

  } catch (error) {
    console.error('Get access ticket error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur',
      details: errorMessage
    }, { status: 500 });
  }
}

// ========================================
// API: MARQUER COMME ENVOYÉ
// ========================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, channel } = body;

    if (!ticketId || !channel) {
      return NextResponse.json({
        success: false,
        error: 'ticketId et channel requis'
      }, { status: 400 });
    }

    if (channel === 'whatsapp') {
      await db.$executeRawUnsafe(
        `UPDATE AccessTicket SET sentViaWhatsApp = 1 WHERE id = ?`,
        ticketId
      );
    } else if (channel === 'sms') {
      await db.$executeRawUnsafe(
        `UPDATE AccessTicket SET sentViaSMS = 1 WHERE id = ?`,
        ticketId
      );
    } else if (channel === 'print') {
      await db.$executeRawUnsafe(
        `UPDATE AccessTicket SET printedAt = datetime('now') WHERE id = ?`,
        ticketId
      );
    }

    return NextResponse.json({
      success: true,
      message: `Ticket marqué comme envoyé via ${channel}`
    });

  } catch (error) {
    console.error('Update access ticket error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur',
      details: errorMessage
    }, { status: 500 });
  }
}
