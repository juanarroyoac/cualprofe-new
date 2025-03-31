import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBDMJUGfwF2b274LVEUiJ1d-sOoUHApHLU",
    authDomain: "cualprofe.com", // Updated from firebaseapp.com to custom domain
    projectId: "cualprofe-fd43b",
    storageBucket: "cualprofe-fd43b.firebasestorage.app",
    messagingSenderId: "115544240669",
    appId: "1:115544240669:web:2493a15d8fa671ba888cf4",
    measurementId: "G-45XDCFVZ4Q"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();