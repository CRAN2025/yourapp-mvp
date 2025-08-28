// src/lib/authRedirect.ts
import type { Auth, User } from 'firebase/auth';

type Navigate = (to: string, options?: { replace?: boolean }) => void;

const DEFAULT_REDIRECT = '/onboarding/step-1';

function asUser(input: User | null | Auth): User | null {
  return (input && 'currentUser' in (input as Auth))
    ? (input as Auth).currentUser
    : (input as User | null);
}

/** Returns true if it redirected (user unauthenticated). */
export function ensureUnauthRedirect(
  userOrAuth: User | null | Auth,
  navigate: Navigate,
  redirect = DEFAULT_REDIRECT
): boolean {
  const user = asUser(userOrAuth);
  if (!user) {
    const safe = redirect.startsWith('/') ? redirect : DEFAULT_REDIRECT;
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(safe)}`, { replace: true });
    return true;
  }
  return false;
}