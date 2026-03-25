import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/admin/categories - List intervention categories
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !['superadmin', 'admin', 'agent', 'garage'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const categories = await db.interventionCategory.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    const category = await db.interventionCategory.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        color: color || null
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/admin/categories - Update category
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, icon, color } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const category = await db.interventionCategory.update({
      where: { id },
      data: {
        name,
        description: description || null,
        icon: icon || null,
        color: color || null
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/categories - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await db.interventionCategory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
