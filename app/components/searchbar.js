'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function SearchBar({ 
  containerClass = ""
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const MAX_SUGGESTIONS = 4;

  // Fetch universities from database
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoadingUniversities(true);
        
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
        
        // Check university settings to filter only active ones and get abbreviations
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
        setLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  // Normalize text for flexible searching (remove accents, lowercase)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics (accents)
  };

  // Get full university name from selection 
  const getFullUniversityName = (uniId) => {
    if (!uniId) return null;
    
    const university = universities.find(uni => uni.id === uniId);
    return university ? university.name : null;
  };

  // Handle search input change
  const handleSearchInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Allow searching from first character
    if (value.trim() === '') {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const teachersRef = collection(db, 'teachers');
      
      // Create query to match partial names flexibly
      const normalizedQuery = normalizeText(value);
      
      let teacherQuery;
      if (selectedUniversity) {
        const fullUniversityName = getFullUniversityName(selectedUniversity.id);
        teacherQuery = query(
          teachersRef,
          where('university', '==', fullUniversityName),
          limit(MAX_SUGGESTIONS)
        );
      } else {
        teacherQuery = query(
          teachersRef,
          limit(MAX_SUGGESTIONS)
        );
      }
      
      const querySnapshot = await getDocs(teacherQuery);
      
      // Filter results client-side for more flexible matching
      const teachers = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(teacher => 
          normalizeText(teacher.name).includes(normalizedQuery)
        );
      
      setResults(teachers);
    } catch (error) {
      console.error('Error searching teachers:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSelect = (teacherId) => {
    router.push(`/teacher/${teacherId}`);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const selectUniversity = (university) => {
    setSelectedUniversity(university);
    setIsDropdownOpen(false);
    
    // Re-run search with existing query
    if (searchQuery.trim() !== '') {
      handleSearchInputChange({ target: { value: searchQuery } });
    }
  };

  return (
    <div className={`flex flex-col items-center max-w-xl mx-auto ${containerClass}`}>
      <div className="w-full flex flex-col">
        <div className="relative w-full mb-2">
          <input
            type="text"
            placeholder="Buscar por profesor o materia..."
            className="w-full py-2 px-4 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:border-transparent text-sm shadow-sm"
            value={searchQuery} 
            onChange={handleSearchInputChange}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg 
                className="h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
          </div>
          {results.length > 0 && (
            <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {results.map((teacher) => (
                <div
                  key={teacher.id}
                  className="p-2 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                  onClick={() => handleTeacherSelect(teacher.id)}
                >
                  <div className="font-medium">{teacher.name}</div>
                  <div className="text-xs text-gray-500">
                    {teacher.department && <span>{teacher.department}</span>}
                    {teacher.department && teacher.university && <span> • </span>}
                    {teacher.university && <span>{teacher.university}</span>}
                  </div>
                </div>
              ))}
              {results.length === MAX_SUGGESTIONS && (
                <div className="p-2 text-center text-xs text-gray-500 border-t border-gray-200">
                  Mostrando {MAX_SUGGESTIONS} resultados. Refina tu búsqueda para ver más.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}