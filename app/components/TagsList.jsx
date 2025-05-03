'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TagsList({ tags = [], selectable = true, onChange, small = false, maxTags = 3, uppercase = false }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch active tags from Firestore
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const tagsQuery = query(
          collection(db, 'tags'), 
          where('isActive', '==', true),
          orderBy('name')
        );
        
        const snapshot = await getDocs(tagsQuery);
        const tagsList = snapshot.docs.map(doc => doc.data().name);
        setAvailableTags(tagsList);
      } catch (error) {
        console.error('Error fetching tags:', error);
        // Fallback to default tags if there's an error
        setAvailableTags([
          "Calificador Exigente",
          "Importante Participar",
          "Clases Excelentes",
          "Criterios Claros",
          "Muchas Tareas",
          "Divertido",
          "Muchos Exámenes",
          "Accesible Fuera de Clase"
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleTagClick = (tag) => {
    if (!selectable) return;

    let newSelectedTags;
    if (selectedTags.includes(tag)) {
      newSelectedTags = selectedTags.filter(t => t !== tag);
    } else {
      if (selectedTags.length >= maxTags) {
        return; // Don't add more than maxTags
      }
      newSelectedTags = [...selectedTags, tag];
    }

    setSelectedTags(newSelectedTags);
    if (onChange) {
      onChange(newSelectedTags);
    }
  };

  // Use provided tags or available tags based on selectable mode
  const displayTags = selectable ? availableTags : tags;

  if (loading && selectable) {
    return <div className="text-sm text-gray-500">Cargando etiquetas...</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayTags.map(tag => {
        const isSelected = selectable ? selectedTags.includes(tag) : true;

        return (
          <button
            key={tag}
            className={`rounded-full px-3 py-1 ${small ? 'text-xs' : 'text-sm'} font-medium transition-colors duration-200 ${
              isSelected
                ? 'bg-blue-100 text-[#00248c] hover:bg-blue-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            } ${selectable ? 'cursor-pointer' : 'cursor-default'} ${uppercase ? 'uppercase' : ''}`}
            onClick={() => handleTagClick(tag)}
          >
            {tag}
          </button>
        );
      })}

      {selectable && selectedTags.length > 0 && (
        <div className="w-full mt-2 text-sm text-gray-500">
          {selectedTags.length} de {maxTags} etiquetas seleccionadas
        </div>
      )}
    </div>
  );
}