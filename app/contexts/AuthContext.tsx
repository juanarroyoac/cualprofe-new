'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  getIdToken
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, DocumentData, Timestamp } from 'firebase/firestore';
import ProfileCompletionModal from '@/app/components/auth/ProfileCompletionModal';
import AuthModal from '@/app/components/auth/AuthModal';
import { useSearchParams } from 'next/navigation';

interface UserProfile extends DocumentData {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photoURL?: string | null;
  university?: string;
  graduationYear?: string;
  createdAt: Timestamp | null;
  lastLogin: Timestamp | null;
  emailVerified: boolean;
  profileCompleted?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'resetPassword';
  authModalRedirectPath: string | null;
  openAuthModal: (mode?: 'login' | 'signup' | 'resetPassword', redirectPath?: string) => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  sendEmailVerification: () => Promise<{ success: boolean; error?: string }>;
  completeProfileModal: () => void;
  isEmailUser: boolean;
  isEmailVerified: boolean;
}

// Create context with a default value matching the interface
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  authModalOpen: false,
  authModalMode: 'login',
  authModalRedirectPath: null,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signOut: async () => {},
  sendEmailVerification: async () => ({ success: false }),
  completeProfileModal: () => {},
  isEmailUser: false,
  isEmailVerified: false
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'resetPassword'>('login');
  const [authModalRedirectPath, setAuthModalRedirectPath] = useState<string | null>(null);
  const [showProfileCompletion, setShowProfileCompletion] = useState<boolean>(false);
  
  const searchParams = useSearchParams();

  // Sync session with server
  const syncSessionWithServer = async (user: User) => {
    try {
      // Get ID token with forceRefresh to ensure we get a fresh token
      const idToken = await getIdToken(user, true);
      
      // Send ID token to server to create session cookie
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
        credentials: 'same-origin', // Important for cookie handling
      });
      
      if (!response.ok) {
        console.error('Failed to create session cookie');
      }
    } catch (error) {
      console.error('Error syncing session with server:', error);
    }
  };

  // Check for auth required param in URL
  useEffect(() => {
    if (!initialLoadComplete) return; // Wait until initial auth check is complete
    
    const authRequired = searchParams.get('authRequired');
    const redirectTo = searchParams.get('redirectTo');
    
    if (authRequired === 'true' && !currentUser && !loading) {
      openAuthModal('login', redirectTo || undefined);
    }
  }, [searchParams, currentUser, loading, initialLoadComplete]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    // Check for cached auth state to reduce flicker
    if (typeof window !== 'undefined') {
      const cachedAuthState = localStorage.getItem('cachedAuthState');
      if (cachedAuthState) {
        try {
          const { user } = JSON.parse(cachedAuthState);
          if (user) {
            // Set a temporary user object to prevent UI flicker
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              // Add minimal required properties to satisfy the User interface
              getIdToken: () => Promise.resolve(''),
              providerData: user.providerData || [],
            } as User);
          }
        } catch (e) {
          localStorage.removeItem('cachedAuthState');
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Cache auth state to localStorage for faster loading on refresh
        if (typeof window !== 'undefined') {
          localStorage.setItem('cachedAuthState', JSON.stringify({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              providerData: user.providerData,
            }
          }));
        }
        
        setCurrentUser(user);
        
        try {
          // Create session cookie on the server
          await syncSessionWithServer(user);
          
          // Get user profile from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setUserProfile(userData);
            
            // Update last login time
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp()
            });
            
            // Check if profile needs completion
            // This applies to ALL users who haven't completed their profile
            // Regardless of auth provider (Google or email)
            if (!userData.profileCompleted) {
              setShowProfileCompletion(true);
            }
            
            // Reset the professor view count in session storage for authenticated users
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('professorViewCount');
            }
          } else {
            // This shouldn't happen normally, but just in case
            console.warn('User document not found in Firestore');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        // Clear cached auth state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cachedAuthState');
        }
        
        setCurrentUser(null);
        setUserProfile(null);
        
        // Initialize the view count for unauthenticated users
        if (typeof window !== 'undefined') {
          if (!sessionStorage.getItem('professorViewCount')) {
            sessionStorage.setItem('professorViewCount', '0');
          }
        }
      }
      
      setLoading(false);
      setInitialLoadComplete(true);
    });

    return unsubscribe;
  }, []);

  const openAuthModal = (
    mode: 'login' | 'signup' | 'resetPassword' = 'login',
    redirectPath?: string
  ) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    if (redirectPath) {
      setAuthModalRedirectPath(redirectPath);
    }
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    // Clear redirect path when modal is closed
    setTimeout(() => {
      setAuthModalRedirectPath(null);
    }, 300); // Small delay to prevent UI flashing
  };

  const signOut = async () => {
    try {
      // Clear cached auth state immediately for better UX
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cachedAuthState');
      }
      
      // First, call the server API to clear the session cookie
      await fetch('/api/auth', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: currentUser?.uid }),
        credentials: 'same-origin' // Important for cookie handling
      });
      
      // Then sign out from Firebase client
      await firebaseSignOut(auth);
      
      // Reset the view count after signing out
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('professorViewCount', '0');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sendEmailVerification = async () => {
    if (currentUser && !currentUser.emailVerified) {
      try {
        await firebaseSendEmailVerification(currentUser);
        return { success: true };
      } catch (error: unknown) {
        console.error('Error sending verification email:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    }
    return { success: false, error: 'No user is logged in or email is already verified' };
  };

  const completeProfileModal = () => {
    setShowProfileCompletion(true);
  };

  const closeProfileCompletionModal = () => {
    setShowProfileCompletion(false);
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    authModalOpen,
    authModalMode,
    authModalRedirectPath,
    openAuthModal,
    closeAuthModal,
    signOut,
    sendEmailVerification,
    completeProfileModal,
    isEmailUser: currentUser?.providerData[0]?.providerId === 'password' || false,
    isEmailVerified: currentUser?.emailVerified || false
  };

  // Only render children once initial auth is determined or we have a cached state
  return (
    <AuthContext.Provider value={value}>
      {!initialLoadComplete && loading ? (
        // You can add a loading spinner component here if desired
        <div className="hidden">Loading...</div>
      ) : (
        children
      )}
      {showProfileCompletion && currentUser && (
        <ProfileCompletionModal
          isOpen={showProfileCompletion}
          onClose={closeProfileCompletionModal}
          user={currentUser}
        />
      )}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={closeAuthModal}
          initialMode={authModalMode}
          redirectPath={authModalRedirectPath || undefined}
        />
      )}
    </AuthContext.Provider>
  );
}