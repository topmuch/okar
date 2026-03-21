import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/garage/resubmit
 * Resoumet une demande de garage après correction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      garageId,
      agreementDocumentUrl,
      shopPhoto,
      idDocumentUrl,
      additionalNotes,
      updatedInfo,
    } = body;

    if (!garageId) {
      return NextResponse.json(
        { error: 'ID garage requis' },
        { status: 400 }
      );
    }

    // Vérifier que le garage existe et est rejeté
    const garage = await db.garage.findUnique({
      where: { id: garageId },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    if (garage.validationStatus !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Seuls les garages rejetés peuvent resoumettre leur demande' },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      validationStatus: 'PENDING', // Remettre en attente
      rejectionReason: null, // Effacer l'ancien motif de rejet
      updatedAt: new Date(),
    };

    // Mettre à jour les documents si fournis
    if (agreementDocumentUrl) {
      updateData.agreementDocumentUrl = agreementDocumentUrl;
    }
    if (shopPhoto) {
      updateData.shopPhoto = shopPhoto;
    }
    if (idDocumentUrl) {
      updateData.idDocumentUrl = idDocumentUrl;
    }

    // Mettre à jour les informations si fournies
    if (updatedInfo) {
      if (updatedInfo.name) updateData.name = updatedInfo.name;
      if (updatedInfo.email !== undefined) updateData.email = updatedInfo.email;
      if (updatedInfo.phone) updateData.phone = updatedInfo.phone;
      if (updatedInfo.whatsappNumber) updateData.whatsappNumber = updatedInfo.whatsappNumber;
      if (updatedInfo.address) updateData.address = updatedInfo.address;
      if (updatedInfo.managerName) updateData.managerName = updatedInfo.managerName;
      if (updatedInfo.managerPhone) updateData.managerPhone = updatedInfo.managerPhone;
      if (updatedInfo.businessRegistryNumber) updateData.businessRegistryNumber = updatedInfo.businessRegistryNumber;
    }

    // Mettre à jour le garage
    const updatedGarage = await db.garage.update({
      where: { id: garageId },
      data: updateData,
    });

    // Créer un log d'audit
    await db.auditLog.create({
      data: {
        action: 'GARAGE_RESUBMITTED',
        entityType: 'GARAGE',
        entityId: garageId,
        details: JSON.stringify({
          garageName: garage.name,
          previousRejectionReason: garage.rejectionReason,
          additionalNotes: additionalNotes || null,
          updatedDocuments: {
            agreementDocument: !!agreementDocumentUrl,
            shopPhoto: !!shopPhoto,
            idDocument: !!idDocumentUrl,
          },
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // Créer une notification pour les admins
    await db.notification.create({
      data: {
        type: 'GARAGE_RESUBMITTED',
        message: `Le garage "${garage.name}" a corrigé et resoumis sa demande.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Votre demande a été mise à jour et sera réexaminée par notre équipe.',
      garage: {
        id: updatedGarage.id,
        name: updatedGarage.name,
        validationStatus: updatedGarage.validationStatus,
      },
    });

  } catch (error: any) {
    console.error('Error resubmitting garage application:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la resoumission' },
      { status: 500 }
    );
  }
}
