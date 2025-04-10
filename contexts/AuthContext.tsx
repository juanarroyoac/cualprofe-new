'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  AuthError // Add this import for typing
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    try {
      // Configure the provider to force account selection
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Use signInWithPopup but with better error handling
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      console.error('Error during Google sign-in:', error);
      
      // Type check to ensure error is an AuthError with a code property
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const authError = error as AuthError;
        if (authError.code === 'auth/popup-closed-by-user' || authError.code === 'auth/cancelled-popup-request') {
          console.log('Authentication popup was closed or cancelled');
        }
      }
      
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async function register(email: string, password: string) {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    signInWithGoogle,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}