'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset, getAuth } from 'firebase/auth';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ResetPasswordContent() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center py-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

// Separate component for the content that uses useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'verified' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) return;

      try {
        const auth = getAuth();
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
        setStatus('verified');
      } catch (error: unknown) {
        console.error('Error verifying reset code:', error);
        setStatus('error');
        setError('El enlace de restablecimiento no es válido o ha expirado.');
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!oobCode) {
        throw new Error('Missing reset code');
      }
      
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      setError('Error al restablecer la contraseña. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {status === 'loading' && (
        <div className="flex flex-col items-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
          <p className="text-gray-600">Verificando enlace de restablecimiento...</p>
        </div>
      )}
      
      {status === 'verified' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Estableciendo nueva contraseña para <strong>{email}</strong>
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              minLength={6}
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              minLength={6}
              required
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
          </div>
        </form>
      )}
      
      {status === 'success' && (
        <div className="text-center py-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Contraseña restablecida!</h2>
          <p className="text-gray-600 mb-6">
            Tu contraseña ha sido restablecida correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Ir a iniciar sesión
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-center py-6">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
          <p className="text-gray-600 mb-6">
            {error || 'El enlace de restablecimiento de contraseña no es válido o ha expirado.'}
          </p>
          <Link 
            href="/"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Volver al inicio
          </Link>
        </div>
      )}
    </>
  );
}