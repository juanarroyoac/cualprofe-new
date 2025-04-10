import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBDMJUGfwF2b274LVEUiJ1d-sOoUHApHLU",
    authDomain: "cualprofe-fd43b.firebaseapp.com", // Change back to the Firebase domain
    projectId: "cualprofe-fd43b",
    storageBucket: "cualprofe-fd43b.firebasestorage.app",
    messagingSenderId: "115544240669",
    appId: "1:115544240669:web:2493a15d8fa671ba888cf4",
    measurementId: "G-45XDCFVZ4Q"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence); // Add this line
export const googleProvider = new GoogleAuthProvider();