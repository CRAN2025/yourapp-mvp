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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {seller.fullName || 'Seller'}!
          </h1>
          <p className="text-lg text-gray-600">
            Store: {seller.storeName || 'Your Store'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            User ID: {user.uid} | Onboarding: {seller.onboardingCompleted ? '✅ Complete' : '⚠️ Incomplete'}
          </p>
        </div>

        {!seller.onboardingCompleted && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-amber-800 mb-2">Complete Your Store Setup</h3>
            <p className="text-amber-700 text-sm mb-4">
              Finish your onboarding to unlock all features and make your store public.
            </p>
            <a 
              href="/onboarding/step-1"
              className="inline-block bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              Continue Setup
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Manage Products</h3>
            <p className="text-sm text-gray-600 mb-4">Add, edit, or remove products from your store</p>
            <a 
              href="/products"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Open Products
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">View Storefront</h3>
            <p className="text-sm text-gray-600 mb-4">See how your store looks to customers</p>
            <a 
              href="/storefront"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
            >
              View Storefront
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">Track views, clicks, and performance</p>
            <a 
              href="/analytics"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
            >
              View Analytics
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Store Settings</h3>
            <p className="text-sm text-gray-600 mb-4">Update store info and preferences</p>
            <a 
              href="/settings"
              className="inline-block bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700"
            >
              Open Settings
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Public Store Link</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 p-3 rounded-lg text-sm font-mono">
              {typeof window !== 'undefined' ? window.location.origin : ''}/store/{seller.id}
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.navigator?.clipboard) {
                  window.navigator.clipboard.writeText(`${window.location.origin}/store/${seller.id}`);
                }
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
            >
              Copy Link
            </button>
            <a
              href={`/store/${seller.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Preview Store
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}