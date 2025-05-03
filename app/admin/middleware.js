// app/admin/middleware.js
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/server/firebase-admin';

export async function middleware(request) {
  // Get session cookie from request
  const sessionCookie = request.cookies.get('session')?.value;
  
  // Create a response object
  const response = NextResponse.next();
  
  if (!sessionCookie) {
    console.log('[ADMIN MIDDLEWARE] No session cookie found');
    return NextResponse.redirect(new URL('/login?redirectTo=/admin', request.url));
  }
  
  try {
    // Verify session
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;
    
    // Check admin status
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log('[ADMIN MIDDLEWARE] User document not found');
      return NextResponse.redirect(new URL('/login?error=no_user', request.url));
    }
    
    const userData = userDoc.data();
    const isAdmin = userData.role === 'admin' || userData.isAdmin === true;
    
    if (!isAdmin) {
      console.log('[ADMIN MIDDLEWARE] User is not an admin');
      return NextResponse.redirect(new URL('/?error=access_denied', request.url));
    }
    
    // User is authenticated and is an admin, allow access
    return response;
  } catch (error) {
    console.error('[ADMIN MIDDLEWARE] Error verifying session:', error);
    
    // Clear the invalid session cookie
    const redirectUrl = new URL('/login?error=session_expired', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.delete('session');
    
    return redirectResponse;
  }
}