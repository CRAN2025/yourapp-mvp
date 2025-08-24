import { useState, useEffect } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { Users, Store, BarChart3, Settings, Shield } from 'lucide-react';
import { database } from '@/lib/firebase';
import { formatRelativeTime } from '@/lib/utils/formatting';
import type { Seller, Event } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface SellerWithStats extends Seller {
  productCount: number;
  totalViews: number;
  lastActivity: number;
}

export default function Admin() {
  const { toast } = useToast();
  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load all sellers and their stats
  useEffect(() => {
    const loadSellersData = async () => {
      try {
        setLoading(true);

        // Load all sellers
        const sellersRef = ref(database, 'sellers');
        const sellersUnsubscribe = onValue(sellersRef, async (snapshot) => {
          if (snapshot.exists()) {
            const sellersData = snapshot.val();
            const sellersWithStats: SellerWithStats[] = [];

            // Process each seller
            for (const [uid, sellerData] of Object.entries(sellersData)) {
              const seller = { id: uid, ...(sellerData as Omit<Seller, 'id'>) };

              // Get product count
              const productsRef = ref(database, `products/${uid}`);
              const productsSnapshot = await new Promise((resolve) => {
                onValue(productsRef, resolve, { onlyOnce: true });
              });
              
              let productCount = 0;
              if ((productsSnapshot as any).exists()) {
                const products = (productsSnapshot as any).val();
                productCount = Object.keys(products).length;
              }

              // Get activity stats
              const eventsRef = ref(database, `events/${uid}`);
              const eventsSnapshot = await new Promise((resolve) => {
                onValue(eventsRef, resolve, { onlyOnce: true });
              });

              let totalViews = 0;
              let lastActivity = 0;
              if ((eventsSnapshot as any).exists()) {
                const events = (eventsSnapshot as any).val();
                const eventsList = Object.values(events) as Event[];
                
                totalViews = eventsList.filter(e => e.type === 'store_view' || e.type === 'product_view').length;
                lastActivity = Math.max(...eventsList.map(e => e.timestamp));
              }

              sellersWithStats.push({
                ...seller,
                productCount,
                totalViews,
                lastActivity,
              });
            }

            setSellers(sellersWithStats.sort((a, b) => b.createdAt - a.createdAt));
          } else {
            setSellers([]);
          }
          setLoading(false);
        });

        return () => off(sellersRef, 'value', sellersUnsubscribe);
      } catch (error) {
        console.error('Error loading sellers data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin data.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    loadSellersData();
  }, [toast]);

  // Filter sellers
  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch = seller.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && seller.lastActivity > Date.now() - 30 * 24 * 60 * 60 * 1000) ||
      (statusFilter === 'inactive' && seller.lastActivity <= Date.now() - 30 * 24 * 60 * 60 * 1000) ||
      (statusFilter === 'admin' && seller.isAdmin);
    
    return matchesSearch && matchesStatus;
  });

  // Toggle admin status
  const toggleAdminStatus = async (sellerId: string, currentStatus: boolean) => {
    try {
      const sellerRef = ref(database, `users/${sellerId}`);
      await update(sellerRef, {
        isAdmin: !currentStatus,
        updatedAt: Date.now(),
      });

      toast({
        title: 'Admin status updated',
        description: `Admin access has been ${!currentStatus ? 'granted' : 'revoked'}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update admin status.',
        variant: 'destructive',
      });
    }
  };

  // Calculate summary stats
  const totalSellers = sellers.length;
  const activeSellers = sellers.filter(s => s.lastActivity > Date.now() - 30 * 24 * 60 * 60 * 1000).length;
  const totalProducts = sellers.reduce((sum, s) => sum + s.productCount, 0);
  const totalViews = sellers.reduce((sum, s) => sum + s.totalViews, 0);

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
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage sellers and monitor platform activity</p>
        </div>

        {/* Summary Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{totalSellers}</h3>
              <p className="text-muted-foreground text-sm">Total Sellers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{activeSellers}</h3>
              <p className="text-muted-foreground text-sm">Active Sellers (30d)</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-accent" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{totalProducts}</h3>
              <p className="text-muted-foreground text-sm">Total Products</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-warning" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{totalViews}</h3>
              <p className="text-muted-foreground text-sm">Total Views</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-sellers"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sellers</SelectItem>
                <SelectItem value="active">Active (30d)</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Sellers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sellers ({filteredSellers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSellers.length === 0 ? (
              <EmptyState
                title="No sellers found"
                description="No sellers match your current search and filter criteria."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {seller.storeName[0]?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <p className="font-medium">{seller.storeName}</p>
                              <p className="text-sm text-muted-foreground">{seller.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{seller.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{seller.productCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{seller.totalViews}</Badge>
                        </TableCell>
                        <TableCell>
                          {seller.lastActivity > 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {formatRelativeTime(seller.lastActivity)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={seller.isAdmin}
                            onCheckedChange={() => toggleAdminStatus(seller.id, seller.isAdmin)}
                            data-testid={`switch-admin-${seller.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/store/${seller.id}`, '_blank')}
                            data-testid={`button-view-store-${seller.id}`}
                          >
                            View Store
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
