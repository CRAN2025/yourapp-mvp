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
  const { loading: onboardingLoading, isComplete, firstIncompleteStep } = useOnboardingProgress();
  const [, navigate] = useLocation();

  console.log('🔐 AppGuard: Checking authentication', {
    user: !!user,
    userUID: user?.uid,
    authLoading,
    onboardingLoading,
    isComplete,
    firstIncompleteStep
  });

  useEffect(() => {
    // Wait for auth and onboarding data to load
    if (authLoading || onboardingLoading) {
      console.log('🔐 AppGuard: Still loading...');
      return;
    }

    // Not authenticated - redirect to auth
    if (!user) {
      console.log('🔐 AppGuard: No user found, redirecting to /auth');
      navigate('/auth');
      return;
    }

    // If onboarding is not completed, redirect to next step
    if (!isComplete) {
      console.log('🔐 AppGuard: Onboarding not complete, redirecting to:', `/onboarding/${firstIncompleteStep}`);
      navigate(`/onboarding/${firstIncompleteStep}`);
      return;
    }

    console.log('🔐 AppGuard: Authentication and onboarding complete, allowing access');
  }, [user, isComplete, firstIncompleteStep, authLoading, onboardingLoading, navigate]);

  // Show loading while checking authentication and onboarding state
  if (authLoading || onboardingLoading) {
    console.log('🔐 AppGuard: Showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render children if user will be redirected
  if (!user || !isComplete) {
    console.log('🔐 AppGuard: Blocking access - user:', !!user, 'complete:', isComplete);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  console.log('🔐 AppGuard: Rendering protected content');
  return <>{children}</>;
}