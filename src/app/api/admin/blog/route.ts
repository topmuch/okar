import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - List all blog posts (Admin/SuperAdmin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const isAdmin = ['superadmin', 'admin'].includes(user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get total count
    const total = await db.blogPost.count({ where });

    // Get posts
    const posts = await db.blogPost.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des articles' },
      { status: 500 }
    );
  }
}

// POST - Create new blog post (Admin/SuperAdmin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const isAdmin = ['superadmin', 'admin'].includes(user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      coverImage,
      status,
      author
    } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titre et contenu requis' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(title);
    const existingPost = await db.blogPost.findUnique({ where: { slug } });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create post
    const post = await db.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        status: status || 'draft',
        author: author || user.name || 'Admin'
      }
    });

    return NextResponse.json({ success: true, post });

  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'article: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update blog post (Admin/SuperAdmin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const isAdmin = ['superadmin', 'admin'].includes(user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      title,
      content,
      excerpt,
      coverImage,
      status,
      author
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'article requis' },
        { status: 400 }
      );
    }

    // Check if post exists
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    // Generate new slug if title changed
    let slug = existing.slug;
    if (title && title !== existing.title) {
      slug = generateSlug(title);
      const slugExists = await db.blogPost.findFirst({
        where: { slug, id: { not: id } }
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Update post
    const post = await db.blogPost.update({
      where: { id },
      data: {
        title: title || existing.title,
        slug,
        content: content || existing.content,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
        status: status || existing.status,
        author: author || existing.author
      }
    });

    return NextResponse.json({ success: true, post });

  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'article' },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog post (SuperAdmin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only superadmin can delete
    if (user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé - SuperAdmin requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'article requis' },
        { status: 400 }
      );
    }

    // Delete post
    await db.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'article' },
      { status: 500 }
    );
  }
}
