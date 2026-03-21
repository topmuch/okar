import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { slugify } from '@/lib/utils';
import { generateCuid } from '@/lib/qr';

// Fonction pour générer un slug unique
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.$queryRaw<any[]>`
      SELECT id FROM Garage WHERE slug = ${slug} LIMIT 1
    `;

    if (!existing || existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Fonction pour générer un mot de passe temporaire
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Fonction pour générer un email unique pour le garage
function generateGarageEmail(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 12);
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}_${random}@demo.okar.sn`;
}

// POST - Create a demo garage account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, city } = body;

    // Validation des champs requis
    if (!name || !phone || !city) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier si un garage avec le même téléphone existe déjà
    const existingGarage = await db.$queryRaw<any[]>`
      SELECT id FROM Garage WHERE phone = ${phone} LIMIT 1
    `;

    if (existingGarage && existingGarage.length > 0) {
      return NextResponse.json(
        { error: 'Ce numéro de téléphone est déjà associé à un garage' },
        { status: 400 }
      );
    }

    // Générer un slug unique
    const slug = await generateUniqueSlug(name);

    // Générer les identifiants
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const garageEmail = generateGarageEmail(name);
    const garageId = generateCuid();

    // Créer le garage avec le statut DEMO
    await db.$executeRaw`
      INSERT INTO Garage (
        id, name, slug, email, phone, address,
        validationStatus, isCertified, active,
        managerName, managerPhone, temporaryPassword,
        createdAt, updatedAt
      ) VALUES (
        ${garageId}, ${name}, ${slug}, ${garageEmail}, ${phone}, ${city},
        'DEMO', 0, 1,
        ${name}, ${phone}, ${hashedPassword},
        ${new Date().toISOString()}, ${new Date().toISOString()}
      )
    `;

    // Créer l'utilisateur garage
    const userId = generateCuid();
    await db.$executeRaw`
      INSERT INTO User (
        id, email, name, phone, password, role, garageId, emailVerified,
        createdAt, updatedAt
      ) VALUES (
        ${userId}, ${garageEmail}, ${name}, ${phone}, ${hashedPassword}, 'garage', ${garageId}, 1,
        ${new Date().toISOString()}, ${new Date().toISOString()}
      )
    `;

    // Créer un GarageProfile
    const profileId = generateCuid();
    await db.$executeRaw`
      INSERT INTO GarageProfile (
        id, garageId, subscriptionTier, createdAt, updatedAt
      ) VALUES (
        ${profileId}, ${garageId}, 'FREE', ${new Date().toISOString()}, ${new Date().toISOString()}
      )
    `;

    // Créer un log d'audit
    const auditId = generateCuid();
    await db.$executeRaw`
      INSERT INTO AuditLog (
        id, action, entityType, entityId, details, createdAt
      ) VALUES (
        ${auditId}, 'GARAGE_DEMO_REGISTER', 'GARAGE', ${garageId},
        ${JSON.stringify({ garageName: name, phone, city, mode: 'DEMO' })},
        ${new Date().toISOString()}
      )
    `;

    // Créer une notification pour les admins
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (
        id, type, garageId, message, createdAt
      ) VALUES (
        ${notificationId}, 'GARAGE_DEMO_CREATED', ${garageId},
        ${`Nouveau garage en mode démo: ${name} (${phone}, ${city}). À valider.`},
        ${new Date().toISOString()}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Compte garage créé en mode démo',
      garageId,
      credentials: {
        email: garageEmail,
        password: temporaryPassword,
      },
    });

  } catch (error: any) {
    console.error('Error creating demo garage:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
