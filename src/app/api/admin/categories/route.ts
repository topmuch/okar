import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

// GET /api/admin/categories - List intervention categories
export async function GET(request: NextRequest) {
  try {
    const categories = await db.interventionCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { children: true }
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
    const body = await request.json();
    const { name, icon, color, parentId, avgCostMin, avgCostMax, avgDuration, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    const category = await db.interventionCategory.create({
      data: {
        name,
        slug: slugify(name),
        icon,
        color,
        parentId,
        avgCostMin,
        avgCostMax,
        avgDuration,
        isActive: isActive ?? true
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
