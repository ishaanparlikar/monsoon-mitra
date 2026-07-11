import { createMiddlewareClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/plan', '/alerts', '/shelters', '/sos', '/profile', '/family'];
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // Auth routes that should redirect to dashboard if already authenticated
  const authPaths = ['/login', '/register', '/otp'];
  const isAuthPath = authPaths.some(path => req.nextUrl.pathname.startsWith(path));

  const { data: { session } } = await supabase.auth.getSession();

  if (isProtectedPath && !session) {
    // Redirect to login with redirect back to intended page
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && session) {
    // Redirect authenticated users away from auth pages
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};