"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  onAuthClick: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  userName: string;
  transparent?: boolean;
}

export default function Header({ onAuthClick, isLoggedIn, onLogout, userName, transparent = false }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Extract first name from userName
  const firstName = userName ? userName.split(' ')[0] : '';

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

  // Add scroll event listener for transparent header
  useEffect(() => {
    if (transparent) {
      const handleScroll = () => {
        const scrollPosition = window.scrollY;
        if (scrollPosition > 50) {
          setScrolled(true);
        } else {
          setScrolled(false);
        }
      };

      // Set initial state
      handleScroll();
      
      // Add event listener
      window.addEventListener('scroll', handleScroll);
      
      // Cleanup
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [transparent]);

  // Determine header background class
  const headerBgClass = transparent 
    ? scrolled 
      ? "header-scroll-transition header-scrolled" // scrolled state
      : "header-scroll-transition bg-transparent" // initial transparent state
    : "bg-gradient-to-r from-[#001d70] via-[#00248c] to-[#0033a8]"; // non-transparent header

  return (
    <header className={`w-full ${headerBgClass} text-white z-50 ${scrolled ? 'shadow-md' : ''} ${transparent ? 'absolute top-0 left-0 right-0' : ''}`}>
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
                className="flex items-center justify-center bg-white text-black font-bold p-2 rounded shadow-md hover:bg-gray-100 transition-colors w-10 h-10"
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
              className="bg-white text-black px-3 py-1 rounded shadow-md text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              INGRESAR
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
                className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors min-h-[44px]"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <span className="uppercase font-poppins">HOLA, {firstName}</span>
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 text-gray-800">
                  <div className="py-3 px-4 border-b border-gray-100 text-sm font-medium text-gray-600">
                    {userName}
                  </div>
                  <Link 
                    href="/profile" 
                    className="block px-4 py-3 text-sm hover:bg-gray-100 font-roboto"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mi perfil
                  </Link>
                  <Link 
                    href="/my-ratings" 
                    className="block px-4 py-3 text-sm hover:bg-gray-100 font-roboto"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mis calificaciones
                  </Link>
                  <button 
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-red-600 font-roboto"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="bg-white text-black px-5 py-2 rounded-lg shadow-md font-bold hover:bg-gray-100 transition-colors min-h-[44px] uppercase"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}