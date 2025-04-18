'use client';

import { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function EmailAuthForm({ 
  mode = 'login', 
  setMode, 
  closeModal,
  redirectPath
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Login logic
        await signInWithEmailAndPassword(auth, email, password);
        // Reset professor view count for authenticated users
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('professorViewCount');
        }
        closeModal();
        // Redirect if necessary
        if (redirectPath) {
          router.push(redirectPath);
        }
      } else if (mode === 'signup') {
        // Signup validation
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.email.split('@')[0], // Set default displayName as part of email
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          emailVerified: user.emailVerified
        });

        // Reset professor view count for authenticated users
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('professorViewCount');
        }

        closeModal();
        // Redirect if necessary
        if (redirectPath) {
          router.push(redirectPath);
        }
      } else if (mode === 'resetPassword') {
        // Reset password logic
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('Se ha enviado un correo para restablecer tu contraseña');
        setTimeout(() => {
          setMode('login');
        }, 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Handle different Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Credenciales incorrectas. Verifica tu email y contraseña');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Intenta iniciar sesión');
        setTimeout(() => setMode('login'), 2000);
      } else if (error.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil');
      } else {
        setError('Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="tu@email.com"
          />
        </div>

        {mode !== 'resetPassword' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : mode === 'login' ? (
              'Iniciar sesión'
            ) : mode === 'signup' ? (
              'Registrarse'
            ) : (
              'Enviar email de recuperación'
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center text-sm">
        {mode === 'login' ? (
          <>
            <button
              type="button"
              onClick={() => setMode('resetPassword')}
              className="text-indigo-600 hover:text-indigo-500"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div className="mt-2">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Regístrate aquí
              </button>
            </div>
          </>
        ) : mode === 'signup' ? (
          <div>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Iniciar sesión
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Volver a iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}