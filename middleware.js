// middleware.js
import { NextResponse } from 'next/server';

// Only protect rate and profile pages, let teacher pages be handled client-side
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // Add pathname to headers for layout detection
  response.headers.set('x-pathname', pathname);
  
  // Only require login for rate and profile pages
  const isRatingPath = pathname.startsWith('/rate');
  const isUserProfilePath = pathname.startsWith('/profile');
  
  // Skip auth middleware for other paths but still pass the response with headers
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
  redirectUrl.searchParams.set('authRequired', 'true');
  redirectUrl.searchParams.set('redirectTo', pathname);
  return NextResponse.redirect(redirectUrl);
}

// Run middleware on ALL routes to add pathname header
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};