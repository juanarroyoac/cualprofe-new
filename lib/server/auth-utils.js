// lib/server/auth-utils.js
import admin from './firebase-admin';

// Create a session cookie from a Firebase ID token
export async function createSessionCookie(idToken, expiresIn) {
  try {
    // Verify the ID token first - without storing the unused result
    await admin.auth().verifyIdToken(idToken);
    
    // Create a session cookie
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    
    return sessionCookie;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    throw new Error('Unauthorized');
  }
}

// Verify a session cookie
export async function verifySessionCookie(sessionCookie) {
  try {
    // Verify the session cookie
    const decodedClaims = await admin.auth().verifySessionCookie(
      sessionCookie, true // Check if revoked
    );
    
    return decodedClaims;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw new Error('Unauthorized');
  }
}

// Revoke all sessions for a user
export async function revokeAllSessions(uid) {
  try {
    // Revoke all tokens for a user
    await admin.auth().revokeRefreshTokens(uid);
    return true;
  } catch (error) {
    console.error('Error revoking sessions:', error);
    throw error;
  }
}

// Get a user by ID
export async function getUserById(uid) {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}