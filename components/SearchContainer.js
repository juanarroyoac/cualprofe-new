'use client';
// import SearchBar from './SearchBar'; // Unused import
import Link from 'next/link';

// This component groups all search elements together as a single unit for better centering
export default function SearchContainer() {
  return (
    <div className="flex flex-col items-center">
      {/* Headline */}
      <h1 className="text-5xl md:text-6xl font-semibold text-white text-center mb-10">
        Elige tus profesores con confianza este semestre
      </h1>
      
      {/* Search input */}
      <div className="relative w-full max-w-2xl mb-6">
        <input
          type="text"
          placeholder="Buscar por profesor o materia..."
          className="w-full py-4 px-6 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00248c] focus:border-transparent text-base"
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
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
        </div>
      </div>
      
      {/* University selector */}
      <button
        className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors text-lg font-bold mb-8"
      >
        <span>Elige tu universidad</span>
        <svg 
          className="h-5 w-5 text-white"
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
      
      {/* Add Professor Link */}
      <Link 
        href="/add-professor" 
        className="text-base text-white hover:underline font-medium"
      >
        ¿No encuentras a un profesor? Agrégalo aquí
      </Link>
    </div>
  );
}