import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all garages (backward compatible: returns as "agencies")
export async function GET() {
  try {
    const garages = await db.garage.findMany({
      include: {
        _count: {
          select: { vehicles: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Return with backward compatible key name
    return NextResponse.json({ agencies: garages, garages });

  } catch (error) {
    console.error('Get garages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new garage (requires userId - use garage registration flow)
export async function POST(request: NextRequest) {
  try {
    // Garage creation requires a user - use proper registration flow
    return NextResponse.json(
      { error: 'Use /api/register/garage for garage registration' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Create garage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update garage
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const garage = await db.garage.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
      }
    });

    return NextResponse.json({ agency: garage, garage });

  } catch (error) {
    console.error('Update garage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete garage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Garage ID is required' },
        { status: 400 }
      );
    }

    await db.garage.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete garage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
