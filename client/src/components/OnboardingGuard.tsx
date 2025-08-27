import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import LoadingSpinner from './LoadingSpinner';

interface OnboardingGuardProps {
  children: React.ReactNode;
  requiredStep?: number;
}

export function OnboardingGuard({ children, requiredStep }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { onboardingState, loading: onboardingLoading, canAccessStep, getNextStep } = useOnboardingProgress();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Wait for auth and onboarding data to load
    if (authLoading || onboardingLoading) return;

    // Not authenticated - redirect to auth
    if (!user) {
      navigate('/auth');
      return;
    }

    // If onboarding is completed, redirect to app
    if (onboardingState.status === 'completed') {
      navigate('/app');
      return;
    }

    // If a specific step is required, check access
    if (requiredStep !== undefined) {
      if (!canAccessStep(requiredStep)) {
        const nextStep = getNextStep();
        if (nextStep) {
          navigate(`/onboarding?step=${nextStep}`);
        } else {
          navigate('/app');
        }
        return;
      }
    }
  }, [user, onboardingState, authLoading, onboardingLoading, requiredStep, navigate, canAccessStep, getNextStep]);

  // Show loading while checking authentication and onboarding state
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render children if user will be redirected
  if (!user || onboardingState.status === 'completed' || 
      (requiredStep !== undefined && !canAccessStep(requiredStep))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}