// lib/server/firebase-admin.js
import admin from 'firebase-admin';

// Import the service account directly
import serviceAccount from '../../cualprofe-fd43b-firebase-adminsdk-fbsvc-948183a799.json';

export function initAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  }
  
  return admin;
}

// Initialize and export
const adminApp = initAdmin();
export const db = adminApp.firestore();
export const auth = adminApp.auth();

export default adminApp;