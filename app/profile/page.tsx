'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import UserProfile from '@/app/components/user/UserProfile';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure the component is mounted on the client for auth checks
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !currentUser) {
      router.push('/');
    }
  }, [currentUser, loading, router, mounted]);

  // Show loading spinner when checking auth state
  if (loading || !mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect in the useEffect
  }

  return <UserProfile />;
}