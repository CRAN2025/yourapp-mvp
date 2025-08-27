import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

interface Router {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

interface CTAOptions {
  router: Router;
  getProgress?: () => ReturnType<typeof useOnboardingProgress>;
}

export async function handlePrimaryCTA({ router, getProgress }: CTAOptions) {
  const progress = getProgress?.();
  
  if (!progress) {
    // Fallback if hook not available
    router.navigate('/auth');
    return;
  }

  const { user, ready, status, nextStep } = progress;

  const debug = window.__debugOnboarding;
  if (debug) {
    console.debug('PrimaryCTA clicked:', { user: !!user, ready, status, nextStep });
  }

  // If not ready yet, go to auth and let the system resolve
  if (!ready) {
    router.navigate('/auth');
    return;
  }

  // Anonymous user
  if (!user) {
    router.navigate('/auth');
    return;
  }

  // Completed user
  if (status === 'completed') {
    router.navigate('/app');
    return;
  }

  // In progress or not started
  router.navigate(`/onboarding?step=${nextStep}`);
}

export async function handleSignInCTA({ router }: Pick<CTAOptions, 'router'>) {
  router.navigate('/auth');
}

export async function handleLogoCTA({ router, getProgress }: CTAOptions) {
  const progress = getProgress?.();
  const currentPath = window.location.pathname;

  // If on marketing page, stay there
  if (currentPath === '/') return;

  // If no progress data, go to marketing
  if (!progress || !progress.ready) {
    router.navigate('/');
    return;
  }

  const { user, status } = progress;

  // If completed user, go to app
  if (user && status === 'completed') {
    router.navigate('/app');
    return;
  }

  // Otherwise go to marketing
  router.navigate('/');
}