import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, logLoginAttempt } from '@/lib/session';

export async function POST(request: NextRequest) {
  const { email, password, role } = await request.json();

  try {
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        garage: true,
      },
    });

    if (!user) {
      // Log failed attempt - user not found
      await logLoginAttempt({
        email,
        success: false,
        failureReason: 'Utilisateur non trouvé',
      });

      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isValidPassword) {
      // Log failed attempt - wrong password
      await logLoginAttempt({
        userId: user.id,
        email,
        success: false,
        failureReason: 'Mot de passe incorrect',
      });

      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérifier le rôle
    if (role === 'admin' && user.role !== 'superadmin') {
      await logLoginAttempt({
        userId: user.id,
        email,
        success: false,
        failureReason: 'Accès admin non autorisé',
      });

      return NextResponse.json(
        { error: 'Accès non autorisé - Administrateur requis' },
        { status: 403 }
      );
    }



    // Vérifier le rôle garage
    if (role === 'garage' && user.role !== 'garage') {
      await logLoginAttempt({
        userId: user.id,
        email,
        success: false,
        failureReason: 'Accès garage non autorisé',
      });

      return NextResponse.json(
        { error: 'Accès non autorisé - Garage requis' },
        { status: 403 }
      );
    }

    // Vérifier le statut de validation du garage
    if (user.role === 'garage' && user.garageId) {
      const garage = await prisma.garage.findUnique({
        where: { id: user.garageId }
      });

      if (!garage || garage.validationStatus !== 'APPROVED') {
        await logLoginAttempt({
          userId: user.id,
          email,
          success: false,
          failureReason: 'Garage non validé',
        });

        const statusMessage = garage?.validationStatus === 'PENDING'
          ? 'Votre inscription est en cours de validation. Vous recevrez vos accès par SMS/WhatsApp une fois validée.'
          : garage?.validationStatus === 'REJECTED'
          ? `Votre inscription a été rejetée. Motif: ${garage.rejectionReason || 'Non spécifié'}`
          : 'Votre compte garage n\'est pas encore activé.';

        return NextResponse.json(
          { error: statusMessage, code: 'GARAGE_NOT_APPROVED' },
          { status: 403 }
        );
      }

      // Vérifier si le compte est suspendu par l'admin (PARTIE 1.5 - Suspension manuelle)
      if (garage.accountStatus === 'SUSPENDED_BY_ADMIN') {
        await logLoginAttempt({
          userId: user.id,
          email,
          success: false,
          failureReason: 'Compte garage suspendu',
        });

        const suspensionDate = garage.suspendedAt
          ? new Date(garage.suspendedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'date inconnue';

        const reasonText = garage.suspensionReason
          ? ` Motif: ${garage.suspensionReason}`
          : '';

        return NextResponse.json(
          {
            error: `Compte suspendu le ${suspensionDate}.${reasonText} Contactez l'administration OKAR.`,
            code: 'GARAGE_SUSPENDED'
          },
          { status: 403 }
        );
      }
    }

    // Créer une session sécurisée avec cookie HTTP-only
    await createSession(user.id);

    // Log successful login
    await logLoginAttempt({
      userId: user.id,
      email,
      success: true,
    });

    // Déterminer l'URL de redirection
    let redirectUrl = '/';
    if (user.role === 'superadmin') {
      redirectUrl = '/admin/tableau-de-bord';
    } else if (user.role === 'garage') {
      redirectUrl = '/garage/tableau-de-bord';
    } else if (user.role === 'driver') {
      redirectUrl = '/driver/tableau-de-bord';
    } else {
      redirectUrl = '/agence/tableau-de-bord';
    }

    // Retourner les infos utilisateur (sans le mot de passe)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        garageId: user.garageId,
        garage: user.garage,
      },
      redirectUrl,
    });
  } catch (error) {
    console.error('Login error:', error);

    // Log error
    await logLoginAttempt({
      email,
      success: false,
      failureReason: 'Erreur serveur',
    });

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
