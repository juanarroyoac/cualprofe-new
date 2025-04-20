'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy,
  limit,
  getDocs,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateDocument, deleteDocument } from '../../lib/firestore-helpers';

interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  isAdmin?: boolean;
  isSuspended?: boolean;
  university?: string;
  emailVerified?: boolean;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  authProvider?: string;
  ratings?: number;
}

interface Activity {
  id: string;
  type: string;
  timestamp: Timestamp;
  details: any;
  professorId?: string;
  professorName?: string;
}

export default function UserDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get user document
        const userDoc = await getDoc(doc(db, 'users', id));
        if (!userDoc.exists()) {
          setError('Usuario no encontrado');
          return;
        }
        
        const userData = {
          id: userDoc.id,
          ...userDoc.data()
        } as User;
        
        setUser(userData);
        
        // Count ratings
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('userId', '==', id)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        
        userData.ratings = ratingsSnapshot.size;
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Error al cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [id]);

  // Load user activity
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        setActivityLoading(true);
        
        // Get user ratings as activity
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('userId', '==', id),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingsActivity: Activity[] = [];
        
        // For each rating, get the professor name
        for (const ratingDoc of ratingsSnapshot.docs) {
          const ratingData = ratingDoc.data();
          let professorName = 'Profesor desconocido';
          
          if (ratingData.professorId) {
            try {
              const professorDoc = await getDoc(doc(db, 'teachers', ratingData.professorId));
              if (professorDoc.exists()) {
                professorName = professorDoc.data().name;
              }
            } catch (error) {
              console.error('Error fetching professor:', error);
            }
          }
          
          ratingsActivity.push({
            id: ratingDoc.id,
            type: 'rating',
            timestamp: ratingData.createdAt,
            details: {
              rating: ratingData.overallRating,
              difficulty: ratingData.difficultyRating,
              comment: ratingData.comment
            },
            professorId: ratingData.professorId,
            professorName
          });
        }
        
        // Sort by timestamp
        const sortedActivity = ratingsActivity.sort((a, b) => {
          return b.timestamp.toMillis() - a.timestamp.toMillis();
        });
        
        setUserActivity(sortedActivity);
      } catch (error) {
        console.error('Error fetching user activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };
    
    if (id) {
      fetchUserActivity();
    }
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (user) {
      setUser({
        ...user,
        [name]: value
      });
    }
  };

  // Save user changes
  const handleSave = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Update user data
      await updateDocument('users', id, {
        role: user.role,
        university: user.university,
        isAdmin: user.role === 'admin',
        isSuspended: user.isSuspended,
        updatedAt: serverTimestamp()
      });
      
      setSuccess('Usuario actualizado con éxito');
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Error al actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  // Toggle suspension status
  const handleToggleSuspension = () => {
    if (user) {
      setUser({
        ...user,
        isSuspended: !user.isSuspended
      });
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      setError('');
      
      // Check if user has ratings
      if (user.ratings && user.ratings > 0) {
        // We should ask what to do with the ratings
        if (!confirm(`Este usuario tiene ${user.ratings} calificaciones. ¿Deseas eliminar también las calificaciones?`)) {
          // User chose not to delete ratings, just anonymize them
          const ratingsQuery = query(
            collection(db, 'ratings'),
            where('userId', '==', id)
          );
          const ratingsSnapshot = await getDocs(ratingsQuery);
          
          const batch = writeBatch(db);
          ratingsSnapshot.docs.forEach(ratingDoc => {
            batch.update(ratingDoc.ref, {
              userId: 'deleted_user',
              userDeleted: true
            });
          });
          
          await batch.commit();
        } else {
          // User chose to delete ratings
          const ratingsQuery = query(
            collection(db, 'ratings'),
            where('userId', '==', id)
          );
          const ratingsSnapshot = await getDocs(ratingsQuery);
          
          const batch = writeBatch(db);
          ratingsSnapshot.docs.forEach(ratingDoc => {
            batch.delete(ratingDoc.ref);
          });
          
          await batch.commit();
        }
      }
      
      // Delete user document
      await deleteDocument('users', id);
      
      // Redirect to users list
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error al eliminar el usuario');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Usuario no encontrado</h1>
        <p className="text-gray-600 mb-4">El usuario que buscas no existe o ha sido eliminado.</p>
        <Link href="/admin/users" className="text-blue-600 hover:text-blue-800">
          ← Volver a la lista de usuarios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.displayName || 'Usuario sin nombre'}
            {user.isSuspended && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Suspendido
              </span>
            )}
          </h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/admin/users" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
      
      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User profile section */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Perfil del usuario</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="h-24 w-24 rounded-full mb-3"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                    <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {user.displayName || 'Usuario sin nombre'}
                </h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ID de usuario</p>
                  <p className="text-sm text-gray-900">{user.id}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Método de autenticación</p>
                  <p className="text-sm text-gray-900">
                    {user.authProvider === 'google.com' ? 'Google' : 
                     user.authProvider === 'password' ? 'Email y contraseña' : 
                     user.authProvider || 'Desconocido'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de registro</p>
                  <p className="text-sm text-gray-900">
                    {user.createdAt instanceof Timestamp
                      ? user.createdAt.toDate().toLocaleString('es-ES')
                      : 'Fecha desconocida'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Último acceso</p>
                  <p className="text-sm text-gray-900">
                    {user.lastLogin instanceof Timestamp
                      ? user.lastLogin.toDate().toLocaleString('es-ES')
                      : 'Nunca'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Correo verificado</p>
                  <p className="text-sm text-gray-900">
                    {user.emailVerified ? 'Sí' : 'No'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Calificaciones realizadas</p>
                  <p className="text-sm text-gray-900">{user.ratings || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* User settings section */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Configuración del usuario</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol del usuario
                </label>
                <select
                  id="role"
                  name="role"
                  value={user.role || 'user'}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="user">Usuario</option>
                  <option value="moderator">Moderador</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Los administradores tienen acceso completo al panel de administración. Los moderadores pueden moderar contenido.
                </p>
              </div>
              
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
                  Universidad
                </label>
                <input
                  type="text"
                  id="university"
                  name="university"
                  value={user.university || ''}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleToggleSuspension}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    user.isSuspended
                      ? 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                      : 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                  }`}
                >
                  {user.isSuspended ? 'Reactivar usuario' : 'Suspender usuario'}
                </button>
                <p className="ml-3 text-sm text-gray-500">
                  {user.isSuspended ? 'El usuario está actualmente suspendido y no puede iniciar sesión.' : 'El usuario está activo.'}
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  Eliminar usuario
                </button>
                <p className="mt-1 text-sm text-gray-500">
                  Eliminar un usuario es una acción permanente y no se puede deshacer.
                </p>
              </div>
            </div>
          </div>
          
          {/* User activity section */}
          <div className="mt-6 bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Actividad reciente</h2>
            </div>
            <div>
              {activityLoading ? (
                <div className="p-6 text-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando actividad...</p>
                </div>
              ) : userActivity.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {userActivity.map((activity) => (
                    <div key={activity.id} className="p-4">
                      <div className="flex justify-between">
                        <div>
                          {activity.type === 'rating' && (
                            <>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">
                                  Calificó a {activity.professorName}
                                </span>
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {activity.details.rating}/5
                                </span>
                              </div>
                              {activity.details.comment && (
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                  {activity.details.comment}
                                </p>
                              )}
                            </>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            {activity.timestamp instanceof Timestamp
                              ? activity.timestamp.toDate().toLocaleString('es-ES')
                              : 'Fecha desconocida'}
                          </p>
                        </div>
                        {activity.professorId && (
                          <Link
                            href={`/admin/professors/${activity.professorId}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Ver profesor
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Este usuario no tiene actividad reciente
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-sm text-gray-500 mb-6">
              ¿Estás seguro de que deseas eliminar a {user.displayName || user.email}? Esta acción no se puede deshacer.
              {user.ratings && user.ratings > 0 && (
                <span className="block mt-2 font-medium">
                  Este usuario tiene {user.ratings} calificaciones que también pueden ser afectadas.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
              >
                {saving ? 'Eliminando...' : 'Eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}