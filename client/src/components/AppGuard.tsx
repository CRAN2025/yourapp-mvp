import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import LoadingSpinner from './LoadingSpinner';

interface AppGuardProps {
  children: React.ReactNode;
}

export function AppGuard({ children }: AppGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { onboardingState, loading: onboardingLoading, getNextStep } = useOnboardingProgress();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Wait for auth and onboarding data to load
    if (authLoading || onboardingLoading) return;

    // Not authenticated - redirect to auth
    if (!user) {
      navigate('/auth');
      return;
    }

    // If onboarding is not completed, redirect to next step
    if (onboardingState.status !== 'completed') {
      const nextStep = getNextStep();
      if (nextStep) {
        navigate(`/onboarding?step=${nextStep}`);
      } else {
        navigate('/onboarding?step=1');
      }
      return;
    }
  }, [user, onboardingState, authLoading, onboardingLoading, navigate, getNextStep]);

  // Show loading while checking authentication and onboarding state
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render children if user will be redirected
  if (!user || onboardingState.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}