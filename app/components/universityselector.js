import { useState } from 'react';

export default function UniversitySelector({ selectedUniversity, onSelectUniversity }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const universities = [
    { id: 'ucab', name: 'Universidad Católica Andrés Bello' },
    { id: 'unimet', name: 'Universidad Metropolitana' }
  ];

  const handleSelect = (universityId) => {
    onSelectUniversity(universityId);
    setIsOpen(false);
  };

  const getUniversityName = () => {
    if (!selectedUniversity) return 'Escoge tu universidad';
    return universities.find(u => u.id === selectedUniversity)?.name || 'Escoge tu universidad';
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full bg-white border border-gray-300 py-3 px-4 text-left flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getUniversityName()}</span>
        <svg 
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 shadow-lg z-10">
          {universities.map((university, index) => (
            <div
              key={university.id}
              className={`py-3 px-4 cursor-pointer hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              onClick={() => handleSelect(university.id)}
            >
              {university.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}