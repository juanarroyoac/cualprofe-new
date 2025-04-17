'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  User,
  UserCredential,
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, DocumentData } from 'firebase/firestore';
// Update this import path to match your project structure
import ProfileCompletionModal from '@/app/components/auth/ProfileCompletionModal';

interface UserProfile extends DocumentData {
  email: string;
  displayName?: string;
  photoURL?: string | null;
  createdAt: any; // FirebaseTimestamp
  lastLogin: any; // FirebaseTimestamp
  emailVerified: boolean;
  profileCompleted?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'resetPassword';
  openAuthModal: (mode?: 'login' | 'signup' | 'resetPassword') => void;
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
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'resetPassword'>('login');
  const [showProfileCompletion, setShowProfileCompletion] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
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
            // This applies to email users who haven't completed their profile
            if (!userData.profileCompleted && 
                user.providerData[0]?.providerId === 'password') {
              setShowProfileCompletion(true);
            }
          } else {
            // This shouldn't happen normally, but just in case
            console.warn('User document not found in Firestore');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const openAuthModal = (mode: 'login' | 'signup' | 'resetPassword' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sendEmailVerification = async () => {
    if (currentUser && !currentUser.emailVerified) {
      try {
        await firebaseSendEmailVerification(currentUser);
        return { success: true };
      } catch (error: any) {
        console.error('Error sending verification email:', error);
        return { 
          success: false, 
          error: error.message 
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
    openAuthModal,
    closeAuthModal,
    signOut,
    sendEmailVerification,
    completeProfileModal,
    isEmailUser: currentUser?.providerData[0]?.providerId === 'password' || false,
    isEmailVerified: currentUser?.emailVerified || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showProfileCompletion && currentUser && (
        <ProfileCompletionModal
          isOpen={showProfileCompletion}
          onClose={closeProfileCompletionModal}
          user={currentUser}
        />
      )}
    </AuthContext.Provider>
  );
}