import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface OnboardingStep {
  savedAt: string;
  [key: string]: any;
}

export interface OnboardingState {
  status: 'not_started' | 'in_progress' | 'completed';
  lastCompletedStep: number; // 0..4
  steps: {
    1?: OnboardingStep;
    2?: OnboardingStep;
    3?: OnboardingStep;
    4?: OnboardingStep;
  };
}

export interface UserProfile {
  onboarding: OnboardingState;
  storeId?: string;
}

export function useOnboardingProgress() {
  const { user, loading: authLoading } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load onboarding state from Firestore
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setOnboardingState(null);
      setLoading(false);
      setError(null);
      return;
    }

    const loadOnboardingState = async () => {
      try {
        setError(null);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (userData.onboarding) {
            setOnboardingState(userData.onboarding);
          } else {
            // Initialize default state for users without onboarding data
            setOnboardingState({
              status: 'not_started',
              lastCompletedStep: 0,
              steps: {}
            });
          }
        } else {
          // New user - initialize default state
          setOnboardingState({
            status: 'not_started',
            lastCompletedStep: 0,
            steps: {}
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
        console.error('Failed to load onboarding state:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, [user, authLoading]);

  // Save step data and update progress
  const saveStep = async (stepNumber: number, stepData: any) => {
    if (!user) throw new Error('User not authenticated');
    
    const currentState = onboardingState || {
      status: 'not_started' as const,
      lastCompletedStep: 0,
      steps: {}
    };

    const updatedState: OnboardingState = {
      ...currentState,
      status: stepNumber === 4 ? 'completed' : 'in_progress',
      lastCompletedStep: Math.max(currentState.lastCompletedStep, stepNumber),
      steps: {
        ...currentState.steps,
        [stepNumber]: {
          ...stepData,
          savedAt: new Date().toISOString()
        }
      }
    };

    try {
      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { 
        onboarding: updatedState 
      }, { merge: true });

      // Update local state
      setOnboardingState(updatedState);

      // Log telemetry
      console.log('onboarding_step_saved', { step: stepNumber });
      
      return updatedState;
    } catch (error) {
      console.error('Failed to save onboarding step:', error);
      throw error;
    }
  };

  // Complete onboarding and create store
  const completeOnboarding = async (storeId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const currentState = onboardingState || {
      status: 'not_started' as const,
      lastCompletedStep: 0,
      steps: {}
    };

    const completedState: OnboardingState = {
      ...currentState,
      status: 'completed',
      lastCompletedStep: 4
    };

    try {
      console.log('Completing onboarding - current state:', onboardingState);
      console.log('Completed state to save:', completedState);
      
      const userDocRef = doc(db, 'users', user.uid);
      
      // Use setDoc with merge instead of updateDoc to ensure document exists
      await setDoc(userDocRef, {
        onboarding: completedState,
        storeId: storeId
      }, { merge: true });

      console.log('Successfully saved completion to Firestore');
      setOnboardingState(completedState);
      
      // Log telemetry
      console.log('onboarding_completed', { storeId, status: 'completed' });
      
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  // Get the next step user should be on
  const getNextStep = () => {
    if (!onboardingState || onboardingState.status === 'completed') return null;
    return Math.min(onboardingState.lastCompletedStep + 1, 4);
  };

  // Check if user can access a specific step
  const canAccessStep = (stepNumber: number) => {
    if (!onboardingState || onboardingState.status === 'completed') return false;
    return stepNumber <= onboardingState.lastCompletedStep + 1;
  };

  // Computed values for easy access
  const ready = !authLoading && !loading;
  const status = onboardingState?.status || 'not_started';
  const lastCompletedStep = onboardingState?.lastCompletedStep || 0;
  const nextStep = Math.min(Math.max(lastCompletedStep + 1, 1), 4);
  const isCompleted = status === 'completed';

  return {
    // Legacy API for existing components
    onboardingState: onboardingState || {
      status: 'not_started',
      lastCompletedStep: 0,
      steps: {}
    },
    loading,
    saveStep,
    completeOnboarding,
    getNextStep,
    canAccessStep,
    isCompleted,
    // New API for route decisions
    user,
    ready,
    status,
    nextStep,
    error
  };
}