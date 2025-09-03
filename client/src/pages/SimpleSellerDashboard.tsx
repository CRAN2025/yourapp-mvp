import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';
import { Store, Package, BarChart3, Settings, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SellerDashboard() {
  const { user, seller, loading } = useAuthContext();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect non-authenticated users
    if (!loading && !user) {
      navigate('/auth?mode=signin&redirect=/seller-dashboard');
      return;
    }

    // Optional: Show onboarding prompt for incomplete sellers but don't redirect
    // This allows sellers to access their dashboard regardless of onboarding status
  }, [user, seller, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !seller) {
    return null;
  }

  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or remove products from your store',
      icon: Package,
      href: '/products',
      color: 'bg-blue-500',
    },
    {
      title: 'View Storefront',
      description: 'See how your store looks to customers',
      icon: Eye,
      href: '/storefront',
      color: 'bg-green-500',
    },
    {
      title: 'Analytics',
      description: 'Track views, clicks, and performance',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-purple-500',
    },
    {
      title: 'Store Settings',
      description: 'Update store info, categories, and preferences',
      icon: Settings,
      href: '/settings',
      color: 'bg-orange-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Onboarding Alert - if incomplete */}
        {!seller.onboardingCompleted && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">Complete Your Store Setup</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Finish your onboarding to unlock all features and make your store public.
                </p>
              </div>
              <Button
                onClick={() => navigate('/onboarding/step-1')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Continue Setup
              </Button>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {seller.fullName || 'Seller'}!
          </h1>
          <p className="text-blue-100 text-lg">
            Manage your store: <span className="font-semibold">{seller.storeName || 'Your Store'}</span>
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span>{seller.category || 'General Store'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{seller.country || 'Unknown'}</span>
            </div>
            {!seller.onboardingCompleted && (
              <div className="flex items-center gap-2 bg-amber-500 bg-opacity-20 px-3 py-1 rounded-full">
                <Settings className="w-4 h-4" />
                <span>Setup Incomplete</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.href} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => navigate(action.href)}
                    className="w-full"
                    variant="outline"
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Store Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Total products in your store
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Store Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Total storefront views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp Clicks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Customer contact attempts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Public Store Link */}
        <Card>
          <CardHeader>
            <CardTitle>Your Public Store</CardTitle>
            <CardDescription>
              Share this link with your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 p-3 rounded-lg text-sm font-mono">
                {window.location.origin}/store/{seller.id}
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/store/${seller.id}`);
                }}
                variant="outline"
              >
                Copy Link
              </Button>
              <Button
                onClick={() => window.open(`/store/${seller.id}`, '_blank')}
                variant="default"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}