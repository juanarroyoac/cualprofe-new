import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function UniversitySelector({ selectedUniversity, onSelectUniversity }) {
  const [isOpen, setIsOpen] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoading(true);
        
        // Get all unique universities from teachers
        const teachersQuery = query(collection(db, 'teachers'), orderBy('university'));
        const teachersSnapshot = await getDocs(teachersQuery);
        
        // Create a map to track unique universities
        const universitiesMap = new Map();
        
        // Process teachers to get unique universities
        teachersSnapshot.forEach(docSnapshot => {
          const teacherData = docSnapshot.data();
          const universityName = teacherData.university;
          
          if (universityName && !universitiesMap.has(universityName)) {
            universitiesMap.set(universityName, {
              id: universityName.toLowerCase().replace(/\s+/g, '-'),
              name: universityName,
              isActive: true // Default to active
            });
          }
        });
        
        // Check university settings to filter only active ones
        for (const [name, university] of universitiesMap.entries()) {
          const settingDoc = await getDoc(doc(db, 'universitySettings', name));
          if (settingDoc.exists()) {
            const settingData = settingDoc.data();
            university.isActive = settingData.isActive !== false; // Default to true if not set
            
            // Use abbreviation as ID if available
            if (settingData.abbreviation) {
              university.id = settingData.abbreviation.toLowerCase();
            }
          }
        }
        
        // Convert map to array, filtering for active only
        const universitiesList = Array.from(universitiesMap.values())
          .filter(uni => uni.isActive)
          .sort((a, b) => a.name.localeCompare(b.name, 'es'));
        
        setUniversities(universitiesList);
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

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
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Cargando...</span>
          </div>
        ) : (
          <span>{getUniversityName()}</span>
        )}
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

      {isOpen && !loading && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 shadow-lg z-10 max-h-60 overflow-y-auto">
          {universities.length === 0 ? (
            <div className="py-3 px-4 text-gray-500 text-center">
              No hay universidades disponibles
            </div>
          ) : (
            universities.map((university, index) => (
              <div
                key={university.id}
                className={`py-3 px-4 cursor-pointer hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                onClick={() => handleSelect(university.id)}
              >
                {university.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}