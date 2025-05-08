import { NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/server/firebase-admin';
import { verifySessionCookie } from '@/lib/server/auth-utils';

export async function POST(request) {
  try {
    // Obtener la cookie de sesión de la solicitud
    const cookies = request.cookies;
    const sessionCookie = cookies.get('session')?.value;
    
    console.log('Cookie de sesión presente:', !!sessionCookie);
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'No autenticado - Cookie de sesión no encontrada' },
        { status: 401 }
      );
    }

    // Verificar la cookie de sesión y obtener datos del usuario
    let userData;
    try {
      userData = await verifySessionCookie(sessionCookie);
      console.log('Datos del usuario:', { ...userData, uid: '[REDACTED]' });
    } catch (error) {
      console.error('Error verificando cookie de sesión:', error);
      return NextResponse.json(
        { success: false, message: 'Sesión inválida o expirada', error: error.message },
        { status: 401 }
      );
    }
    
    // Comprobar si el usuario es administrador
    if (!userData.admin) {
      return NextResponse.json(
        { success: false, message: 'Permisos insuficientes - Usuario no es administrador' },
        { status: 403 }
      );
    }

    // Obtener datos del profesor de la solicitud
    let professorId, professorData;
    try {
      const body = await request.json();
      professorId = body.professorId;
      professorData = body.professorData;
      
      console.log('Datos recibidos:', { professorId, professorData });
    } catch (error) {
      console.error('Error al parsear la solicitud:', error);
      return NextResponse.json(
        { success: false, message: 'Formato de solicitud inválido', error: error.message },
        { status: 400 }
      );
    }
    
    if (!professorId || !professorData) {
      return NextResponse.json(
        { success: false, message: 'ID de profesor y datos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el profesor existe antes de actualizarlo
    try {
      const professorRef = adminFirestore.collection('teachers').doc(professorId);
      const professorDoc = await professorRef.get();
      
      console.log('Profesor existe:', professorDoc.exists);
      
      if (!professorDoc.exists) {
        return NextResponse.json(
          { success: false, message: 'El profesor no existe en la base de datos' },
          { status: 404 }
        );
      }

      // Actualizar el documento del profesor
      await professorRef.update({
        ...professorData,
        updatedAt: adminFirestore.FieldValue.serverTimestamp()
      });
      
      console.log('Profesor actualizado correctamente');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Profesor actualizado correctamente',
        data: {
          id: professorId,
          ...professorData
        }
      });
    } catch (firestoreError) {
      console.error('Error de Firestore:', firestoreError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error al acceder a la base de datos', 
          error: firestoreError.message,
          details: firestoreError.code || 'unknown_error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error general actualizando profesor:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al actualizar el profesor', 
        error: error.message,
        details: error.code || 'unknown_error'
      },
      { status: 500 }
    );
  }
} 