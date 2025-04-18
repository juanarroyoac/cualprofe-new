"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    <header className="fixed top-0 left-0 w-full bg-gradient-to-r from-[#001d70] via-[#00248c] to-[#0033a8] text-white shadow-md z-50">
      <div className="container mx-auto px-4 py-3">
        {/* Mobile Layout (left-aligned logo) */}
        <div className="sm:hidden flex items-center justify-between">
          {/* Left-aligned Logo */}
          <Link href="/" className="flex items-center">
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
          
          {/* Smaller Login Button for Mobile */}
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center bg-gradient-to-r from-blue-800 to-blue-700 text-white p-2 rounded hover:from-blue-900 hover:to-blue-800 transition-colors w-10 h-10"
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 text-gray-800">
                  <div className="py-2 px-4 border-b border-gray-100 text-sm font-medium text-gray-600">
                    {userName}
                  </div>
                  <Link 
                    href="/profile" 
                    className="block px-4 py-3 text-sm hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mi perfil
                  </Link>
                  <Link 
                    href="/my-ratings" 
                    className="block px-4 py-3 text-sm hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mis calificaciones
                  </Link>
                  <button 
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-red-600"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="bg-gradient-to-r from-white to-gray-100 text-black px-2 py-1 rounded text-xs font-medium hover:from-gray-100 hover:to-gray-200 transition-colors"
            >
              Ingresar
            </button>
          )}
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:justify-between sm:items-center">
          <Link href="/" className="flex items-center">
            <div className="w-[180px] h-[48px] relative">
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
          
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-800 to-blue-700 text-white px-4 py-2 rounded hover:from-blue-900 hover:to-blue-800 transition-colors min-h-[44px]"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <span>{userName}</span>
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 text-gray-800">
                  <Link 
                    href="/profile" 
                    className="block px-4 py-3 text-sm hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mi perfil
                  </Link>
                  <Link 
                    href="/my-ratings" 
                    className="block px-4 py-3 text-sm hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mis calificaciones
                  </Link>
                  <button 
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-red-600"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="bg-gradient-to-r from-white to-gray-100 text-black px-4 py-2 rounded font-medium hover:from-gray-100 hover:to-gray-200 transition-colors min-h-[44px]"
            >
              Iniciar sesión / Registrarse
            </button>
          )}
        </div>
      </div>
    </header>
  );
}