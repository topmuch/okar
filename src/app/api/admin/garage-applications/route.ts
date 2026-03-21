import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Récupérer la liste des demandes d'adhésion garages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé. Privilèges SuperAdmin requis.' }, { status: 403 });
    }

    const applications = await db.garage.findMany({
      where: {
        // Récupérer tous les garages (PENDING, APPROVED, REJECTED)
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
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
        validationStatus: true,
        rejectionReason: true,
        createdAt: true,
        validatedAt: true,
        validatedBy: true,
        isCertified: true,
        // PARTIE 1.5 - Suspension manuelle
        accountStatus: true,
        suspendedAt: true,
        suspendedBy: true,
        suspensionReason: true,
        contractEndDate: true,
        active: true,
      },
    });

    return NextResponse.json({ applications });

  } catch (error: any) {
    console.error('Error fetching garage applications:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des demandes' },
      { status: 500 }
    );
  }
}
