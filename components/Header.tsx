import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onAuthClick: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  userName: string;
}

export default function Header({ onAuthClick, isLoggedIn, onLogout, userName }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full bg-[#0F17FF] text-white shadow-md z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          cualprofe
        </Link>
        
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