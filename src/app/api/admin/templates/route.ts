import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

// GET /api/admin/templates - List message templates
export async function GET(request: NextRequest) {
  try {
    const templates = await db.messageTemplate.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/templates - Create template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, category, subject, content, variables, isActive } = body;

    if (!name || !content) {
      return NextResponse.json({ error: 'Nom et contenu requis' }, { status: 400 });
    }

    const template = await db.messageTemplate.create({
      data: {
        name,
        slug: slugify(name),
        type: type || 'SMS',
        category: category || 'WELCOME',
        subject,
        content,
        variables,
        isActive: isActive ?? true
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
