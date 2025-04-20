'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoginButton from './LoginButton';

interface AdminAuthCheckProps {
  children: React.ReactNode;
}

export default function AdminAuthCheck({ children }: AdminAuthCheckProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log(`Usuario autenticado: ${user.email}`);
          
          // Verificar si el usuario es administrador
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Datos de usuario:', userData);
            
            if (userData.role === 'admin' || userData.isAdmin === true) {
              console.log('Usuario es administrador');
              setIsAdmin(true);
            } else {
              console.log('Usuario no tiene rol de administrador');
              setError('No tienes permisos de administrador.');
              setIsAdmin(false);
            }
          } else {
            console.log('No se encontraron datos del usuario');
            setError('No se encontraron datos de usuario.');
            setIsAdmin(false);
          }
        } else {
          console.log('No hay usuario autenticado');
          setIsAdmin(false);
          setError('Inicia sesión para continuar.');
        }
      } catch (error) {
        console.error('Error verificando permisos:', error);
        setError('Error verificando permisos. Intenta de nuevo.');
        setIsAdmin(false);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso restringido</h1>
          <p className="text-gray-600 mb-6">
            Esta área está reservada para administradores. Por favor, inicia sesión con una cuenta de administrador para continuar.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <LoginButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}