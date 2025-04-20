'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface University {
  id: string;
  name: string;
  abbreviation?: string;
  location?: string;
  website?: string;
  isActive: boolean;
  professorsCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    abbreviation: '',
    location: '',
    website: ''
  });
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  const editNameRef = useRef<HTMLInputElement>(null);

  // Fetch universities
  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const universitiesQuery = query(collection(db, 'universities'), orderBy('name'));
      const snapshot = await getDocs(universitiesQuery);
      
      const universitiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as University));
      
      // Get professor counts for each university
      for (const university of universitiesList) {
        const professorsQuery = query(
          collection(db, 'teachers'), 
          where('university', '==', university.name)
        );
        const professorsSnapshot = await getDocs(professorsQuery);
        university.professorsCount = professorsSnapshot.size;
      }
      
      setUniversities(universitiesList);
    } catch (error) {
      console.error('Error fetching universities:', error);
      setError('Error al cargar las universidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  // Focus on edit input when editing a university
  useEffect(() => {
    if (editingUniversity && editNameRef.current) {
      editNameRef.current.focus();
    }
  }, [editingUniversity]);

  // Add a new university
  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUniversity.name.trim()) {
      setError('El nombre de la universidad es obligatorio');
      return;
    }
    
    // Check if university already exists
    if (universities.some(uni => uni.name.toLowerCase() === newUniversity.name.toLowerCase())) {
      setError('Ya existe una universidad con ese nombre');
      return;
    }

    setError('');
    
    try {
      const newUniData = {
        name: newUniversity.name.trim(),
        abbreviation: newUniversity.abbreviation.trim(),
        location: newUniversity.location.trim(),
        website: newUniversity.website.trim(),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'universities'), newUniData);
      
      setUniversities([...universities, { id: docRef.id, ...newUniData, professorsCount: 0 }]);
      setSuccess('Universidad creada con éxito');
      
      // Clear form
      setNewUniversity({
        name: '',
        abbreviation: '',
        location: '',
        website: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding university:', error);
      setError('Error al crear la universidad');
    }
  };

  // Edit university
  const handleUpdateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUniversity) return;
    
    if (!editingUniversity.name.trim()) {
      setError('El nombre de la universidad es obligatorio');
      return;
    }
    
    // Check if university name already exists (except for the current university)
    if (universities.some(uni => 
      uni.id !== editingUniversity.id && 
      uni.name.toLowerCase() === editingUniversity.name.toLowerCase()
    )) {
      setError('Ya existe una universidad con ese nombre');
      return;
    }

    setError('');
    
    try {
      await updateDoc(doc(db, 'universities', editingUniversity.id), {
        name: editingUniversity.name.trim(),
        abbreviation: editingUniversity.abbreviation?.trim() || '',
        location: editingUniversity.location?.trim() || '',
        website: editingUniversity.website?.trim() || '',
        updatedAt: serverTimestamp()
      });
      
      setUniversities(universities.map(uni => 
        uni.id === editingUniversity.id ? { ...editingUniversity } : uni
      ));
      
      setSuccess('Universidad actualizada con éxito');
      setEditingUniversity(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating university:', error);
      setError('Error al actualizar la universidad');
    }
  };

  // Toggle university active status
  const handleToggleActive = async (universityId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'universities', universityId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
      
      setUniversities(universities.map(uni => 
        uni.id === universityId ? { ...uni, isActive: !currentStatus } : uni
      ));
      
      setSuccess(`Universidad ${!currentStatus ? 'activada' : 'desactivada'} con éxito`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error toggling university status:', error);
      setError('Error al cambiar el estado de la universidad');
    }
  };

  // Delete university
  const handleDeleteUniversity = async (universityId: string, universityName: string, professorsCount: number = 0) => {
    if (professorsCount > 0) {
      setError(`No se puede eliminar la universidad "${universityName}" porque tiene ${professorsCount} profesores asociados.`);
      return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas eliminar la universidad "${universityName}"?`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'universities', universityId));
      
      setUniversities(universities.filter(uni => uni.id !== universityId));
      setSuccess('Universidad eliminada con éxito');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting university:', error);
      setError('Error al eliminar la universidad');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingUniversity(null);
    setError('');
  };

  // Handle input change for new university
  const handleNewUniversityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUniversity(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input change for editing university
  const handleEditUniversityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingUniversity) return;
    
    const { name, value } = e.target;
    setEditingUniversity({
      ...editingUniversity,
      [name]: value
    });
  };

  // Filter universities based on active status
  const filteredUniversities = showInactive ? universities : universities.filter(uni => uni.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Universidades</h1>
        <p className="text-gray-600">Administra las universidades disponibles en la plataforma</p>
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
        {/* Add new university form */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Añadir nueva universidad</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddUniversity} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newUniversity.name}
                    onChange={handleNewUniversityChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: Universidad Católica Andrés Bello"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="abbreviation" className="block text-sm font-medium text-gray-700 mb-1">
                    Abreviatura
                  </label>
                  <input
                    type="text"
                    id="abbreviation"
                    name="abbreviation"
                    value={newUniversity.abbreviation}
                    onChange={handleNewUniversityChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: UCAB"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={newUniversity.location}
                    onChange={handleNewUniversityChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: Caracas, Venezuela"
                  />
                </div>
                
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio web
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={newUniversity.website}
                    onChange={handleNewUniversityChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: https://www.ucab.edu.ve"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Añadir universidad
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Universities list */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Universidades</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showInactive"
                  checked={showInactive}
                  onChange={() => setShowInactive(!showInactive)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showInactive" className="ml-2 text-sm text-gray-600">
                  Mostrar inactivas
                </label>
              </div>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando universidades...</p>
              </div>
            ) : filteredUniversities.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay universidades{showInactive ? '' : ' activas'}.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUniversities.map(university => (
                  <div key={university.id} className="p-6">
                    {editingUniversity && editingUniversity.id === university.id ? (
                      // Edit form
                      <form onSubmit={handleUpdateUniversity} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre completo *
                            </label>
                            <input
                              type="text"
                              id="editName"
                              name="name"
                              ref={editNameRef}
                              value={editingUniversity.name}
                              onChange={handleEditUniversityChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="editAbbreviation" className="block text-sm font-medium text-gray-700 mb-1">
                              Abreviatura
                            </label>
                            <input
                              type="text"
                              id="editAbbreviation"
                              name="abbreviation"
                              value={editingUniversity.abbreviation || ''}
                              onChange={handleEditUniversityChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="editLocation" className="block text-sm font-medium text-gray-700 mb-1">
                              Ubicación
                            </label>
                            <input
                              type="text"
                              id="editLocation"
                              name="location"
                              value={editingUniversity.location || ''}
                              onChange={handleEditUniversityChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="editWebsite" className="block text-sm font-medium text-gray-700 mb-1">
                              Sitio web
                            </label>
                            <input
                              type="url"
                              id="editWebsite"
                              name="website"
                              value={editingUniversity.website || ''}
                              onChange={handleEditUniversityChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                          >
                            Guardar cambios
                          </button>
                        </div>
                      </form>
                    ) : (
                      // University details
                      <div>
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {university.name}
                              {!university.isActive && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactiva
                                </span>
                              )}
                            </h3>
                            {university.abbreviation && (
                              <p className="mt-1 text-sm text-gray-500">
                                <span className="font-medium">Abreviatura:</span> {university.abbreviation}
                              </p>
                            )}
                            {university.location && (
                              <p className="mt-1 text-sm text-gray-500">
                                <span className="font-medium">Ubicación:</span> {university.location}
                              </p>
                            )}
                            {university.website && (
                              <p className="mt-1 text-sm text-gray-500">
                                <span className="font-medium">Web:</span>{' '}
                                <a 
                                  href={university.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {university.website}
                                </a>
                              </p>
                            )}
                            <p className="mt-2 text-sm text-blue-600">
                              <span className="font-medium">Profesores:</span> {university.professorsCount || 0}
                            </p>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => setEditingUniversity(university)}
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleActive(university.id, university.isActive)}
                              className={`${
                                university.isActive 
                                  ? 'text-gray-600 hover:text-gray-800' 
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {university.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                            {(!university.professorsCount || university.professorsCount === 0) && (
                              <button
                                onClick={() => handleDeleteUniversity(university.id, university.name, university.professorsCount)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}