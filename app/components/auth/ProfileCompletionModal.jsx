// components/auth/ProfileCompletionModal.jsx
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Asegúrate de que esta ruta sea correcta

// Ícono SVG para XMarkIcon (mantenido como referencia, pero no usado para cerrar)
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

// Lista de universidades
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
    if (user) {
      // Priorizar el displayName existente, de lo contrario dejar en blanco para entrada del usuario
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación mejorada: verificar si contiene al menos un nombre y un apellido
    const nameParts = displayName.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length < 2) {
      setError('Por favor, ingresa tu nombre completo (nombre y apellido).');
      setLoading(false);
      return;
    }

    if (!auth.currentUser) {
      setError('Error: Usuario no autenticado.');
      setLoading(false);
      return;
    }

    try {
      // Actualizar perfil de Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      });

      // Actualizar documento de usuario en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        university: university || null,
        profileCompleted: true
      });

      onClose(); // Cerrar modal al tener éxito
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setError('Ocurrió un error al actualizar tu perfil. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el diálogo solo si isOpen es true
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      // Prevenir cierre al hacer clic fuera del panel de diálogo
      onClose={() => {/* Intencionalmente vacío para prevenir cierre */}}
      className="relative z-50"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Contenedor del Panel de Diálogo */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-bold font-poppins">
              Completa tu perfil
            </Dialog.Title>
            {/* No se renderiza botón de cierre ('X') aquí, asegurando que no sea descartable */}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-4">
              Para continuar, completa la siguiente información:
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Nombre Completo (e.g., Juan Arroyo)
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Nombre Apellido"
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
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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