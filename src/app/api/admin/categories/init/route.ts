import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

const DEFAULT_CATEGORIES = [
  { name: 'Vidange', icon: '🛢️', color: '#3B82F6' },
  { name: 'Freins', icon: '🛑', color: '#EF4444' },
  { name: 'Pneumatique', icon: '🛞', color: '#10B981' },
  { name: 'Batterie', icon: '🔋', color: '#F59E0B' },
  { name: 'Climatisation', icon: '❄️', color: '#06B6D4' },
  { name: 'Électricité', icon: '⚡', color: '#8B5CF6' },
  { name: 'Moteur', icon: '🔧', color: '#EC4899' },
  { name: 'Transmission', icon: '⚙️', color: '#6366F1' },
  { name: 'Suspension', icon: '🚗', color: '#14B8A6' },
  { name: 'Échappement', icon: '💨', color: '#6B7280' },
];

// POST - Initialize default categories
export async function POST() {
  try {
    const user = await getSession();

    if (!user || !['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if categories already exist
    const existing = await db.interventionCategory.count();
    if (existing > 0) {
      return NextResponse.json(
        { error: 'Des catégories existent déjà', count: existing },
        { status: 400 }
      );
    }

    // Create default categories
    const created = await Promise.all(
      DEFAULT_CATEGORIES.map((cat) =>
        db.interventionCategory.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: created.length,
      categories: created
    });
  } catch (error) {
    console.error('Error initializing categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
