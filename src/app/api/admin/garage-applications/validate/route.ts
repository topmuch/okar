import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

// Fonction pour générer un mot de passe temporaire
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Fonction pour générer un email unique pour le garage
function generateGarageEmail(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}_${random}@okar.sn`;
}

// POST - Valider ou rejeter une demande d'adhésion
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { garageId, action, rejectionReason } = body;

    if (!garageId || !action) {
      return NextResponse.json(
        { error: 'garageId et action sont requis' },
        { status: 400 }
      );
    }

    // Récupérer le garage
    const garage = await db.garage.findUnique({
      where: { id: garageId },
    });

    if (!garage) {
      return NextResponse.json({ error: 'Garage non trouvé' }, { status: 404 });
    }

    // Check if already verified (using isVerified instead of validationStatus)
    if (garage.isVerified && action !== 'update') {
      return NextResponse.json(
        { error: 'Ce garage est déjà validé' },
        { status: 400 }
      );
    }

    const adminId = session.id;

    if (action === 'approve') {
      // Générer les identifiants
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      const garageEmail = garage.email || generateGarageEmail(garage.name);

      // Créer ou mettre à jour l'utilisateur garage
      let user = await db.user.findUnique({
        where: { email: garageEmail },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            email: garageEmail,
            name: garage.name,
            phone: garage.phone,
            password: hashedPassword,
            role: 'garage',
            garageId: garage.id,
            emailVerified: new Date(),
          },
        });
      } else {
        await db.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            role: 'garage',
            garageId: garage.id,
            emailVerified: new Date(),
          },
        });
      }

      // Valider le garage
      const updatedGarage = await db.garage.update({
        where: { id: garageId },
        data: {
          isVerified: true,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Garage validé avec succès',
        garage: updatedGarage,
        credentials: {
          email: garageEmail,
          temporaryPassword,
        },
      });

    } else if (action === 'reject') {
      if (!rejectionReason || rejectionReason.trim() === '') {
        return NextResponse.json(
          { error: 'Le motif de rejet est obligatoire' },
          { status: 400 }
        );
      }

      // Désactiver le garage
      const updatedGarage = await db.garage.update({
        where: { id: garageId },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Demande rejetée',
        garage: updatedGarage,
      });

    } else {
      return NextResponse.json(
        { error: 'Action non valide. Utilisez "approve" ou "reject"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error processing garage application:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du traitement de la demande' },
      { status: 500 }
    );
  }
}
