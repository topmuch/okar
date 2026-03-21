import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { z } from 'zod';

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
          select: { vehicles: true, users: true }
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

    // Generate slug if not provided
    const slug = validatedData.slug || generateSlug(validatedData.name);

    // Check if slug already exists
    const existing = await db.garage.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un garage avec ce slug existe déjà' },
        { status: 400 }
      );
    }

    const garage = await db.garage.create({
      data: {
        name: validatedData.name,
        slug,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        businessLicense: validatedData.businessLicense || null,
        subscriptionPlan: validatedData.subscriptionPlan || 'basic',
        managerName: validatedData.managerName || null,
        managerPhone: validatedData.managerPhone || null,
        whatsappNumber: validatedData.whatsappNumber || null,
        validationStatus: validatedData.validationStatus || 'APPROVED',
        isCertified: validatedData.isCertified ?? true,
      }
    });

    // Log creation
    await db.auditLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        action: 'GARAGE_CREATED',
        entityType: 'GARAGE',
        entityId: garage.id,
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        details: JSON.stringify({
          garageName: garage.name,
          slug: garage.slug,
        }),
      },
    });

    return NextResponse.json({ garage });

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
