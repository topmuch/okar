import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/garage/check-status?phone=XXX
 * Vérifie le statut d'un garage par son numéro de téléphone
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    // Normaliser le numéro de téléphone
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Rechercher le garage par téléphone
    const garage = await db.garage.findFirst({
      where: {
        phone: { contains: normalizedPhone.slice(-9) }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Aucun garage trouvé avec ce numéro de téléphone' },
        { status: 404 }
      );
    }

    // Vérifier le statut
    if (garage.isVerified && garage.isActive) {
      return NextResponse.json(
        {
          error: 'Votre garage est déjà validé. Vous pouvez vous connecter à votre espace.',
          garage: garage
        },
        { status: 400 }
      );
    }

    if (!garage.isVerified) {
      return NextResponse.json(
        {
          error: 'Votre demande est en cours d\'examen.',
          garage: garage
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      garage: garage,
      canResubmit: !garage.isActive,
    });

  } catch (error: any) {
    console.error('Error checking garage status:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
