import { db, auth } from '@/lib/firebase';
import {
  doc, collection, serverTimestamp, runTransaction,
  updateDoc, arrayUnion
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
  const now = serverTimestamp();

  return runTransaction(db, async (tx) => {
    // ----- READS (no writes here!) -----------------------------------------
    const profileRef = doc(db, 'profiles', uid);
    const obRef      = doc(db, 'onboarding', uid);

    const profileSnap = await tx.get(profileRef);
    const obSnap      = await tx.get(obRef);

    let storeId: string | null = null;
    let needCreateStore = false;
    let needCreateOnboarding = false;
    let needCreateProfile = !profileSnap.exists();

    if (obSnap.exists()) {
      const ob = obSnap.data() as any;
      storeId = ob.storeId ?? null;

      // If onboarding exists but points to a missing store, we'll create it below.
      if (!storeId) needCreateStore = true;
      else {
        const storeRef = doc(db, 'stores', storeId);
        const storeSnap = await tx.get(storeRef);    // still a read (allowed)
        if (!storeSnap.exists()) needCreateStore = true;
      }
    } else {
      // No onboarding yet: we'll create both store + onboarding
      needCreateOnboarding = true;
      needCreateStore = true;
    }

    // ----- WRITES (all after every read has finished) -----------------------
    if (needCreateProfile) {
      tx.set(profileRef, {
        uid,
        email: auth.currentUser?.email ?? '',
        createdAt: now,
      });
    }

    if (needCreateStore) {
      const storeRef = doc(collection(db, 'stores')); // new id
      storeId = storeRef.id;
      tx.set(storeRef, {
        ownerUid: uid,
        status: 'draft',
        name: '',
        createdAt: now,
      });
    }

    if (needCreateOnboarding) {
      // If we created a store above, storeId is set. If onboarding existed, we keep its storeId.
      tx.set(obRef, {
        storeId,
        currentStep: 1,
        completed: [],   // IMPORTANT: empty means step 1 is NOT complete
        updatedAt: now,
      });
    }

    // If onboarding existed AND didn't include storeId (rare), patch it now
    if (obSnap.exists() && !obSnap.data().storeId && storeId) {
      tx.update(obRef, { storeId, updatedAt: now });
    }

    // Build progress to return
    const progress = obSnap.exists()
      ? obSnap.data()
      : { storeId, currentStep: 1, completed: [] };

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