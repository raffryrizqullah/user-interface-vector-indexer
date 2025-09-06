import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/'];

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard'];

// Define admin-only routes (require super_admin role)
const superAdminRoutes = ['/admin', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies (if using cookies) or prepare for client-side auth
  // Note: Since we're using localStorage, actual token validation needs to be client-side
  // This middleware primarily handles basic redirects
  
  // If accessing root path, redirect to login (client will handle auth check)
  if (pathname === '/') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // For protected routes, let client-side handle detailed authorization
  // Middleware focuses on basic route protection and redirects
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Client-side will handle authentication and role-based redirects
    return NextResponse.next();
  }

  // Handle explicit admin routes (if they exist as separate pages)
  if (superAdminRoutes.some(route => pathname.startsWith(route))) {
    // Redirect to dashboard - client-side will handle role-based access within dashboard
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};