import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/garage/check-status?phone=XXX
 * Vérifie le statut d'un garage par son numéro de téléphone
 * Utilisé pour le flux de correction après rejet
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

    // Rechercher le garage par téléphone ou WhatsApp
    const garage = await db.garage.findFirst({
      where: {
        OR: [
          { phone: { contains: normalizedPhone.slice(-9) } },
          { whatsappNumber: { contains: normalizedPhone.slice(-9) } },
          { managerPhone: { contains: normalizedPhone.slice(-9) } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        address: true,
        managerName: true,
        managerPhone: true,
        businessRegistryNumber: true,
        agreementDocumentUrl: true,
        shopPhoto: true,
        idDocumentUrl: true,
        rejectionReason: true,
        validationStatus: true,
        accountStatus: true,
        createdAt: true,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Aucun garage trouvé avec ce numéro de téléphone' },
        { status: 404 }
      );
    }

    // Vérifier si le garage peut corriger sa demande
    if (garage.validationStatus === 'APPROVED') {
      return NextResponse.json(
        { 
          error: 'Votre garage est déjà validé. Vous pouvez vous connecter à votre espace.',
          garage: garage 
        },
        { status: 400 }
      );
    }

    if (garage.validationStatus === 'PENDING') {
      return NextResponse.json(
        { 
          error: 'Votre demande est en cours d\'examen. Vous serez notifié par SMS/WhatsApp une fois traitée.',
          garage: garage 
        },
        { status: 400 }
      );
    }

    // Le garage est rejeté, il peut corriger
    return NextResponse.json({
      success: true,
      garage: garage,
      canResubmit: garage.validationStatus === 'REJECTED',
    });

  } catch (error: any) {
    console.error('Error checking garage status:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
