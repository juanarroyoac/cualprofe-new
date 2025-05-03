'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SearchBar({ 
  textColor = "text-gray-800", 
  largerHeading = false, 
  headlineText = "Buscando con quién meter las materias este semestre?",
  containerClass = "",
  headingWeight = "font-semibold", 
  headingSize = "",
  hideUniversityDropdown = false
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

  // Determine text color classes
  const textColorClass = textColor === "white" ? "text-white" : "text-gray-800";
  const dropdownTextClass = textColor === "white" ? "text-white hover:text-gray-200" : "text-gray-700 hover:text-[#00103f]";

  // Determine heading size class - use headingSize if provided, otherwise use default
  const headingSizeClass = headingSize || (largerHeading ? 'text-5xl md:text-6xl' : 'text-2xl');

  return (
    <div className={`flex flex-col items-center max-w-2xl mx-auto ${containerClass}`}>
      {/* Only show headline text if it's not empty */}
      {headlineText && (
        <h1 className={`${headingSizeClass} ${headingWeight} ${textColorClass} text-center mb-8`}>
          {headlineText}
        </h1>
      )}
      
      <div className="w-full flex flex-col">
        {/* Search input with results */}
        <div className="relative w-full mb-6">
          <input
            type="text"
            placeholder="Buscar por profesor o materia..."
            className="w-full py-4 px-6 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00103f] focus:border-transparent text-base"
            value={searchQuery} 
            onChange={handleSearchInputChange}
          />
          
          {/* Search icon or loading spinner */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg 
                className="h-5 w-5 text-gray-400"
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
          
          {/* Search results */}
          {results.length > 0 && (
            <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {results.map((teacher) => (
                <div
                  key={teacher.id}
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  onClick={() => handleTeacherSelect(teacher.id)}
                >
                  <div className="font-medium">{teacher.name}</div>
                  <div className="text-sm text-gray-500">
                    {teacher.department && <span>{teacher.department}</span>}
                    {teacher.department && teacher.university && <span> • </span>}
                    {teacher.university && <span>{teacher.university}</span>}
                  </div>
                </div>
              ))}
              {results.length === MAX_SUGGESTIONS && (
                <div className="p-2 text-center text-sm text-gray-500 border-t border-gray-200">
                  Mostrando {MAX_SUGGESTIONS} resultados. Refina tu búsqueda para ver más.
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* University selector - only shown if hideUniversityDropdown is false */}
        {!hideUniversityDropdown && (
          <div className="relative flex justify-center" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className={`flex items-center gap-2 ${dropdownTextClass} transition-colors text-lg font-bold`}
              disabled={loadingUniversities}
            >
              {loadingUniversities ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Cargando universidades...</span>
                </div>
              ) : (
                <>
                  <span>
                    {selectedUniversity 
                      ? selectedUniversity.name 
                      : "Elige tu universidad"}
                  </span>
                  {/* Inline SVG for dropdown arrow */}
                  <svg 
                    className={`h-5 w-5 ${textColor === "white" ? "text-white" : ""}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </>
              )}
            </button>
            
            {/* Dropdown menu */}
            {isDropdownOpen && !loadingUniversities && (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-10 w-72 bg-white rounded-md shadow-lg z-40 overflow-hidden border border-gray-200 max-h-60 overflow-y-auto">
                {universities.length === 0 ? (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    No hay universidades disponibles
                  </div>
                ) : (
                  universities.map((uni) => (
                    <button
                      key={uni.id}
                      className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-100 hover:text-[#00103f]"
                      onClick={() => selectUniversity(uni)}
                    >
                      {uni.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}