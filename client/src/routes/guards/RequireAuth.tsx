import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [location, navigate] = useLocation();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(() => auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setReady(true); 
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (ready && !user) {
      const fullPath = location + (window.location.search || '');
      navigate(`/auth?mode=signup&redirect=${encodeURIComponent(fullPath)}`, { replace: true });
    }
  }, [ready, user, location, navigate]);

  if (!ready) return null; // Loading state
  if (!user) return null; // Will redirect via useEffect

  return children;
}