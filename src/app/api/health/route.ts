import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/health - Health check endpoint for Coolify/Docker
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'OKAR',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed' 
      },
      { status: 500 }
    );
  }
}
