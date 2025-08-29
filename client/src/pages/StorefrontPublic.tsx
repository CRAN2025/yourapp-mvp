import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ref, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Search, Heart, MessageCircle, ChevronDown, X, ArrowLeft, CreditCard, Truck, MapPin, Phone, Info, Star, Clock, Globe, CheckCircle, Sparkles, Award, Shield, Zap } from 'lucide-react';
import { database, auth as primaryAuth } from '@/lib/firebase';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import { trackInteraction } from '@/lib/utils/analytics';
import { openWhatsApp, createWhatsAppMessage } from '@/lib/utils/whatsapp';
import { ensureAnonymousEventsAuth } from '@/lib/firebaseEvents';
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

// --- Full-bleed section helper ---
const FullBleedSection = ({ children }: { children: React.ReactNode }) => (
  <section className="w-full bg-blue-600 text-white py-6">
    <div className="max-w-4xl mx-auto px-4">
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
  const [isOwner, setIsOwner] = useState(false);

  const sellerId = params?.sellerId;
  const [location] = useLocation();

  // Owner detection and anonymous authentication for events
  useEffect(() => {
    // 2A) Isolate analytics auth (secondary app)
    ensureAnonymousEventsAuth();
    
    // 2B) Detect owner on primary app (no anon sign-in here)
    const unsubscribe = onAuthStateChanged(primaryAuth, (user) => {
      setIsOwner(!!user && user.uid === sellerId);
    });
    
    return () => unsubscribe();
  }, [sellerId]);

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
  const favKey = useMemo(() => `shoplink_favorites_${sellerId}`, [sellerId]);

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

  // Deep link: open product modal if URL has #productId
  useEffect(() => {
    if (!filteredProducts?.length) return;
    const id = window.location.hash?.slice(1);
    if (!id) return;
    const product = filteredProducts.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
      setShowProductModal(true);
      
      // Track deep link access
      trackInteraction({
        type: 'product_view',
        sellerId: sellerId!,
        productId: product.id,
        metadata: { source: 'deeplink' },
      }).catch(console.error);
    }
  }, [filteredProducts, sellerId]);

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
      if (showProductModal && selectedProduct) {
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

        // Load seller data from public store with timeout
        const sellerRef = ref(database, `publicStores/${sellerId}/profile`);
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

        // Load products from public store with enhanced filtering
        const productsRef = ref(database, `publicStores/${sellerId}/products`);
        const productsSnapshot = await Promise.race([
          get(productsRef),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as any;

        let productsList: any[] = [];
        if (productsSnapshot.exists()) {
          const data = productsSnapshot.val();
          productsList = Object.entries(data)
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
            productCount: productsList.length,
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

    // Track favorite action
    try {
      await trackInteraction({
        type: 'product_view',
        sellerId: sellerId!,
        productId,
        metadata: { action: isAdding ? 'favorite_add' : 'favorite_remove' },
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
        type: 'wa_click',
        sellerId,
        metadata: { action: 'store_contact', source: 'floating_button' },
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
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'marketing_cta_click', { 
          sellerId, 
          source,
          store_name: seller?.storeName 
        });
      }
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
    if (key.includes('post')) return 'Postal Service';
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <h2 className="text-xl font-semibold text-gray-800">
            Loading Store
          </h2>
          <p className="text-gray-600">
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-md">
            <Globe className="w-8 h-8 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Store Not Found</h2>
            <p className="text-gray-600">
              {error || "This store could not be found or may have been removed."}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced CSS Animations */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-fadeInScale {
          animation: fadeInScale 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .bg-mesh {
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 bg-mesh">
        {/* ===== Header / Banner (FULL-BLEED) ===== */}
        <FullBleedSection>
          <div className="mx-auto max-w-3xl md:max-w-4xl bg-white/95 rounded-2xl shadow-xl overflow-hidden">
            {/* Optional banner (falls back to gradient) */}
            <div
              className="h-40 md:h-48 w-full"
              style={{
                background: seller?.coverUrl
                  ? `url(${seller.coverUrl}) center/cover no-repeat`
                  : 'linear-gradient(135deg,#c7d2fe 0%,#bae6fd 60%,#ccfbf1 100%)',
              }}
            />

            <div className="px-[clamp(12px,4vw,24px)] pb-6 -mt-8">
              {/* Header row */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-cyan-400 border-4 border-white shadow-md flex items-center justify-center text-2xl">
                  {seller?.logoUrl ? (
                    <img
                      src={seller.logoUrl}
                      alt={seller.storeName}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : '🛍️'}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold truncate">
                    {seller.storeName}
                  </h1>
                  <p className="text-muted-foreground truncate">
                    {seller.location || 'Online Store'}
                  </p>
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {!!paymentMethods.length && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-3 py-2 rounded-full border text-sm bg-indigo-50 border-indigo-100"
                    title="View payment methods"
                  >
                    💳 {paymentMethods.length} Payment Methods
                  </button>
                )}
                {!!deliveryOptions.length && (
                  <button
                    onClick={() => setShowDeliveryModal(true)}
                    className="px-3 py-2 rounded-full border text-sm bg-cyan-50 border-cyan-100"
                    title="View delivery options"
                  >
                    🚚 {deliveryOptions.length} Delivery Options
                  </button>
                )}
                {seller.currency && (
                  <span className="px-3 py-2 rounded-full border text-sm bg-slate-50 border-slate-200">
                    🌐 {seller.currency} Currency
                  </span>
                )}
              </div>

              {/* Description */}
              {seller.storeDescription && (
                <p className="mt-3 text-slate-700 line-clamp-2">{seller.storeDescription}</p>
              )}

              {/* Owner read-only view vs buyer CTAs */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {isOwner ? (
                  <a 
                    href="/products" 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-decoration-none cursor-pointer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(99,102,241,0.12)',
                      color: '#6366f1',
                      padding: '8px 16px',
                      borderRadius: 999,
                      fontWeight: 700,
                      border: '1px solid rgba(0,0,0,0.08)',
                      textDecoration: 'none'
                    }}
                  >
                    ← Back to dashboard
                  </a>
                ) : (
                  <>
                    {seller.whatsappNumber && (
                      <button
                        onClick={handleFloatingChatClick}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(37,211,102,0.12)',
                          color: '#25D366',
                          padding: '8px 16px',
                          borderRadius: 999,
                          fontWeight: 700,
                          border: '1px solid rgba(0,0,0,0.08)',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat with seller on WhatsApp
                      </button>
                    )}
                    <a
                      href={`${SHOPLINK_MARKETING_URL}?utm_source=storefront&utm_medium=header_badge&utm_campaign=public_cta&seller=${sellerId}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => handleMarketingClick('hero')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(59,130,246,0.12)',
                        color: '#3b82f6',
                        padding: '8px 16px',
                        borderRadius: 999,
                        fontWeight: 700,
                        border: '1px solid rgba(0,0,0,0.08)',
                        textDecoration: 'none'
                      }}
                    >
                      ✨ Create your free store
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </FullBleedSection>

        {/* Enhanced Search and Filters */}
        <div className="mx-auto max-w-7xl py-8" style={{
          paddingInline: 'clamp(12px, 4vw, 24px)',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))'
        }}>
          <Card className="p-8 mb-10 bg-white/90 backdrop-blur-xl shadow-2xl border-0 rounded-3xl">
            <div className="space-y-8">
              {/* Premium Search Bar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-10 transition-all duration-500"></div>
                <Search className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                <Input
                  type="text"
                  placeholder="Search for products, brands, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-6 h-16 text-lg border-3 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400"
                  data-testid="input-search-products"
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

              {/* Enhanced Filters */}
              <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
                {/* Category Pills */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-blue-600" />
                      Categories
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant={categoryFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryFilter('all')}
                      className="rounded-full px-6 py-3 font-bold transition-all duration-300 hover:scale-105"
                    >
                      All Categories ({products.length})
                    </Button>
                    {categories.slice(0, 6).map(category => {
                      const count = products.filter(p => p.category === category).length;
                      return (
                        <Button
                          key={category}
                          variant={categoryFilter === category ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCategoryFilter(category)}
                          className="rounded-full px-6 py-3 font-bold transition-all duration-300 hover:scale-105"
                        >
                          {category} ({count})
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Controls */}
                <div className="flex gap-4 items-center flex-wrap">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 font-semibold">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-slate-200">
                      <SelectItem value="newest">🆕 Newest First</SelectItem>
                      <SelectItem value="popular">🔥 Most Popular</SelectItem>
                      <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                      <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                      <SelectItem value="name">📝 Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showFavorites ? "default" : "outline"}
                    size="lg"
                    onClick={() => setShowFavorites(!showFavorites)}
                    className="h-12 px-6 rounded-xl border-2 border-slate-200 font-bold transition-all duration-300 hover:scale-105"
                    data-testid="button-toggle-favorites"
                  >
                    <Heart className={`w-5 h-5 mr-2 ${showFavorites ? 'fill-current text-red-500' : 'text-slate-400'}`} />
                    Favorites {favorites.size > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                        {favorites.size}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Results Summary */}
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

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={<Search className="h-20 w-20 text-slate-400" />}
                title={searchQuery || categoryFilter !== 'all' || showFavorites ? "No products match your filters" : "No products available"}
                description={
                  searchQuery || categoryFilter !== 'all' || showFavorites
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "This store doesn't have any products listed yet. Check back soon!"
                }
                action={
                  (searchQuery || categoryFilter !== 'all' || showFavorites) ? {
                    label: "Clear All Filters",
                    onClick: () => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setShowFavorites(false);
                    }
                  } : undefined
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border rounded-lg overflow-hidden"
                  onClick={() => handleProductView(product)}
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="relative overflow-hidden">
                    {/* Product image */}
                    <div className="aspect-square relative bg-gray-100">
                      <img
                        src={getProductImageUrl(product) || PLACEHOLDER_IMAGE}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onLoad={(e) => handleImageLoad(product.id, e)}
                        onError={handleImageError}
                        loading="lazy"
                      />
                      
                      {/* Quality warning */}
                      {lowResImages[product.id] && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Low Res
                        </div>
                      )}
                      
                      {/* Favorite button - hidden for owners */}
                      {!isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0 bg-white hover:bg-gray-50 rounded-full shadow-md"
                          onClick={(e) => toggleFavorite(product.id, e)}
                          data-testid={`button-favorite-${product.id}`}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favorites.has(product.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-slate-600 hover:text-red-500'
                            }`}
                          />
                        </Button>
                      )}

                      {/* Product badges */}
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {product.features?.includes('featured') && (
                          <Badge className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                            ⭐ Featured
                          </Badge>
                        )}
                        {(Date.now() - (product.createdAt || 0)) < 7 * 24 * 60 * 60 * 1000 && (
                          <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                            🆕 New
                          </Badge>
                        )}
                        {product.quantity < 5 && (
                          <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                            📍 Limited
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Product info */}
                    <CardContent className="p-4 space-y-3">
                      {/* Product name and brand */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-base line-clamp-2">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-500 uppercase">
                            {product.brand}
                          </p>
                        )}
                      </div>

                      {/* Price and category */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-green-600">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-xs">
                                📦 {product.category}
                              </Badge>
                              {product.subcategory && (
                                <Badge variant="outline" className="text-xs">
                                  {product.subcategory}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons - different for owners vs buyers */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        {isOwner ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border border-gray-200 hover:bg-gray-50 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductView(product);
                            }}
                            data-testid={`button-view-${product.id}`}
                          >
                            View Details
                          </Button>
                        ) : (
                          <>
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactProduct(product);
                              }}
                              data-testid={`button-contact-${product.id}`}
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
                              className="px-4 border border-gray-200 hover:bg-gray-50 rounded-md"
                              data-testid={`button-view-${product.id}`}
                            >
                              View
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Stock indicator for limited stock */}
                      {product.quantity <= 10 && (
                        <div className="pt-2 border-t border-gray-100">
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ Limited Stock — Only {product.quantity} Left
                          </Badge>
                        </div>
                      )}

                      {/* Product attributes and badges */}
                      {(product.color || product.size || product.material || product.isHandmade || product.isCustomizable || product.sustainability) && (
                        <div className="flex flex-wrap gap-1 pt-3 border-t border-gray-100">
                          {product.color && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                              🎨 {product.color}
                            </span>
                          )}
                          {product.size && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
                              📏 {product.size}
                            </span>
                          )}
                          {product.material && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                              🧵 {product.material}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Special feature badges */}
                      {(product.isHandmade || product.isCustomizable || product.sustainability) && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {product.isHandmade && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              🎨 Handmade
                            </Badge>
                          )}
                          {product.isCustomizable && (
                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              ⚙️ Customizable
                            </Badge>
                          )}
                          {product.sustainability && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              🌱 {product.sustainability}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Load more or pagination */}
          {filteredProducts.length >= 20 && (
            <div className="text-center mt-16">
              <Card className="inline-block p-8 bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-3xl">
                <p className="text-slate-600 mb-6 text-lg font-semibold">
                  You've seen all {filteredProducts.length} products
                </p>
                <Button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 mr-3 rotate-90" />
                  Back to Top
                </Button>
              </Card>
            </div>
          )}
        </div>

        {/* Enhanced floating contact button */}
        {showChatFab && seller.whatsappNumber && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button
              onClick={handleFloatingChatClick}
              className="h-16 w-16 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
              data-testid="button-floating-contact"
            >
              <MessageCircle className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
              <span className="sr-only">Contact store via WhatsApp</span>
            </Button>
            
            {/* Floating tooltip */}
            <div className="absolute bottom-20 right-0 bg-black/90 text-white px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
              💬 Chat with {seller.storeName}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
            </div>
          </div>
        )}

        {/* Enhanced contact notification */}
        {contactNotification.show && contactNotification.product && (
          <div className="fixed top-24 right-8 z-50 max-w-sm animate-fadeInScale">
            <Card className="p-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-2xl border-0 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg">WhatsApp Opening...</h4>
                  <p className="text-sm opacity-90 line-clamp-2">
                    Contacted seller about "{contactNotification.product.name}"
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setContactNotification({show: false, product: null})}
                  className="text-white hover:bg-white/20 rounded-full p-2 h-8 w-8 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        {/* Ultra-Premium Payment Methods Modal */}
        {showPaymentModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4" 
            onClick={() => setShowPaymentModal(false)}
          >
            <Card 
              className="max-w-lg w-full bg-white shadow-2xl border-0 rounded-3xl animate-fadeInScale overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    Payment Methods
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowPaymentModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 h-10 w-10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-8">
                <div className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-slate-200">
                        {getPaymentIcon(method)}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 text-lg">{getPaymentLabel(method)}</span>
                        <p className="text-sm text-slate-600">Secure payment processing</p>
                      </div>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && (
                    <div className="text-center py-12">
                      <Info className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                      <h4 className="text-xl font-bold text-slate-800 mb-3">Payment Details Available</h4>
                      <p className="text-slate-600 leading-relaxed">
                        Payment methods and details will be shared when you contact the seller directly.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Ultra-Premium Delivery Options Modal */}
        {showDeliveryModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4" 
            onClick={() => setShowDeliveryModal(false)}
          >
            <Card 
              className="max-w-lg w-full bg-white shadow-2xl border-0 rounded-3xl animate-fadeInScale overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Truck className="w-7 h-7 text-white" />
                    </div>
                    Delivery Options
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDeliveryModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 h-10 w-10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-8">
                <div className="space-y-4">
                  {deliveryOptions.map((option, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-slate-200">
                        {getDeliveryIcon(option)}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 text-lg">{getDeliveryLabel(option)}</span>
                        <p className="text-sm text-slate-600">Fast and reliable delivery</p>
                      </div>
                    </div>
                  ))}
                  {deliveryOptions.length === 0 && (
                    <div className="text-center py-12">
                      <Info className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                      <h4 className="text-xl font-bold text-slate-800 mb-3">Delivery Info Available</h4>
                      <p className="text-slate-600 leading-relaxed">
                        Delivery options and costs will be discussed when you contact the seller.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Ultra-Premium Product Detail Modal */}
        {showProductModal && selectedProduct && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4" 
            onClick={() => setShowProductModal(false)}
          >
            <Card 
              className="max-w-5xl w-full max-h-[95vh] overflow-y-auto bg-white shadow-2xl border-0 rounded-3xl animate-fadeInScale" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ultra-Premium Product Image Header */}
              <div className="relative">
                <div className="aspect-[16/9] relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-slate-100 to-slate-50">
                  <img
                    src={getProductImageUrl(selectedProduct) || PLACEHOLDER_IMAGE}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onLoad={(e) => handleImageLoad(selectedProduct.id, e)}
                    onError={handleImageError}
                  />
                  
                  {/* Enhanced overlay with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  
                  {/* Premium quality warning */}
                  {lowResImages[selectedProduct.id] && (
                    <div className="absolute top-6 left-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-full font-bold text-sm shadow-2xl">
                      ⚠️ Low Quality Image - Upload HD for better results
                    </div>
                  )}
                  
                  {/* Enhanced Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProductModal(false)}
                    className="absolute top-6 right-6 w-14 h-14 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <X className="w-7 h-7" />
                  </Button>
                  
                  {/* Enhanced Favorite Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                    className={`absolute top-6 left-6 w-14 h-14 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110 ${
                      favorites.has(selectedProduct.id) ? 'text-red-500' : 'text-slate-600'
                    }`}
                  >
                    <Heart 
                      className="w-7 h-7" 
                      fill={favorites.has(selectedProduct.id) ? 'currentColor' : 'none'} 
                    />
                  </Button>

                  {/* Navigation Arrows */}
                  {filteredProducts.length > 1 && (
                    <>
                      {filteredProducts.findIndex(p => p.id === selectedProduct.id) > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const currentIndex = filteredProducts.findIndex(p => p.id === selectedProduct.id);
                            const prevProduct = filteredProducts[currentIndex - 1];
                            setSelectedProduct(prevProduct);
                            window.history.replaceState(null, '', `#${prevProduct.id}`);
                          }}
                          className="absolute left-1/2 top-1/2 transform -translate-x-20 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110"
                        >
                          <ChevronDown className="w-7 h-7 rotate-90" />
                        </Button>
                      )}
                      
                      {filteredProducts.findIndex(p => p.id === selectedProduct.id) < filteredProducts.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const currentIndex = filteredProducts.findIndex(p => p.id === selectedProduct.id);
                            const nextProduct = filteredProducts[currentIndex + 1];
                            setSelectedProduct(nextProduct);
                            window.history.replaceState(null, '', `#${nextProduct.id}`);
                          }}
                          className="absolute left-1/2 top-1/2 transform translate-x-6 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110"
                        >
                          <ChevronDown className="w-7 h-7 -rotate-90" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Product Details */}
              <CardContent className="p-6 space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-3">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                          {selectedProduct.name}
                        </h2>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="secondary" className="px-3 py-1">
                            📦 {selectedProduct.category}
                          </Badge>
                          {(selectedProduct as any).subcategory && (
                            <Badge variant="outline" className="px-3 py-1">
                              {(selectedProduct as any).subcategory}
                            </Badge>
                          )}
                          {(Date.now() - (selectedProduct.createdAt || 0)) < 7 * 24 * 60 * 60 * 1000 && (
                            <Badge className="bg-green-500 text-white px-3 py-1">
                              🆕 NEW ARRIVAL
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:text-right space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold text-green-600">
                        {formatPrice(selectedProduct.price)}
                      </div>
                      <div className="text-sm text-gray-500">per unit</div>
                    </div>
                  </div>
                  
                  {/* Stock Status */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className={`w-6 h-6 rounded-full shadow-lg ${
                      selectedProduct.quantity > 10 ? 'bg-emerald-500' :
                      selectedProduct.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <div className="w-full h-full rounded-full animate-pulse opacity-50"></div>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-lg text-gray-800">
                        {selectedProduct.quantity > 10 ? '✅ In Stock & Ready to Ship' :
                         selectedProduct.quantity > 0 ? `⚠️ Limited Stock - Only ${selectedProduct.quantity} Left` : 
                         '❌ Currently Out of Stock'}
                      </span>
                      <p className="text-gray-600 mt-1 text-sm">
                        {selectedProduct.quantity > 0 
                          ? `${selectedProduct.quantity} ${selectedProduct.quantity === 1 ? 'unit' : 'units'} available for immediate purchase`
                          : 'Contact seller for restocking information'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Description
                    </h3>
                    <p className="text-gray-600 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
                
                {/* Product Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: 'Brand', value: selectedProduct.brand, icon: '🏷️' },
                    { label: 'Condition', value: selectedProduct.condition, icon: '⭐' },
                    { label: 'Size', value: selectedProduct.size, icon: '📏' },
                    { label: 'Color', value: selectedProduct.color, icon: '🎨' },
                    { label: 'Material', value: selectedProduct.material, icon: '🧵' },
                    { label: 'Chain Length', value: (selectedProduct as any).chainLength, icon: '📐' },
                    { label: 'Pendant Size', value: (selectedProduct as any).pendantSize, icon: '💎' },
                    { label: 'Processing Time', value: (selectedProduct as any).processingTime, icon: '⏱️' },
                    { label: 'Ships From', value: (selectedProduct as any).shipsFrom, icon: '✈️' },
                    { label: 'Occasion', value: (selectedProduct as any).occasion, icon: '🎉' },
                    { label: 'Age Group', value: (selectedProduct as any).targetAgeGroup, icon: '👥' },
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-sm font-medium text-gray-500 uppercase">
                          {item.label}
                        </span>
                      </div>
                      <p className="font-semibold text-lg text-gray-800 capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Additional Information Sections */}
                <div className="space-y-6">
                  {/* Personalization Options */}
                  {(selectedProduct as any).personalizationOptions && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">✏️</span>
                        Personalization Options
                      </h3>
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <p className="text-gray-700">{(selectedProduct as any).personalizationOptions}</p>
                      </div>
                    </div>
                  )}

                  {/* Care Instructions */}
                  {(selectedProduct as any).careInstructions && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🧼</span>
                        Care Instructions
                      </h3>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-gray-700">{(selectedProduct as any).careInstructions}</p>
                      </div>
                    </div>
                  )}

                  {/* Sustainability */}
                  {(selectedProduct as any).sustainability && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🌱</span>
                        Sustainability
                      </h3>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-gray-700">{(selectedProduct as any).sustainability}</p>
                      </div>
                    </div>
                  )}

                  {/* Warranty */}
                  {(selectedProduct as any).warranty && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🛡️</span>
                        Warranty
                      </h3>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-gray-700">{(selectedProduct as any).warranty}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Special Features */}
                {((selectedProduct as any).isHandmade || (selectedProduct as any).isCustomizable || (selectedProduct as any).madeToOrder || (selectedProduct as any).giftWrapping) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Special Features
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(selectedProduct as any).isHandmade && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl">🎨</div>
                          <div>
                            <span className="font-bold text-orange-800">Handmade</span>
                            <p className="text-sm text-orange-600">Crafted with care by skilled artisans</p>
                          </div>
                        </div>
                      )}
                      {(selectedProduct as any).isCustomizable && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">⚙️</div>
                          <div>
                            <span className="font-bold text-blue-800">Customizable</span>
                            <p className="text-sm text-blue-600">Can be personalized to your preferences</p>
                          </div>
                        </div>
                      )}
                      {(selectedProduct as any).madeToOrder && (
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-2xl">📋</div>
                          <div>
                            <span className="font-bold text-purple-800">Made to Order</span>
                            <p className="text-sm text-purple-600">Specially created just for you</p>
                          </div>
                        </div>
                      )}
                      {(selectedProduct as any).giftWrapping && (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">🎁</div>
                          <div>
                            <span className="font-bold text-green-800">Gift Wrapping</span>
                            <p className="text-sm text-green-600">Beautiful packaging available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Ultra-Premium Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t-2 border-slate-200">
                  <Button
                    onClick={() => handleContactProduct(selectedProduct)}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 py-6 text-xl font-bold rounded-2xl"
                    size="lg"
                  >
                    <MessageCircle className="w-7 h-7 mr-4" />
                    Contact Seller on WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                    className="sm:px-12 py-6 border-3 hover:bg-red-50 hover:border-red-300 rounded-2xl transition-all duration-300 hover:scale-105 font-bold text-lg"
                    size="lg"
                  >
                    <Heart 
                      className={`w-7 h-7 mr-3 ${favorites.has(selectedProduct.id) ? 'fill-current text-red-500' : 'text-slate-400'}`} 
                    />
                    <span>
                      {favorites.has(selectedProduct.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                    </span>
                  </Button>
                </div>

                {/* Product Navigation */}
                {filteredProducts.length > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <span className="text-slate-600 font-semibold">
                      Product {filteredProducts.findIndex(p => p.id === selectedProduct.id) + 1} of {filteredProducts.length}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-sm text-slate-500">Use ← → arrow keys to navigate</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}