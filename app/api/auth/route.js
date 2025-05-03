// app/api/admin/ratings/delete/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// Corregir la ruta de importación para authOptions
import { authOptions } from '@/lib/auth-config.js';
import { adminAuth, adminFirestore } from '@/lib/server/firebase-admin'; // Ensure this path is correct too

export async function POST(request) {
  try {
    // Verify user is authenticated and has admin rights
    const session = await getServerSession(authOptions); // Pass authOptions here
    if (!session) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Get user and check if they're an admin
    const userEmail = session.user?.email; // Optional chaining for safety
    if (!userEmail) {
        return NextResponse.json(
            { message: 'Correo electrónico del usuario no encontrado en la sesión' },
            { status: 400 }
        );
    }
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
    // Improved error logging
    let errorMessage = 'Error al eliminar la calificación';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { message: 'Error al eliminar la calificación', error: errorMessage },
      { status: 500 }
    );
  }
}