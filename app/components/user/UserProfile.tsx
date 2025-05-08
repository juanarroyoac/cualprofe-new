'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { updateProfile, updateEmail, updatePassword, 
         EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertCircle, CheckCircle, Lock, Mail, User as UserIcon, ChevronRight } from 'lucide-react';
import { useUniversities } from '@/lib/hooks/useUniversities';

interface AlertProps {
  type: 'success' | 'error';
  message: string;
}

export default function UserProfile() {
  const { currentUser, userProfile, isEmailUser, isEmailVerified, sendEmailVerification } = useAuth();
  const router = useRouter();
  
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [university, setUniversity] = useState(userProfile?.university || '');
  const [graduationYear, setGraduationYear] = useState(userProfile?.graduationYear || '');
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

  // Fetch universities using the custom hook
  const { universities, loading: loadingUniversities, error: universitiesError } = useUniversities();
  
  // Lista de años de graduación
  const graduationYears = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i <= currentYear + 6; i++) {
    graduationYears.push(i);
  }
  
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setUniversity(userProfile.university || '');
      setGraduationYear(userProfile.graduationYear || '');
    }
  }, [userProfile]);

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

      if (!firstName.trim()) {
        throw new Error('El nombre es obligatorio');
      }

      if (!lastName.trim()) {
        throw new Error('El apellido es obligatorio');
      }

      if (!university) {
        throw new Error('La universidad es obligatoria');
      }

      if (!graduationYear) {
        throw new Error('El año de graduación es obligatorio');
      }

      // Construct the displayName from first name and last name
      const displayName = `${firstName.trim()} ${lastName.trim()}`;

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: displayName
      });

      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName,
        university: university,
        graduationYear: graduationYear
      });

      setProfileSuccess('Perfil actualizado correctamente');
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil. Intenta de nuevo.';
      setProfileError(errorMessage);
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
      <div className={`rounded-lg p-4 mb-4 ${
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
    <div className="max-w-2xl mx-auto px-4 py-12 bg-white">
      {/* Profile Card */}
      <div className="rounded-2xl shadow-lg p-8 mb-8" style={{ background: '#00248c', color: '#fff' }}>
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            (userProfile?.firstName?.[0] || currentUser?.email?.[0] || '?').toUpperCase()
          )}
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold text-gray-900 mb-1">{userProfile?.firstName} {userProfile?.lastName}</div>
          <div className="text-sm text-gray-500 mb-2">{currentUser.email}</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{isEmailVerified ? 'Verificada' : 'No verificada'}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{userProfile?.university || 'Universidad'}</span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl shadow-lg p-8 mb-8" style={{ background: '#00248c', color: '#fff' }}>
        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
            <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select id="university" value={university} onChange={(e) => setUniversity(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required disabled={loadingUniversities}>
              <option value="">Universidad</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>{uni.name}</option>
              ))}
            </select>
            <select id="graduationYear" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required>
              <option value="">Año de graduación</option>
              {graduationYears.map((year) => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading.profile || loadingUniversities} className="w-full py-3 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 transition disabled:opacity-50 text-base">{loading.profile ? 'Guardando...' : 'Guardar cambios'}</button>
        </form>
        <Alert type="success" message={profileSuccess} />
        <Alert type="error" message={profileError} />
      </div>

      {/* Email/Password Card */}
      <div className="rounded-2xl shadow-lg p-8 mb-8" style={{ background: '#00248c', color: '#fff' }}>
        {/* Email Verification */}
        {!isEmailVerified && (
          <div className="flex flex-col gap-2 items-center mb-6">
            <span className="text-sm text-yellow-700 font-semibold">Tu correo no está verificado</span>
            <button type="button" onClick={handleSendVerificationEmail} disabled={loading.verification || verificationSent} className="px-5 py-2 rounded-xl font-semibold bg-yellow-400 text-white hover:bg-yellow-500 transition disabled:opacity-50 text-sm">{loading.verification ? 'Enviando...' : verificationSent ? 'Correo enviado' : 'Enviar verificación'}</button>
            {verificationSent && <span className="text-xs text-yellow-700">Revisa tu bandeja de entrada</span>}
          </div>
        )}
        {/* Email Update */}
        <form onSubmit={handleEmailUpdate} className="flex flex-col gap-4">
          <input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Nuevo correo electrónico" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
          <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Contraseña actual" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
          <button type="submit" disabled={loading.email} className="w-full py-3 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 transition disabled:opacity-50 text-base">{loading.email ? 'Actualizando...' : 'Actualizar correo'}</button>
        </form>
        <Alert type="success" message={emailSuccess} />
        <Alert type="error" message={emailError} />
        {/* Password Update */}
        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4 mt-6">
          <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Contraseña actual" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
          <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar nueva contraseña" className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
          <button type="submit" disabled={loading.password} className="w-full py-3 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 transition disabled:opacity-50 text-base">{loading.password ? 'Actualizando...' : 'Actualizar contraseña'}</button>
        </form>
        <Alert type="success" message={passwordSuccess} />
        <Alert type="error" message={passwordError} />
      </div>
    </div>
  );
}