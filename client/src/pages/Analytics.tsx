import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { BarChart3, TrendingUp, Eye, MessageCircle, Users, ExternalLink } from 'lucide-react';
import { database } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { formatRelativeTime } from '@/lib/utils/formatting';
import type { Event, Product } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  storeViews: number;
  productViews: number;
  whatsappClicks: number;
  ctr: number;
}

interface TopProduct {
  product: Product;
  views: number;
  clicks: number;
  ctr: number;
}

export default function Analytics() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  // Load events and products from Firebase
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load events
        const eventsRef = ref(database, `events/${user.uid}`);
        const eventsUnsubscribe = onValue(eventsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const eventsList = Object.entries(data).map(([id, eventData]) => ({
              id,
              ...(eventData as Omit<Event, 'id'>),
            }));
            setEvents(eventsList);
          } else {
            setEvents([]);
          }
        });

        // Load products
        const productsRef = ref(database, `sellers/${user.uid}/products`);
        const productsUnsubscribe = onValue(productsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const productsList = Object.entries(data).map(([id, productData]) => ({
              id,
              ...(productData as Omit<Product, 'id'>),
            }));
            setProducts(productsList);
          } else {
            setProducts([]);
          }
          setLoading(false);
        });

        return () => {
          off(eventsRef, 'value', eventsUnsubscribe);
          off(productsRef, 'value', productsUnsubscribe);
        };
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    loadData();
  }, [user, toast]);

  // Filter events by date range
  const getFilteredEvents = () => {
    const days = parseInt(dateRange);
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    return events.filter(event => event.timestamp >= cutoffDate);
  };

  // Calculate analytics data
  const getAnalyticsData = (): AnalyticsData => {
    const filteredEvents = getFilteredEvents();
    
    const storeViews = filteredEvents.filter(e => e.type === 'store_view').length;
    const productViews = filteredEvents.filter(e => e.type === 'product_view').length;
    const whatsappClicks = filteredEvents.filter(e => e.type === 'wa_click').length;
    const ctr = productViews > 0 ? (whatsappClicks / productViews) * 100 : 0;

    return {
      storeViews,
      productViews,
      whatsappClicks,
      ctr,
    };
  };

  // Get top performing products
  const getTopProducts = (): TopProduct[] => {
    const filteredEvents = getFilteredEvents();
    const productStats: { [productId: string]: { views: number; clicks: number } } = {};

    filteredEvents.forEach(event => {
      if (event.productId) {
        if (!productStats[event.productId]) {
          productStats[event.productId] = { views: 0, clicks: 0 };
        }
        
        if (event.type === 'product_view') {
          productStats[event.productId].views++;
        } else if (event.type === 'wa_click') {
          productStats[event.productId].clicks++;
        }
      }
    });

    const topProducts = Object.entries(productStats)
      .map(([productId, stats]) => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        
        const ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0;
        return {
          product,
          views: stats.views,
          clicks: stats.clicks,
          ctr,
        };
      })
      .filter(Boolean) as TopProduct[];

    return topProducts.sort((a, b) => b.ctr - a.ctr).slice(0, 5);
  };

  // Get recent activity
  const getRecentActivity = () => {
    return getFilteredEvents()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  };

  const analyticsData = getAnalyticsData();
  const topProducts = getTopProducts();
  const recentActivity = getRecentActivity();

  const getActivityIcon = (type: Event['type']) => {
    switch (type) {
      case 'wa_click':
        return <MessageCircle className="w-5 h-5 text-success" />;
      case 'product_view':
        return <Eye className="w-5 h-5 text-accent" />;
      case 'store_view':
        return <Users className="w-5 h-5 text-primary" />;
      default:
        return <BarChart3 className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getActivityDescription = (event: Event) => {
    switch (event.type) {
      case 'wa_click':
        return event.metadata?.productName 
          ? `WhatsApp clicked for "${event.metadata.productName}"`
          : 'WhatsApp contact clicked';
      case 'product_view':
        return event.metadata?.productName 
          ? `"${event.metadata.productName}" viewed`
          : 'Product viewed';
      case 'store_view':
        return 'Store page visited';
      default:
        return 'Activity recorded';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" className="mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your store performance and customer interactions</p>
        </div>

        {/* Date Range Selector */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">Performance Overview</h2>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="text-success">
                  +{Math.round((analyticsData.storeViews / Math.max(parseInt(dateRange), 1)) * 100) / 100}/day
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1" data-testid="metric-store-views">
                {analyticsData.storeViews}
              </h3>
              <p className="text-muted-foreground text-sm">Store Views</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-accent" />
                </div>
                <Badge variant="outline" className="text-success">
                  +{Math.round((analyticsData.productViews / Math.max(parseInt(dateRange), 1)) * 100) / 100}/day
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1" data-testid="metric-product-views">
                {analyticsData.productViews}
              </h3>
              <p className="text-muted-foreground text-sm">Product Views</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-success" />
                </div>
                <Badge variant="outline" className="text-success">
                  +{Math.round((analyticsData.whatsappClicks / Math.max(parseInt(dateRange), 1)) * 100) / 100}/day
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1" data-testid="metric-whatsapp-clicks">
                {analyticsData.whatsappClicks}
              </h3>
              <p className="text-muted-foreground text-sm">WhatsApp Clicks</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
                <Badge variant="outline" className="text-success">
                  {analyticsData.ctr > 0 ? '+' : ''}{analyticsData.ctr.toFixed(1)}%
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1" data-testid="metric-ctr">
                {analyticsData.ctr.toFixed(1)}%
              </h3>
              <p className="text-muted-foreground text-sm">Click-Through Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <EmptyState
                  title="No product data"
                  description="Product performance data will appear here once customers start viewing your products."
                />
              ) : (
                <div className="space-y-4">
                  {topProducts.map((item) => (
                    <div key={item.product.id} className="flex items-center space-x-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                      <img
                        src={item.product.images[0] || '/placeholder-product.png'}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.views} views • {item.clicks} clicks
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-success">
                          {item.ctr.toFixed(1)}%
                        </span>
                        <p className="text-xs text-muted-foreground">CTR</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Interactive chart showing daily traffic trends
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Chart implementation: Use Chart.js or Recharts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <EmptyState
                title="No recent activity"
                description="Customer interactions will appear here as they happen."
                action={{
                  label: "View Store",
                  onClick: () => window.open(`/store/${user?.uid}`, '_blank'),
                }}
              />
            ) : (
              <div className="space-y-4">
                {recentActivity.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground mb-1">
                        {getActivityDescription(event)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatRelativeTime(event.timestamp)}</span>
                        <span className="capitalize">{event.deviceType} device</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
