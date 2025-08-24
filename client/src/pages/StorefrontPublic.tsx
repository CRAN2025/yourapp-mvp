import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { ref, get } from 'firebase/database';
import { Search, Heart } from 'lucide-react';
import { database } from '@/lib/firebase';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import { trackInteraction } from '@/lib/utils/analytics';
import { openWhatsApp, createWhatsAppMessage } from '@/lib/utils/whatsapp';
import type { Product, Seller } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PublicLayout from '@/components/Layout/PublicLayout';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function StorefrontPublic() {
  const [, params] = useRoute('/store/:sellerId');
  const { toast } = useToast();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const sellerId = params?.sellerId;

  // Load seller and products data
  useEffect(() => {
    if (!sellerId) return;

    const loadStoreData = async () => {
      try {
        setLoading(true);

        // Load seller data
        const sellerRef = ref(database, `users/${sellerId}`);
        const sellerSnapshot = await get(sellerRef);
        
        if (!sellerSnapshot.exists()) {
          throw new Error('Store not found');
        }

        const sellerData = sellerSnapshot.val();
        setSeller(sellerData);

        // Load products
        const productsRef = ref(database, `products/${sellerId}`);
        const productsSnapshot = await get(productsRef);

        if (productsSnapshot.exists()) {
          const data = productsSnapshot.val();
          const productsList = Object.entries(data).map(([id, productData]) => ({
            id,
            ...(productData as Omit<Product, 'id'>),
          })).filter(product => product.isActive);
          setProducts(productsList);
        }

        // Track store view
        await trackInteraction({
          type: 'store_view',
          sellerId,
        });

      } catch (error) {
        console.error('Error loading store:', error);
        toast({
          title: 'Store not found',
          description: 'The store you are looking for does not exist.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [sellerId, toast]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesFavorites = !showFavorites || favorites.has(product.id);
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category)));

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const handleWhatsAppContact = async (product: Product) => {
    if (!seller || !sellerId) return;

    try {
      // Track WhatsApp click
      await trackInteraction({
        type: 'wa_click',
        sellerId,
        productId: product.id,
        metadata: {
          productName: product.name,
          productPrice: product.price,
        },
      });

      // Create WhatsApp message
      const message = createWhatsAppMessage({
        storeName: seller.storeName,
        productName: product.name,
        productId: product.id,
        url: window.location.href,
      });

      // Open WhatsApp
      openWhatsApp(seller.whatsappNumber, message);

    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      toast({
        title: 'Error',
        description: 'Failed to open WhatsApp. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleProductView = async (product: Product) => {
    if (!sellerId) return;

    try {
      await trackInteraction({
        type: 'product_view',
        sellerId,
        productId: product.id,
        metadata: {
          productName: product.name,
          productPrice: product.price,
        },
      });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </PublicLayout>
    );
  }

  if (!seller) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <EmptyState
            title="Store not found"
            description="The store you are looking for does not exist or has been removed."
            action={{
              label: "Browse Other Stores",
              onClick: () => window.location.href = '/',
            }}
          />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Store Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shadow-soft">
                  {seller.logoUrl ? (
                    <img
                      src={seller.logoUrl}
                      alt={seller.storeName}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {seller.storeName[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {seller.storeName}
                </h1>
                {seller.storeDescription && (
                  <p className="text-muted-foreground mb-4">{seller.storeDescription}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  {seller.location && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
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
        </header>

        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Card className="p-6 mb-8 shadow-soft">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-products"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showFavorites ? 'default' : 'outline'}
                onClick={() => setShowFavorites(!showFavorites)}
                data-testid="button-favorites"
              >
                <Heart className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Favorites</span>
              </Button>
            </div>
          </Card>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No products found"
              description={
                products.length === 0
                  ? "This store doesn't have any products yet."
                  : "Try adjusting your search or filter criteria."
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                  onClick={() => handleProductView(product)}
                  data-testid={`product-card-${product.id}`}
                >
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
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity ${
                        favorites.has(product.id) ? 'text-red-500' : 'text-gray-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      data-testid={`button-favorite-${product.id}`}
                    >
                      <Heart className="w-4 h-4" fill={favorites.has(product.id) ? 'currentColor' : 'none'} />
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
                    
                    {/* WhatsApp Button */}
                    <Button
                      className="w-full bg-success text-success-foreground hover:bg-success/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsAppContact(product);
                      }}
                      data-testid={`button-whatsapp-${product.id}`}
                    >
                      💬 Contact on WhatsApp
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
