// app/api/admin/professors/delete/route.js
import { NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/server/firebase-admin';
import { verifySessionCookie } from '@/lib/server/auth-utils';

export async function POST(request) {
  try {
    // Obtener la cookie de sesión de la solicitud
    const cookies = request.cookies;
    const sessionCookie = cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar la cookie de sesión y obtener datos del usuario
    const userData = await verifySessionCookie(sessionCookie);
    
    // Comprobar si el usuario es administrador
    if (!userData.admin) {
      return NextResponse.json(
        { message: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener ID del profesor de la solicitud
    const { professorId } = await request.json();
    if (!professorId) {
      return NextResponse.json(
        { message: 'ID de profesor no proporcionado' },
        { status: 400 }
      );
    }

    // Eliminar el documento del profesor
    await adminFirestore.collection('teachers').doc(professorId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando profesor:', error);
    return NextResponse.json(
      { message: 'Error al eliminar el profesor', error: error.message },
      { status: 500 }
    );
  }
}