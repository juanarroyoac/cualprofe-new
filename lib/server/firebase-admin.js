// lib/server/firebase-admin.js

// Note: This file should only be imported in server components or API routes
// It will cause errors if imported in client components or middleware
import admin from 'firebase-admin';

// Initialize the app only once
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }
  
  // Use service account or application default credentials
  try {
    // For production, use environment variables properly
    const projectId = process.env.FIREBASE_PROJECT_ID || "cualprofe-fd43b";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-noreply@cualprofe-fd43b.iam.gserviceaccount.com";
    
    // The private key should be in your environment variables and properly formatted
    // This is a placeholder - you need to replace it with your actual service account private key
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Replace escaped newlines if present
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      }),
      databaseURL: `https://${projectId}.firebaseio.com`
    });
    
    return admin;
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
}

export default getFirebaseAdmin();