import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { onAuthStateChanged } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      
      try {
        // Block if no user or anonymous user
        if (!user || user.isAnonymous) {
          setLocation('/auth');
          return;
        }

        // Ensure seller profile exists
        const sellerProfileRef = ref(database, `sellers/${user.uid}/profile`);
        const snapshot = await get(sellerProfileRef);
        
        if (!snapshot.exists()) {
          setLocation('/onboarding');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth guard error:', error);
        setLocation('/auth');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}