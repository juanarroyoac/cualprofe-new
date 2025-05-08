'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import SearchBar from './searchbar';

// Updated map of common abbreviations to include all universities from forms
const UNIVERSITY_ABBREVIATIONS: Record<string, string> = {
  'ucab': 'Universidad Católica Andrés Bello',
  'unimet': 'Universidad Metropolitana',
  'ucv': 'Universidad Central de Venezuela',
  'udo': 'Universidad de Oriente',
  'uc': 'Universidad de Carabobo',
  // More can be added as needed
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
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Extract first name from userName
  const firstName = userName ? userName.split(' ')[0].toUpperCase() : '';

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
    <header className="w-full bg-[#00248c] text-white z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile Layout (centered logo) */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between">
            {/* Centered Logo */}
            <Link href="/" className="flex items-center justify-center">
              <div className="w-[140px] h-[35px] relative">
                <Image 
                  src="/CualProfeLogoTransparent.png" 
                  alt="CuálProfe" 
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  quality={90}
                />
              </div>
            </Link>
            
            {/* Smaller Login Button for Mobile */}
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center text-white p-2 rounded-lg hover:bg-[#00103f] transition-all duration-200 w-10 h-10"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 text-gray-800">
                    <div className="py-3 px-4 border-b border-gray-100 text-sm font-medium text-gray-600">
                      {userName}
                    </div>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Mi perfil
                    </Link>
                    <Link 
                      href="/my-ratings" 
                      className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Mis calificaciones
                    </Link>
                    <button 
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-red-600 transition-colors duration-200"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onAuthClick}
                className="bg-white text-[#00248c] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center mr-8">
            <div className="w-[160px] h-[40px] relative">
              <Image 
                src="/CualProfeLogoTransparent.png" 
                alt="CuálProfe" 
                fill
                style={{ objectFit: 'contain' }}
                priority
                quality={90}
              />
            </div>
          </Link>
          
          {/* Auth button or User Menu */}
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-white text-[#00248c] font-medium px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 min-h-[44px]"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <span className="font-inter font-bold text-sm tracking-wide">HOLA, {firstName}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 text-gray-800">
                  <div className="py-3 px-4 border-b border-gray-100 text-sm font-medium text-gray-600">
                    {userName}
                  </div>
                  <Link 
                    href="/profile" 
                    className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mi perfil
                  </Link>
                  <Link 
                    href="/my-ratings" 
                    className="block px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mis calificaciones
                  </Link>
                  <button 
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-red-600 transition-colors duration-200"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="bg-white text-[#00248c] px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200 min-h-[44px]"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}