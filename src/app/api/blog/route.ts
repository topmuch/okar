import { NextRequest, NextResponse } from 'next/server';

// GET - List published blog posts (placeholder - no blog model)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Return empty posts as blog functionality is not configured
    return NextResponse.json({
      posts: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ posts: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
  }
}
