import { ROUTES } from '@shared/config';

export interface NavigationContext {
  user: any;
  onboardingStatus: 'not_started' | 'in_progress' | 'completed';
  lastCompletedStep: number;
  navigate: (path: string) => void;
}

/**
 * Centralized CTA navigation logic following the state-driven rules:
 * - Anonymous → /auth
 * - Signed-in + not completed → /onboarding?step=${nextStep}
 * - Signed-in + completed → /app
 */
export function handleCreateStoreCTA({ user, onboardingStatus, lastCompletedStep, navigate }: NavigationContext) {
  if (!user) {
    navigate(ROUTES.AUTH);
    return;
  }

  if (onboardingStatus === 'completed') {
    navigate(ROUTES.APP);
    return;
  }

  const nextStep = lastCompletedStep + 1;
  navigate(`${ROUTES.ONBOARDING}?step=${nextStep}`);
}

export function handleSignInCTA({ navigate }: Pick<NavigationContext, 'navigate'>) {
  navigate(ROUTES.AUTH);
}

export function handleLogoCTA({ 
  user, 
  onboardingStatus, 
  navigate, 
  currentRoute 
}: NavigationContext & { currentRoute: string }) {
  // From marketing page - stay on marketing
  if (currentRoute === ROUTES.HOME) {
    return; // No navigation needed
  }
  
  // From onboarding - go to marketing
  if (currentRoute.startsWith(ROUTES.ONBOARDING)) {
    navigate(ROUTES.HOME);
    return;
  }
  
  // From app - stay on app if completed, otherwise go to marketing
  if (currentRoute.startsWith(ROUTES.APP)) {
    if (onboardingStatus === 'completed') {
      navigate(ROUTES.APP);
    } else {
      navigate(ROUTES.HOME);
    }
    return;
  }
  
  // Default - go to marketing
  navigate(ROUTES.HOME);
}