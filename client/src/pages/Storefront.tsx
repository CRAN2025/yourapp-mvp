import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { ref, onValue, off, get } from 'firebase/database';
import { ExternalLink, Eye, Search, Heart, RefreshCw, X, MessageCircle, ChevronDown, ArrowLeft, CreditCard, Truck, MapPin, Phone, Info, Star, Clock, Globe, CheckCircle, Sparkles, Award, Shield, Zap, Share2, UserPlus, Filter, Instagram, Facebook } from 'lucide-react';
import StoreHeader from '@/components/StoreHeader';
import { database } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import { mirrorAllSellerData } from '@/lib/utils/dataMirror';
import { trackInteraction } from '@/lib/utils/analytics';
import { openWhatsApp, createWhatsAppMessage } from '@/lib/utils/whatsapp';
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

// URL normalization for social media links
const normalizeUrl = (value: string, platform: 'instagram' | 'tiktok' | 'facebook'): string => {
  if (!value || typeof value !== 'string') return '';
  
  const trimmed = value.trim();
  if (!trimmed) return '';
  
  // Block unsafe URLs
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
    return '';
  }
  
  // If already a full URL, use as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Handle-to-URL conversion
  let handle = trimmed;
  if (handle.startsWith('@')) {
    handle = handle.slice(1);
  }
  
  // Escape handle for URL safety
  const encodedHandle = encodeURIComponent(handle);
  
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${encodedHandle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${encodedHandle}`;
    case 'facebook':
      return `https://facebook.com/${encodedHandle}`;
    default:
      return '';
  }
};

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
  const [lowResImages, setLowResImages] = useState<Record<string, boolean>>({});
  const [isPublishing, setIsPublishing] = useState(false);

  // Enhanced image quality detection
  const MIN_WIDTH = 800;
  const MIN_HEIGHT = 600;
  
  const handleImageLoad = (productId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
      setLowResImages(prev => ({ ...prev, [productId]: true }));
    }
  };

  // Simple placeholder image
  const PLACEHOLDER_IMAGE = '/placeholder-product.png';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  };

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
      localStorage.removeItem(favKey);
    }
  }, [favKey]);

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

  // Enhanced filtering logic from StorefrontPublic
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      // Enhanced search matching
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(Boolean);
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.brand,
        product.material,
        product.color,
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchTerms.length === 0 || 
        searchTerms.every(term => searchableText.includes(term));
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesFavorites = !showFavorites || favorites.has(product.id);
      
      return matchesSearch && matchesCategory && matchesFavorites;
    });

    // Enhanced sorting with multiple criteria
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popular':
        filtered.sort((a, b) => {
          // Sort by views, then by favorites count, then by recency
          const aPopularity = ((a as any).analytics?.views || 0) + ((a as any).analytics?.favorites || 0);
          const bPopularity = ((b as any).analytics?.views || 0) + ((b as any).analytics?.favorites || 0);
          if (aPopularity !== bPopularity) return bPopularity - aPopularity;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, showFavorites, favorites, sortBy]);

  // Enhanced category extraction with counts
  const categories = useMemo(() => {
    const categoryCount = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);
  }, [products]);

  // Enhanced favorite toggling with analytics and animations
  const toggleFavorite = async (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const newFavorites = new Set(favorites);
    const isAdding = !newFavorites.has(productId);
    
    if (isAdding) {
      newFavorites.add(productId);
    } else {
      newFavorites.delete(productId);
    }
    
    setFavorites(newFavorites);
    
    // Save to localStorage with error handling
    try {
      localStorage.setItem(favKey, JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  };

  // Enhanced payment and delivery data processing
  const paymentMethods = useMemo(() => {
    if (!seller?.paymentMethods) return [];
    
    const methods = Array.isArray(seller.paymentMethods) 
      ? seller.paymentMethods.filter(Boolean) 
      : Object.entries(seller.paymentMethods)
          .filter(([, value]) => !!value)
          .map(([key]) => key);
    
    // Sort payment methods by preference
    return methods.sort((a, b) => {
      const order = ['mobile', 'card', 'bank', 'cash', 'paypal'];
      const aIndex = order.findIndex(o => a.toLowerCase().includes(o));
      const bIndex = order.findIndex(o => b.toLowerCase().includes(o));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }, [seller?.paymentMethods]);

  const deliveryOptions = useMemo(() => {
    if (!seller?.deliveryOptions) return [];
    
    const options = Array.isArray(seller.deliveryOptions) 
      ? seller.deliveryOptions.filter(Boolean)
      : Object.entries(seller.deliveryOptions)
          .filter(([, value]) => !!value)
          .map(([key]) => key);
    
    // Sort delivery options by speed/convenience
    return options.sort((a, b) => {
      const order = ['pickup', 'local', 'courier', 'nationwide', 'international'];
      const aIndex = order.findIndex(o => a.toLowerCase().includes(o));
      const bIndex = order.findIndex(o => b.toLowerCase().includes(o));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }, [seller?.deliveryOptions]);

  // Product view handler
  const handleProductView = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // WhatsApp contact handler
  const handleContactProduct = async (product: Product) => {
    if (!seller?.whatsappNumber) return;
    
    const message = createWhatsAppMessage(product, seller);
    openWhatsApp(seller.whatsappNumber, message);
    
    setContactNotification({show: true, product});
    
    // Track interaction
    try {
      await trackInteraction({
        type: 'whatsapp_contact',
        sellerId: user?.uid!,
        productId: product.id,
        metadata: { productName: product.name },
      });
    } catch (error) {
      console.error('Failed to track WhatsApp contact:', error);
    }
  };

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
    <>
      {/* Add CSS from StorefrontPublic */}
      <style>{`
        /* Premium search bar matching landing page inputs */
        .frosted-search {
          background: #FFFFFF;
          border: 1px solid #E5EAF5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
        }
        
        /* Filter Bar Layout */
        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        
        .filter-bar__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .filter-bar__title {
          font-weight: 600;
          font-size: 14px;
          line-height: 1.4;
          margin: 0;
        }
        
        /* GLOBAL DESIGN TOKENS - LOCKED SYSTEM */
        :root {
          --token-gradient-primary: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
          --token-button-height: 36px;
          --token-button-padding-x: 16px;
          --token-button-padding-y: 8px;
          --token-shadow-primary: 0px 5px 18px rgba(80, 155, 255, 0.45);
          --token-shadow-primary-hover: 0px 8px 24px rgba(80, 155, 255, 0.55);
          --token-shadow-secondary: 0px 2px 8px rgba(0, 0, 0, 0.08);
          --token-border-radius: 8px;
          --token-font-size: 14px;
          --token-font-weight: 500;
          --token-transition-default: all 0.2s ease;
          --token-hover-scale: 1.02;
          --token-hover-brightness: 1.02;
          --token-gap: 8px;
        }
        
        /* CATEGORY PILLS - Primary Control with Global Tokens */
        .category-pill {
          height: var(--token-button-height);
          padding: var(--token-button-padding-y) var(--token-button-padding-x);
          border-radius: var(--token-border-radius);
          font-size: var(--token-font-size);
          font-weight: var(--token-font-weight);
          background: #f8f9fc;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: var(--token-transition-default);
          box-shadow: var(--token-shadow-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--token-gap);
          color: #555;
          margin-top: 0;
        }
        
        .category-pill:hover {
          transform: scale(var(--token-hover-scale));
          filter: brightness(var(--token-hover-brightness));
          background: #f0f4ff;
          border-color: #b3c8ff;
        }
        
        .category-pill.active {
          background: var(--token-gradient-primary);
          color: #fff;
          border: none;
          box-shadow: var(--token-shadow-primary);
          font-weight: 600;
        }
        
        /* Filter pill classes using global tokens */
        .filter-pill-active {
          background: var(--token-gradient-primary);
          color: #FFFFFF;
          box-shadow: var(--token-shadow-primary);
          border-radius: var(--token-border-radius);
          font-weight: 600;
          transition: var(--token-transition-default);
          border: none;
          height: var(--token-button-height);
          padding: var(--token-button-padding-y) var(--token-button-padding-x);
          font-size: var(--token-font-size);
        }
        
        .filter-pill-inactive {
          background: #f8f9fc;
          color: #555;
          border: 1px solid #e5e7eb;
          border-radius: var(--token-border-radius);
          transition: var(--token-transition-default);
          box-shadow: var(--token-shadow-secondary);
          font-weight: var(--token-font-weight);
          height: var(--token-button-height);
          padding: var(--token-button-padding-y) var(--token-button-padding-x);
          font-size: var(--token-font-size);
        }
        
        .filter-pill-inactive:hover {
          transform: scale(var(--token-hover-scale));
          filter: brightness(var(--token-hover-brightness));
          background: #f0f4ff;
          border-color: #b3c8ff;
        }
        
        /* FAVORITES CHIP - Secondary Control with Global Tokens */
        .favorites-chip {
          height: var(--token-button-height);
          padding: var(--token-button-padding-y) var(--token-button-padding-x);
          border-radius: var(--token-border-radius);
          font-size: var(--token-font-size);
          font-weight: var(--token-font-weight);
          background: #fff;
          border: 1px solid #e5e7eb;
          box-shadow: var(--token-shadow-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: var(--token-transition-default);
          cursor: pointer;
          color: #333;
          margin-top: 0;
        }
        
        .favorites-chip:hover {
          filter: brightness(var(--token-hover-brightness));
          background: #f9f9fc;
          border-color: #b3c8ff;
        }
        
        /* Consistent micro-elevations */
        .micro-elevation {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }
      `}</style>
      
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

        {/* Store Header Component from StorefrontPublic */}
        <StoreHeader
          name={seller?.storeName || 'Store Name'}
          logoUrl={seller?.logoUrl}
          description={seller?.storeDescription}
          paymentCount={paymentMethods.length}
          deliveryCount={deliveryOptions.length}
          onBack={() => window.location.href = '/dashboard'}
          socials={{
            instagram: seller?.socialMedia?.instagram ? normalizeUrl(seller.socialMedia.instagram, 'instagram') : undefined,
            tiktok: seller?.socialMedia?.tiktok ? normalizeUrl(seller.socialMedia.tiktok, 'tiktok') : undefined,
            facebook: seller?.socialMedia?.facebook ? normalizeUrl(seller.socialMedia.facebook, 'facebook') : undefined,
          }}
        />

        {/* v1.9.4 Clean Global Search and Filters from StorefrontPublic */}
        <FullWidthContainer className="py-10">
          <Card className="p-10 mb-12 rounded-3xl relative overflow-hidden border border-white/40"
            style={{
              background: 'linear-gradient(135deg, #F9FBFF 0%, rgba(255, 255, 255, 0.95) 100%)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04)'
            }}>
            {/* Clean frosted glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-white/20 rounded-3xl"></div>
            <div className="relative z-10">
            <div className="space-y-10">
              {/* v1.9.3 Global Standard Search Bar */}
              <div className="relative group">
                {/* ShopLynk gradient focus border */}
                <div 
                  className="absolute -inset-1 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-400"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                    padding: '1px'
                  }}
                >
                  <div className="w-full h-full bg-white rounded-2xl"></div>
                </div>
                <div className="absolute inset-0 bg-blue-500/3 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                
                {/* Premium search icon */}
                <Search className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 transition-all duration-300" style={{ color: '#9CA3AF' }} />
                
                <Input
                  type="text"
                  placeholder="Search for products, brands, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-14 h-14 text-base border-0 frosted-search transition-all duration-300 font-medium relative z-10"
                  style={{
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(8px)',
                    color: '#374151'
                  }}
                  data-testid="input-search-products"
                />
                
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-slate-100 transition-all duration-200 z-20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* v1.8 Enhanced Filters - Perfect Baseline Alignment */}
              <div className="filter-bar">
                {/* Left side: Categories label + pills */}
                <div className="filter-bar__left">
                  <span className="filter-bar__title text-slate-700 uppercase tracking-wide flex items-center">
                    <Filter className="w-5 h-5 mr-3 text-blue-600" />
                    Categories
                  </span>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoryFilter('all')}
                      className={`category-pill transition-all duration-300 micro-elevation ${
                        categoryFilter === 'all' 
                          ? 'filter-pill-active' 
                          : 'filter-pill-inactive'
                      }`}
                    >
                      All Categories ({products.length})
                    </Button>
                    {categories.slice(0, 6).map(category => {
                      const count = products.filter(p => p.category === category).length;
                      const isActive = categoryFilter === category;
                      return (
                        <Button
                          key={category}
                          variant="outline"
                          size="sm"
                          onClick={() => setCategoryFilter(category)}
                          className={`category-pill transition-all duration-300 micro-elevation ${
                            isActive 
                              ? 'filter-pill-active' 
                              : 'filter-pill-inactive'
                          }`}
                        >
                          {category} ({count})
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Right side: Controls */}
                <div className="flex gap-6 items-center flex-wrap">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-56 sort-dropdown border-0"
                      style={{
                        height: 'var(--token-button-height)',
                        padding: 'var(--token-button-padding-y) var(--token-button-padding-x)',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 'var(--token-border-radius)',
                        boxShadow: 'var(--token-shadow-secondary)',
                        fontWeight: 'var(--token-font-weight)',
                        fontSize: 'var(--token-font-size)',
                        color: '#333',
                        transition: 'var(--token-transition-default)'
                      }}>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-0 shadow-2xl backdrop-blur-xl"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                      <SelectItem value="newest">🆕 Newest First</SelectItem>
                      <SelectItem value="popular">🔥 Most Popular</SelectItem>
                      <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                      <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                      <SelectItem value="name">📝 Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Unified Favorites Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`favorites-chip border-0 ${showFavorites ? 'active' : ''}`}
                    style={showFavorites ? {
                      height: 'var(--token-button-height)',
                      padding: 'var(--token-button-padding-y) var(--token-button-padding-x)',
                      background: 'var(--token-gradient-primary)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: 'var(--token-shadow-primary)',
                      borderRadius: 'var(--token-border-radius)',
                      fontWeight: '600',
                      fontSize: 'var(--token-font-size)',
                      transition: 'var(--token-transition-default)'
                    } : {
                      height: 'var(--token-button-height)',
                      padding: 'var(--token-button-padding-y) var(--token-button-padding-x)',
                      background: '#fff',
                      color: '#333',
                      border: '1px solid #e5e7eb',
                      borderRadius: 'var(--token-border-radius)',
                      boxShadow: 'var(--token-shadow-secondary)',
                      fontWeight: 'var(--token-font-weight)',
                      fontSize: 'var(--token-font-size)',
                      transition: 'var(--token-transition-default)'
                    }}
                  >
                    <Heart className="w-5 h-5 mr-3" fill={showFavorites ? 'currentColor' : 'none'} />
                    Favorites
                    {favorites.size > 0 && (
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        showFavorites ? 'bg-white/20' : 'bg-red-100 text-red-600'
                      }`}>
                        {favorites.size}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </Card>
        </FullWidthContainer>

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
    </>
  );
}
