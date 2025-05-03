'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateDocument, deleteDocument } from '../../lib/firestore-helpers';

interface Professor {
  id: string;
  name: string;
  university: string;
  department: string;
  createdAt?: Timestamp;
  totalRatings?: number;
  averageRating?: number;
}

interface Rating {
  id: string;
  overallRating: number;
  difficultyRating: number;
  comment: string;
  tags: string[];
  createdAt: Timestamp;
  userId: string;
  wouldTakeAgain: boolean;
  grade?: number;
}

// Modifying to accept ID directly instead of params
export default function ProfessorDetail({ id }: { id: string }) {
  const router = useRouter();
  
  // State
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load professor data
  useEffect(() => {
    const fetchProfessorData = async () => {
      try {
        setLoading(true);
        
        // Get professor document
        const professorDoc = await getDoc(doc(db, 'teachers', id));
        if (!professorDoc.exists()) {
          setError('Profesor no encontrado');
          return;
        }
        
        setProfessor({
          id: professorDoc.id,
          ...professorDoc.data()
        } as Professor);
        
        // Get ratings for this professor
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('professorId', '==', id),
          orderBy('createdAt', 'desc')
        );
        
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingsData = ratingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Rating));
        
        setRatings(ratingsData);
      } catch (error) {
        console.error('Error fetching professor data:', error);
        setError('Error al cargar los datos del profesor');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfessorData();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (professor) {
      setProfessor({
        ...professor,
        [name]: value
      });
    }
  };

  // Save professor changes
  const handleSave = async () => {
    if (!professor) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Validate required fields
      if (!professor.name || !professor.university || !professor.department) {
        setError('Los campos Nombre, Universidad y Departamento son obligatorios');
        return;
      }
      
      // Update document
      await updateDocument('teachers', id, {
        name: professor.name,
        university: professor.university,
        department: professor.department
      });
      
      setSuccess('Profesor actualizado con éxito');
    } catch (error) {
      console.error('Error updating professor:', error);
      setError('Error al actualizar el profesor');
    } finally {
      setSaving(false);
    }
  };

  // Delete professor
  const handleDelete = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Use API route for deletion instead of direct Firestore access
      const response = await fetch(`/api/admin/professors/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ professorId: id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el profesor');
      }
      
      // Redirect to professors list
      router.push('/admin/professors');
    } catch (error) {
      console.error('Error deleting professor:', error);
      setError(`Error al eliminar el profesor: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setSaving(false);
    }
  };

  // Handle single rating deletion
  const handleDeleteRating = async (ratingId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta calificación? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      // Use API route for deletion
      const response = await fetch(`/api/admin/ratings/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ratingId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la calificación');
      }
      
      // Update local state
      setRatings(ratings.filter(rating => rating.id !== ratingId));
      
      setSuccess('Calificación eliminada con éxito');
    } catch (error) {
      console.error('Error deleting rating:', error);
      setError(`Error al eliminar la calificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Profesor no encontrado</h1>
        <p className="text-gray-600 mb-4">El profesor que buscas no existe o ha sido eliminado.</p>
        <Link href="/admin/professors" className="text-blue-600 hover:text-blue-800">
          ← Volver a la lista de profesores
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{professor.name}</h1>
          <p className="text-gray-600">ID: {professor.id}</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/admin/professors" 
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
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit form */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Información del profesor</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={professor.name}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
              Universidad
            </label>
            <input
              type="text"
              id="university"
              name="university"
              value={professor.university}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={professor.department}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de creación
            </label>
            <p className="text-sm text-gray-600">
              {professor.createdAt instanceof Timestamp
                ? professor.createdAt.toDate().toLocaleString('es-ES')
                : 'Fecha desconocida'}
            </p>
          </div>
          
          <div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Eliminar profesor
            </button>
          </div>
        </div>
      </div>
      
      {/* Ratings section */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Calificaciones ({ratings.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {ratings.length > 0 ? (
            ratings.map(rating => (
              <div key={rating.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-800 font-semibold text-sm px-2 py-1 rounded">
                          Calidad: {rating.overallRating}/5
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-yellow-100 text-yellow-800 font-semibold text-sm px-2 py-1 rounded">
                          Dificultad: {rating.difficultyRating}/5
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className={`${rating.wouldTakeAgain ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} font-semibold text-sm px-2 py-1 rounded`}>
                          {rating.wouldTakeAgain ? 'Lo volvería a tomar' : 'No lo volvería a tomar'}
                        </div>
                      </div>
                      {rating.grade !== undefined && (
                        <div className="flex items-center">
                          <div className="bg-purple-100 text-purple-800 font-semibold text-sm px-2 py-1 rounded">
                            Nota obtenida: {rating.grade}/20
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {rating.tags && rating.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {rating.tags.map(tag => (
                          <span key={tag} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-gray-700 text-sm">{rating.comment || 'Sin comentario'}</p>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {rating.createdAt instanceof Timestamp 
                        ? rating.createdAt.toDate().toLocaleString('es-ES') 
                        : 'Fecha desconocida'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteRating(rating.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              Este profesor aún no tiene calificaciones
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-sm text-gray-500 mb-6">
              ¿Estás seguro de que deseas eliminar a <span className="font-semibold">{professor.name}</span>? Esta acción no se puede deshacer y también eliminará todas las calificaciones asociadas.
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
                {saving ? 'Eliminando...' : 'Eliminar profesor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}