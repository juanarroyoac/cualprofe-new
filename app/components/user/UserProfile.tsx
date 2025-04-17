'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { updateProfile, updateEmail, updatePassword, 
         EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertCircle, CheckCircle, Lock, Mail, User as UserIcon } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error';
  message: string;
}

export default function UserProfile() {
  const { currentUser, userProfile, isEmailUser, isEmailVerified, sendEmailVerification } = useAuth();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [newEmail, setNewEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [loading, setLoading] = useState({
    profile: false,
    email: false,
    password: false,
    verification: false
  });

  // Function declarations need to be before the return statement
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setLoading(prev => ({ ...prev, profile: true }));

    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: displayName.trim()
      });

      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim()
      });

      setProfileSuccess('Perfil actualizado correctamente');
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      setProfileError('Error al actualizar el perfil. Intenta de nuevo.');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };
  
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSuccess('');
    setEmailError('');
    setLoading(prev => ({ ...prev, email: true }));

    if (!currentPassword) {
      setEmailError('Debes ingresar tu contraseña actual para actualizar el correo');
      setLoading(prev => ({ ...prev, email: false }));
      return;
    }

    try {
      if (!currentUser || !currentUser.email) {
        throw new Error('No user logged in');
      }

      // Re-authenticate the user first
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update email in Firebase Auth
      await updateEmail(currentUser, newEmail.trim());
      
      // Update email in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        email: newEmail.trim(),
        emailVerified: false
      });

      setEmailSuccess('Correo electrónico actualizado. Por favor, verifica tu nuevo correo.');
      setCurrentPassword('');
      
      // Send verification email to the new address
      await sendEmailVerification();
      setVerificationSent(true);
    } catch (error: unknown) {
      console.error('Error updating email:', error);
      const errorObj = error as { code?: string };
      if (errorObj.code === 'auth/wrong-password') {
        setEmailError('Contraseña incorrecta');
      } else if (errorObj.code === 'auth/requires-recent-login') {
        setEmailError('Por favor, cierra sesión y vuelve a iniciar sesión para actualizar tu correo');
      } else if (errorObj.code === 'auth/email-already-in-use') {
        setEmailError('Este correo ya está registrado');
      } else {
        setEmailError('Error al actualizar el correo. Intenta de nuevo.');
      }
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    setLoading(prev => ({ ...prev, password: true }));

    if (!currentPassword) {
      setPasswordError('Debes ingresar tu contraseña actual');
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden');
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }

    try {
      if (!currentUser || !currentUser.email) {
        throw new Error('No user logged in');
      }

      // Re-authenticate the user first
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      setPasswordSuccess('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Error updating password:', error);
      const errorObj = error as { code?: string };
      if (errorObj.code === 'auth/wrong-password') {
        setPasswordError('Contraseña actual incorrecta');
      } else if (errorObj.code === 'auth/requires-recent-login') {
        setPasswordError('Por favor, cierra sesión y vuelve a iniciar sesión para actualizar tu contraseña');
      } else {
        setPasswordError('Error al actualizar la contraseña. Intenta de nuevo.');
      }
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };
  
  const handleSendVerificationEmail = async () => {
    if (verificationSent) return;
    
    setLoading(prev => ({ ...prev, verification: true }));
    const result = await sendEmailVerification();
    
    if (result.success) {
      setVerificationSent(true);
    } else {
      setEmailError(result.error || 'Error al enviar el correo de verificación');
    }
    
    setLoading(prev => ({ ...prev, verification: false }));
  };

  if (!currentUser) {
    router.push('/');
    return null;
  }
  
  // Alert component for success and error messages
  const Alert = ({ type, message }: AlertProps) => {
    if (!message) return null;
    
    return (
      <div className={`rounded-md p-3 mb-4 ${
        type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
      }`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div className="ml-3 text-sm font-medium">{message}</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold font-poppins mb-6">Mi Perfil</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 font-poppins flex items-center">
            <UserIcon className="mr-2 h-5 w-5 text-gray-500" />
            Información Personal
          </h2>
        </div>
        
        <div className="p-6">
          <Alert type="success" message={profileSuccess} />
          <Alert type="error" message={profileError} />
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Nombre de usuario
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <p className="text-sm text-gray-500">
                Correo electrónico: <span className="font-medium">{currentUser.email}</span>
                {!isEmailVerified && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    No verificado
                  </span>
                )}
              </p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading.profile}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading.profile ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {isEmailUser && (
        <>
          {/* Email verification section */}
          {!isEmailVerified && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 font-poppins flex items-center">
                  <Mail className="mr-2 h-5 w-5 text-gray-500" />
                  Verificación de Correo
                </h2>
              </div>
              
              <div className="p-6">
                <div className="bg-yellow-50 p-4 rounded-md mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Tu correo electrónico no ha sido verificado. Te recomendamos verificarlo para 
                        acceder a todas las funcionalidades de CuálProfe.
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={loading.verification || verificationSent}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading.verification ? 'Enviando...' : 
                   verificationSent ? 'Correo enviado' : 'Enviar correo de verificación'}
                </button>
                
                {verificationSent && (
                  <p className="mt-2 text-sm text-gray-600">
                    Hemos enviado un correo de verificación a {currentUser.email}. 
                    Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Email update section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 font-poppins flex items-center">
                <Mail className="mr-2 h-5 w-5 text-gray-500" />
                Cambiar Correo Electrónico
              </h2>
            </div>
            
            <div className="p-6">
              <Alert type="success" message={emailSuccess} />
              <Alert type="error" message={emailError} />
              
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                    Nuevo correo electrónico
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Contraseña actual
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading.email}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading.email ? 'Actualizando...' : 'Actualizar correo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Password update section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 font-poppins flex items-center">
                <Lock className="mr-2 h-5 w-5 text-gray-500" />
                Cambiar Contraseña
              </h2>
            </div>
            
            <div className="p-6">
              <Alert type="success" message={passwordSuccess} />
              <Alert type="error" message={passwordError} />
              
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="password-current" className="block text-sm font-medium text-gray-700">
                    Contraseña actual
                  </label>
                  <input
                    id="password-current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password-new" className="block text-sm font-medium text-gray-700">
                    Nueva contraseña
                  </label>
                  <input
                    id="password-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    id="password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading.password}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading.password ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      
      {!isEmailUser && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex items-center text-yellow-600 mb-4">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm font-medium">Iniciaste sesión con Google. Algunas opciones de gestión de cuenta no están disponibles.</p>
            </div>
            <p className="text-sm text-gray-600">
              Para cambiar tu correo electrónico o contraseña, debes hacerlo a través de tu cuenta de Google.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}