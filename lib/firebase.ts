// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBDMJUGfwF2b274LVEUiJ1d-sOoUHApHLU",
    authDomain: "cualprofe-fd43b.firebaseapp.com",
    projectId: "cualprofe-fd43b",
    storageBucket: "cualprofe-fd43b.appspot.com",
    messagingSenderId: "115544240669",
    appId: "1:115544240669:web:2493a15d8fa671ba888cf4",
    measurementId: "G-45XDCFVZ4Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Set persistence with proper error handling
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('Firebase Auth persistence set to browserLocalPersistence');
  } catch (error) {
    console.error('Error setting Firebase auth persistence:', error);
  }
})();

// Google provider for authentication
export const googleProvider = new GoogleAuthProvider();

// Utility function to fetch teachers (for debugging)
export async function fetchTeachers() {
  try {
    const teachersRef = collection(db, 'teachers');
    const snapshot = await getDocs(teachersRef);
    
    console.log('Total teachers:', snapshot.size);
    const teachers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Teachers:', teachers);
    return teachers;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
}

// Export the app for potential global use
export const firebaseApp = app;