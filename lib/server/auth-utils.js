// lib/server/auth-utils.js
import { db, auth } from './firebase-admin';

/**
 * Verificar si un usuario es administrador
 * 
 * @param {string} uid - ID de usuario de Firebase
 * @returns {Promise<boolean>} - true si el usuario es administrador
 */
export async function isAdmin(uid) {
  try {
    // Verificar si el usuario tiene el rol de administrador
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData.role === 'admin' || userData.isAdmin === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verificando permisos de administrador:', error);
    return false;
  }
}

/**
 * Crear cookie de sesión para autenticación
 * 
 * @param {string} idToken - Token ID de Firebase Auth
 * @param {number} expiresIn - Tiempo de expiración en segundos
 * @returns {Promise<string>} - Cookie de sesión
 */
export async function createSessionCookie(idToken, expiresIn = 60 * 60 * 24 * 5) {
  try {
    // Convertir a milisegundos para la API de Firebase Admin
    const sessionCookie = await auth.createSessionCookie(idToken, { 
      expiresIn: expiresIn * 1000 
    });
    return sessionCookie;
  } catch (error) {
    console.error('Error creando cookie de sesión:', error);
    throw new Error('Error al crear la sesión. Inténtelo de nuevo.');
  }
}

/**
 * Verificar cookie de sesión
 * 
 * @param {string} sessionCookie - Cookie de sesión
 * @returns {Promise<{uid: string, email: string, admin: boolean}>} - Información del usuario
 */
export async function verifySessionCookie(sessionCookie) {
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;
    const adminStatus = await isAdmin(uid);
    
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      admin: adminStatus
    };
  } catch (error) {
    console.error('Error verificando cookie de sesión:', error);
    throw new Error('Sesión inválida o expirada');
  }
}

/**
 * Revocar todas las sesiones de un usuario
 * 
 * @param {string} uid - ID de usuario de Firebase
 * @returns {Promise<void>}
 */
export async function revokeAllSessions(uid) {
  try {
    await auth.revokeRefreshTokens(uid);
  } catch (error) {
    console.error('Error revocando sesiones:', error);
    throw new Error('Error al cerrar sesión');
  }
}