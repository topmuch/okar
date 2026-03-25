import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * POST - Resubmit garage application after rejection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'garage' || !session.garageId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const garageId = session.garageId; // Now we know it's not null
    const body = await request.json();
    const { name, address, city, phone, email, description } = body;

    // Get garage
    const garage = await db.garage.findUnique({
      where: { id: garageId }
    });

    if (!garage) {
      return NextResponse.json({ error: 'Garage non trouvé' }, { status: 404 });
    }

    // Update garage with new data
    const updatedGarage = await db.garage.update({
      where: { id: garageId },
      data: {
        name: name || garage.name,
        address: address || garage.address,
        city: city || garage.city,
        phone: phone || garage.phone,
        email: email || garage.email,
        description: description || garage.description,
        isVerified: false,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Demande renvoyée avec succès',
      garage: updatedGarage
    });

  } catch (error) {
    console.error('Error resubmitting garage application:', error);
    return NextResponse.json(
      { error: 'Erreur lors du renvoi de la demande' },
      { status: 500 }
    );
  }
}
