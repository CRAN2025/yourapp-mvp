import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { ensureBootstrap, firstIncompleteStep, isOnboardingComplete } from '@/lib/onboarding';
import OnboardingStep1 from '../components/onboarding/OnboardingStep1';
import OnboardingStep2 from '../components/onboarding/OnboardingStep2';
import OnboardingStep3 from '../components/onboarding/OnboardingStep3';

interface OnboardingNewProps {
  step: string;
}

export default function OnboardingNew({ step }: OnboardingNewProps) {
  const [, navigate] = useLocation();
  const [user, authLoading] = useAuthState(auth);
  const { progress, loading, firstIncompleteStep: nextStep, isComplete } = useOnboardingProgress();

  // Route guard and redirection logic
  useEffect(() => {
    if (authLoading || loading) return;

    // Not authenticated - redirect to auth
    if (!user) {
      navigate(`/auth?mode=signup&redirect=${encodeURIComponent('/onboarding/step-1')}`, { replace: true });
      return;
    }

    // Ensure bootstrap is complete
    if (!progress) {
      ensureBootstrap(user.uid).then(({ progress: newProgress }) => {
        const correctStep = firstIncompleteStep(newProgress?.completed);
        if (step !== correctStep) {
          navigate(`/onboarding/${correctStep}`, { replace: true });
        }
      }).catch(console.error);
      return;
    }

    // All steps complete - redirect to dashboard
    if (isComplete) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Allow navigation to current step, previous completed steps, or next incomplete step
    // Only redirect if trying to access a step beyond the first incomplete step
    const stepIndex = ['step-1', 'step-2', 'step-3'].indexOf(step);
    const nextStepIndex = ['step-1', 'step-2', 'step-3'].indexOf(nextStep);
    
    // If trying to access a step further than the next incomplete step, redirect to next incomplete
    if (stepIndex > nextStepIndex) {
      navigate(`/onboarding/${nextStep}`, { replace: true });
      return;
    }
  }, [user, authLoading, loading, progress, step, nextStep, isComplete, navigate]);

  // Show loading while authenticating or fetching progress
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your onboarding progress...</p>
        </div>
      </div>
    );
  }

  // Don't render if user not authenticated or redirecting
  if (!user || !progress) {
    return null;
  }

  // Render the appropriate step component
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
            <span className="text-sm text-gray-500">
              Step {step === 'step-1' ? 1 : step === 'step-2' ? 2 : 3} of 3
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${step === 'step-1' ? 33 : step === 'step-2' ? 66 : 100}%` 
              }}
            />
          </div>
        </div>

        {/* Step content */}
        {step === 'step-1' && <OnboardingStep1 storeId={progress.storeId} />}
        {step === 'step-2' && <OnboardingStep2 storeId={progress.storeId} />}
        {step === 'step-3' && <OnboardingStep3 storeId={progress.storeId} />}
      </div>
    </div>
  );
}