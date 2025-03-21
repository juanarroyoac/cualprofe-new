'use client';

import { useState } from 'react';

const AVAILABLE_TAGS = [
  "Tough Grader", 
  "Get Ready To Read",
  "Participation Matters",
  "Extra Credit",
  "Group Projects",
  "Amazing Lectures",
  "Clear Grading Criteria",
  "Gives Good Feedback",
  "Inspirational",
  "Lots Of Homework",
  "Hilarious",
  "Beware Of Pop Quizzes",
  "So Many Papers",
  "Caring",
  "Respected",
  "Lecture Heavy",
  "Test Heavy",
  "Graded By Few Things",
  "Accessible Outside Class",
  "Online Savvy"
];

// Spanish translations for the tags
const TAG_TRANSLATIONS = {
  "Tough Grader": "Calificador Exigente",
  "Get Ready To Read": "Prepárate Para Leer",
  "Participation Matters": "Participación Importante",
  "Extra Credit": "Crédito Extra",
  "Group Projects": "Proyectos Grupales",
  "Amazing Lectures": "Clases Excelentes",
  "Clear Grading Criteria": "Criterios Claros de Evaluación",
  "Gives Good Feedback": "Buena Retroalimentación",
  "Inspirational": "Inspirador",
  "Lots Of Homework": "Muchas Tareas",
  "Hilarious": "Divertido",
  "Beware Of Pop Quizzes": "Cuidado Con Exámenes Sorpresa",
  "So Many Papers": "Muchos Trabajos Escritos",
  "Caring": "Atento",
  "Respected": "Respetado",
  "Lecture Heavy": "Muchas Clases Teóricas",
  "Test Heavy": "Muchos Exámenes",
  "Graded By Few Things": "Califica Por Pocas Cosas",
  "Accessible Outside Class": "Accesible Fuera de Clase",
  "Online Savvy": "Habilidoso en Línea"
};

export default function TagsList({ tags = [], selectable = true, onChange, small = false, maxTags = 3 }) {
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
        const translatedTag = TAG_TRANSLATIONS[tag] || tag;
        
        return (
          <button
            key={tag}
            className={`rounded-full px-3 py-1 ${small ? 'text-xs' : 'text-sm'} ${
              isSelected
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            } ${selectable ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => handleTagClick(tag)}
          >
            {translatedTag}
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