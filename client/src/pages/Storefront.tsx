import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { ref, onValue, off, get } from 'firebase/database';
import { ExternalLink, Eye, Search, Heart, RefreshCw, CreditCard, Truck, MapPin, Phone, Info, Star, Clock, Globe, CheckCircle, Sparkles, Award, Shield, Zap, Share2, UserPlus, Filter, ChevronDown, MessageCircle } from 'lucide-react';
import { database } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import { trackInteraction } from '@/lib/utils/analytics';
import { openWhatsApp, createWhatsAppMessage } from '@/lib/utils/whatsapp';
import { mirrorAllSellerData } from '@/lib/utils/dataMirror';
import type { Product, Seller } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import logoUrl from '@/assets/logo.png';

// Marketing URL for ShopLink promotion
const SHOPLINK_MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://shoplink.app';

// --- v1.8 Full-Width Container System for Edge-to-Edge Alignment ---
const FullWidthContainer = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`w-full max-w-full px-6 md:px-12 ${className}`}>
    {children}
  </div>
);

// --- Full-bleed section with edge-to-edge container ---
const FullBleedSection = ({ children }: { children: React.ReactNode }) => (
  <section className="w-full py-8" style={{
    background: 'linear-gradient(135deg, #2563EB 0%, #9333EA 100%)'
  }}>
    <FullWidthContainer>
      {children}
    </FullWidthContainer>
  </section>
);

export default function Storefront() {
  const { user, seller } = useAuthContext();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [contactNotification, setContactNotification] = useState<{show: boolean, product: Product | null}>({show: false, product: null});
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

  // Enhanced image quality detection
  const MIN_WIDTH = 800;
  const MIN_HEIGHT = 600;

  // Memoized favorites key for proper sellerId-based loading
  const favKey = useMemo(() => `shoplink_favorites_${user?.uid}`, [user?.uid]);

  // Load favorites with enhanced error handling
  useEffect(() => {
    try {
      const saved = localStorage.getItem(favKey);
      setFavorites(saved ? new Set(JSON.parse(saved)) : new Set());
    } catch (error) {
      console.warn('Failed to load favorites from localStorage:', error);
      setFavorites(new Set());
    }
  }, [favKey]);

  // Enhanced interaction tracking
  const handleInteraction = (action: string, productId?: string) => {
    if (action === 'contact_whatsapp') {
      trackInteraction({ 
        type: 'wa_click', 
        sellerId: user?.uid || '',
        productId
      });
    }
  };

  // WhatsApp contact handler with notification
  const handleContactSeller = (product: Product) => {
    if (!seller?.whatsappNumber) {
      toast({
        title: 'WhatsApp Not Available',
        description: 'This seller has not configured WhatsApp contact.',
        variant: 'destructive',
      });
      return;
    }

    const message = createWhatsAppMessage(product, seller.storeName);
    openWhatsApp(seller.whatsappNumber, message);
    
    // Show contact notification
    setContactNotification({show: true, product});
    
    handleInteraction('contact_whatsapp', product.id);
    
    // Auto-hide notification
    setTimeout(() => {
      setContactNotification({show: false, product: null});
    }, 3000);
  };

  // Enhanced category extraction from products
  const availableCategories = useMemo(() => {
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [products]);

  // Enhanced search and filtering
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Favorites filter
    if (showFavorites) {
      filtered = filtered.filter(product => favorites.has(product.id));
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high':
        return filtered.sort((a, b) => b.price - a.price);
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  }, [products, searchQuery, categoryFilter, showFavorites, favorites, sortBy]);

  // Payment and delivery options from seller profile
  const paymentMethods = seller?.paymentMethods || [];
  const deliveryOptions = seller?.deliveryOptions || [];

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
      <style>{`
        /* LOCKED HEADER TOKENS - RESTORED FROM v1.1 SPECIFICATION */
        :root {
          --bg-surface-scrim: linear-gradient(135deg, rgba(240, 247, 255, 0.95) 0%, rgba(248, 251, 255, 0.92) 40%, rgba(255, 255, 255, 0.9) 100%);
          --space-8: 32px;
          --space-10: 40px;
          --space-6: 24px;
          --space-2: 8px;
          --radius-16: 16px;
          --shadow-xl-soft: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          --size-96: 96px;
          --size-80: 80px;
          
          /* TYPOGRAPHY TOKENS - LOCKED GLOBAL SYSTEM */
          --store-name-size: 24px;
          --store-name-weight: 700;
          --powered-by-size: 16px;
          --powered-by-weight: 500;
          --description-size: 15px;
          --description-weight: 400;
          --meta-size: 14px;
          --meta-weight: 400;
        }
        
        .shadow-xl-soft {
          box-shadow: var(--shadow-xl-soft);
        }
      `}</style>
      
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

        {/* LOCKED STOREFRONT HEADER - v1.1 COMPLETE */}
        <FullBleedSection>
          <div 
            className="mx-auto max-w-3xl md:max-w-4xl bg-white/95 rounded-2xl shadow-xl-soft p-8 relative overflow-hidden"
            style={{
              background: 'var(--bg-surface-scrim)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Store Identity Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Store Logo Container */}
              <div className="flex-shrink-0">
                <div 
                  className="rounded-2xl overflow-hidden shadow-lg bg-white"
                  style={{
                    width: 'var(--size-96)',
                    height: 'var(--size-96)',
                  }}
                >
                  {seller?.logoUrl ? (
                    <img
                      src={seller.logoUrl}
                      alt={seller.storeName}
                      width="96"
                      height="96"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = logoUrl;
                        e.currentTarget.alt = 'ShopLynk logo';
                      }}
                    />
                  ) : (
                    <img
                      src={logoUrl}
                      alt="ShopLynk logo"
                      width="96"
                      height="96"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              
              {/* Store Information */}
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <h1 
                    className="text-white font-bold mb-1"
                    style={{
                      fontSize: 'var(--store-name-size)',
                      fontWeight: 'var(--store-name-weight)',
                      lineHeight: '1.2',
                    }}
                  >
                    {seller?.storeName || 'Your Store'}
                  </h1>
                  <div 
                    className="text-white/80 font-medium mb-2"
                    style={{
                      fontSize: 'var(--powered-by-size)',
                      fontWeight: 'var(--powered-by-weight)',
                    }}
                  >
                    <Link href={SHOPLINK_MARKETING_URL} target="_blank" rel="noopener noreferrer">
                      Powered by ShopLynk
                    </Link>
                  </div>
                  {seller?.storeDescription && (
                    <p 
                      className="text-white/90 leading-relaxed"
                      style={{
                        fontSize: 'var(--description-size)',
                        fontWeight: 'var(--description-weight)',
                        lineHeight: '1.4',
                      }}
                    >
                      {seller.storeDescription}
                    </p>
                  )}
                </div>

                {/* Store Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                  {seller?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{seller.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Usually responds in 1 hour</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {paymentMethods.length > 0 && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                    variant="outline"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {paymentMethods.length} Payment{paymentMethods.length !== 1 ? 's' : ''}
                  </Button>
                )}
                
                {deliveryOptions.length > 0 && (
                  <Button
                    onClick={() => setShowDeliveryModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                    variant="outline"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    {deliveryOptions.length} Delivery
                  </Button>
                )}
              </div>
            </div>
          </div>
        </FullBleedSection>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-preview"
                />
              </div>
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group bg-white">
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
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {product.category}
                    </Badge>
                  </div>
                  
                  {/* WhatsApp Contact Button - Preview Mode */}
                  <Button 
                    className="w-full bg-[#25D366] hover:bg-[#22C55E] text-white font-medium"
                    disabled
                    data-testid={`button-whatsapp-preview-${product.id}`}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Seller (Preview)
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
