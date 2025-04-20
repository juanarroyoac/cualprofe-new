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
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Tag {
  id: string;
  name: string;
  description?: string;
  category?: string;
  usageCount?: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export default function TagsManagementPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('general');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  const editNameRef = useRef<HTMLInputElement>(null);

  // Categories for tags
  const categories = [
    { id: 'general', name: 'General' },
    { id: 'personality', name: 'Personalidad' },
    { id: 'teaching', name: 'Enseñanza' },
    { id: 'workload', name: 'Carga de trabajo' }
  ];

  // Fetch tags
  const fetchTags = async () => {
    try {
      setLoading(true);
      const tagsQuery = query(collection(db, 'tags'), orderBy('category'), orderBy('name'));
      const snapshot = await getDocs(tagsQuery);
      
      const tagsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tag));
      
      setTags(tagsList);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('Error al cargar las etiquetas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Focus on edit input when editing a tag
  useEffect(() => {
    if (editingTag && editNameRef.current) {
      editNameRef.current.focus();
    }
  }, [editingTag]);

  // Add a new tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTagName.trim()) {
      setError('El nombre de la etiqueta es obligatorio');
      return;
    }
    
    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      setError('Ya existe una etiqueta con ese nombre');
      return;
    }

    setError('');
    
    try {
      const newTag = {
        name: newTagName.trim(),
        description: newTagDescription.trim() || '',
        category: newTagCategory,
        isActive: true,
        usageCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'tags'), newTag);
      
      setTags([...tags, { id: docRef.id, ...newTag }]);
      setSuccess('Etiqueta creada con éxito');
      
      // Clear form
      setNewTagName('');
      setNewTagDescription('');
      setNewTagCategory('general');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding tag:', error);
      setError('Error al crear la etiqueta');
    }
  };

  // Edit tag
  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTag) return;
    
    if (!editingTag.name.trim()) {
      setError('El nombre de la etiqueta es obligatorio');
      return;
    }
    
    // Check if tag name already exists (except for the current tag)
    if (tags.some(tag => 
      tag.id !== editingTag.id && 
      tag.name.toLowerCase() === editingTag.name.toLowerCase()
    )) {
      setError('Ya existe una etiqueta con ese nombre');
      return;
    }

    setError('');
    
    try {
      await updateDoc(doc(db, 'tags', editingTag.id), {
        name: editingTag.name.trim(),
        description: editingTag.description?.trim() || '',
        category: editingTag.category || 'general',
        updatedAt: serverTimestamp()
      });
      
      setTags(tags.map(tag => 
        tag.id === editingTag.id ? { ...editingTag } : tag
      ));
      
      setSuccess('Etiqueta actualizada con éxito');
      setEditingTag(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating tag:', error);
      setError('Error al actualizar la etiqueta');
    }
  };

  // Toggle tag active status
  const handleToggleActive = async (tagId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'tags', tagId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
      
      setTags(tags.map(tag => 
        tag.id === tagId ? { ...tag, isActive: !currentStatus } : tag
      ));
      
      setSuccess(`Etiqueta ${!currentStatus ? 'activada' : 'desactivada'} con éxito`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error toggling tag status:', error);
      setError('Error al cambiar el estado de la etiqueta');
    }
  };

  // Delete tag
  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la etiqueta "${tagName}"?`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'tags', tagId));
      
      setTags(tags.filter(tag => tag.id !== tagId));
      setSuccess('Etiqueta eliminada con éxito');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError('Error al eliminar la etiqueta');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingTag(null);
    setError('');
  };

  // Filter tags based on active status
  const filteredTags = showInactive ? tags : tags.filter(tag => tag.isActive);

  // Group tags by category
  const tagsByCategory = filteredTags.reduce((acc, tag) => {
    const category = tag.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {} as { [key: string]: Tag[] });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Etiquetas</h1>
        <p className="text-gray-600">Administra las etiquetas que los usuarios pueden seleccionar al calificar profesores</p>
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
        {/* Add new tag form */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Añadir nueva etiqueta</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddTag} className="space-y-4">
                <div>
                  <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="tagName"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: Exigente"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="tagDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    id="tagDescription"
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Descripción de la etiqueta (opcional)"
                  />
                </div>
                
                <div>
                  <label htmlFor="tagCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    id="tagCategory"
                    value={newTagCategory}
                    onChange={(e) => setNewTagCategory(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Añadir etiqueta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Tags list */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Etiquetas</h2>
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
                <p className="mt-4 text-gray-600">Cargando etiquetas...</p>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay etiquetas{showInactive ? '' : ' activas'}.
              </div>
            ) : (
              <div className="p-4">
                {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">
                      {categories.find(c => c.id === category)?.name || 'General'}
                    </h3>
                    <div className="bg-gray-50 rounded-lg border border-gray-200">
                      {editingTag && categoryTags.some(tag => tag.id === editingTag.id) ? (
                        // Edit form
                        <form onSubmit={handleUpdateTag} className="p-4 border-b border-gray-200 last:border-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label htmlFor="editTagName" className="block text-xs font-medium text-gray-500 mb-1">
                                Nombre *
                              </label>
                              <input
                                type="text"
                                id="editTagName"
                                ref={editNameRef}
                                value={editingTag.name}
                                onChange={(e) => setEditingTag({...editingTag, name: e.target.value})}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="editTagCategory" className="block text-xs font-medium text-gray-500 mb-1">
                                Categoría
                              </label>
                              <select
                                id="editTagCategory"
                                value={editingTag.category || 'general'}
                                onChange={(e) => setEditingTag({...editingTag, category: e.target.value})}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                {categories.map(category => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="mb-4">
                            <label htmlFor="editTagDescription" className="block text-xs font-medium text-gray-500 mb-1">
                              Descripción
                            </label>
                            <textarea
                              id="editTagDescription"
                              value={editingTag.description || ''}
                              onChange={(e) => setEditingTag({...editingTag, description: e.target.value})}
                              rows={2}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                            >
                              Guardar
                            </button>
                          </div>
                        </form>
                      ) : (
                        // Tags list for this category
                        <div className="divide-y divide-gray-200">
                          {categoryTags.map(tag => (
                            <div key={tag.id} className="p-4 flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <h4 className="text-sm font-medium text-gray-900">{tag.name}</h4>
                                  {!tag.isActive && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      Inactiva
                                    </span>
                                  )}
                                  {tag.usageCount && tag.usageCount > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Usada {tag.usageCount} {tag.usageCount === 1 ? 'vez' : 'veces'}
                                    </span>
                                  )}
                                </div>
                                {tag.description && (
                                  <p className="mt-1 text-sm text-gray-500">{tag.description}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingTag(tag)}
                                  className="text-sm text-yellow-600 hover:text-yellow-800"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleToggleActive(tag.id, tag.isActive)}
                                  className={`text-sm ${
                                    tag.isActive 
                                    ? 'text-gray-600 hover:text-gray-800' 
                                    : 'text-green-600 hover:text-green-800'
                                  }`}
                                >
                                  {tag.isActive ? 'Desactivar' : 'Activar'}
                                </button>
                                {(!tag.usageCount || tag.usageCount === 0) && (
                                  <button
                                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                                    className="text-sm text-red-600 hover:text-red-800"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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