// app/api/auth/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionCookie, revokeAllSessions } from '@/lib/server/auth-utils';

// Login endpoint - creates a session cookie from Firebase ID token
export async function POST(request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }
    
    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 14; // 2 weeks
    const sessionCookie = await createSessionCookie(idToken, expiresIn);
    
    // Set cookie
    const cookieStore = cookies();
    await cookieStore.set({
      name: 'session',
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Unauthorized request' },
      { status: 401 }
    );
  }
}

// Logout endpoint - clears the session cookie
export async function DELETE(request) {
  try {
    const { uid } = await request.json();
    
    // Revoke all sessions if uid is provided
    if (uid) {
      await revokeAllSessions(uid);
    }
    
    // Clear the session cookie
    const cookieStore = cookies();
    await cookieStore.set({
      name: 'session',
      value: '',
      maxAge: 0,
      path: '/',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}