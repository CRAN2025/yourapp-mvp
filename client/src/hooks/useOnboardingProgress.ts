import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { OnboardingProgress, firstIncompleteStep, isOnboardingComplete } from '@/lib/onboarding';

export function useOnboardingProgress() {
  const [user, loading] = useAuthState(auth);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setProgress(null);
      setProgressLoading(false);
      return;
    }

    setProgressLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'onboarding', user.uid),
      (doc) => {
        if (doc.exists()) {
          setProgress(doc.data() as OnboardingProgress);
        } else {
          setProgress(null);
        }
        setProgressLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching onboarding progress:', error);
        setError(error);
        setProgressLoading(false);
      }
    );

    return unsubscribe;
  }, [user, loading]);

  const firstIncomplete = progress ? firstIncompleteStep(progress.completed) : 'step-1';
  const isComplete = progress ? isOnboardingComplete(progress.completed) : false;

  return {
    progress,
    loading: loading || progressLoading,
    error,
    firstIncompleteStep: firstIncomplete,
    isComplete,
    storeId: progress?.storeId || null
  };
}