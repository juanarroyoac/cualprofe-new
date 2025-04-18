// app/components/LoginLimiter.tsx
'use client';

import { useState, useEffect } from 'react';
import { useViewTracking } from '../contexts/ViewTrackingContext'; // Ensure path is correct
import { usePathname } from 'next/navigation';
import { Dialog } from '@headlessui/react';
// Removed unused X import from lucide-react
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Ensure path is correct
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'; // Added updateDoc
import EmailAuthForm from './EmailAuthForm'; // Ensure path is correct

export default function LoginLimiter({ children }: { children: React.ReactNode }) {
  // Use context for view tracking
  const { professorViewCount, hasReachedViewLimit, viewLimit } = useViewTracking();

  // State for modal visibility and auth form mode
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'resetPassword'>('login');
  const [error, setError] = useState<string>('');

  // Get current path
  const pathname = usePathname();

  // Determine if currently on a professor page (more robust check)
  const isTeacherProfile = pathname?.startsWith('/teacher/') && pathname.split('/').length > 2 && pathname.split('/')[2] !== '';

  // Check if we need to show the login modal based on context state
  useEffect(() => {
    // Show modal immediately if the limit is reached *while* on a teacher profile
    if (isTeacherProfile && hasReachedViewLimit) {
      console.log(`LoginLimiter: View limit (${viewLimit}) reached. Showing modal. Current count: ${professorViewCount}`);
      setShowLoginModal(true);
    } else {
      // Optionally hide modal if navigating away or limit no longer reached (e.g., user logs in)
        if (showLoginModal) { // Only update state if it needs changing
            setShowLoginModal(false);
        }
    }
    // Dependencies: re-check when path changes or limit status changes
  }, [isTeacherProfile, hasReachedViewLimit, viewLimit, professorViewCount, showLoginModal]);

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    try {
      setError(''); // Clear previous errors
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if this is a new user
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create a new user document in Firestore for new users
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(), // Use server timestamp for creation
          lastLogin: serverTimestamp(), // Set initial last login
          emailVerified: user.emailVerified,
          // Add any other default fields for new users
        });
        console.log('New user created in Firestore:', user.uid);
      } else {
        // Update the last login time for existing users
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(), // Update last login timestamp
          // Optionally update other fields like displayName or photoURL if they changed
          ...(user.displayName && { displayName: user.displayName }),
          ...(user.photoURL && { photoURL: user.photoURL }),
          emailVerified: user.emailVerified, // Update verification status
        });
          console.log('Existing user last login updated:', user.uid);
      }

      // Close modal after successful login/signup
      setShowLoginModal(false);
    } catch (error: unknown) {
      console.error('Error during Google Sign-in:', error);
      // Provide a user-friendly error message
      if (error instanceof Error && 'code' in error) {
          const errorCode = (error as { code: string }).code; // Type assertion for code
          if (errorCode === 'auth/popup-closed-by-user') {
              setError('Inicio de sesión cancelado.');
          } else if (errorCode === 'auth/network-request-failed') {
              setError('Error de red. Por favor, revisa tu conexión.');
          } else {
              setError('No se pudo iniciar sesión con Google. Intenta de nuevo.');
          }
      } else {
          setError('Ocurrió un error inesperado durante el inicio de sesión.');
      }
    }
  };

  // Render children normally, and the modal conditionally
  return (
    <>
      {children} {/* Render the actual page content */}

      {/* View Limit Login Modal (using Headless UI Dialog) */}
      <Dialog
        open={showLoginModal}
        onClose={() => { /* Prevent closing by clicking outside when limit reached */ }}
        className="relative z-50" // Ensure modal is on top
      >
        {/* Modal Backdrop */}
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

        {/* Modal Content Container */}
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold font-poppins text-gray-800">
                {/* Dynamically set title based on auth mode */}
                {mode === 'login' ? 'Iniciar sesión' :
                 mode === 'signup' ? 'Crear cuenta' :
                 'Recuperar contraseña'}
              </Dialog.Title>
              {/* No close button - must log in */}
            </div>

            {/* Limit Reached Message */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md mb-5 text-center">
              <p className="text-sm font-medium">
                Has alcanzado el límite de {viewLimit} perfiles de profesores gratuitos.
              </p>
              <p className="text-xs mt-1">
                Para seguir explorando, por favor inicia sesión o crea una cuenta.
              </p>
            </div>

            {/* Authentication Forms and Options */}
            <div className="space-y-5">
              {/* OAuth provider buttons (only if not in resetPassword mode) */}
              {mode !== 'resetPassword' && (
                <div className="space-y-4">
                  {/* Google Sign-In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="flex w-full justify-center items-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    {/* Google SVG Icon */}
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                    <span>Continuar con Google</span>
                  </button>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">O</span>
                      </div>
                    </div>
                  </div>
              )}

              {/* Email/Password Auth Form Component */}
              <EmailAuthForm
                mode={mode}
                setMode={setMode}
                // Pass function to close modal on successful email/password auth
                closeModal={() => setShowLoginModal(false)}
                // Pass current path for potential redirection after auth
                redirectPath={pathname}
              />

              {/* Error message display area */}
              {error && (
                <div className="text-red-600 text-center text-sm font-medium border border-red-200 bg-red-50 p-2 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}