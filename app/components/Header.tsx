"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import CualProfeLogoBlue from '/public/CualProfeLogoBlue.png';
const inter = Inter({ subsets: ['latin'] });

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
  const pathname = usePathname();
  
  // Extract first name from userName, all caps
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
    ? 'bg-transparent' 
    : 'bg-white';

  // Determine which logo to use
  const logoImg = CualProfeLogoBlue;

  return (
    <header className={`w-full ${headerBgClass} text-gray-900 z-50 ${transparent ? 'absolute top-0 left-0 right-0' : ''} ${inter.className}`}>
      <div className="container mx-auto px-4 py-4">
        {/* Mobile Layout (left-aligned logo) */}
        <div className="sm:hidden flex items-center justify-between">
          {/* Left-aligned Logo */}
          <Link href="/" className="flex items-center">
            <div className="w-[140px] h-[35px] relative">
              <Image 
                src={logoImg}
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
                className="flex items-center justify-center text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 w-10 h-10"
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
              className="bg-[#00248c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00103f] transition-colors duration-200"
            >
              INGRESAR
            </button>
          )}
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:justify-between sm:items-center">
          <Link href="/" className="flex items-center">
            <div className="w-[160px] h-[40px] relative">
              <Image 
                src={logoImg}
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
                className="flex items-center gap-2 bg-[#00248c] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#00103f] transition-colors duration-200 min-h-[44px]"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <span className="font-inter font-bold text-sm tracking-wide">HOLA, {firstName}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
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
              className="bg-[#00248c] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#00103f] transition-colors duration-200 min-h-[44px]"
            >
              INICIAR SESIÓN
            </button>
          )}
        </div>
      </div>
    </header>
  );
}