import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ref, onValue, off, get } from 'firebase/database';
import { ExternalLink, Eye, Search, Heart, RefreshCw, X } from 'lucide-react';
import { database } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import { mirrorAllSellerData } from '@/lib/utils/dataMirror';
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
  const [isPublishing, setIsPublishing] = useState(false);

  // Load products from Firebase
  useEffect(() => {
    if (!user) return;

    const productsRef = ref(database, `sellers/${user.uid}/products`);
    
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

  const handlePublishNow = async () => {
    if (!user || !seller) return;

    setIsPublishing(true);
    try {
      // Get all products from sellers path
      const productsRef = ref(database, `sellers/${user.uid}/products`);
      const productsSnapshot = await get(productsRef);
      const productsData = productsSnapshot.exists() ? productsSnapshot.val() : {};

      // Mirror profile and all products to public store
      await mirrorAllSellerData(user.uid, seller, productsData);

      toast({
        title: 'Published successfully',
        description: 'Your store profile and products have been published to the public store.',
      });
    } catch (error) {
      console.error('Error publishing store:', error);
      toast({
        title: 'Publication failed',
        description: 'Failed to publish your store. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handlePublishNow} 
                disabled={isPublishing}
                data-testid="button-publish-now"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isPublishing ? 'animate-spin' : ''}`} />
                {isPublishing ? 'Publishing...' : 'Publish Now'}
              </Button>
              <Button onClick={handleViewPublicStore} data-testid="button-view-public">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Store
              </Button>
            </div>
          </div>

          <Alert className="border-primary/20 bg-primary/5">
            <Eye className="h-4 w-4" />
            <AlertDescription>
              This is how your storefront appears to customers. Changes to your products will be reflected here automatically.
            </AlertDescription>
          </Alert>
        </div>

        {/* Store Header from StorefrontPublic */}
        <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                {seller?.logoUrl ? (
                  <img
                    src={seller.logoUrl}
                    alt={seller.storeName}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {seller?.storeName?.[0]?.toUpperCase() || 'S'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-foreground mb-3">
                {seller?.storeName || 'Your Store'}
              </h2>
              {seller?.storeDescription && (
                <p className="text-muted-foreground mb-4 text-lg">{seller.storeDescription}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {seller?.location && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    📍 {seller.location}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-success/10 text-success text-sm px-3 py-1">
                  🕒 Usually responds in 1 hour
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <Card className="p-8 mb-8 rounded-3xl border border-white/40"
          style={{
            background: 'linear-gradient(135deg, #F9FBFF 0%, rgba(255, 255, 255, 0.95) 100%)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04)'
          }}>
          <div className="space-y-6">
            {/* Premium Search Bar */}
            <div className="relative group">
              <Search className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for products, brands, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-14 h-14 text-base border-0 transition-all duration-300 font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  color: '#374151'
                }}
                data-testid="input-search-preview"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
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
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group rounded-2xl border border-white/40"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04)'
                }}>
                <div className="relative">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-t-2xl"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-foreground font-semibold px-3 py-1">
                      {formatPrice(product.price)}
                    </Badge>
                  </div>
                  {product.quantity <= 10 && (
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800 font-medium">
                        Only {product.quantity} left
                      </Badge>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-favorite-preview-${product.id}`}
                  >
                    <Heart className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant="outline" className="font-medium">{product.category}</Badge>
                  </div>
                  
                  {/* Enhanced WhatsApp Button Preview */}
                  <Button 
                    className="w-full bg-success text-success-foreground hover:bg-success/90 font-medium py-3"
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
