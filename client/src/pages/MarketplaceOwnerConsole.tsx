import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';
import { ref, onValue, off } from 'firebase/database';
import { Users, Store, BarChart3, Settings, Shield, DollarSign, TrendingUp, Globe } from 'lucide-react';
import { database } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import type { Seller } from '@shared/schema';

interface PlatformStats {
  totalSellers: number;
  activeSellers: number;
  totalProducts: number;
  totalViews: number;
  revenue: number;
}

export default function MarketplaceOwnerConsole() {
  const { user, seller, loading } = useAuthContext();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [stats, setStats] = useState<PlatformStats>({
    totalSellers: 0,
    activeSellers: 0,
    totalProducts: 0,
    totalViews: 0,
    revenue: 0,
  });
  const [recentSellers, setRecentSellers] = useState<Seller[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Redirect non-authenticated users
    if (!loading && !user) {
      navigate('/auth?mode=signin&redirect=/marketplace-console');
      return;
    }

    // Check if user is admin
    if (!loading && user && seller && !seller.isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You need admin privileges to access the marketplace console.',
        variant: 'destructive',
      });
      navigate('/seller-dashboard');
      return;
    }
  }, [user, seller, loading, navigate, toast]);

  useEffect(() => {
    if (!user || !seller?.isAdmin) return;

    const loadPlatformData = async () => {
      try {
        setDataLoading(true);

        // Load all sellers
        const sellersRef = ref(database, 'sellers');
        const sellersUnsubscribe = onValue(sellersRef, async (snapshot) => {
          if (snapshot.exists()) {
            const sellersData = snapshot.val();
            const sellersList = Object.entries(sellersData).map(([uid, sellerData]) => ({
              id: uid,
              ...(sellerData as Omit<Seller, 'id'>),
            }));

            const totalSellers = sellersList.length;
            const activeSellers = sellersList.filter(s => s.onboardingCompleted).length;
            
            // Get recent sellers (last 5)
            const recentSellersList = sellersList
              .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
              .slice(0, 5);
            
            setRecentSellers(recentSellersList);

            // Calculate total products across all sellers
            let totalProducts = 0;
            for (const sellerData of sellersList) {
              const productsRef = ref(database, `sellers/${sellerData.id}/products`);
              try {
                const productsSnapshot = await new Promise((resolve) => {
                  onValue(productsRef, resolve, { onlyOnce: true });
                });
                if ((productsSnapshot as any).exists()) {
                  const products = (productsSnapshot as any).val();
                  totalProducts += Object.keys(products).length;
                }
              } catch (error) {
                console.warn(`Could not load products for seller ${sellerData.id}`);
              }
            }

            setStats({
              totalSellers,
              activeSellers,
              totalProducts,
              totalViews: 0, // Would be calculated from events
              revenue: 0, // Would be calculated from orders/subscriptions
            });
          }
          setDataLoading(false);
        });

        return () => {
          off(sellersRef, 'value', sellersUnsubscribe);
        };
      } catch (error) {
        console.error('Error loading platform data:', error);
        setDataLoading(false);
      }
    };

    loadPlatformData();
  }, [user, seller]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !seller?.isAdmin) {
    return null;
  }

  const adminActions = [
    {
      title: 'Manage Sellers',
      description: 'View, approve, and manage all sellers',
      icon: Users,
      href: '/admin',
      color: 'bg-blue-500',
    },
    {
      title: 'Platform Analytics',
      description: 'View platform-wide statistics and trends',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-green-500',
    },
    {
      title: 'Data Migration',
      description: 'Import and migrate user data',
      icon: Settings,
      href: '/admin/migration',
      color: 'bg-purple-500',
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings and features',
      icon: Shield,
      href: '/admin/settings',
      color: 'bg-orange-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Marketplace Owner Console
          </h1>
          <p className="text-emerald-100 text-lg">
            Welcome back, {seller.fullName}! Manage your ShopLynk marketplace.
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Platform Administrator</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Full Access</span>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSellers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeSellers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Across all stores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">
                Total storefront views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.revenue}</div>
              <p className="text-xs text-muted-foreground">
                Platform earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminActions.map((action) => {
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

        {/* Recent Sellers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sellers</CardTitle>
            <CardDescription>
              Latest sellers who joined the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSellers.map((seller) => (
                <div key={seller.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {seller.storeName?.[0]?.toUpperCase() || seller.fullName?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <div className="font-medium">{seller.storeName || 'Unnamed Store'}</div>
                      <div className="text-sm text-gray-600">{seller.fullName}</div>
                      <div className="text-xs text-gray-500">{seller.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={seller.onboardingCompleted ? 'default' : 'secondary'}>
                      {seller.onboardingCompleted ? 'Active' : 'Pending'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/store/${seller.id}`, '_blank')}
                    >
                      View Store
                    </Button>
                  </div>
                </div>
              ))}
              {recentSellers.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No sellers found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}