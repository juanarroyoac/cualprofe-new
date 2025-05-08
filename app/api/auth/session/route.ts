import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth as auth } from '@/lib/server/firebase-admin';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'No session cookie found' }, { status: 401 });
    }

    // Verify the session cookie
    await auth.verifySessionCookie(sessionCookie.value);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
  }
} 