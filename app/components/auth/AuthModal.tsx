'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithRedirect, User, AuthError } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import EmailAuthForm from '../EmailAuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'resetPassword';
  redirectPath?: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  redirectPath
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'resetPassword'>(initialMode);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if this is a forced login (non-dismissable)
  const forceLogin = searchParams?.get('forceLogin') === 'true';
  
  // Store the redirectTo from URL params if provided
  const urlRedirectPath = searchParams?.get('redirectTo') || '';
  
  // Determine the final redirect path (priority: prop > URL param)
  const finalRedirectPath = redirectPath || (urlRedirectPath ? urlRedirectPath : '');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Clean URL parameters to prevent loop
  const cleanUrlParameters = () => {
    if (typeof window !== 'undefined' && window.history.pushState) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('forceLogin');
      newUrl.searchParams.delete('showLogin');
      newUrl.searchParams.delete('redirectTo');
      
      // Update URL without causing page reload
      window.history.pushState({ path: newUrl.toString() }, '', newUrl.toString());
    }
  };

  // Handle modal close with URL cleanup
  const handleClose = () => {
    // Only allow closing if not a forced login
    if (!forceLogin) {
      cleanUrlParameters();
      onClose();
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setIsLoading(false);
    // Clean up URL parameters first
    cleanUrlParameters();
    
    // Determine where to redirect after successful login
    if (finalRedirectPath) {
      router.push(finalRedirectPath);
    } else if (pathname.startsWith('/teacher/')) {
      // If on a teacher page, stay there after login
      onClose();
    } else if (pathname === '/') {
      // If on home page, just close the modal
      onClose();
    } else {
      // Default fallback
      onClose();
    }

    // Reset the professor view count in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('professorViewCount');
    }
  };

  const createOrUpdateUserDoc = async (user: User) => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create a new user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: user.emailVerified,
        profileCompleted: false
      });
    } else {
      // Update the last login time
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      // Configure Google provider with better options
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'  // Always show account selector
      });
      
      // Try popup first
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await createOrUpdateUserDoc(user);
        handleAuthSuccess();
      } catch (error: unknown) {
        console.log('Popup error:', error);
        
        // Specific handling for popup errors
        if (
          error instanceof Error && 
          'code' in error && 
          (error.code === 'auth/cancelled-popup-request' || 
          error.code === 'auth/popup-blocked' ||
          error.code === 'auth/popup-closed-by-user')
        ) {
          
          // Try redirect method as fallback when popup fails
          setError('Se cerrará esta ventana para iniciar sesión con Google. Por favor, completa el proceso de autenticación.');
          
          // Wait 2 seconds to show the message before redirect
          setTimeout(() => {
            signInWithRedirect(auth, provider);
          }, 2000);
          
        } else {
          throw error; // Re-throw for general error handling
        }
      }
    } catch (error: unknown) {
      console.error('Error al iniciar sesión con Google:', error);
      setError('No se pudo iniciar sesión con Google. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-5">
            <Dialog.Title className="text-2xl font-bold font-poppins text-[#00103f]">
              {mode === 'login' ? 'Iniciar sesión' : 
               mode === 'signup' ? 'Crear cuenta' : 
               'Recuperar contraseña'}
            </Dialog.Title>
            
            {/* Only show close button if modal is dismissable */}
            {!forceLogin && (
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-[#00103f] transition-colors"
              >
                <span className="sr-only">Cerrar</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Message for limit reached or redirect */}
          {(pathname.startsWith('/teacher/') || forceLogin) && (
            <div className="bg-blue-50 text-[#00103f] p-4 rounded-lg mb-5 font-roboto">
              <p className="text-sm">
                Para seguir explorando perfiles de profesores, es necesario iniciar sesión o crear una cuenta.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* OAuth provider buttons */}
            {mode !== 'resetPassword' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={`flex w-full justify-center items-center gap-3 rounded-lg border border-gray-300 ${
                    isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                  } px-4 py-3 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:ring-offset-2 transition-colors font-roboto`}
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                        </g>
                      </svg>
                      Continuar con Google
                    </>
                  )}
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-3 text-gray-500 font-roboto">O</span>
                  </div>
                </div>
              </div>
            )}

            {/* Email auth form */}
            <EmailAuthForm 
              mode={mode} 
              setMode={setMode} 
              closeModal={() => handleAuthSuccess()} 
              redirectPath={finalRedirectPath || redirectPath}
            />

            {/* Error message */}
            {error && (
              <div className="text-red-500 text-center text-sm font-roboto mt-3 p-2 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}