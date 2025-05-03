'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  getDocs,
  doc,
  setDoc,
  updateDoc,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface University {
  id: string;
  name: string;
  abbreviation?: string;
  isActive: boolean;
  professorsCount: number;
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    abbreviation: '',
  });
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  const editNameRef = useRef<HTMLInputElement>(null);

  // Fetch unique universities from teachers collection
  const fetchUniversities = async () => {
    try {
      setLoading(true);
      
      // First get all unique universities from teachers
      const teachersQuery = query(collection(db, 'teachers'), orderBy('university'));
      const teachersSnapshot = await getDocs(teachersQuery);
      
      // Create a map to track unique universities and count professors
      const universitiesMap = new Map<string, {
        name: string;
        professorsCount: number;
        abbreviation?: string;
        isActive: boolean;
      }>();
      
      // Process teachers to get unique universities and count professors
      teachersSnapshot.forEach(doc => {
        const teacherData = doc.data();
        const universityName = teacherData.university;
        
        if (universityName) {
          if (universitiesMap.has(universityName)) {
            // Increment professor count for existing university
            const university = universitiesMap.get(universityName)!;
            university.professorsCount += 1;
          } else {
            // Add new university
            universitiesMap.set(universityName, {
              name: universityName,
              professorsCount: 1,
              isActive: true, // Default to active
              abbreviation: '' // Default empty abbreviation
            });
          }
        }
      });
      
      // Now check for university settings in the universitySettings collection
      const settingsQuery = query(collection(db, 'universitySettings'));
      const settingsSnapshot = await getDocs(settingsQuery);
      
      // Apply settings to universities map
      settingsSnapshot.forEach(doc => {
        const settingData = doc.data();
        if (universitiesMap.has(settingData.name)) {
          const university = universitiesMap.get(settingData.name)!;
          university.abbreviation = settingData.abbreviation || '';
          university.isActive = settingData.isActive !== false; // Default to true if not set
        }
      });
      
      // Convert map to array with IDs (using name as ID)
      const universitiesList = Array.from(universitiesMap.entries()).map(([name, data]) => ({
        id: name,
        ...data
      }));
      
      // Sort by name
      universitiesList.sort((a, b) => a.name.localeCompare(b.name));
      
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

  // Focus on edit input when editing
  useEffect(() => {
    if (editingUniversity && editNameRef.current) {
      editNameRef.current.focus();
    }
  }, [editingUniversity]);

  // Update university settings
  const updateUniversitySettings = async (universityName: string, data: any) => {
    try {
      await setDoc(doc(db, 'universitySettings', universityName), {
        name: universityName,
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error updating university settings:', error);
      throw error;
    }
  };

  // Handle updating abbreviation
  const handleUpdateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUniversity) return;
    
    setError('');
    
    try {
      await updateUniversitySettings(editingUniversity.id, {
        abbreviation: editingUniversity.abbreviation?.trim() || '',
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
      await updateUniversitySettings(universityId, {
        isActive: !currentStatus,
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

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingUniversity(null);
    setError('');
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
      
      <div>
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
                            Nombre completo
                          </label>
                          <div className="text-sm font-medium text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                            {editingUniversity.name}
                          </div>
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
  );
}