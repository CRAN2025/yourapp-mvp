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
        /* LOCKED HEADER TOKENS - ENTERPRISE GOVERNANCE */
        .header-container-locked {
          background: linear-gradient(180deg, var(--sl-header-gradient-start) 0%, var(--sl-header-gradient-end) 100%);
          box-shadow: var(--sl-header-shadow);
          border: var(--sl-header-border);
          border-radius: var(--sl-header-radius);
          overflow: hidden;
        }
        
        .header-row-locked {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--header-padding);
          gap: var(--action-spacing);
          flex-wrap: wrap;
        }
        
        .store-info-block {
          display: flex;
          align-items: center;
          gap: var(--store-info-gap);
          flex: 1;
          min-width: 0;
        }
        
        .store-logo-container {
          width: var(--size-96);
          height: var(--size-96);
          border-radius: var(--radius-16);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8faff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .store-logo-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .store-title-locked {
          font-size: var(--store-name-size);
          font-weight: var(--store-name-weight);
          color: var(--sl-header-title);
          margin: 0;
          line-height: 1.2;
        }
        
        .powered-by-locked {
          font-size: var(--powered-by-size);
          font-weight: var(--powered-by-weight);
          color: var(--sl-header-link);
          margin: 4px 0;
        }
        
        .powered-by-locked a {
          color: inherit;
          text-decoration: none;
        }
        
        .powered-by-locked a:hover {
          text-decoration: underline;
        }
        
        .store-description-locked {
          font-size: var(--description-size);
          font-weight: var(--description-weight);
          color: var(--sl-header-subtle);
          margin: 4px 0 0;
          line-height: 1.4;
        }
        
        .store-subtitle-locked {
          font-size: var(--meta-size);
          font-weight: var(--meta-weight);
          color: var(--sl-header-subtle);
          margin: 4px 0 0;
        }
        
        .badges-block {
          display: flex;
          align-items: center;
          gap: var(--action-spacing);
          flex-wrap: wrap;
        }
        
        .payment-delivery-badge {
          background: var(--sl-chip-surface);
          border: var(--sl-chip-border);
          border-radius: var(--sl-chip-radius);
          box-shadow: var(--sl-chip-shadow);
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--sl-header-title);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .payment-delivery-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
        }
        
        .cta-block {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .enterprise-cta-secondary {
          background: var(--sl-chip-surface);
          border: var(--sl-chip-border);
          border-radius: var(--sl-chip-radius);
          box-shadow: var(--sl-chip-shadow);
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--sl-header-title);
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .enterprise-cta-secondary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.15);
          color: var(--sl-header-title);
          text-decoration: none;
        }
        
        /* GLOBAL DESIGN TOKENS - LOCKED SYSTEM */
        :root {
          --sl-header-gradient-start: #ffffff;
          --sl-header-gradient-end: #f8faff;
          --sl-header-shadow: 0 12px 30px rgba(22, 34, 51, 0.06);
          --sl-header-border: 1px solid rgba(15, 23, 42, 0.06);
          --sl-header-radius: 20px;
          --sl-header-title: #0f172a;
          --sl-header-subtle: #64748b;
          --sl-header-link: #2563eb;
          --sl-chip-surface: #ffffff;
          --sl-chip-border: 1px solid rgba(15, 23, 42, 0.08);
          --sl-chip-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
          --sl-chip-radius: 12px;
          --store-name-size: 24px;
          --store-name-weight: 700;
          --powered-by-size: 16px;
          --powered-by-weight: 500;
          --description-size: 15px;
          --description-weight: 400;
          --meta-size: 14px;
          --meta-weight: 400;
          --header-padding: 20px 24px;
          --action-spacing: 12px;
          --store-info-gap: 8px;
          --size-96: 96px;
          --radius-16: 16px;
        }
        
        @media (max-width: 768px) {
          .header-row-locked {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .store-info-block {
            justify-content: center;
          }
          
          .badges-block {
            justify-content: center;
          }
          
          .cta-block {
            justify-content: center;
          }
        }
      `}</style>

      <div className="bg-gradient-to-br from-white to-slate-50 min-h-screen">
        {/* Enterprise-Grade Header Banner - Locked Design */}
        <FullWidthContainer className="py-8">
          <div className="header-container-locked overflow-hidden relative">
            
            {/* Locked header banner - light gradient background */}
            <div className="h-32 md:h-36 w-full relative overflow-hidden">
              {/* Header stays as locked gradient only */}
            </div>

            {/* PERFECT VERTICAL ALIGNMENT HEADER ROW */}
            <div className="relative z-10 -mt-8">
              <div className="header-row-locked">
                {/* LEFT ZONE: Logo + Store Identity */}
                <div className="store-info-block">
                  {/* Store Logo Container */}
                  <div className="store-logo-container">
                    {seller?.logoUrl ? (
                      <img
                        src={seller.logoUrl}
                        alt={seller.storeName}
                        decoding="async"
                        width="96"
                        height="96"
                        onError={(e) => {
                          e.currentTarget.src = logoUrl;
                          e.currentTarget.alt = 'ShopLynk logo';
                        }}
                      />
                    ) : (
                      <img
                        src={logoUrl}
                        alt="ShopLynk logo"
                        decoding="async"
                        width="96"
                        height="96"
                      />
                    )}
                  </div>
                  
                  {/* Store Title Info */}
                  <div className="min-w-0 flex-1">
                    <h1 className="store-title-locked">
                      {seller?.storeName || 'Your Store'}
                    </h1>
                    <div className="powered-by-locked">
                      <Link href={SHOPLINK_MARKETING_URL} target="_blank" rel="noopener noreferrer">
                        Powered by ShopLynk
                      </Link>
                    </div>
                    {seller?.storeDescription && seller.storeDescription.trim() ? (
                      <div className="store-description-locked">
                        {seller.storeDescription}
                      </div>
                    ) : (
                      <div className="store-subtitle-locked">
                        Preview Mode - Console View
                      </div>
                    )}
                    {seller?.location && (
                      <div className="store-subtitle-locked">
                        {seller.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* MIDDLE ZONE: Payment/Delivery Pills */}
                <div className="badges-block">
                  {!!paymentMethods.length && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="payment-delivery-badge group gap-3"
                      title="View payment methods"
                    >
                      <CreditCard className="h-5 w-5 transition-transform group-hover:scale-110" style={{ color: '#3B82F6' }} />
                      {paymentMethods.length} Payment Methods
                    </button>
                  )}
                  {!!deliveryOptions.length && (
                    <button
                      onClick={() => setShowDeliveryModal(true)}
                      className="payment-delivery-badge group gap-3"
                      title="View delivery options"
                    >
                      <Truck className="h-5 w-5 transition-transform group-hover:scale-110" style={{ color: '#3B82F6' }} />
                      {deliveryOptions.length} Delivery Options
                    </button>
                  )}
                </div>

                {/* RIGHT ZONE: View Public Store CTA */}
                <div className="cta-block">
                  <button onClick={handleViewPublicStore} className="enterprise-cta-secondary">
                    <ExternalLink className="h-4 w-4" />
                    View Public Store
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FullWidthContainer>

        {/* Search and Filter Section */}
        <FullWidthContainer className="py-4">
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
              
              <div className="flex gap-3">
                <Button 
                  onClick={handlePublishNow} 
                  disabled={isPublishing}
                  variant="outline"
                  data-testid="button-publish-now"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isPublishing ? 'animate-spin' : ''}`} />
                  {isPublishing ? 'Publishing...' : 'Publish Now'}
                </Button>
              </div>
            </div>
          </div>
        </FullWidthContainer>

        {/* Products Grid */}
        <FullWidthContainer className="pb-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
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
            </div>
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
                    
                    {/* WhatsApp Contact Button - Locked Design */}
                    <Button 
                      onClick={() => handleContactSeller(product)}
                      className="w-full bg-[#25D366] hover:bg-[#22C55E] text-white font-medium"
                      data-testid={`button-whatsapp-preview-${product.id}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Seller
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </FullWidthContainer>
        
        {/* Contact Notification */}
        {contactNotification.show && contactNotification.product && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>WhatsApp message sent for {contactNotification.product.name}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
