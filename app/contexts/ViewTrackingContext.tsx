// app/contexts/ViewTrackingContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
// Removed unused usePathname import
import { useAuth } from './AuthContext'; // Assuming AuthContext is in the same directory

// Define the context type
interface ViewTrackingContextType {
  professorViewCount: number;
  hasReachedViewLimit: boolean;
  incrementProfessorView: (professorId: string) => void;
  resetProfessorViews: () => void;
  viewLimit: number;
}

// Create the context with a default value
const ViewTrackingContext = createContext<ViewTrackingContextType | undefined>(undefined);

// Create the provider component
export function ViewTrackingProvider({ children }: { children: ReactNode }) {
  const [professorViewCount, setProfessorViewCount] = useState<number>(0);
  const { currentUser } = useAuth();
  const viewLimit = 3; // ****** UPDATED: Limit set to 3 ******

  // Initialize from localStorage on component mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && !currentUser) {
      try {
        const storedCount = localStorage.getItem('professorViewCount');
        if (storedCount) {
          const count = parseInt(storedCount, 10);
          if (!isNaN(count)) {
            setProfessorViewCount(count);
            console.log('Loaded view count from storage:', count);
          } else {
            // Handle cases where localStorage might contain invalid data
            localStorage.removeItem('professorViewCount');
            setProfessorViewCount(0);
            console.warn('Invalid view count in storage, resetting.');
          }
        }
      } catch (error) {
        console.error('Error loading view count from localStorage:', error);
        // Attempt to clear potentially corrupted storage item
        localStorage.removeItem('professorViewCount');
        setProfessorViewCount(0);
      }
    } else if (currentUser) {
      // If user is logged in when provider mounts, ensure count is 0
      setProfessorViewCount(0);
      if (typeof window !== 'undefined') {
          localStorage.removeItem('professorViewCount');
      }
    }
  }, [currentUser]); // Re-run if user logs in/out

  // Reset when user logs in
  useEffect(() => {
    if (currentUser) {
      // Check if count needs resetting (e.g., user logs in while limit was reached)
      if (professorViewCount > 0) {
        console.log('User logged in, resetting professor views.');
        setProfessorViewCount(0);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('professorViewCount');
        }
      }
    }
  }, [currentUser, professorViewCount]); // Added professorViewCount dependency


  // ****** UPDATED: Wrap incrementProfessorView in useCallback ******
  const incrementProfessorView = useCallback((professorId: string) => {
    // Skip if user is logged in - check currentUser directly inside useCallback
    if (currentUser) {
      console.log('User is logged in, skipping view count increment');
      return;
    }

    // Use functional update to ensure we always increment based on the latest count
    setProfessorViewCount(currentCount => {
      // Prevent incrementing beyond the limit if desired, though currently allowing it
      // if (currentCount >= viewLimit) return currentCount;

      const newCount = currentCount + 1;
      console.log(`Incrementing view count for professor ${professorId}. New count: ${newCount}`);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('professorViewCount', String(newCount));
      }
      return newCount;
    });
  // Dependency: currentUser ensures the check inside is up-to-date
  }, [currentUser]); // Removed viewLimit as it's constant here and not used in the logic directly

  // ****** UPDATED: Wrap resetProfessorViews in useCallback ******
  const resetProfessorViews = useCallback(() => {
    console.log('Resetting professor views to 0');
    setProfessorViewCount(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('professorViewCount');
    }
  }, []); // No dependencies needed here

  // ****** UPDATED: Memoize hasReachedViewLimit calculation ******
  // Added viewLimit as a dependency for correctness, though it's currently constant
  const hasReachedViewLimit = useMemo(() => professorViewCount >= viewLimit, [professorViewCount, viewLimit]);

  // ****** UPDATED: Wrap the context value in useMemo ******
  const value = useMemo(() => ({
    professorViewCount,
    hasReachedViewLimit,
    incrementProfessorView,
    resetProfessorViews,
    viewLimit,
  }), [professorViewCount, hasReachedViewLimit, incrementProfessorView, resetProfessorViews, viewLimit]);

  return (
    <ViewTrackingContext.Provider value={value}>
      {children}
    </ViewTrackingContext.Provider>
  );
}

// Custom hook to use the context
export function useViewTracking() {
  const context = useContext(ViewTrackingContext);
  if (context === undefined) {
    throw new Error('useViewTracking must be used within a ViewTrackingProvider');
  }
  return context;
}