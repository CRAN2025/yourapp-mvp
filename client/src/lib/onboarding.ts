import { db, auth } from '@/lib/firebase';
import {
  doc, collection, serverTimestamp, runTransaction,
  query, where, getDocs, limit, updateDoc, arrayUnion
} from 'firebase/firestore';

// Single source of truth for onboarding steps
export const STEPS = ['step-1', 'step-2', 'step-3'] as const;
export type OnboardingStep = typeof STEPS[number];

export interface OnboardingProgress {
  storeId: string;
  currentStep: number;
  completed: string[];
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  createdAt: any;
}

export interface Store {
  ownerUid: string;
  status: 'draft' | 'active';
  name: string;
  createdAt: any;
}

/**
 * Find the first incomplete step based on completed array
 */
export function firstIncompleteStep(completed: string[] = []): OnboardingStep {
  const done = new Set(completed);
  return STEPS.find(s => !done.has(s)) ?? STEPS[STEPS.length - 1];
}

/**
 * Bootstrap user profile, store, and onboarding progress
 * Idempotent - safe to call multiple times
 */
export async function ensureBootstrap(uid: string) {
  return runTransaction(db, async (tx) => {
    // Create or get profile
    const profileRef = doc(db, 'profiles', uid);
    const profileSnap = await tx.get(profileRef);
    if (!profileSnap.exists()) {
      tx.set(profileRef, {
        uid,
        email: auth.currentUser?.email ?? '',
        createdAt: serverTimestamp(),
      });
    }

    // Find existing store or create new draft store
    const storesQ = query(
      collection(db, 'stores'), 
      where('ownerUid', '==', uid), 
      limit(1)
    );
    const storesSnap = await getDocs(storesQ);
    let storeId: string;
    
    if (storesSnap.empty) {
      // Create new draft store
      const storeRef = doc(collection(db, 'stores'));
      storeId = storeRef.id;
      tx.set(storeRef, {
        ownerUid: uid,
        status: 'draft',
        name: '',
        createdAt: serverTimestamp(),
      });
    } else {
      storeId = storesSnap.docs[0].id;
    }

    // Create or get onboarding progress
    const obRef = doc(db, 'onboarding', uid);
    const obSnap = await tx.get(obRef);
    let progress = obSnap.exists() ? obSnap.data() as OnboardingProgress : null;

    if (!progress) {
      progress = {
        storeId,
        currentStep: 1,
        completed: [], // IMPORTANT: Initialize as empty array
        updatedAt: serverTimestamp(),
      };
      tx.set(obRef, progress);
    }

    return { storeId, progress };
  });
}

/**
 * Mark a step as completed and update progress
 */
export async function completeStep(uid: string, step: OnboardingStep) {
  const nextStepIndex = STEPS.indexOf(step) + 1;
  const nextStep = nextStepIndex < STEPS.length ? nextStepIndex + 1 : STEPS.length;
  
  await updateDoc(doc(db, 'onboarding', uid), {
    completed: arrayUnion(step),
    currentStep: nextStep,
    updatedAt: serverTimestamp()
  });
}

/**
 * Check if all onboarding steps are completed
 */
export function isOnboardingComplete(completed: string[] = []): boolean {
  const done = new Set(completed);
  return STEPS.every(step => done.has(step));
}

/**
 * Get the next step after completing current step
 */
export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = STEPS.indexOf(currentStep);
  const nextIndex = currentIndex + 1;
  return nextIndex < STEPS.length ? STEPS[nextIndex] : null;
}

/**
 * Validate redirect URL to prevent open redirects
 */
export function validateRedirect(redirect: string | null): string {
  if (!redirect || !redirect.startsWith('/')) {
    return '/onboarding/step-1';
  }
  return redirect;
}