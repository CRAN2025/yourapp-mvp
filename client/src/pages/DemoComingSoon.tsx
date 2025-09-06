import { useEffect } from 'react';
import { Link } from 'wouter';

// Analytics tracking
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function DemoComingSoon() {
  useEffect(() => {
    document.title = 'Demo Coming Soon - ShopLynk';
    
    // Add noindex meta tag
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    
    // Track analytics event
    try {
      if (window.gtag) {
        window.gtag('event', 'demo_coming_soon_viewed', {
          event_category: 'demo',
          event_label: 'coming_soon_page'
        });
      }
    } catch (e) {
      // Analytics failure shouldn't break the experience
    }
    
    // Cleanup
    return () => {
      if (document.head.contains(meta)) {
        document.head.removeChild(meta);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
          Demo Coming Soon
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          This demo storefront will be available soon. Check back later or create your own store to get started.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/">
            <a 
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              data-testid="back-home"
              aria-label="Back to homepage"
            >
              Back to Home
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}