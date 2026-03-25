import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Fetch garage profile
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'garage' || !session.garageId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const garage = await db.garage.findUnique({
      where: { id: session.garageId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        description: true,
        logo: true,
        isVerified: true,
        isActive: true,
        subscriptionPlan: true,
        createdAt: true,
      },
    });

    if (!garage) {
      return NextResponse.json({ error: 'Garage non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ garage });

  } catch (error) {
    console.error('Error fetching garage profile:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du profil' }, { status: 500 });
  }
}

// PUT - Update garage profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'garage' || !session.garageId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, address, city, description, logo } = body;

    const garage = await db.garage.update({
      where: { id: session.garageId },
      data: {
        name,
        email,
        phone,
        address,
        city,
        description,
        logo,
      },
    });

    return NextResponse.json({ success: true, garage });

  } catch (error) {
    console.error('Error updating garage profile:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil' }, { status: 500 });
  }
}
