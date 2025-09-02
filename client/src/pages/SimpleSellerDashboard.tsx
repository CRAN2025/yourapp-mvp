import { useAuthContext } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SimpleSellerDashboard() {
  const { user, seller, loading } = useAuthContext();

  console.log('🔧 SimpleSellerDashboard - Debug Info:', {
    loading,
    hasUser: !!user,
    hasSeller: !!seller,
    userUID: user?.uid,
    sellerData: seller ? {
      id: seller.id,
      fullName: seller.fullName,
      storeName: seller.storeName,
      onboardingCompleted: seller.onboardingCompleted,
      isAdmin: seller.isAdmin
    } : null
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading seller dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900">Not Authenticated</h1>
          <p className="mt-2 text-gray-600">Please sign in to access your dashboard.</p>
          <a 
            href="/auth?mode=signin&redirect=/seller-dashboard" 
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900">No Seller Profile</h1>
          <p className="mt-2 text-gray-600">Unable to load seller profile data.</p>
          <p className="mt-1 text-sm text-gray-500">User ID: {user.uid}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-blue-600 rounded-2xl p-8 mb-8 text-white" style={{ backgroundColor: '#4F46E5' }}>
          <h1 className="text-4xl font-bold mb-3">
            Welcome, {seller.fullName || 'Seller'}!
          </h1>
          <p className="text-xl text-blue-100 mb-2">
            Store: {seller.storeName || 'Your Store'}
          </p>
          <p className="text-sm text-blue-200">
            User ID: {user.uid} | Onboarding: {seller.onboardingCompleted ? '✅ Complete' : '⚠️ Incomplete'}
          </p>
        </div>

        {!seller.onboardingCompleted && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-orange-900 mb-2">Complete Your Store Setup</h3>
            <p className="text-orange-800 mb-4">
              Finish your onboarding to unlock all features and make your store public.
            </p>
            <a 
              href="/onboarding/step-1"
              className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-full hover:opacity-90 transition-all duration-200"
              style={{ backgroundColor: '#4F46E5' }}
            >
              Continue Setup
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-6" style={{ backgroundColor: '#4F46E5' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Products</h3>
            <p className="text-sm text-gray-600 mb-6">Add, edit, or remove products from your store</p>
            <button
              onClick={() => window.location.href = '/products'}
              className="w-full px-4 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-all duration-200"
              style={{ backgroundColor: '#4F46E5' }}
            >
              Open Products
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Storefront</h3>
            <p className="text-sm text-gray-600 mb-6">See how your store looks to customers</p>
            <button
              onClick={() => window.location.href = '/storefront'}
              className="w-full px-4 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-all duration-200"
            >
              View Storefront
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-6" style={{ backgroundColor: '#4F46E5' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600 mb-6">Track views, clicks, and performance</p>
            <button
              onClick={() => window.location.href = '/analytics'}
              className="w-full px-4 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-all duration-200"
              style={{ backgroundColor: '#4F46E5' }}
            >
              View Analytics
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-orange-500 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Store Settings</h3>
            <p className="text-sm text-gray-600 mb-6">Update store info and preferences</p>
            <button
              onClick={() => window.location.href = '/settings'}
              className="w-full px-4 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-all duration-200"
            >
              Open Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 mt-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Public Store Link</h3>
          <div className="flex flex-col md:flex-row items-stretch gap-4">
            <div className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm font-mono break-all text-gray-700">
              {typeof window !== 'undefined' ? window.location.origin : ''}/store/{seller.id}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.navigator?.clipboard) {
                    window.navigator.clipboard.writeText(`${window.location.origin}/store/${seller.id}`);
                  }
                }}
                className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/store/${seller.id}`;
                  const message = encodeURIComponent(`Check out my store: ${storeUrl}`);
                  window.open(`https://wa.me/?text=${message}`, '_blank');
                }}
                className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-all duration-200"
              >
                Share Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}