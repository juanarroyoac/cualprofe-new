// components/auth/ProfileCompletionModal.jsx
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useUniversities } from '@/lib/hooks/useUniversities';

// Lista de años de graduación
const graduationYears = [];
const currentYear = new Date().getFullYear();
for (let i = currentYear; i <= currentYear + 6; i++) {
  graduationYears.push(i);
}

export default function ProfileCompletionModal({ isOpen, onClose, user }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch universities using the custom hook
  const { universities, loading: loadingUniversities, error: universitiesError } = useUniversities();

  useEffect(() => {
    if (user) {
      // Intentar extraer nombre y apellido del displayName si existe
      if (user.displayName) {
        const parts = user.displayName.split(' ');
        if (parts.length >= 2) {
          setFirstName(parts[0]);
          setLastName(parts.slice(1).join(' '));
        } else {
          setFirstName(user.displayName);
        }
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación básica
    if (!firstName.trim()) {
      setError('Por favor, ingresa tu nombre.');
      setLoading(false);
      return;
    }

    if (!lastName.trim()) {
      setError('Por favor, ingresa tu apellido.');
      setLoading(false);
      return;
    }

    if (!university) {
      setError('Por favor, selecciona tu universidad.');
      setLoading(false);
      return;
    }

    if (!graduationYear) {
      setError('Por favor, selecciona tu año de graduación previsto.');
      setLoading(false);
      return;
    }

    if (!auth.currentUser) {
      setError('Error: Usuario no autenticado.');
      setLoading(false);
      return;
    }

    // Construir el nombre completo para displayName
    const displayName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      // Actualizar perfil de Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: displayName,
      });

      // Actualizar documento de usuario en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName,
        university: university,
        graduationYear: graduationYear,
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
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      {/* Contenedor del Panel de Diálogo */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-5">
            <Dialog.Title className="text-2xl font-bold font-poppins text-[#00103f]">
              Completa tu perfil
            </Dialog.Title>
            {/* No se renderiza botón de cierre ('X') aquí, asegurando que no sea descartable */}
          </div>

          <div>
            <div className="bg-blue-50 p-4 rounded-lg mb-5">
              <p className="text-sm text-[#00103f] font-roboto">
                Para continuar utilizando CuálProfe, completa la siguiente información:
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 font-roboto">
                  Nombre
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#00103f] focus:ring-[#00103f] transition-colors py-2 px-3"
                  placeholder="Nombre"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 font-roboto">
                  Apellido
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#00103f] focus:ring-[#00103f] transition-colors py-2 px-3"
                  placeholder="Apellido"
                  required
                />
              </div>

              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700 font-roboto">
                  Universidad
                </label>
                <select
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#00103f] focus:ring-[#00103f] transition-colors py-2 px-3"
                  required
                  disabled={loadingUniversities}
                >
                  <option value="">Selecciona una universidad</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
                {loadingUniversities && (
                  <p className="mt-1 text-sm text-gray-500">Cargando universidades...</p>
                )}
                {universitiesError && (
                  <p className="mt-1 text-sm text-red-500">{universitiesError}</p>
                )}
                {!loadingUniversities && universities.length === 0 && !universitiesError && (
                  <p className="mt-1 text-sm text-amber-500">No hay universidades disponibles.</p>
                )}
                {loadingUniversities && (
                  <p className="mt-1 text-sm text-gray-500">Cargando universidades...</p>
                )}
                {universitiesError && (
                  <p className="mt-1 text-sm text-red-500">{universitiesError}</p>
                )}
              </div>

              <div>
                <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 font-roboto">
                  Año de graduación previsto
                </label>
                <select
                  id="graduationYear"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#00103f] focus:ring-[#00103f] transition-colors py-2 px-3"
                  required
                >
                  <option value="">Selecciona un año</option>
                  {graduationYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {error && 
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-red-500 text-sm font-roboto">{error}</p>
                </div>
              }

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || loadingUniversities}
                  className="w-full inline-flex justify-center rounded-full border border-transparent bg-[#00103f] py-3 px-6 text-base font-medium text-white shadow-sm hover:bg-[#001b6d] focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Guardando...' : 'Guardar y continuar'}
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 font-roboto mt-3">
                  Al guardar, aceptas los <a href="/terminosycondiciones" className="text-[#00103f] hover:underline">Términos y Condiciones</a> de CuálProfe
                </p>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}