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
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar la cookie de sesión y obtener datos del usuario
    let userData;
    try {
      userData = await verifySessionCookie(sessionCookie);
    } catch (error) {
      console.error('Error verificando cookie de sesión:', error);
      return NextResponse.json(
        { success: false, message: 'Sesión inválida' },
        { status: 401 }
      );
    }
    
    // Comprobar si el usuario es administrador
    if (!userData.admin) {
      return NextResponse.json(
        { success: false, message: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener ID del profesor de la solicitud
    let professorId;
    try {
      const body = await request.json();
      professorId = body.professorId;
    } catch (error) {
      console.error('Error al parsear la solicitud:', error);
      return NextResponse.json(
        { success: false, message: 'Formato de solicitud inválido' },
        { status: 400 }
      );
    }
    
    if (!professorId) {
      return NextResponse.json(
        { success: false, message: 'ID de profesor no proporcionado' },
        { status: 400 }
      );
    }

    // Verificar si el profesor existe antes de eliminarlo
    try {
      const professorDoc = await adminFirestore.collection('teachers').doc(professorId).get();
      
      if (!professorDoc.exists) {
        return NextResponse.json(
          { success: false, message: 'El profesor no existe en la base de datos' },
          { status: 404 }
        );
      }

      // Eliminar el documento del profesor
      await adminFirestore.collection('teachers').doc(professorId).delete();
      
      return NextResponse.json({ success: true, message: 'Profesor eliminado correctamente' });
    } catch (firestoreError) {
      console.error('Error de Firestore:', firestoreError);
      return NextResponse.json(
        { success: false, message: 'Error al acceder a la base de datos', error: firestoreError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error general eliminando profesor:', error);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar el profesor', error: error.message },
      { status: 500 }
    );
  }
}