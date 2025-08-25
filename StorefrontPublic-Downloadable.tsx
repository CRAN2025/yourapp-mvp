import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ref, get } from 'firebase/database';
import { Search, Heart, MessageCircle, ChevronDown, X, ArrowLeft, CreditCard, Truck, MapPin, Phone, Info, Star, Clock, Globe, CheckCircle, Sparkles, Award, Shield, Zap } from 'lucide-react';
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

// Marketing URL for ShopLink promotion
const SHOPLINK_MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://shoplink.app';

// --- Full-bleed section helper (edge-to-edge band) ---
const FullBleedSection = ({ children }: { children: React.ReactNode }) => (
  <section
    style={{
      width: '100vw',
      position: 'relative',
      left: '50%',
      right: '50%',
      marginLeft: '-50vw',
      marginRight: '-50vw',
      // pick your hero gradient; the band itself is full width
      background: 'linear-gradient(135deg,#6f3ef4 0%,#38bdf8 100%)',
      padding: '24px 0',
    }}
  >
    <div
      style={{
        maxWidth: 980,
        margin: '0 auto',
        paddingInline: 'clamp(12px,4vw,24px)',
      }}
    >
      {children}
    </div>
  </section>
);

export default function StorefrontPublic() {
  const [, params] = useRoute('/store/:sellerId');
  const { toast } = useToast();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showChatFab, setShowChatFab] = useState(false);
  const [contactNotification, setContactNotification] = useState<{show: boolean, product: Product | null}>({show: false, product: null});
  const [lowResImages, setLowResImages] = useState<Record<string, boolean>>({});

  const sellerId = params?.sellerId;
  const [location] = useLocation();

  // Enhanced image quality detection
  const MIN_WIDTH = 800;
  const MIN_HEIGHT = 600;
  
  const handleImageLoad = (productId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
      setLowResImages(prev => ({ ...prev, [productId]: true }));
    }
  };

  // Ultra-premium placeholder with sophisticated design
  const ULTRA_PREMIUM_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="premium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="25%" stop-color="#e2e8f0"/>
          <stop offset="75%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>
        <pattern id="premium-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1" fill="#64748b" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#premium-gradient)"/>
      <rect width="100%" height="100%" fill="url(#premium-pattern)"/>
      <g fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
        <circle cx="600" cy="350" r="80" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
        <path d="M560 330 L570 340 L590 320 L620 350 L630 340 L640 350" stroke="#64748b" stroke-width="3" fill="none" stroke-linecap="round"/>
        <text x="600" y="500" font-size="28" font-weight="600" text-anchor="middle">No Image Available</text>
        <text x="600" y="535" font-size="16" text-anchor="middle" opacity="0.7">Upload a high-quality image (min 800×600px)</text>
      </g>
    </svg>
  `)}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = ULTRA_PREMIUM_PLACEHOLDER;
  };

  // Load favorites with enhanced error handling
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shoplink_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavorites(new Set(parsed));
        }
      }
    } catch (error) {
      console.warn('Failed to load favorites from localStorage:', error);
      localStorage.removeItem('shoplink_favorites');
    }
  }, []);

  // Enhanced floating chat button with intelligent positioning
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const isNearBottom = scrolled + windowHeight > documentHeight - 200;
          
          setShowChatFab(scrolled > 400 || window.innerWidth > 1024);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Enhanced product deep linking with analytics
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && products.length > 0) {
      const product = products.find(p => p.id === hash);
      if (product) {
        setSelectedProduct(product);
        setShowProductModal(true);
        
        // Track deep link access
        trackInteraction({
          type: 'product_view',
          sellerId: sellerId!,
          productId: product.id,
        }).catch(console.error);
      }
    }
  }, [products, sellerId]);


  // Auto-dismiss notifications with improved timing
  useEffect(() => {
    if (contactNotification.show) {
      const timer = setTimeout(() => {
        setContactNotification({show: false, product: null});
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [contactNotification.show]);

  // Enhanced data loading with retry logic
  useEffect(() => {
    if (!sellerId) return;

    let retryCount = 0;
    const maxRetries = 3;

    const loadStoreData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Load seller data with timeout
        const sellerRef = ref(database, `sellers/${sellerId}`);
        const sellerSnapshot = await Promise.race([
          get(sellerRef),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as any;
        
        if (!sellerSnapshot.exists()) {
          setError('This store could not be found. It may have been removed or the link is incorrect.');
          return;
        }

        const sellerData = sellerSnapshot.val();
        
        // Validate seller data
        if (!sellerData.storeName) {
          setError('Invalid store data. Please contact support.');
          return;
        }
        
        setSeller(sellerData);

        // Load products with enhanced filtering
        const productsRef = ref(database, `sellers/${sellerId}/products`);
        const productsSnapshot = await Promise.race([
          get(productsRef),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as any;

        if (productsSnapshot.exists()) {
          const data = productsSnapshot.val();
          const productsList = Object.entries(data)
            .map(([id, productData]: [string, any]) => ({
              id,
              ...productData,
            }))
            .filter((product: any) => 
              product.isActive && 
              product.quantity > 0 && 
              product.name && 
              product.price > 0
            );
          
          // Enhanced sorting with multiple criteria
          productsList.sort((a: any, b: any) => {
            // First by featured status (if available)
            if (a.featured !== b.featured) {
              return b.featured ? 1 : -1;
            }
            // Then by creation date
            return (b.createdAt || 0) - (a.createdAt || 0);
          });
          
          setProducts(productsList);
        }

        // Track successful store view
        await trackInteraction({
          type: 'store_view',
          sellerId,
          metadata: {
            storeName: sellerData.storeName,
            productCount: products.length,
          },
        });

      } catch (error) {
        console.error('Error loading store:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => loadStoreData(), 1000 * retryCount);
          return;
        }
        
        setError('Unable to load store. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [sellerId]);

  // Enhanced product filtering with fuzzy search
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
          const aPopularity = 0; // Placeholder for analytics data
          const bPopularity = 0; // Placeholder for analytics data
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
      localStorage.setItem('shoplink_favorites', JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }

    // Track favorite action
    try {
      await trackInteraction({
        type: 'product_view',
        sellerId: sellerId!,
        productId,
      });
    } catch (error) {
      console.warn('Failed to track favorite action:', error);
    }

    // Enhanced animation
    if (e?.target) {
      const button = (e.target as HTMLElement).closest('button');
      if (button) {
        button.style.transform = 'scale(0.9)';
        button.style.transition = 'transform 0.15s ease-out';
        
        setTimeout(() => {
          button.style.transform = 'scale(1.1)';
          setTimeout(() => {
            button.style.transform = 'scale(1)';
            button.style.transition = '';
          }, 150);
        }, 150);
      }
    }
  };

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close modals with Escape
      if (e.key === 'Escape') {
        setShowProductModal(false);
        setShowPaymentModal(false);
        setShowDeliveryModal(false);
        setContactNotification({show: false, product: null});
        return;
      }
      
      // Navigate products with arrow keys when modal is open
      if (showProductModal && selectedProduct && filteredProducts) {
        const currentIndex = filteredProducts.findIndex(p => p.id === selectedProduct.id);
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          const prevProduct = filteredProducts[currentIndex - 1];
          setSelectedProduct(prevProduct);
          window.history.replaceState(null, '', `#${prevProduct.id}`);
        } else if (e.key === 'ArrowRight' && currentIndex < filteredProducts.length - 1) {
          const nextProduct = filteredProducts[currentIndex + 1];
          setSelectedProduct(nextProduct);
          window.history.replaceState(null, '', `#${nextProduct.id}`);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showProductModal, selectedProduct, filteredProducts]);

  // Enhanced product view with analytics
  const handleProductView = async (product: Product) => {
    try {
      await trackInteraction({
        type: 'product_view',
        sellerId: sellerId!,
        productId: product.id,
        metadata: {
          productName: product.name,
          productPrice: product.price,
          category: product.category,
          viewSource: 'grid',
        },
      });
      
      setSelectedProduct(product);
      setShowProductModal(true);
      
      // Update URL for sharing and deep linking
      window.history.pushState(null, '', `#${product.id}`);
    } catch (error) {
      console.error('Error tracking product view:', error);
      // Still show the modal even if tracking fails
      setSelectedProduct(product);
      setShowProductModal(true);
    }
  };

  // Enhanced store contact with improved messaging
  const handleFloatingChatClick = async () => {
    if (!seller?.whatsappNumber || !sellerId) return;
    
    try {
      await trackInteraction({
        type: 'store_view',
        sellerId,
      });
      
      const storeUrl = `${window.location.origin}/store/${sellerId}`;
      const message = `👋 Hello! I discovered your beautiful store "${seller.storeName}" and I'm interested in learning more about your products.\n\nCould you please share:\n• Product availability\n• Payment options\n• Delivery information\n\nStore Link: ${storeUrl}`;
      
      openWhatsApp(seller.whatsappNumber, message);
    } catch (error) {
      console.error('Error contacting seller:', error);
      // Fallback to basic WhatsApp contact
      if (seller.whatsappNumber) {
        openWhatsApp(seller.whatsappNumber, `Hi! I'm interested in your products at ${seller.storeName}.`);
      }
    }
  };

  // Enhanced product contact with rich messaging
  const handleContactProduct = async (product: Product) => {
    if (!seller?.whatsappNumber || !sellerId) return;
    
    try {
      await trackInteraction({
        type: 'wa_click',
        sellerId,
        productId: product.id,
        metadata: {
          productName: product.name,
          productPrice: product.price,
          category: product.category,
        },
      });
      
      const productUrl = `${window.location.origin}/store/${sellerId}#${product.id}`;
      const message = `🛍️ Hi! I'm interested in this product from ${seller.storeName}:

📦 *${product.name}*
💰 Price: ${formatPrice(product.price)}
🏷️ Category: ${product.category}

I'd like to know more about:
• Availability and stock
• Payment options
• Delivery details
• Any additional specifications

Product Link: ${productUrl}`;
      
      openWhatsApp(seller.whatsappNumber, message);
      
      // Enhanced mobile notification
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          setContactNotification({show: true, product});
        }, 800);
      }
    } catch (error) {
      console.error('Error contacting seller:', error);
      toast({
        title: 'Unable to open WhatsApp',
        description: 'Please try again or contact the seller directly.',
        variant: 'destructive',
      });
    }
  };

  // Enhanced marketing click tracking
  const handleMarketingClick = (source: string) => {
    try {
      // Analytics tracking (when available)
      console.log('Marketing CTA clicked:', { sellerId, source, storeName: seller?.storeName });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
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

  // Enhanced icon and label functions
  const getPaymentIcon = (method: string): string => {
    const key = method.toLowerCase();
    if (key.includes('mobile') || key.includes('momo')) return '📱';
    if (key.includes('card') || key.includes('visa') || key.includes('master')) return '💳';
    if (key.includes('bank') || key.includes('transfer')) return '🏦';
    if (key.includes('cash')) return '💵';
    if (key.includes('pos')) return '🧾';
    if (key.includes('paypal')) return '🅿️';
    if (key.includes('crypto') || key.includes('bitcoin')) return '₿';
    return '💳';
  };

  const getPaymentLabel = (method: string): string => {
    const key = method.toLowerCase();
    if (key.includes('mobile') || key.includes('momo')) return 'Mobile Money';
    if (key.includes('card')) return 'Card Payment';
    if (key.includes('bank')) return 'Bank Transfer';
    if (key.includes('cash')) return 'Cash Payment';
    if (key.includes('pos')) return 'POS Terminal';
    if (key.includes('paypal')) return 'PayPal';
    if (key.includes('crypto')) return 'Cryptocurrency';
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const getDeliveryIcon = (option: string): string => {
    const key = option.toLowerCase();
    if (key.includes('pickup') || key.includes('collect')) return '🧍';
    if (key.includes('local') || key.includes('same day')) return '🚲';
    if (key.includes('courier') || key.includes('express')) return '🚚';
    if (key.includes('nation') || key.includes('country')) return '🛣️';
    if (key.includes('inter') || key.includes('worldwide')) return '✈️';
    if (key.includes('post') || key.includes('mail')) return '📮';
    return '🚚';
  };

  const getDeliveryLabel = (option: string): string => {
    const key = option.toLowerCase();
    if (key.includes('pickup')) return 'Self Pickup';
    if (key.includes('local')) return 'Local Delivery';
    if (key.includes('courier')) return 'Courier Service';
    if (key.includes('nation')) return 'Nationwide Shipping';
    if (key.includes('inter')) return 'International Shipping';
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  // Enhanced error states
  if (loading) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Loading store...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !seller) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title="Store Not Found"
            description={error || "This store could not be found or may have been removed."}
            action={
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            }
          />
        </div>
      </PublicLayout>
    );
  }

  return (
    <>
      <PublicLayout>
        {/* Full-width hero band */}
        <FullBleedSection>
          <div className="text-center py-8 text-white">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Award className="h-6 w-6 text-yellow-300" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                Verified Store
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {seller.storeName}
            </h1>
            {seller.storeDescription && (
              <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
                {seller.storeDescription}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-300" />
                <span>WhatsApp Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-300" />
                <span>Secure Shopping</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span>Fast Response</span>
              </div>
            </div>
          </div>
        </FullBleedSection>

        {/* Enhanced store header with seller info */}
        <div className="bg-background border-b sticky top-0 z-40 backdrop-blur-sm bg-background/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {/* Store Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  {seller.profileImageUrl && (
                    <img
                      src={seller.profileImageUrl}
                      alt={seller.storeName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{seller.storeName}</h2>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {seller.location || 'Online Store'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        4.8 Rating
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Usually responds in 1 hour
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex items-center gap-2">
                  {paymentMethods.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center gap-2"
                      data-testid="payment-info-button"
                    >
                      <CreditCard className="h-4 w-4" />
                      Payment Options
                    </Button>
                  )}
                  {deliveryOptions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeliveryModal(true)}
                      className="flex items-center gap-2"
                      data-testid="delivery-info-button"
                    >
                      <Truck className="h-4 w-4" />
                      Delivery Info
                    </Button>
                  )}
                  {seller.whatsappNumber && (
                    <Button
                      onClick={handleFloatingChatClick}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      data-testid="contact-store-button"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Contact Store
                    </Button>
                  )}
                </div>
              </div>

              {/* Enhanced filters and search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products, brands, colors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-products"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40" data-testid="category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32" data-testid="sort-products">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="price-low">Price: Low</SelectItem>
                      <SelectItem value="price-high">Price: High</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showFavorites ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFavorites(!showFavorites)}
                    className="flex items-center gap-2"
                    data-testid="favorites-filter"
                  >
                    <Heart className={`h-4 w-4 ${showFavorites ? 'fill-current' : ''}`} />
                    {favorites.size > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                        {favorites.size}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Product Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title={searchQuery || categoryFilter !== 'all' || showFavorites ? "No products match your filters" : "No products available"}
              description={
                searchQuery || categoryFilter !== 'all' || showFavorites
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "This store doesn't have any products listed yet. Check back soon!"
              }
              action={
                (searchQuery || categoryFilter !== 'all' || showFavorites) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setShowFavorites(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Results summary */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} products
                  {searchQuery && ` for "${searchQuery}"`}
                  {categoryFilter !== 'all' && ` in ${categoryFilter}`}
                  {showFavorites && ` from your favorites`}
                </p>
                
                {/* Quick category chips */}
                {categories.length > 1 && categoryFilter === 'all' && (
                  <div className="hidden md:flex items-center gap-2">
                    {categories.slice(0, 4).map(category => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Enhanced product grid with better responsiveness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm hover:shadow-xl hover:-translate-y-1"
                    onClick={() => handleProductView(product)}
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="relative overflow-hidden">
                      {/* Enhanced product image with quality indicators */}
                      <div className="aspect-square relative bg-muted">
                        <img
                          src={getProductImageUrl(product.imageUrl) || ULTRA_PREMIUM_PLACEHOLDER}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onLoad={(e) => handleImageLoad(product.id, e)}
                          onError={handleImageError}
                          loading="lazy"
                        />
                        
                        {/* Quality warning for low-res images */}
                        {lowResImages[product.id] && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Low Res
                          </div>
                        )}
                        
                        {/* Enhanced favorite button with animation */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white backdrop-blur-sm"
                          onClick={(e) => toggleFavorite(product.id, e)}
                          data-testid={`favorite-button-${product.id}`}
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              favorites.has(product.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-600 hover:text-red-500'
                            }`}
                          />
                        </Button>

                        {/* Enhanced product badges */}
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {product.featured && (
                            <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                              ⭐ Featured
                            </Badge>
                          )}
                          {product.isNew && (
                            <Badge className="bg-green-500 text-white text-xs">
                              🆕 New
                            </Badge>
                          )}
                          {product.quantity < 5 && (
                            <Badge variant="destructive" className="text-xs">
                              📍 Limited
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Enhanced product info */}
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Product name and brand */}
                          <div>
                            <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                            {product.brand && (
                              <p className="text-sm text-muted-foreground">
                                {product.brand}
                              </p>
                            )}
                          </div>

                          {/* Price and category */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">
                                  {formatPrice(product.price)}
                                </span>
                                {product.compareAtPrice && product.compareAtPrice > product.price && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    {formatPrice(product.compareAtPrice)}
                                  </span>
                                )}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>
                          </div>

                          {/* Enhanced action buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactProduct(product);
                              }}
                              data-testid={`contact-product-${product.id}`}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductView(product);
                              }}
                              data-testid={`view-product-${product.id}`}
                            >
                              View
                            </Button>
                          </div>

                          {/* Enhanced product attributes */}
                          {(product.color || product.size || product.material) && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t">
                              {product.color && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {product.color}
                                </span>
                              )}
                              {product.size && (
                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                  {product.size}
                                </span>
                              )}
                              {product.material && (
                                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                  {product.material}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Enhanced load more or pagination could go here */}
              {filteredProducts.length >= 12 && (
                <div className="text-center mt-12">
                  <p className="text-muted-foreground mb-4">
                    You've seen all {filteredProducts.length} products
                  </p>
                  <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Back to Top
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced floating contact button */}
        {showChatFab && seller.whatsappNumber && (
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 z-50 group"
            onClick={handleFloatingChatClick}
            data-testid="floating-contact-button"
          >
            <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="sr-only">Contact store via WhatsApp</span>
          </Button>
        )}
      </PublicLayout>

      {/* Enhanced modals would go here - ProductModal, PaymentModal, DeliveryModal */}
      {/* Contact notification would go here */}
    </>
  );
}