import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useRouteDecision } from '@/hooks/useRouteDecision';

const OnboardingLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

export default function OnboardingNew() {
  const [location] = useLocation();
  const { ready, error } = useOnboardingProgress();
  const { redirected } = useRouteDecision();
  
  // Extract step from URL
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const currentStep = Number.parseInt(searchParams.get('step') || '1', 10);

  // Debug logging
  useEffect(() => {
    if (window.__debugOnboarding) {
      console.debug('OnboardingNew render:', {
        ready,
        redirected,
        currentStep,
        error,
        location
      });
    }
  }, [ready, redirected, currentStep, error, location]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading onboarding data</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Show loader until ready and not redirected
  if (!ready || redirected) {
    return <OnboardingLoader />;
  }

  // Simple step components for testing
  const Step1 = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Step 1: Store Basics</h1>
        <p className="text-gray-600 text-center mb-4">Let's start by setting up your store basics.</p>
        <div className="space-y-4">
          <button 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            data-testid="button-continue-step1"
          >
            Continue to Step 2
          </button>
        </div>
      </div>
    </div>
  );

  const Step2 = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Step 2: Business Details</h1>
        <p className="text-gray-600 text-center mb-4">Tell us about your business.</p>
        <div className="space-y-4">
          <button 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            data-testid="button-continue-step2"
          >
            Continue to Step 3
          </button>
        </div>
      </div>
    </div>
  );

  const Step3 = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Step 3: Products</h1>
        <p className="text-gray-600 text-center mb-4">Add your first product.</p>
        <div className="space-y-4">
          <button 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            data-testid="button-continue-step3"
          >
            Continue to Step 4
          </button>
        </div>
      </div>
    </div>
  );

  const Step4 = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Step 4: Complete Setup</h1>
        <p className="text-gray-600 text-center mb-4">Finalize your store setup.</p>
        <div className="space-y-4">
          <button 
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            data-testid="button-complete-setup"
          >
            Complete Setup
          </button>
        </div>
      </div>
    </div>
  );

  // Render the appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      default:
        return <OnboardingLoader />;
    }
  };

  return renderStep();
}