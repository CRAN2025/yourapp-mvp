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

        /* PRODUCT CARD v1.1 - Complete CSS from StorefrontPublic */
        .product-card-v11 {
          background: linear-gradient(135deg, #FFFFFF 0%, #FDFDFD 100%);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .product-card-v11:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .product-image-container {
          position: relative;
          overflow: hidden;
        }

        .product-image-wrapper {
          position: relative;
          width: 100%;
          height: 240px;
          overflow: hidden;
          background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .product-card-v11:hover .product-image {
          transform: scale(1.08);
        }

        .product-favorite-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .product-favorite-btn:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .product-favorite-active {
          color: #EF4444;
          fill: #EF4444;
        }

        .product-favorite-idle {
          color: #6B7280;
          fill: none;
        }

        .product-badges-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 5;
        }

        .product-badge-new {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .product-badge-limited {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .product-badge-featured {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .product-card-content {
          padding: 20px;
        }

        .product-title-section {
          margin-bottom: 12px;
        }

        .product-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
          margin: 0 0 4px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-brand {
          font-size: 13px;
          color: #6B7280;
          font-weight: 500;
          margin: 0;
        }

        .product-price-section {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .product-price {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
        }

        .product-compare-price {
          font-size: 14px;
          color: #9CA3AF;
          text-decoration: line-through;
        }

        .product-discount-badge {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: white;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .product-category-section {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .product-category-pill {
          background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
          color: #374151;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .product-cta-section {
          display: flex;
          gap: 8px;
        }

        .product-cta-primary {
          flex: 1;
          background: linear-gradient(135deg, #25D366 0%, #22C55E 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .product-cta-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
        }

        .product-cta-secondary {
          background: rgba(59, 130, 246, 0.1);
          color: #2563EB;
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .product-cta-secondary:hover {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }

        .product-cta-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

          {/* Enhanced Results Summary from StorefrontPublic */}
          {(searchQuery || categoryFilter !== 'all' || showFavorites) && (
            <div className="mb-8">
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">
                      Found {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                      {searchQuery && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Search: "{searchQuery}"
                        </Badge>
                      )}
                      {categoryFilter !== 'all' && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          Category: {categoryFilter}
                        </Badge>
                      )}
                      {showFavorites && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <Heart className="w-3 h-3 mr-1" />
                          Favorites Only
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setShowFavorites(false);
                    }}
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-semibold"
                  >
                    Clear Filters
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Product Grid from StorefrontPublic */}
          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={<Search className="h-20 w-20 text-slate-400" />}
                title={searchQuery || categoryFilter !== 'all' || showFavorites ? "No products match your filters" : "No products available"}
                description={
                  searchQuery || categoryFilter !== 'all' || showFavorites
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Add products to your catalog to see how they'll appear to customers."
                }
                action={
                  (searchQuery || categoryFilter !== 'all' || showFavorites) ? {
                    label: "Clear All Filters",
                    onClick: () => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setShowFavorites(false);
                    }
                  } : {
                    label: "Manage Products",
                    onClick: () => window.location.href = '/products',
                  }
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="product-card-v11 group cursor-pointer border-0 overflow-hidden"
                  onClick={() => handleProductView(product)}
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="product-image-container">
                    {/* Product image */}
                    <div className="product-image-wrapper">
                      <img
                        src={getProductImageUrl(product) || PLACEHOLDER_IMAGE}
                        alt={product.name}
                        className="product-image"
                        onLoad={(e) => handleImageLoad(product.id, e)}
                        onError={handleImageError}
                        loading="lazy"
                        decoding="async"
                      />
                      
                      {/* Favorite button - top right */}
                      <button
                        className="product-favorite-btn"
                        onClick={(e) => toggleFavorite(product.id, e)}
                        aria-pressed={favorites.has(product.id)}
                        data-testid={`button-favorite-${product.id}`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.has(product.id)
                              ? 'product-favorite-active'
                              : 'product-favorite-idle'
                          }`}
                        />
                      </button>

                      {/* v1.1 Product badges - top left overlay */}
                      <div className="product-badges-overlay">
                        {(Date.now() - (product.createdAt || 0)) < 7 * 24 * 60 * 60 * 1000 && (
                          <span className="product-badge-new">
                            New
                          </span>
                        )}
                        {product.quantity < 5 && (
                          <span className="product-badge-limited">
                            Limited Stock
                          </span>
                        )}
                        {product.features?.includes('featured') && (
                          <span className="product-badge-featured">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>

                    {/* v1.1 Product info with token-driven layout */}
                    <CardContent className="product-card-content">
                      {/* Product title & brand */}
                      <div className="product-title-section">
                        <h3 className="product-title">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="product-brand">
                            {product.brand}
                          </p>
                        )}
                      </div>

                      {/* Price row */}
                      <div className="product-price-section">
                        <span className="product-price">
                          {formatPrice(product.price)}
                        </span>
                        {(product as any).compareAtPrice && (product as any).compareAtPrice > product.price && (
                          <>
                            <span className="product-compare-price">
                              {formatPrice((product as any).compareAtPrice)}
                            </span>
                            <span className="product-discount-badge">
                              -{Math.round((((product as any).compareAtPrice - product.price) / (product as any).compareAtPrice) * 100)}%
                            </span>
                          </>
                        )}
                      </div>

                      {/* Category pills row - reuse global tokens */}
                      <div className="product-category-section">
                        <span className="product-category-pill">
                          📦 {product.category}
                        </span>
                        {product.subcategory && (
                          <span className="product-category-pill">
                            {product.subcategory}
                          </span>
                        )}
                      </div>

                      {/* v1.1 CTAs - Token-driven buttons */}
                      <div className="product-cta-section">
                        {/* Primary CTA - Contact Seller (Preview Mode) */}
                        {seller?.whatsappNumber ? (
                          <button
                            className="product-cta-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactProduct(product);
                            }}
                            aria-label={`Preview: Contact seller about ${product.name} on WhatsApp`}
                            data-testid={`button-whatsapp-${product.id}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            Contact Seller
                          </button>
                        ) : (
                          <button
                            className="product-cta-secondary"
                            disabled
                            data-testid={`button-whatsapp-disabled-${product.id}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp Required
                          </button>
                        )}

                        {/* Secondary CTA - View Details */}
                        <button
                          className="product-cta-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductView(product);
                          }}
                          aria-label={`View details for ${product.name}`}
                          data-testid={`button-details-${product.id}`}
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
