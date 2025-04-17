// components/auth/ProfileCompletionModal.jsx
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Replace heroicons with inline SVG
const XMarkIcon = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const universities = [
  { id: 'ucab', name: 'Universidad Católica Andrés Bello (UCAB)' },
  { id: 'unimet', name: 'Universidad Metropolitana (UNIMET)' },
  { id: 'ucv', name: 'Universidad Central de Venezuela (UCV)' },
  { id: 'udo', name: 'Universidad de Oriente (UDO)' },
  { id: 'uc', name: 'Universidad de Carabobo (UC)' }
];

export default function ProfileCompletionModal({ isOpen, onClose, user }) {
  const [displayName, setDisplayName] = useState('');
  const [university, setUniversity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.displayName) {
      setDisplayName(user.displayName);
    } else if (user && user.email) {
      // Set display name to the part of email before @ as a suggestion
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!displayName.trim()) {
      setError('Por favor, ingresa un nombre de usuario');
      setLoading(false);
      return;
    }

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      });

      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        university: university || null,
        profileCompleted: true
      });

      onClose();
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setError('Ocurrió un error al actualizar tu perfil. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={() => {/* Prevent closing by clicking outside */}}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-bold font-poppins">
              Completa tu perfil
            </Dialog.Title>
            {/* Only show close button if this is optional */}
            {false && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Cerrar</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-4">
              Para continuar, completa la siguiente información:
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                  Universidad (opcional)
                </label>
                <select
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Selecciona una universidad</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar y continuar'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}