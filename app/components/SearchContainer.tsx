// app/components/SearchContainer.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react'; // Add React import
// import Link from 'next/link'; // Removed unused import
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Map of common abbreviations to full university names
const UNIVERSITY_ABBREVIATIONS: Record<string, string> = {
  'ucab': 'Universidad Católica Andrés Bello',
  'unimet': 'Universidad Metropolitana',
  // Add more as needed
};

interface University {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  school?: string;
  university?: string;
  normalizedName: string;
  department?: string; // Added to match usage in render
  [key: string]: string | number | boolean | undefined | null;
}

interface SearchContainerProps {
  headlineText?: string;
  hideUniversityDropdown?: boolean;
  onProfessorSelect?: (professorId: string) => void;
  textColor?: string;
  largerHeading?: boolean;
}

export default function SearchContainer({
  headlineText = "Elige tus profesores con confianza este semestre",
  hideUniversityDropdown = false,
  onProfessorSelect,
  textColor,
  largerHeading
}: SearchContainerProps) {
  const router = useRouter();
  const { currentUser, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_SUGGESTIONS = 4;

  const universities = [
    { id: 'ucab', name: 'Universidad Católica Andrés Bello (UCAB)' },
    { id: 'unimet', name: 'Universidad Metropolitana (UNIMET)' }
  ];

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize text for comparison (remove accents, lowercase)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics (accents)
  };

  // Convert any abbreviation to full university name
  const getFullUniversityName = (uniName: string): string | null => {
    if (!uniName) return null;

    const lowercaseName = uniName.toLowerCase();
    if (UNIVERSITY_ABBREVIATIONS[lowercaseName]) {
      return UNIVERSITY_ABBREVIATIONS[lowercaseName];
    }

    return uniName;
  };

  // Load all teachers once when component mounts
  useEffect(() => {
    const loadAllTeachers = async () => {
      if (initialized) return;

      try {
        const teachersCollection = collection(db, 'teachers');
        const snapshot = await getDocs(teachersCollection);
        const teachersList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            normalizedName: normalizeText(data.name || '')
          };
        }) as Teacher[];

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
        const filteredTeachers = allTeachers.filter(teacher => {
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

  // Handle professor selection with auth check
  const handleProfessorSelect = (professorId: string) => {
    setShowResults(false);

    if (typeof window !== 'undefined' && !currentUser) {
      // Get current view count from sessionStorage (as per your code)
      // CONSIDER: Using ViewTrackingContext might be more consistent here if available
      const count = parseInt(sessionStorage.getItem('professorViewCount') || '0');

      // If they've viewed 1 or more professors already and aren't authenticated, show auth modal
      if (count >= 1) {
        openAuthModal('login', `/teacher/${professorId}`);
        return;
      }

      // Otherwise increment the counter and allow them to view the professor
      sessionStorage.setItem('professorViewCount', (count + 1).toString());
    }

    // Navigate to professor page
    if (onProfessorSelect) {
      onProfessorSelect(professorId);
    } else {
      router.push(`/teacher/${professorId}`);
    }
  };

  const selectUniversity = (university: University) => {
    setSelectedUniversity(university);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim() !== '') {
      setShowResults(true);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Headline - conditional rendering based on prop */}
      {headlineText !== "" && (
        <h1 className={`text-5xl md:text-6xl font-semibold ${textColor || 'text-white'} text-center mb-10 ${largerHeading ? 'text-7xl' : ''}`}>
          {headlineText}
        </h1>
      )}

      {/* Search input */}
      <div className="relative w-full max-w-2xl mb-6">
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar por profesor o materia..."
          className="w-full py-4 px-6 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00248c] focus:border-transparent text-base"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />

        {/* Search icon */}
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

        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            <ul className="py-2">
              {results.map((professor) => (
                <li
                  key={professor.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleProfessorSelect(professor.id)}
                >
                  <div className="font-medium">{professor.name}</div>
                  <div className="text-sm text-gray-500">
                    {professor.department} • {universities.find(u => u.id === professor.university)?.name || professor.university}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* University selector - only show if not hidden */}
      {!hideUniversityDropdown && (
        <div className="relative">
          <button
            className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors text-lg font-bold mb-8"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>
              {selectedUniversity
                ? universities.find(u => u.id === selectedUniversity.id)?.name
                : "Elige tu universidad"}
            </span>
            <svg
              className={`h-5 w-5 text-white transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
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

          {/* University dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-1/2 transform -translate-x-1/2 z-10 mt-1 w-64 bg-white rounded-lg shadow-lg">
              <ul className="py-1">
                {universities.map(uni => (
                  <li
                    key={uni.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                    onClick={() => selectUniversity(uni)}
                  >
                    {uni.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Removed the redundant "¿No encuentras a un profesor? Agrégalo aquí" link */}
    </div>
  );
}