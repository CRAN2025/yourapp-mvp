import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ref, onValue, off } from 'firebase/database';
import { ExternalLink, Eye, Search, Heart } from 'lucide-react';
import { database } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import type { Product } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function Storefront() {
  const { user, seller } = useAuthContext();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load products from Firebase
  useEffect(() => {
    if (!user) return;

    const productsRef = ref(database, `users/${user.uid}/products`);
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const productsList = Object.entries(data).map(([id, productData]) => ({
            id,
            ...(productData as Omit<Product, 'id'>),
          })).filter(product => product.isActive);
          setProducts(productsList);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    });

    return () => off(productsRef, 'value', unsubscribe);
  }, [user, toast]);

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewPublicStore = () => {
    if (user) {
      const url = `/store/${user.uid}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LoadingSpinner size="lg" className="mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Storefront Preview</h1>
              <p className="text-muted-foreground">Preview how your store appears to customers</p>
            </div>
            <Button onClick={handleViewPublicStore} data-testid="button-view-public">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Store
            </Button>
          </div>

          <Alert className="border-primary/20 bg-primary/5">
            <Eye className="h-4 w-4" />
            <AlertDescription>
              This is how your storefront appears to customers. Changes to your products will be reflected here automatically.
            </AlertDescription>
          </Alert>
        </div>

        {/* Store Header */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                {seller?.logoUrl ? (
                  <img
                    src={seller.logoUrl}
                    alt={seller.storeName}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {seller?.storeName?.[0]?.toUpperCase() || 'S'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {seller?.storeName || 'Your Store'}
              </h2>
              {seller?.storeDescription && (
                <p className="text-muted-foreground mb-4">{seller.storeDescription}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {seller?.location && (
                  <Badge variant="outline">
                    📍 {seller.location}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-success/10 text-success">
                  🕒 Usually responds in 1 hour
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="p-6 mb-8">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-preview"
            />
          </div>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Eye className="w-16 h-16" />}
            title="No products to display"
            description={
              products.length === 0
                ? "Add products to your catalog to see how they'll appear to customers."
                : "No products match your search criteria."
            }
            action={{
              label: "Manage Products",
              onClick: () => window.location.href = '/products',
            }}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-64 object-cover"
                    loading="lazy"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-favorite-preview-${product.id}`}
                  >
                    <Heart className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                  
                  {/* WhatsApp Button Preview */}
                  <Button 
                    className="w-full bg-success text-success-foreground hover:bg-success/90"
                    disabled
                    data-testid={`button-whatsapp-preview-${product.id}`}
                  >
                    💬 Contact on WhatsApp
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
