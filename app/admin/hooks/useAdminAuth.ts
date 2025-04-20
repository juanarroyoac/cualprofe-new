// app/admin/hooks/useAdminAuth.ts
import { useState, useEffect } from 'react';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Custom hook to handle admin authentication
 * 
 * @returns Authentication state and user data
 */
export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // User is signed in
          setIsAuthenticated(true);
          setUser(currentUser);
          
          // Check if user is admin
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.role === 'admin' || userData.isAdmin === true) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
              setError('No tienes permisos de administrador.');
            }
          } else {
            setIsAdmin(false);
            setError('No se encontraron datos de usuario.');
          }
        } else {
          // User is signed out
          setIsAuthenticated(false);
          setIsAdmin(false);
          setUser(null);
          setError('Inicia sesión para continuar.');
        }
      } catch (err) {
        console.error('Error verificando permisos:', err);
        setError('Error verificando permisos. Intenta de nuevo.');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getToken = async () => {
    if (!user) return null;
    try {
      return await getIdToken(user);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  return {
    isAuthenticated,
    isAdmin,
    user,
    loading,
    error,
    getToken
  };
}