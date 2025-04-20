// middleware.js
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const response = NextResponse.next();
  
  // Add pathname to headers
  response.headers.set('x-pathname', request.nextUrl.pathname);
  
  // Only require login for rate and profile pages (non-admin)
  const isRatingPath = request.nextUrl.pathname.startsWith('/rate');
  const isUserProfilePath = request.nextUrl.pathname.startsWith('/profile');
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  
  // Skip authentication middleware for admin paths
  if (isAdminPath) {
    return response;
  }
  
  // Skip middleware for all other non-protected paths
  if (!isRatingPath && !isUserProfilePath) {
    return response;
  }
  
  // Check if user is logged in
  const session = request.cookies.get('session')?.value;
  
  // If user is logged in, let them through
  if (session) {
    return response;
  }
  
  // For rate and profile pages, always require login
  console.log('[MIDDLEWARE] Protected route requires login');
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('showLogin', 'true');
  redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

// Match all routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};