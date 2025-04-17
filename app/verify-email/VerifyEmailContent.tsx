'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { applyActionCode, getAuth } from 'firebase/auth';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!oobCode) return;

      try {
        const auth = getAuth();
        await applyActionCode(auth, oobCode);
        setStatus('success');
      } catch (error: unknown) {
        console.error('Error verifying email:', error);
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMessage);
      }
    };

    verifyEmail();
  }, [oobCode]);

  return (
    <>
      {status === 'loading' && (
        <div className="flex flex-col items-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
          <p className="text-gray-600">Verificando tu correo electrónico...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-center py-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Correo verificado!</h2>
          <p className="text-gray-600 mb-6">
            Tu correo electrónico ha sido verificado correctamente. Ahora puedes acceder a todas las funcionalidades de CuálProfe.
          </p>
          <Link 
            href="/profile"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Ir a mi perfil
          </Link>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-center py-6">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de verificación</h2>
          <p className="text-gray-600 mb-2">
            No pudimos verificar tu correo electrónico. El enlace puede haber expirado o ya ha sido utilizado.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <Link 
              href="/profile"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Ir a mi perfil
            </Link>
            <div>
              <Link 
                href="/"
                className="text-sm text-blue-600 hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}