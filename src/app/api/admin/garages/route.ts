import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Generate a unique slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
}

// Validation schema
const garageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessLicense: z.string().optional(),
  subscriptionPlan: z.enum(['basic', 'premium', 'enterprise']).optional(),
  managerName: z.string().optional(),
  managerPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  validationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isCertified: z.boolean().optional(),
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
    // Verify authentication
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const garages = await db.garage.findMany({
      include: {
        _count: {
          select: { Vehicle: true, User: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transformer les données pour inclure les champs de suspension
    const garagesWithStatus = garages.map(garage => ({
      ...garage,
      accountStatus: garage.accountStatus || 'ACTIVE',
      suspendedAt: garage.suspendedAt,
      suspendedBy: garage.suspendedBy,
      suspensionReason: garage.suspensionReason,
      contractEndDate: garage.contractEndDate,
    }));

    return NextResponse.json({ garages: garagesWithStatus });

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
    // Verify authentication
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

    // Generate slug if not provided
    const slug = validatedData.slug || generateSlug(validatedData.name);

    // Check if slug already exists
    const existingGarage = await db.garage.findUnique({
      where: { slug }
    });

    if (existingGarage) {
      return NextResponse.json(
        { error: 'Un garage avec ce slug existe déjà' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.loginPassword, 10);

    // Create garage and user in a transaction
    const now = new Date();
    const result = await db.$transaction(async (tx) => {
      // Create garage
      const garage = await tx.garage.create({
        data: {
          id: `garage-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          name: validatedData.name,
          slug,
          email: validatedData.email || validatedData.loginEmail || null,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          businessLicense: validatedData.businessLicense || null,
          subscriptionPlan: validatedData.subscriptionPlan || 'basic',
          managerName: validatedData.managerName || null,
          managerPhone: validatedData.managerPhone || null,
          whatsappNumber: validatedData.whatsappNumber || null,
          validationStatus: validatedData.validationStatus || 'APPROVED',
          isCertified: validatedData.isCertified ?? true,
          active: true,
          updatedAt: now,
        }
      });

      // Create user account for garage
      const user = await tx.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          email: validatedData.loginEmail.toLowerCase(),
          name: validatedData.managerName || validatedData.name,
          phone: validatedData.phone || null,
          password: hashedPassword,
          role: 'garage',
          garageId: garage.id,
          emailVerified: true,
          updatedAt: now,
        }
      });

      return { garage, user };
    });

    // Log creation
    await db.auditLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        action: 'GARAGE_CREATED',
        entityType: 'GARAGE',
        entityId: result.garage.id,
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        details: JSON.stringify({
          garageName: result.garage.name,
          slug: result.garage.slug,
          loginEmail: validatedData.loginEmail,
        }),
      },
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
    // Verify authentication
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, isCertified, ...data } = body;
    const validatedData = garageSchema.partial().parse(data);

    const updateData: Record<string, unknown> = { ...validatedData };
    
    // Handle certification separately (superadmin only)
    if (isCertified !== undefined && auth.user!.role === 'superadmin') {
      updateData.isCertified = isCertified;
    }

    const garage = await db.garage.update({
      where: { id },
      data: updateData
    });

    // Log update
    await db.auditLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        action: 'GARAGE_UPDATED',
        entityType: 'GARAGE',
        entityId: garage.id,
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        details: JSON.stringify({
          garageName: garage.name,
          updatedFields: Object.keys(updateData),
        }),
      },
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
    // Verify authentication - only superadmin can delete
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

    // Get garage info before deletion
    const garage = await db.garage.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage non trouvé' },
        { status: 404 }
      );
    }

    await db.garage.delete({
      where: { id }
    });

    // Log deletion
    await db.auditLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        action: 'GARAGE_DELETED',
        entityType: 'GARAGE',
        entityId: id,
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        details: JSON.stringify({
          garageName: garage.name,
          slug: garage.slug,
        }),
      },
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
