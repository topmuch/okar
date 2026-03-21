import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Generate a unique slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
}

// GET - Récupérer la liste des demandes d'adhésion garages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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

// POST - Créer une nouvelle demande d'adhésion (public)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const managerName = formData.get('managerName') as string;
    
    // Validation
    if (!name || !phone || !managerName) {
      return NextResponse.json(
        { error: 'Le nom du garage, le téléphone et le nom du gérant sont obligatoires' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = generateSlug(name);

    // Check if slug already exists
    const existing = await db.garage.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un garage avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    // Handle file uploads (in production, you'd upload to cloud storage)
    // For now, we'll store placeholder URLs
    const shopPhoto = formData.get('shopPhoto') as File | null;
    const agreementDocument = formData.get('agreementDocument') as File | null;
    const idDocument = formData.get('idDocument') as File | null;

    // Create garage application
    const garage = await db.garage.create({
      data: {
        name,
        slug,
        phone,
        email: (formData.get('email') as string) || null,
        whatsappNumber: (formData.get('whatsappNumber') as string) || null,
        address: (formData.get('address') as string) || null,
        businessRegistryNumber: (formData.get('businessRegistryNumber') as string) || null,
        managerName,
        managerPhone: (formData.get('managerPhone') as string) || null,
        validationStatus: 'PENDING',
        isCertified: false,
        active: true,
        // Store file placeholders (in production, upload to cloud)
        shopPhoto: shopPhoto ? `/uploads/shops/${Date.now()}-${shopPhoto.name}` : null,
        agreementDocumentUrl: agreementDocument ? `/uploads/agreements/${Date.now()}-${agreementDocument.name}` : null,
        idDocumentUrl: idDocument ? `/uploads/ids/${Date.now()}-${idDocument.name}` : null,
      }
    });

    // Create notification for superadmin
    await db.notification.create({
      data: {
        type: 'GARAGE_APPLICATION',
        message: `Nouvelle demande d'adhésion: ${name}`,
        data: JSON.stringify({ garageId: garage.id, garageName: name }),
      }
    });

    return NextResponse.json({ 
      success: true, 
      garage,
      message: 'Votre demande a été envoyée avec succès' 
    });

  } catch (error: any) {
    console.error('Error creating garage application:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la demande' },
      { status: 500 }
    );
  }
}
