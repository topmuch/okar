import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// Session cookie name - MUST match lib/session.ts
// ============================================
const SESSION_COOKIE_NAME = 'okar_session';

// ============================================
// DEBUG MODE
// ============================================
const DEBUG = process.env.NODE_ENV === 'development';

function debugLog(req: NextRequest, message: string, data?: Record<string, unknown>) {
  if (DEBUG) {
    console.log(`[MW] ${req.nextUrl.pathname} - ${message}`, data || '');
  }
}

// ============================================
// Routes that NEVER require authentication
// ============================================
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/admin/connexion',
  '/admin/login',
  '/garage/connexion',
  '/garage/inscrire',
  '/garage/activate',
  '/garage/correction',
  '/agence/login',
  '/devenir-partenaire',
  '/inscrire',
  '/forgot-password',
  '/reset-password',
]);

// Routes that start with these prefixes are public
const PUBLIC_PREFIXES = [
  '/v/',           // QR scan pages
  '/scan/',        // QR scan pages
  '/activate/',    // QR activation pages
  '/api/auth',     // Auth API
  '/api/init-demo',
  '/api/upload',
  '/api/webhook',
  '/api/public',
  '/api/register',
  '/api/setup',
  '/api/garage/check-status',
  '/api/garage/resubmit',
  '/api/activate',
  '/api/admin/garage-applications',
  '/api/reports/public',
];

// Login page for each area
const LOGIN_PAGES: Record<string, string> = {
  admin: '/admin/connexion',
  garage: '/garage/connexion',
  agence: '/agence/login',
  driver: '/login',
};

// ============================================
// Helper functions
// ============================================
function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (PUBLIC_ROUTES.has(pathname)) return true;
  
  // Prefix match
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  
  return false;
}

function getArea(pathname: string): string | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/garage')) return 'garage';
  if (pathname.startsWith('/agence')) return 'agence';
  if (pathname.startsWith('/driver')) return 'driver';
  return null;
}

// ============================================
// Middleware
// ============================================
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 1. Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Skip public routes
  if (isPublicRoute(pathname)) {
    debugLog(req, 'Public route, allowing');
    return NextResponse.next();
  }

  // 3. Determine if this is a protected area
  const area = getArea(pathname);
  if (!area) {
    // Not a protected area, allow
    return NextResponse.next();
  }

  // 4. Check for session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    // No session cookie - redirect to login
    debugLog(req, 'No session cookie, redirecting to login');
    const loginPath = LOGIN_PAGES[area] || '/login';
    const loginUrl = new URL(loginPath, req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Session cookie exists - allow request
  // Note: We don't validate the session here for performance
  // The AuthContext will validate it client-side
  debugLog(req, 'Session cookie found, allowing');
  return NextResponse.next();
}

// ============================================
// Config - Which routes to match
// ============================================
export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    // Garage routes
    '/garage/:path*',
    // Agence routes
    '/agence/:path*',
    // Driver routes
    '/driver/:path*',
  ],
};
