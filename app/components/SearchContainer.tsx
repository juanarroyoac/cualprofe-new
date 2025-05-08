// app/components/SearchContainer.tsx
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUniversities } from '@/lib/hooks/useUniversities';
import { filterTeachers } from '@/lib/utils/suggestions';
import { normalizeText } from '@/lib/utils/textNormalization';
import TeacherCard from './TeacherCard';
import { useTeachers } from '@/lib/hooks/useTeachers';

// Cache keys
const SEARCH_CACHE_KEY = 'searchCache';
const TEACHERS_CACHE_KEY = 'teachersCache';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

// Map of common abbreviations to full university names
const UNIVERSITY_ABBREVIATIONS: Record<string, string> = {
  'ucab': 'Universidad Católica Andrés Bello',
  'unimet': 'Universidad Metropolitana',
  // Add more as needed
};

interface University {
  id: string;
  name: string;
  abbreviation?: string;
  isActive?: boolean;
}

interface Teacher {
  id: string;
  name: string;
  university: string;
  department: string;
  normalizedName: string;
}

interface SearchContainerProps {
  headlineText?: string;
  hideUniversityDropdown?: boolean;
  onProfessorSelect?: (professor: Teacher) => void;
  textColor?: string;
  largerHeading?: boolean;
  containerClass?: string;
}

export default function SearchContainer({
  headlineText = "Elige tus profesores con confianza este semestre",
  hideUniversityDropdown = false,
  onProfessorSelect,
  textColor,
  largerHeading,
  containerClass
}: SearchContainerProps) {
  const router = useRouter();
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { universities, loading: loadingUniversities } = useUniversities();
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_SUGGESTIONS = 4;
  const { teachers: allTeachers, loading: loadingTeachers, error } = useTeachers();

  // Set user's university from profile
  useEffect(() => {
    if (userProfile?.university) {
      setSelectedUniversity(userProfile.university);
    }
  }, [userProfile]);

  // Initialize cache from localStorage
  useEffect(() => {
    const initializeCache = async () => {
      try {
        const cachedTeachers = localStorage.getItem(TEACHERS_CACHE_KEY);
        if (cachedTeachers) {
          const { data, timestamp } = JSON.parse(cachedTeachers);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setFilteredTeachers(data);
            setInitialized(true);
            return;
          }
        }
        await loadTeachers();
      } catch (error) {
        console.error('Error initializing cache:', error);
      }
    };

    initializeCache();
  }, []);

  // Load teachers from Firestore
  const loadTeachers = async () => {
    if (initialized) return;

    try {
      const teachersCollection = collection(db, 'teachers');
      const teachersSnapshot = await getDocs(teachersCollection);
      const teachersList = teachersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          university: data.university || '',
          department: data.department || '',
          normalizedName: normalizeText(data.name || '')
        } as Teacher;
      });

      // Cache the teachers data
      localStorage.setItem(TEACHERS_CACHE_KEY, JSON.stringify({
        data: teachersList,
        timestamp: Date.now()
      }));

      setFilteredTeachers(teachersList);
      setInitialized(true);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (!allTeachers) return;

    let results = allTeachers;

    // Aplicar filtro de universidad si está seleccionada
    if (selectedUniversity) {
      results = results.filter((teacher: Teacher) => 
        normalizeText(teacher.university) === normalizeText(selectedUniversity)
      );
    }

    // Aplicar búsqueda si hay query
    if (searchQuery) {
      results = filterTeachers(results, searchQuery);
    }

    setFilteredTeachers(results);
  }, [searchQuery, selectedUniversity, allTeachers]);

  const handleProfessorSelect = (professor: Teacher) => {
    setShowResults(false);

    if (typeof window !== 'undefined' && !currentUser) {
      const count = parseInt(sessionStorage.getItem('professorViewCount') || '0');
      if (count >= 1) {
        openAuthModal('login', `/teacher/${professor.id}`);
        return;
      }
      sessionStorage.setItem('professorViewCount', (count + 1).toString());
    }

    if (onProfessorSelect) {
      onProfessorSelect(professor);
    } else {
      router.push(`/teacher/${professor.id}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loadingTeachers) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className={`w-full ${containerClass}`}>
      {headlineText && (
        <div className="text-center mb-8">
          <h1 className={`${textColor || 'text-white'} ${largerHeading ? 'text-4xl' : 'text-3xl'} font-bold mb-4`}>
            {headlineText}
          </h1>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
          placeholder="Buscar profesor, universidad o departamento..."
          className="w-full px-4 py-3 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00103f] text-gray-900 placeholder-gray-500"
        />

        {showResults && searchQuery.trim() !== '' && filteredTeachers.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute z-10 w-full mt-1 bg-[#00103f]/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            <ul className="divide-y divide-white/10">
              {filteredTeachers.slice(0, MAX_SUGGESTIONS).map(professor => (
                <li
                  key={professor.id}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors duration-150"
                  onClick={() => handleProfessorSelect(professor)}
                >
                  <div className="font-medium text-white">{professor.name}</div>
                  <div className="text-sm text-white/70">
                    {professor.university} - {professor.department}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!hideUniversityDropdown && (
        <div className="relative mt-2 max-w-2xl mx-auto text-center">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center text-sm text-white/80 hover:text-white transition-colors duration-200"
          >
            {selectedUniversity ? (
              <>
                <span className="mr-1">Universidad:</span>
                <span className="font-medium">{selectedUniversity}</span>
              </>
            ) : (
              <>
                <span className="mr-1">Todas las universidades</span>
              </>
            )}
            <svg
              className={`ml-1 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
            >
              <ul className="py-1">
                <li>
                  <button
                    onClick={() => {
                      setSelectedUniversity(null);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      !selectedUniversity ? 'bg-gray-50' : ''
                    }`}
                  >
                    Todas las universidades
                  </button>
                </li>
                {universities
                  .filter(u => u.isActive !== false)
                  .map(university => (
                    <li key={university.id}>
                      <button
                        onClick={() => {
                          setSelectedUniversity(university.name);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          selectedUniversity === university.name ? 'bg-gray-50' : ''
                        }`}
                      >
                        {university.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {filteredTeachers.map((teacher) => (
          <TeacherCard key={teacher.id} teacher={teacher} />
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No se encontraron resultados para tu búsqueda.
        </div>
      )}
    </div>
  );
}