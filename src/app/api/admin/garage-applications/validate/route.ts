import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { 
  sendGarageApprovalNotification, 
  sendGarageRejectionNotification 
} from '@/lib/notification-service';

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
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
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

    if (garage.validationStatus !== 'PENDING' && action !== 'update') {
      return NextResponse.json(
        { error: 'Cette demande a déjà été traitée' },
        { status: 400 }
      );
    }

    const adminId = session.user.id;
    const adminEmail = session.user.email;

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
            name: garage.managerName || garage.name,
            phone: garage.whatsappNumber || garage.phone,
            password: hashedPassword,
            role: 'garage',
            garageId: garage.id,
            emailVerified: true,
          },
        });
      } else {
        // Mettre à jour l'utilisateur existant
        await db.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            role: 'garage',
            garageId: garage.id,
            emailVerified: true,
          },
        });
      }

      // Valider le garage
      const updatedGarage = await db.garage.update({
        where: { id: garageId },
        data: {
          validationStatus: 'APPROVED',
          isCertified: true,
          active: true,
          validatedAt: new Date(),
          validatedBy: adminId,
          email: garageEmail,
          temporaryPassword: hashedPassword,
        },
      });

      // Créer un log d'audit
      await db.auditLog.create({
        data: {
          action: 'APPROVE_GARAGE',
          entityType: 'GARAGE',
          entityId: garageId,
          userId: adminId,
          userEmail: adminEmail,
          garageId: garageId,
          details: JSON.stringify({
            garageName: garage.name,
            garageEmail: garageEmail,
            managerPhone: garage.whatsappNumber || garage.phone,
          }),
        },
      });

      // Envoyer les identifiants par notification multi-canal
      await sendGarageApprovalNotification({
        garageId: garage.id,
        garageName: garage.name,
        phone: garage.phone || '',
        whatsappNumber: garage.whatsappNumber,
        email: garageEmail,
        managerName: garage.managerName,
        managerPhone: garage.managerPhone,
        loginEmail: garageEmail,
        temporaryPassword: temporaryPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn'}/garage/connexion`,
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

      // Rejeter le garage
      const updatedGarage = await db.garage.update({
        where: { id: garageId },
        data: {
          validationStatus: 'REJECTED',
          rejectionReason: rejectionReason,
          validatedAt: new Date(),
          validatedBy: adminId,
        },
      });

      // Créer un log d'audit
      await db.auditLog.create({
        data: {
          action: 'REJECT_GARAGE',
          entityType: 'GARAGE',
          entityId: garageId,
          userId: adminId,
          userEmail: adminEmail,
          garageId: garageId,
          details: JSON.stringify({
            garageName: garage.name,
            rejectionReason: rejectionReason,
          }),
        },
      });

      // Notifier le demandeur via multi-canal
      await sendGarageRejectionNotification({
        garageId: garage.id,
        garageName: garage.name,
        phone: garage.phone || '',
        whatsappNumber: garage.whatsappNumber,
        email: garage.email,
        managerName: garage.managerName,
        managerPhone: garage.managerPhone,
        rejectionReason: rejectionReason,
        correctionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://okar.sn'}/garage/correction?phone=${encodeURIComponent(garage.phone || '')}`,
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

// Les fonctions de notification ont été déplacées vers /lib/notification-service.ts
