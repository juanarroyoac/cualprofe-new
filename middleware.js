// middleware.js
import { NextResponse } from 'next/server';

// Only protect rate and profile pages, let teacher pages be handled client-side
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Only require login for rate and profile pages
  const isRatingPath = pathname.startsWith('/rate');
  const isUserProfilePath = pathname.startsWith('/profile');
  
  // Skip middleware for all other paths
  if (!isRatingPath && !isUserProfilePath) {
    return NextResponse.next();
  }
  
  // Check if user is logged in
  const session = request.cookies.get('session')?.value;
  
  // If user is logged in, let them through
  if (session) {
    return NextResponse.next();
  }
  
  // For rate and profile pages, always require login
  console.log('[MIDDLEWARE] Protected route requires login');
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('showLogin', 'true');
  redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

// Only run middleware on protected paths
export const config = {
  matcher: [
    '/rate/:path*',
    '/profile/:path*',
  ],
};