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
  const { user } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    status: 'not_started',
    lastCompletedStep: 0,
    steps: {}
  });
  const [loading, setLoading] = useState(true);

  // Load onboarding state from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOnboardingState = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (userData.onboarding) {
            setOnboardingState(userData.onboarding);
          }
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, [user]);

  // Save step data and update progress
  const saveStep = async (stepNumber: number, stepData: any) => {
    if (!user) throw new Error('User not authenticated');

    const updatedState: OnboardingState = {
      ...onboardingState,
      status: stepNumber === 4 ? 'completed' : 'in_progress',
      lastCompletedStep: Math.max(onboardingState.lastCompletedStep, stepNumber),
      steps: {
        ...onboardingState.steps,
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

    const completedState: OnboardingState = {
      ...onboardingState,
      status: 'completed',
      lastCompletedStep: 4
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        onboarding: completedState,
        storeId: storeId
      });

      setOnboardingState(completedState);
      
      // Log telemetry
      console.log('onboarding_completed', { storeId });
      
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  // Get the next step user should be on
  const getNextStep = () => {
    if (onboardingState.status === 'completed') return null;
    return onboardingState.lastCompletedStep + 1;
  };

  // Check if user can access a specific step
  const canAccessStep = (stepNumber: number) => {
    if (onboardingState.status === 'completed') return false;
    return stepNumber <= onboardingState.lastCompletedStep + 1;
  };

  return {
    onboardingState,
    loading,
    saveStep,
    completeOnboarding,
    getNextStep,
    canAccessStep,
    isCompleted: onboardingState.status === 'completed'
  };
}