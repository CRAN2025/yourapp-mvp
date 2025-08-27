// MarketLanding.tsx - CTA Components and goCreate function
// This file contains the key CTA components from MarketLanding.tsx

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export function MarketLandingCTAs() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Main CTA handler function
  const goCreate = async () => {
    setIsLoading(true);
    
    // Track CTA click
    try {
      await trackInteraction({
        type: 'store_view',
        sellerId: 'marketing',
        metadata: { source: 'cta_click', action: 'signup' },
      });
    } catch (error) {
      console.warn('Failed to track CTA click:', error);
    }
    
    try { (window as any).gtag?.('event', 'begin_signup', { source: 'marketing_landing' }); } catch {}
    
    // Use auth redirect helper for unauthenticated users
    const { ensureUnauthRedirect } = await import('@/lib/authRedirect');
    if (ensureUnauthRedirect(user, navigate)) {
      setIsLoading(false);
      return;
    }
    
    // Authenticated path - existing onboarding logic
    try {
      const { ensureBootstrap, firstIncompleteStep, isOnboardingComplete } = await import('@/lib/onboarding');
      const { storeId, progress } = await ensureBootstrap(user!.uid);
      
      // Check if onboarding is complete
      if (isOnboardingComplete(progress?.completed)) {
        navigate('/dashboard');
      } else {
        const step = firstIncompleteStep(progress?.completed);
        navigate(`/onboarding/${step}`);
      }
    } catch (error) {
      console.error('Error handling CTA click:', error);
      // Fallback to direct onboarding step
      navigate('/onboarding/step-1');
    }
    
    setIsLoading(false);
  };

  return (
    <>
      {/* Hero CTA Button */}
      <button 
        onClick={goCreate} 
        className="btn btnPrimary cta-pulse" 
        data-testid="hero-create-store"
        disabled={isLoading}
        aria-label="Create your free store - Start your free trial"
      >
        {isLoading ? <div className="loading-spinner" aria-label="Loading"></div> : 'Create your free store'}
      </button>

      {/* Mid-page CTA */}
      <button 
        onClick={goCreate} 
        className="btn btnPrimary cta-pulse" 
        style={{ padding: '16px 28px', fontSize: 16, borderRadius: 16 }}
        disabled={isLoading}
      >
        {isLoading ? <div className="loading-spinner"></div> : '🎯 Start Selling Now'}
      </button>

      {/* Final CTA */}
      <button 
        onClick={goCreate} 
        className="btn btnPrimary cta-pulse" 
        style={{ padding: '20px 32px', fontSize: 18, borderRadius: 16 }}
        disabled={isLoading}
      >
        {isLoading ? <div className="loading-spinner"></div> : '🚀 Create Your Store Now'}
      </button>
    </>
  );
}