// src/lib/authRedirect.ts
import type { User } from 'firebase/auth';

const DEFAULT_REDIRECT = '/onboarding/step-1';

export function goToSignup(navigate: (url: string) => void, redirect = DEFAULT_REDIRECT) {
  const safe = redirect.startsWith('/') ? redirect : DEFAULT_REDIRECT;
  navigate(`/auth?mode=signup&redirect=${encodeURIComponent(safe)}`);
}

/** Returns true if it handled the redirect (user unauthenticated). */
export function ensureUnauthRedirect(user: User | null, navigate: (url: string) => void, redirect = DEFAULT_REDIRECT) {
  if (!user) {
    goToSignup(navigate, redirect);
    return true;
  }
  return false;
}

/** Helper to prevent manual navigation to onboarding without auth */
export function redirectUnauthenticatedFromOnboarding(user: User | null, currentPath: string, navigate: (url: string) => void) {
  if (!user && currentPath.startsWith('/onboarding')) {
    const redirect = encodeURIComponent(currentPath);
    navigate(`/auth?mode=signup&redirect=${redirect}`);
    return true;
  }
  return false;
}