// onboarding steps configuration from the onboarding system

export const ONBOARDING_STEPS = ['step-1', 'step-2', 'step-3'] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export function firstIncompleteStep(completed?: string[]): OnboardingStep {
  if (!completed || completed.length === 0) return 'step-1';
  
  for (const step of ONBOARDING_STEPS) {
    if (!completed.includes(step)) {
      return step;
    }
  }
  
  return 'step-1'; // fallback
}

export function isOnboardingComplete(completed?: string[]): boolean {
  if (!completed) return false;
  return ONBOARDING_STEPS.every(step => completed.includes(step));
}

export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex + 1];
}

export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex - 1];
}