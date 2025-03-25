'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  // More specific type definition instead of any
  [key: string]: string | number | boolean | undefined | null;
}

interface HeaderWithSearchProps {
  onAuthClick: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  userName: string;
}

export default function HeaderWithSearch({ onAuthClick, isLoggedIn, onLogout, userName }: HeaderWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const MAX_SUGGESTIONS = 4;

  // Build university list from abbreviations
  const universities = Object.entries(UNIVERSITY_ABBREVIATIONS).map(([id, name]) => ({
    id,
    name
  }));

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    
    // If it's an abbreviation, convert to full name
    const lowercaseName = uniName.toLowerCase();
    if (UNIVERSITY_ABBREVIATIONS[lowercaseName]) {
      return UNIVERSITY_ABBREVIATIONS[lowercaseName];
    }
    
    // Otherwise return the original name
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

  const handleTeacherSelect = (teacherId: string) => {
    setShowResults(false);
    setSearchQuery('');
    router.push(`/teacher/${teacherId}`);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
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
    <header className="fixed top-0 left-0 w-full bg-[#00248c] text-white shadow-md z-50">
      <div className="container mx-auto px-4 py-3 flex items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center mr-6">
          <Image 
            src="/CualProfeLogoTransparent.png" 
            alt="CuálProfe" 
            width={240} 
            height={64} 
            className="h-8 w-auto" 
            priority
            quality={100}
            unoptimized={true}
          />
        </Link>
        
        {/* Center container for dropdown and search */}
        <div className="flex items-center mx-auto">
          {/* University dropdown */}
          <div className="relative mr-4 w-56" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="w-full bg-[#00248c] text-white px-3 py-2 flex items-center justify-between"
              type="button"
            >
              <span className="text-white text-sm font-semibold truncate">
                {selectedUniversity ? selectedUniversity.name : "Seleccionar universidad"}
              </span>
              <svg 
                className="h-4 w-4 ml-0.5 text-white flex-shrink-0" 
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
            
            {/* University dropdown with WHITE background */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-0 w-56 bg-white rounded-md shadow-lg z-40 overflow-hidden">
                {universities.map((uni) => (
                  <button
                    key={uni.id}
                    className="block w-full text-left px-4 py-2 text-sm text-black font-medium hover:bg-gray-100 truncate"
                    onClick={() => selectUniversity(uni)}
                  >
                    {uni.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Search bar */}
          <div className="relative w-80" ref={searchRef}>
            <input
              type="text"
              placeholder="Buscar por profesor o materia..."
              className="w-full py-2 px-4 pr-8 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent text-sm"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
            />
          
          {/* Search icon or loading spinner */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
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
          
          {/* Search results */}
          {showResults && results.length > 0 && (
            <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
              {results.map((teacher) => (
                <div
                  key={teacher.id}
                  className="p-2 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  onClick={() => handleTeacherSelect(teacher.id)}
                >
                  <div className="font-medium text-gray-800 text-sm">{teacher.name}</div>
                  <div className="text-xs text-gray-500">
                    {teacher.school && <span>{teacher.school}</span>}
                    {teacher.school && teacher.university && <span> • </span>}
                    {teacher.university && <span>{teacher.university}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        
        {/* Spacer */}
        <div className="ml-auto"></div>
        
        {/* Auth button or User Menu */}
        {isLoggedIn ? (
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
            >
              <span className="hidden sm:inline">{userName}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
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
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 text-gray-800">
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Mi perfil
                </Link>
                <Link 
                  href="/my-ratings" 
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Mis calificaciones
                </Link>
                <button 
                  onClick={() => {
                    onLogout();
                    setShowUserMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={onAuthClick}
            className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            Iniciar sesión / Registrarse
          </button>
        )}
      </div>
    </header>
  );
}