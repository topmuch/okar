import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Session cookie name
const SESSION_COOKIE_NAME = 'okar_session';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/admin/connexion',
  '/admin/login',
  '/garage/connexion',
  '/garage/correction',
  '/agence/login',
  '/login',
  '/register',
  '/devenir-partenaire',
  '/v/',  // QR scan pages
  '/scan',
  '/api/auth',
  '/api/init-demo',
  '/api/upload',
  '/api/webhook',
  '/api/public',
  '/api/register',
  '/api/garage/check-status',
  '/api/garage/resubmit',
];

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
  
  // 1. Check if it's a public route - always allow
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Check for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // 3. Check if user has a session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 4. Determine if it's an API route or page route
  const isApiRoute = API_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith('/admin');
  const isGarageRoute = pathname.startsWith('/garage') && !pathname.startsWith('/garage/connexion') && !pathname.startsWith('/garage/correction');

  // 5. If no session cookie, deny access
  if (!sessionCookie) {
    if (isApiRoute) {
      // Return JSON error for API routes
      return NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    if (isAdminRoute) {
      // Redirect to admin login
      const loginUrl = new URL('/admin/connexion', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (isGarageRoute) {
      // Redirect to garage login
      const loginUrl = new URL('/garage/connexion', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // For other routes, allow but let client handle
    return NextResponse.next();
  }

  // 6. Session cookie exists - allow request to proceed
  // Full session validation happens in API handlers via getSession()
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
