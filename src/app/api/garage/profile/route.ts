import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch garage profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garageId');

    if (!garageId) {
      return NextResponse.json(
        { error: 'Garage ID is required' },
        { status: 400 }
      );
    }

    const garage = await db.garage.findUnique({
      where: { id: garageId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        isCertified: true,
        businessLicense: true,
        subscriptionPlan: true,
        active: true,
        createdAt: true,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ garage });

  } catch (error) {
    console.error('Error fetching garage profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

// PUT - Update garage profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { garageId, name, email, phone, address, logo, businessLicense } = body;

    if (!garageId) {
      return NextResponse.json(
        { error: 'Garage ID is required' },
        { status: 400 }
      );
    }

    const garage = await db.garage.update({
      where: { id: garageId },
      data: {
        name,
        email,
        phone,
        address,
        logo,
        businessLicense,
      },
    });

    return NextResponse.json({ success: true, garage });

  } catch (error) {
    console.error('Error updating garage profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
