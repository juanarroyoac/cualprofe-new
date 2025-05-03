// lib/server/firebase-admin.js
import admin from 'firebase-admin';
import { join } from 'path';
import { readFileSync } from 'fs';

let firebaseAdmin;

function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    try {
      // Check if already initialized
      if (admin.apps.length === 0) {
        const serviceAccountPath = join(process.cwd(), 'cualprofe-fd43b-firebase-adminsdk-fbsvc-948183a799.json');
        
        // Load service account directly from file
        const serviceAccountContent = readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountContent);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });
        
        console.log('Firebase Admin initialized successfully');
      }
      
      firebaseAdmin = admin;
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw new Error(`Firebase admin initialization failed: ${error.message}`);
    }
  }
  
  return firebaseAdmin;
}

// Get Admin instance
const adminInstance = getFirebaseAdmin();

// Export the admin instance and its services with correct names
export const adminAuth = adminInstance.auth();
export const adminFirestore = adminInstance.firestore();
export default adminInstance;