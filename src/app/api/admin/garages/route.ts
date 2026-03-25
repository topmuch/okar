import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schema
const garageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  // Login credentials
  loginEmail: z.string().email().optional().or(z.literal('')),
  loginPassword: z.string().optional(),
});

/**
 * Verify authentication and admin role
 */
async function verifyAdminAuth() {
  const session = await getSession();

  if (!session) {
    return { authorized: false, error: 'Non authentifié', status: 401 };
  }

  if (!['superadmin', 'admin', 'agent'].includes(session.role)) {
    return { authorized: false, error: 'Accès non autorisé. Droits admin requis.', status: 403 };
  }

  return { authorized: true, user: session };
}

// GET - List all garages
export async function GET() {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const garages = await db.garage.findMany({
      include: {
        _count: {
          select: { vehicles: true }
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
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const validatedData = garageSchema.parse(body);

    // Validate login credentials
    if (!validatedData.loginEmail) {
      return NextResponse.json(
        { error: "L'email de connexion est obligatoire" },
        { status: 400 }
      );
    }
    if (!validatedData.loginPassword) {
      return NextResponse.json(
        { error: 'Le mot de passe est obligatoire' },
        { status: 400 }
      );
    }

    // Check if login email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.loginEmail.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.loginPassword, 10);

    // Create garage and user in a transaction
    const loginEmail = validatedData.loginEmail!.toLowerCase();

    const result = await db.$transaction(async (tx) => {
      // Create user account for garage first
      const user = await tx.user.create({
        data: {
          email: loginEmail,
          name: validatedData.name,
          phone: validatedData.phone || null,
          password: hashedPassword,
          role: 'garage',
          emailVerified: new Date(),
        }
      });

      // Create garage with userId
      const garage = await tx.garage.create({
        data: {
          name: validatedData.name,
          email: validatedData.email || loginEmail || null,
          phone: validatedData.phone || '',
          address: validatedData.address || '',
          city: validatedData.city || '',
          description: validatedData.description || null,
          isVerified: true,
          isActive: true,
          userId: user.id,
        }
      });

      // Update user with garageId
      await tx.user.update({
        where: { id: user.id },
        data: { garageId: garage.id }
      });

      return { garage, user };
    });

    return NextResponse.json({ garage: result.garage });

  } catch (error) {
    console.error('Create garage error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Update garage
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, ...data } = body;

    const garage = await db.garage.update({
      where: { id },
      data
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
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (auth.user!.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Seul le superadmin peut supprimer un garage' },
        { status: 403 }
      );
    }

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
