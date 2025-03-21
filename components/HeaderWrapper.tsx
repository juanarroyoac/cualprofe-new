'use client';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import HeaderWithSearch from './HeaderWithSearch';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

export default function HeaderWrapper() {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  
  // Check if we're on the home/landing page
  const isHomePage = pathname === '/';
  
  const handleOpenModal = () => {
    console.log("Opening auth modal");
    setShowAuthModal(true);
  };
  
  const handleCloseModal = () => {
    console.log("Closing auth modal");
    setShowAuthModal(false);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  // Add escape key handler at this level too for redundancy
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAuthModal) {
        handleCloseModal();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAuthModal]);
  
  return (
    <>
      {isHomePage ? (
        <Header 
          onAuthClick={handleOpenModal} 
          isLoggedIn={!!currentUser} 
          onLogout={handleLogout}
          userName={currentUser?.displayName || currentUser?.email?.split('@')[0] || ''}
        />
      ) : (
        <HeaderWithSearch 
          onAuthClick={handleOpenModal} 
          isLoggedIn={!!currentUser} 
          onLogout={handleLogout}
          userName={currentUser?.displayName || currentUser?.email?.split('@')[0] || ''}
        />
      )}
      {showAuthModal && <AuthModal onClose={handleCloseModal} />}
    </>
  );
}