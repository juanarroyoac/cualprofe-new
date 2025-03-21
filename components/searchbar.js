'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Map of common abbreviations to full university names
const UNIVERSITY_ABBREVIATIONS = {
  'ucab': 'Universidad Católica Andrés Bello',
  'unimet': 'Universidad Metropolitana',
  // Add more as needed
};

export default function SearchBar() {
  // Initialize with empty string instead of undefined
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allTeachers, setAllTeachers] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const MAX_SUGGESTIONS = 4;

  // Build university list from abbreviations
  const universities = Object.entries(UNIVERSITY_ABBREVIATIONS).map(([id, name]) => ({
    id,
    name
  }));

  // Set isMounted after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Convert any abbreviation to full university name
  const getFullUniversityName = (uniName) => {
    if (!uniName) return null;
    
    // If it's an abbreviation, convert to full name
    const lowercaseName = uniName.toLowerCase();
    if (UNIVERSITY_ABBREVIATIONS[lowercaseName]) {
      return UNIVERSITY_ABBREVIATIONS[lowercaseName];
    }
    
    // Otherwise return the original name
    return uniName;
  };

  // Normalize text for comparison (remove accents, lowercase)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics (accents)
  };

  // Load all teachers once when component mounts
  useEffect(() => {
    const loadAllTeachers = async () => {
      if (initialized) return;
      
      try {
        const teachersCollection = collection(db, 'teachers');
        const snapshot = await getDocs(teachersCollection);
        const teachersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          normalizedName: normalizeText(doc.data().name || '')
        }));
        
        setAllTeachers(teachersList);
        setInitialized(true);
      } catch (error) {
        console.error('Error loading teachers:', error);
      }
    };
    
    loadAllTeachers();
  }, [initialized]);

  // Filter teachers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const filterTeachers = () => {
      setIsLoading(true);
      try {
        // Get the proper university name (handling abbreviations)
        const fullUniversityName = selectedUniversity ? getFullUniversityName(selectedUniversity.id) : null;
        const normalizedQuery = normalizeText(searchQuery);
        
        // Filter teachers client-side
        let filteredTeachers = allTeachers.filter(teacher => {
          // Check if name contains search query (case insensitive, accent insensitive)
          const nameMatch = teacher.normalizedName.includes(normalizedQuery);
          
          // Apply university filter if selected
          const universityMatch = !fullUniversityName || 
            normalizeText(teacher.university || '') === normalizeText(fullUniversityName);
            
          return nameMatch && universityMatch;
        });
        
        // Sort by relevance (exact matches first)
        filteredTeachers.sort((a, b) => {
          // Exact match at start of name gets highest priority
          const aStartsWithQuery = a.normalizedName.startsWith(normalizedQuery);
          const bStartsWithQuery = b.normalizedName.startsWith(normalizedQuery);
          
          if (aStartsWithQuery && !bStartsWithQuery) return -1;
          if (!aStartsWithQuery && bStartsWithQuery) return 1;
          
          // Then sort by name length (shorter names first)
          return a.name.length - b.name.length;
        });
        
        // Limit to max suggestions
        setResults(filteredTeachers.slice(0, MAX_SUGGESTIONS));
      } catch (error) {
        console.error('Error filtering teachers', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only filter if we've loaded the teachers
    if (initialized) {
      // Add a small delay to prevent excessive filtering while typing
      const timeoutId = setTimeout(() => {
        filterTeachers();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, selectedUniversity, allTeachers, initialized]);

  const handleTeacherSelect = (teacherId) => {
    router.push(`/teacher/${teacherId}`);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const selectUniversity = (university) => {
    setSelectedUniversity(university);
    setIsDropdownOpen(false);
  };

  // Handle input change separately
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-center mb-8 mt-12">
        Buscando con quién meter las materias este semestre?
      </h1>
      
      <div className="w-full flex flex-col">
        {/* Search input with results - NOW FIRST */}
        <div className="relative w-full mb-4">
          <input
            type="text"
            placeholder="Buscar por profesor o materia..."
            className="w-full py-3 px-5 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0F17FF] focus:border-transparent"
            value={searchQuery} 
            onChange={handleInputChange}
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
              {results.map((teacher, index) => (
                <div
                  key={teacher.id}
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  onClick={() => handleTeacherSelect(teacher.id)}
                >
                  <div className="font-medium">{teacher.name}</div>
                  <div className="text-sm text-gray-500">
                    {teacher.school && <span>{teacher.school}</span>}
                    {teacher.school && teacher.university && <span> • </span>}
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
        
        {/* University selector - NOW AFTER SEARCH BAR */}
        <div className="relative flex justify-center mt-2" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 text-gray-700 hover:text-[#0F17FF] transition-colors text-base font-medium"
          >
            <span>
              {selectedUniversity 
                ? selectedUniversity.name 
                : "Elige tu universidad"}
            </span>
            {/* Inline SVG for dropdown arrow */}
            <svg 
              className="h-5 w-5" 
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
          </button>
          
          {/* Dropdown menu - CENTERED with larger font */}
          {isDropdownOpen && (
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-10 w-72 bg-white rounded-md shadow-lg z-40 overflow-hidden border border-gray-200">
              {universities.map((uni) => (
                <button
                  key={uni.id}
                  className="block w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-100 hover:text-[#0F17FF]"
                  onClick={() => selectUniversity(uni)}
                >
                  {uni.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}