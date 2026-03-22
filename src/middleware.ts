import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Session cookie name
const SESSION_COOKIE_NAME = 'okar_session';

// Public routes that don't require authentication (exact matches or prefixes)
const PUBLIC_ROUTES = [
  '/admin/connexion',
  '/admin/login',
  '/garage/connexion',
  '/garage/correction',
  '/agence/login',
  '/login',
  '/register',
  '/devenir-partenaire',
  '/inscrire',
  '/forgot-password',
  '/reset-password',
  '/v/',  // QR scan pages
  '/scan/',
  '/activate/',  // QR activation pages
  '/api/auth',
  '/api/init-demo',
  '/api/upload',
  '/api/webhook',
  '/api/public',
  '/api/register',
  '/api/garage/check-status',
  '/api/garage/resubmit',
  '/api/activate',
];

// Routes that should always pass through (no redirect loop possible)
const ALLOWED_PATHS = new Set([
  '/admin/connexion',
  '/admin/login',
]);

// API routes that require special handling (return 401 instead of redirect)
const API_ROUTES = [
  '/api/admin',
  '/api/garage',
  '/api/driver',
];

/**
 * Middleware for route protection with server-side session verification
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 1. Check if it's a static file or Next.js internals - always allow
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // 2. Check if it's an allowed path (exact match) - always allow without session check
  if (ALLOWED_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // 3. Check if it's a public route - always allow
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    // Exact match for login pages
    if (pathname === route) return true;
    // Prefix match for API routes and scan pages
    if (route.endsWith('/')) return pathname.startsWith(route);
    return pathname.startsWith(route + '/') || pathname === route;
  });
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 4. Check for session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 5. Determine route type
  const isApiRoute = API_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith('/admin');
  const isGarageRoute = pathname.startsWith('/garage') && !pathname.startsWith('/garage/connexion') && !pathname.startsWith('/garage/correction');

  // 6. If no session cookie, deny access
  if (!sessionCookie) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    if (isAdminRoute) {
      const loginUrl = new URL('/admin/connexion', req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    if (isGarageRoute) {
      const loginUrl = new URL('/garage/connexion', req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  }

  // 7. Session cookie exists - allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    // Garage routes
    '/garage/:path*',
    // API routes
    '/api/admin/:path*',
    '/api/garage/:path*',
    '/api/driver/:path*',
  ],
};
