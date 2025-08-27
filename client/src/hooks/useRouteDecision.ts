import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useOnboardingProgress } from './useOnboardingProgress';

// Debug flag for development
declare global {
  interface Window {
    __debugOnboarding?: boolean;
  }
}

export function useRouteDecision() {
  const { user, ready, status, nextStep, error } = useOnboardingProgress();
  const [, navigate] = useLocation();
  const redirected = useRef(false);

  useEffect(() => {
    // Don't redirect if not ready or already redirected
    if (!ready || redirected.current) return;

    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    const requestedStep = Number.parseInt(search.get('step') ?? '1', 10);

    const debug = window.__debugOnboarding;
    
    if (debug) {
      console.debug('RouteDecision:', {
        path,
        user: !!user,
        status,
        nextStep,
        requestedStep,
        error
      });
    }

    const go = (to: string, reason: string) => {
      redirected.current = true;
      if (debug) {
        console.debug(`Redirecting to ${to} - Reason: ${reason}`);
      }
      navigate(to, { replace: true });
    };

    // Handle errors
    if (error) {
      console.error('Onboarding error:', error);
      if (path !== '/auth') go('/auth', 'Error loading user data');
      return;
    }

    // Anonymous user - allow marketing landing page
    if (!user) {
      // Allow anonymous users to view marketing landing page
      if (path === '/' || path.startsWith('/features') || path.startsWith('/pricing') || path.startsWith('/support') || path.startsWith('/faq') || path.startsWith('/terms') || path.startsWith('/privacy')) {
        return; // Don't redirect, let them browse
      }
      if (path !== '/auth') go('/auth', 'Not authenticated');
      return;
    }

    // Completed onboarding
    if (status === 'completed') {
      if (path !== '/app' && !path.startsWith('/products') && !path.startsWith('/analytics') && !path.startsWith('/orders') && !path.startsWith('/settings') && !path.startsWith('/storefront')) {
        go('/app', 'Onboarding completed');
      }
      return;
    }

    // In progress or not started - ensure correct step
    const shouldBe = `/onboarding?step=${nextStep}`;
    const currentOnboarding = path === '/onboarding' && requestedStep === nextStep;
    
    if (!currentOnboarding) {
      go(shouldBe, `Should be on step ${nextStep}, currently on ${path} step ${requestedStep}`);
    }
  }, [ready, user, status, nextStep, navigate, error]);

  return { ready, redirected: redirected.current };
}