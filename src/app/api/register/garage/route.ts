import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { slugify } from '@/lib/utils';

// Fonction pour générer un slug unique
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.garage.findUnique({
      where: { slug },
    });

    if (!existing) {
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
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      whatsappNumber,
      address,
      managerName,
      managerPhone,
      businessRegistryNumber,
      agreementDocumentUrl,
      shopPhoto,
      idDocumentUrl,
    } = body;

    // Validation des champs requis
    if (!name || !phone || !whatsappNumber || !address || !managerName || !managerPhone || !businessRegistryNumber) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    if (!agreementDocumentUrl || !shopPhoto || !idDocumentUrl) {
      return NextResponse.json(
        { error: 'Tous les documents doivent être téléchargés' },
        { status: 400 }
      );
    }

    // Vérifier si un garage avec le même nom existe déjà
    const existingGarage = await db.garage.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { phone },
          { whatsappNumber },
        ],
      },
    });

    if (existingGarage) {
      if (existingGarage.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(
          { error: 'Un garage avec ce nom existe déjà' },
          { status: 400 }
        );
      }
      if (existingGarage.phone === phone) {
        return NextResponse.json(
          { error: 'Ce numéro de téléphone est déjà associé à un garage' },
          { status: 400 }
        );
      }
      if (existingGarage.whatsappNumber === whatsappNumber) {
        return NextResponse.json(
          { error: 'Ce numéro WhatsApp est déjà associé à un garage' },
          { status: 400 }
        );
      }
    }

    // Générer un slug unique
    const slug = await generateUniqueSlug(name);

    // Générer un mot de passe temporaire
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Créer le garage avec le statut PENDING
    const garage = await db.garage.create({
      data: {
        name,
        slug,
        email: email || null,
        phone,
        whatsappNumber,
        address,
        managerName,
        managerPhone,
        businessRegistryNumber,
        agreementDocumentUrl,
        shopPhoto,
        idDocumentUrl,
        validationStatus: 'PENDING',
        isCertified: false,
        active: false, // Inactif jusqu'à validation
        temporaryPassword: hashedPassword,
      },
    });

    // Créer un log d'audit
    await db.auditLog.create({
      data: {
        action: 'GARAGE_REGISTRATION',
        entityType: 'GARAGE',
        entityId: garage.id,
        details: JSON.stringify({
          garageName: name,
          managerName,
          managerPhone,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Votre demande d\'inscription a été envoyée avec succès',
      garageId: garage.id,
    });

  } catch (error: any) {
    console.error('Error registering garage:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
