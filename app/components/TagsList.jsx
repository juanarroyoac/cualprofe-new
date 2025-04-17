// components/TagsList.jsx // Or wherever your component is located
'use client';

import { useState } from 'react';

// Only Spanish tags - no English versions at all
const AVAILABLE_TAGS = [
  "Calificador Exigente",
  "Participación Importante",
  "Clases Excelentes",
  "Criterios Claros",
  "Muchas Tareas",
  "Divertido",
  "Muchos Exámenes",
  "Accesible Fuera de Clase"
];

// Added 'uppercase' prop, default to false
export default function TagsList({ tags = [], selectable = true, onChange, small = false, maxTags = 3, uppercase = false }) {
  const [selectedTags, setSelectedTags] = useState([]);

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

  // Use provided tags or all available tags based on selectable mode
  const displayTags = selectable ? AVAILABLE_TAGS : tags;

  return (
    <div className="flex flex-wrap gap-2">
      {displayTags.map(tag => {
        const isSelected = selectable ? selectedTags.includes(tag) : true;

        return (
          <button
            key={tag}
            // Added conditional uppercase class
            className={`rounded-full px-3 py-1 ${small ? 'text-xs' : 'text-sm'} font-medium transition-colors duration-200 ${
              isSelected
                ? 'bg-blue-100 text-[#00248c] hover:bg-blue-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            } ${selectable ? 'cursor-pointer' : 'cursor-default'} ${uppercase ? 'uppercase' : ''}`} // Conditionally add 'uppercase'
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