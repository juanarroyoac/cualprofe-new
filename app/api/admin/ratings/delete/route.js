// app/api/admin/ratings/delete/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { adminAuth, adminFirestore } from '@/lib/server/firebase-admin';

export async function POST(request) {
  try {
    // Verify user is authenticated and has admin rights
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Get user and check if they're an admin
    const userEmail = session.user.email;
    const userRecord = await adminAuth.getUserByEmail(userEmail);
    
    // Check custom claims for admin role
    const customClaims = userRecord.customClaims || {};
    if (!customClaims.admin) {
      return NextResponse.json(
        { message: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Get rating ID from request
    const { ratingId } = await request.json();
    if (!ratingId) {
      return NextResponse.json(
        { message: 'ID de calificación no proporcionado' },
        { status: 400 }
      );
    }

    // Delete the rating document
    await adminFirestore.collection('ratings').doc(ratingId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { message: 'Error al eliminar la calificación', error: error.message },
      { status: 500 }
    );
  }
}