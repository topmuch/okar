import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const garageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessLicense: z.string().optional(),
  subscriptionPlan: z.enum(['basic', 'premium', 'enterprise']).optional(),
});

// GET - List all garages
export async function GET() {
  try {
    const garages = await db.garage.findMany({
      include: {
        _count: {
          select: { vehicles: true, users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ garages });

  } catch (error) {
    console.error('Get garages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new garage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = garageSchema.parse(body);

    // Check if slug already exists
    const existing = await db.garage.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const garage = await db.garage.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        businessLicense: validatedData.businessLicense || null,
        subscriptionPlan: validatedData.subscriptionPlan || 'basic',
      }
    });

    return NextResponse.json({ garage });

  } catch (error) {
    console.error('Create garage error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

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
    const { id, isCertified, ...data } = body;
    const validatedData = garageSchema.partial().parse(data);

    const updateData: Record<string, unknown> = { ...validatedData };
    
    // Handle certification separately (superadmin only)
    if (isCertified !== undefined) {
      updateData.isCertified = isCertified;
    }

    const garage = await db.garage.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ garage });

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
