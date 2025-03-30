'use client';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import HeaderWithSearch from './HeaderWithSearch';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

export default function HeaderWrapper() {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [modalMountedOnce, setModalMountedOnce] = useState<boolean>(false); // Track if modal has mounted once
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  
  // Check if we're on the home/landing page
  const isHomePage = pathname === '/';
  
  const handleOpenModal = () => {
    console.log("Opening auth modal");
    setShowAuthModal(true);
    setModalMountedOnce(true); // Mark that we've mounted the modal at least once
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
  
  // Handle iOS-specific issues with scroll locking when modal is open
  useEffect(() => {
    if (showAuthModal) {
      // Lock scroll on body when modal is open
      document.body.style.overflow = 'hidden';
      // Add padding to account for scrollbar disappearance and prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else if (modalMountedOnce) {
      // Only restore these if we've mounted the modal at least once
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    return () => {
      // Cleanup function to ensure we restore normal scrolling
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showAuthModal, modalMountedOnce]);
  
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