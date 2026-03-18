import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch garage profile (backward compatible with agency naming)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('agencyId') || searchParams.get('garageId');

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

    // Return with backward compatible key name
    return NextResponse.json({ agency: garage, garage });

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
    const garageId = body.agencyId || body.garageId;
    const { name, email, phone, address } = body;

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
      },
    });

    // Return with backward compatible key name
    return NextResponse.json({ success: true, agency: garage, garage });

  } catch (error) {
    console.error('Error updating garage profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
