import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { ref, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Search, Heart, MessageCircle, ChevronDown, X, ArrowLeft, CreditCard, Truck, MapPin, Phone, Info, Star, Clock, Globe, CheckCircle, Sparkles, Award, Shield, Zap, Share2, UserPlus, Filter, Instagram, Facebook } from 'lucide-react';
import StoreHeader from '@/components/StoreHeader';
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
import logoUrl from '@/assets/logo.png';

// Marketing URL for ShopLink promotion
const SHOPLINK_MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://shoplink.app';

// Landing page design system constants
const _ui = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0', gap: '24px' },
  ctaPrimary: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    height: '52px',
    padding: '0 24px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '16px',
    color: '#fff',
    background: 'linear-gradient(135deg,#5a6bff 0%, #67d1ff 100%)',
    backgroundSize: '180% 100%',
    backgroundPosition: '0% 50%',
    boxShadow: '0 12px 30px rgba(90,107,255,.28)',
    transition: 'background-position .2s ease, box-shadow .15s ease',
    textDecoration: 'none'
  }
};

// Brand wordmark styling matching landing page
const _brand = {
  link: { display: 'inline-block', textDecoration: 'none' as const, padding: '10px 0' },
  text: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    fontWeight: 700,
    letterSpacing: '-0.01em',
    fontSize: 'clamp(24px, 2.05vw, 30px)',
    lineHeight: 1.05,
    whiteSpace: 'nowrap' as const,
    background: 'linear-gradient(90deg,#3A49FF 0%, #1873FF 100%)',
    WebkitBackgroundClip: 'text', 
    backgroundClip: 'text', 
    color: 'transparent',
    textShadow: '0 1px 0 rgba(0,0,0,0.06)'
  }
};

// Category icon helper function
const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    'Electronics': '📱',
    'Clothing': '👕',
    'Jewelry': '💍',
    'Home & Garden': '🏡',
    'Books': '📚',
    'Sports': '⚽',
    'Beauty': '💄',
    'Toys': '🧸',
    'Food': '🍎',
    'Health': '💊',
    'Art': '🎨',
    'Music': '🎵',
    'Automotive': '🚗',
    'Travel': '✈️',
    'Photography': '📸',
    'Fashion': '👗',
    'Accessories': '👜',
    'Footwear': '👟',
    'Watches': '⌚',
    'Gaming': '🎮',
    'Furniture': '🪑',
    'Appliances': '🔌',
    'Tools': '🔧',
    'Office': '📊',
    'Kids': '🧒',
    'Pet Supplies': '🐾',
    'Outdoor': '🏕️',
    'Crafts': '✂️',
    'Vintage': '🕰️',
    'Handmade': '🤲'
  };
  return iconMap[category] || '📦';
};

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
  // Removed showChatFab state - floating FAB removed per v1.3.1_UI_UX_WHATSAPP_PER_CARD
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

  // Track WhatsApp CTA views for analytics per v1.3.1_UI_UX_WHATSAPP_PER_CARD
  const trackWhatsAppView = async (productId: string) => {
    if (!sellerId || !seller?.whatsappNumber) return;
    
    try {
      await trackInteraction({
        type: 'wa_click',
        sellerId,
        productId,
        metadata: { location: 'card', action: 'whatsapp_cta_viewed' },
      });
    } catch (error) {
      console.warn('Failed to track WhatsApp CTA view:', error);
    }
  };

  // Removed floating chat button logic per v1.3.1_UI_UX_WHATSAPP_PER_CARD specification
  // All WhatsApp functionality moved to per-card buttons



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

  // Enhanced product contact with comprehensive analytics and messaging per v1.3.1_UI_UX_WHATSAPP_PER_CARD
  const handleContactProduct = async (product: Product) => {
    if (!seller?.whatsappNumber || !sellerId) {
      // Track blocked attempt for analytics
      try {
        await trackInteraction({
          type: 'wa_click',
          sellerId: sellerId!,
          productId: product.id,
          metadata: { location: 'card', action: 'whatsapp_cta_missing_number', reason: 'no_whatsapp_number' },
        });
      } catch (error) {
        console.warn('Failed to track blocked WhatsApp attempt:', error);
      }
      return;
    }
    
    try {
      // Enhanced analytics tracking per specification
      await trackInteraction({
        type: 'wa_click',
        sellerId,
        productId: product.id,
        metadata: {
          location: 'card',
          action: 'whatsapp_cta_clicked',
          productName: product.name,
          productPrice: product.price,
          category: product.category,
          sellerName: seller.fullName || seller.storeName,
        },
      });
      
      // Enhanced pre-filled message with seller first name
      const sellerFirstName = seller.fullName?.split(' ')[0] || seller.storeName;
      const productUrl = `${window.location.origin}/store/${sellerId}#${product.id}`;
      const message = `Hi ${sellerFirstName}, I'm interested in "${product.name}" on ShopLynk.

${productUrl}`;
      
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
        
        /* Perfect landing page icy gradient with cool palette */
        .bg-mesh {
          background: linear-gradient(135deg, #F9FBFF 0%, #F3F7FF 100%);
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(96, 165, 250, 0.05) 0%, transparent 50%);
        }
        
        /* GLOBAL CTA BUTTON STANDARD v2.1 (LOCKED) */
        /* Use across all ShopLynk components for primary actions */
        .primary-button-gradient {
          background: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
          box-shadow: 0 6px 18px rgba(80, 155, 255, 0.45);
          border-radius: 14px;
          padding: 14px 28px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.3px;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease-in-out;
        }
        
        .primary-button-gradient:hover {
          background: linear-gradient(135deg, #5ABFFF 0%, #5F7AFF 100%);
          transform: scale(1.03);
          box-shadow: 0 8px 24px rgba(80, 155, 255, 0.55);
        }
        
        .primary-button-gradient:active {
          transform: scale(0.98);
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
        
        .category-pill .icon {
          width: var(--icon-size);
          height: var(--icon-size);
          flex: 0 0 var(--icon-size);
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
        
        .category-pill.active:hover {
          transform: scale(var(--token-hover-scale));
          box-shadow: var(--token-shadow-primary-hover);
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
        
        .filter-pill-active:hover {
          transform: scale(var(--token-hover-scale));
          box-shadow: var(--token-shadow-primary-hover);
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
        /* Universal component tokens for categories, filters, favorites, and CTAs */
        :root {
          /* Primary gradient token - used for active pills & CTAs */
          --token-gradient-primary: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
          
          /* Button heights & spacing - uniform across all components */
          --token-button-height: 36px;
          --token-button-padding-x: 16px;
          --token-button-padding-y: 8px;
          
          /* Shadows & elevation hierarchy */
          --token-shadow-primary: 0px 5px 18px rgba(80, 155, 255, 0.45);
          --token-shadow-primary-hover: 0px 7px 20px rgba(80, 155, 255, 0.55);
          --token-shadow-secondary: 0px 2px 6px rgba(0, 0, 0, 0.06);
          
          /* Interactivity tokens */
          --token-transition-default: all 0.25s ease-in-out;
          --token-hover-scale: 1.05;
          --token-hover-brightness: 1.08;
          
          /* Component-specific tokens */
          --token-badge-danger: #FF3B5C;
          --token-border-radius: 12px;
          --token-font-size: 14px;
          --token-font-weight: 500;
          --token-gap: 10px;
          
          /* HEADER LAYOUT TOKENS v1.1 - LOCKED FOR ALL STOREFRONTS */
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
          
          /* TYPOGRAPHY HIERARCHY - GOVERNANCE ALIGNED */
          --token-font-weight-bold: 700;
          --token-font-weight-semibold: 600;
          --token-font-weight-medium: 500;
          --token-font-weight-normal: 400;
          --token-text-primary: #111827;
          --token-text-secondary: var(--token-color-secondary);
          --token-text-muted: #9CA3AF;
          --token-eco-friendly: var(--token-color-success);
          --token-stock-warning: var(--token-color-danger);
          
          /* COLOR TOKENS - LOCKED GLOBAL PALETTE */
          --text-primary: #111827;
          --text-secondary: #6B7280;
          --text-tertiary: #9CA3AF;
          --brand-link: #3B82F6;
          --brand-gradient: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
          
          /* SHOPLYNK GLOBAL TOKEN SYSTEM - ENTERPRISE GOVERNANCE */
          
          /* A. BRAND & ACCENT COLORS - CROSS-COMPONENT HARMONY */
          --brand-primary: #2563EB;
          --brand-secondary: #3B82F6;
          --brand-green: #25D366;
          --brand-grey: #F3F4F6;
          --brand-red: #EF4444;
          --brand-gold: #FACC15;
          --neutral-100: #FFFFFF;
          --neutral-200: #E5E7EB;
          --neutral-300: #D1D5DB;
          --text-primary: #111827;
          --text-secondary: #6B7280;
          
          /* HEADER BACKGROUND - LOCKED GRADIENT */
          --color-header-bg: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
          
          /* HEADER TEXT CONTRAST TOKENS */
          --color-header-text-primary: #FFFFFF;
          --color-header-text-secondary: rgba(255,255,255,0.85);
          --color-header-text-tertiary: rgba(255,255,255,0.70);
          
          /* B. TYPOGRAPHY - UNIFIED HIERARCHY */
          --font-store-name: 24px;
          --font-store-subtitle: 16px;
          --font-description: 14px;
          --font-action-label: 14px;
          --font-title-lg: 16px;
          --font-subtitle: 14px;
          --font-price: 18px;
          --font-pill: 13px;
          --font-badge: 12px;
          
          /* C. SPACING - UNIFIED LAYOUT */
          --header-padding: 20px 24px;
          --action-spacing: 12px;
          --store-info-gap: 8px;
          --banner-min-height: 140px;
          --card-padding: 16px;
          --pill-padding: 4px 12px;
          --cta-padding: 12px 16px;
          --badge-padding: 3px 8px;
          
          /* D. SHADOWS & ELEVATION - ENTERPRISE CONSISTENCY */
          --elevation-card: 0px 6px 14px rgba(0,0,0,0.08);
          --elevation-header: 0 2px 6px rgba(0, 0, 0, 0.08);
          --elevation-low: 0 1px 3px rgba(0, 0, 0, 0.08);
          --elevation-mid: 0 2px 6px rgba(0, 0, 0, 0.12);
          --elevation-hover: 0 4px 12px rgba(0, 0, 0, 0.12);
          --elevation-high: 0 4px 12px rgba(0, 0, 0, 0.18);
          
          /* LEGACY SUPPORT TOKENS */
          --token-surface-elevated: #ffffff;
          --token-shadow-soft: 0 4px 12px rgba(0, 0, 0, 0.08);
          --token-shadow-hover: 0 8px 20px rgba(0, 0, 0, 0.12);
          --token-font-weight-bold: 700;
          --token-font-weight-semibold: 600;
          --token-font-weight-medium: 500;
          --token-font-weight-normal: 400;
          --token-text-primary: #111827;
          --token-text-muted: #9CA3AF;
        }
        
        /* ENTERPRISE PRODUCT CARD CONTAINER */
        .product-card-v11 {
          background: var(--neutral-100);
          border-radius: 12px;
          box-shadow: var(--elevation-low);
          transition: all 0.3s ease;
          overflow: hidden;
          padding: var(--card-padding);
        }
        
        .product-card-v11:hover {
          transform: translateY(-2px);
          box-shadow: var(--elevation-high);
        }
        
        /* Image Section */
        .product-image-container {
          position: relative;
          overflow: hidden;
        }
        
        .product-image-wrapper {
          aspect-ratio: 1;
          position: relative;
          background: var(--sl-skeleton);
        }
        
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px 12px 0 0;
        }
        
        .product-favorite-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--neutral-100);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--elevation-low);
          transition: all 0.2s ease;
        }
        
        .product-favorite-btn:hover {
          transform: scale(1.1);
        }
        
        .product-favorite-idle {
          color: var(--token-text-muted);
        }
        
        .product-favorite-active {
          color: var(--brand-red);
          fill: currentColor;
        }
        
        /* ENTERPRISE STATUS BADGE SYSTEM */
        .product-badges-overlay {
          position: absolute;
          bottom: 8px;
          left: 8px;
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        
        .product-badge-new {
          background: #DBEAFE;
          color: var(--brand-primary);
          font-size: var(--font-badge);
          font-weight: 600;
          padding: var(--badge-padding);
          border-radius: 6px;
        }
        
        .product-badge-limited {
          background: var(--brand-red);
          color: var(--neutral-100);
          font-size: var(--font-badge);
          font-weight: 600;
          padding: var(--badge-padding);
          border-radius: 6px;
        }
        
        .product-badge-eco {
          background: #DCFCE7;
          color: #166534;
          font-size: var(--font-badge);
          font-weight: 600;
          padding: var(--badge-padding);
          border-radius: 6px;
        }
        
        .product-badge-premium {
          background: var(--brand-gold);
          color: #92400E;
          font-size: var(--font-badge);
          font-weight: 600;
          padding: var(--badge-padding);
          border-radius: 6px;
        }
        
        /* ENTERPRISE CONTENT SECTION */
        .product-card-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .product-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        /* ENTERPRISE PRODUCT TITLE */
        .product-title {
          font-size: var(--font-title-lg);
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 8px;
        }
        
        .product-brand {
          font-size: var(--font-subtitle);
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* ENTERPRISE PRICE STYLING */
        .product-price-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .product-price {
          font-size: var(--font-price);
          font-weight: 700;
          color: #16A34A;
          letter-spacing: -0.02em;
        }
        
        .product-compare-price {
          font-size: var(--font-subtitle);
          color: var(--text-secondary);
          text-decoration: line-through;
        }
        
        .product-discount-badge {
          background: var(--brand-red);
          color: var(--neutral-100);
          font-size: var(--font-badge);
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
        }
        
        /* ENTERPRISE CATEGORY PILLS */
        .product-category-section {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 8px 0;
        }
        
        .product-category-pill {
          background: var(--neutral-100);
          color: var(--brand-primary);
          font-size: var(--font-pill);
          font-weight: 500;
          padding: var(--pill-padding);
          border-radius: 18px;
          border: 1px solid var(--brand-primary);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .product-category-pill:hover {
          background: #EFF6FF;
          transform: translateY(-1px);
        }
        
        .product-category-pill:active {
          background: #DBEAFE;
        }
        
        /* ENTERPRISE CTA SYSTEM */
        .product-cta-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--neutral-200);
        }
        
        /* ENTERPRISE PRIMARY CTA - CONTACT SELLER */
        .product-cta-primary {
          width: 100%;
          background: var(--brand-green);
          color: var(--neutral-100);
          border: none;
          border-radius: 8px;
          font-size: var(--font-subtitle);
          font-weight: 600;
          padding: var(--cta-padding);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--elevation-mid);
        }
        
        .product-cta-primary:hover {
          background: #22C55E;
          transform: translateY(-1px);
          box-shadow: var(--elevation-high);
        }
        
        .product-cta-primary:active {
          background: #16A34A;
          transform: translateY(0);
          box-shadow: var(--elevation-mid);
        }
        
        /* ENTERPRISE SECONDARY CTA - VIEW DETAILS */
        .product-cta-secondary {
          width: 100%;
          background: var(--neutral-100);
          color: var(--text-primary);
          border: 1px solid var(--neutral-200);
          border-radius: 8px;
          font-size: var(--font-subtitle);
          font-weight: 600;
          padding: var(--cta-padding);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .product-cta-secondary:hover {
          background: #F9FAFB;
          transform: translateY(-1px);
          box-shadow: var(--elevation-low);
        }
        
        .product-cta-secondary:active {
          background: #F3F4F6;
          transform: translateY(0);
        }
        
        .product-warning-badge {
          width: 100%;
          border-radius: 8px;
          border: 1px solid var(--brand-gold);
          background: #FEF3C7;
          padding: var(--cta-padding);
          font-size: var(--font-badge);
          font-weight: 500;
          color: #92400E;
          text-align: center;
        }
        
        /* ENTERPRISE ATTRIBUTES SYSTEM */
        .product-attributes-section {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 8px;
        }
        
        .product-attribute-tag {
          background: #F3F4F6;
          color: var(--text-secondary);
          font-size: var(--font-badge);
          font-weight: 400;
          padding: var(--badge-padding);
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          opacity: 0.85;
        }
        
        .product-attribute-eco {
          background: #DCFCE7;
          color: #166534;
          font-weight: 500;
          opacity: 1;
        }
        
        .product-attribute-stock-warning {
          background: var(--brand-red);
          color: var(--neutral-100);
          font-weight: 500;
          opacity: 1;
        }
          
          /* BADGE CARD STYLE - GLOBAL */
          --badge-card-style-bg: #FFFFFF;
          --badge-card-style-radius: 12px;
          --badge-card-style-shadow: 0px 2px 8px rgba(0, 0, 0, 0.05);
          --badge-card-style-icon-size: 18px;
          --badge-card-style-font-size: 14px;
          --badge-card-style-hover-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
          
          /* CTA PRIMARY STYLE - GLOBAL */
          --cta-primary-style: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
          --cta-primary-font-size: 15px;
          --cta-primary-font-weight: 600;
          --cta-primary-padding: 10px 24px;
          --cta-primary-radius: 12px;
          --cta-primary-hover-shadow: 0px 6px 18px rgba(80, 155, 255, 0.35);
          
          /* Responsive tokens */
          --store-title-font-tablet: 20px;
          --logo-scale-tablet: 0.9;
          --logo-scale-mobile: 0.8;
          
          /* Legacy compatibility mappings */
          --filter-height: var(--token-button-height);
          --filter-radius: var(--token-border-radius);
          --filter-padding-x: var(--token-button-padding-x);
          --filter-padding-y: var(--token-button-padding-y);
          --filter-font-size: var(--token-font-size);
          --filter-gap: var(--token-gap);
          --filter-transition: var(--token-transition-default);
          --cta-gradient-start: #4FA8FF;
          --cta-gradient-end: #5271FF;
          --control-height: var(--token-button-height);
          --control-radius: var(--token-border-radius);
          --control-pad-x: var(--token-button-padding-x);
          --control-gap: var(--token-gap);
          --control-font-size: var(--token-font-size);
          --control-line-height: 20px;
          --icon-size: 16px;
          --control-gradient: var(--token-gradient-primary);
          --control-bg-inactive: #f8f9fc;
          --control-border: 1px solid #e5e7eb;
          --control-shadow: var(--token-shadow-secondary);
          --control-shadow-hover: 0px 5px 15px rgba(80, 155, 255, 0.35);
          --control-font-weight: var(--token-font-weight);
          --control-transition: var(--token-transition-default);
        }
        
        /* SORT DROPDOWN - Secondary Control with Global Tokens */
        .sort-dropdown {
          height: var(--token-button-height);
          padding: var(--token-button-padding-y) var(--token-button-padding-x);
          border-radius: var(--token-border-radius);
          font-size: var(--token-font-size);
          font-weight: var(--token-font-weight);
          background: #fff;
          border: 1px solid #e5e7eb;
          color: #333;
          cursor: pointer;
          transition: var(--token-transition-default);
          box-shadow: var(--token-shadow-secondary);
          display: inline-flex;
          align-items: center;
          gap: var(--token-gap);
          margin-top: 0;
        }
        
        .sort-dropdown .icon,
        .sort-dropdown .chevron {
          width: var(--icon-size);
          height: var(--icon-size);
          flex: 0 0 var(--icon-size);
        }
        
        .sort-dropdown:hover,
        .sort-dropdown:focus {
          filter: brightness(var(--token-hover-brightness));
          border-color: #b3c8ff;
          box-shadow: 0 0 0 3px rgba(80, 155, 255, 0.2);
        }
        
        /* Legacy unified dropdown for backward compatibility */
        .unified-dropdown {
          height: var(--token-button-height);
          padding: var(--token-button-padding-y) var(--token-button-padding-x);
          border-radius: var(--token-border-radius);
          font-size: var(--token-font-size);
          font-weight: var(--token-font-weight);
          background: #fff;
          border: 1px solid #e5e7eb;
          box-shadow: var(--token-shadow-secondary);
          color: #333;
          cursor: pointer;
          transition: var(--token-transition-default);
          display: inline-flex;
          align-items: center;
          gap: var(--token-gap);
          margin-top: 0;
        }
        
        .unified-dropdown:hover {
          filter: brightness(var(--token-hover-brightness));
          border-color: #b3c8ff;
          box-shadow: 0 0 0 3px rgba(80, 155, 255, 0.2);
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
        
        .favorites-chip .icon {
          width: var(--icon-size);
          height: var(--icon-size);
          flex: 0 0 var(--icon-size);
        }
        
        .favorites-chip .badge {
          background: var(--token-badge-danger);
          color: #fff;
          font-size: 12px;
          border-radius: 50%;
          padding: 2px 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          line-height: 12px;
        }
        
        /* Legacy unified favorites button for backward compatibility */
        .unified-favorites-button {
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
        
        .unified-favorites-button:hover {
          filter: brightness(var(--token-hover-brightness));
          background: #f9f9fc;
          border-color: #b3c8ff;
        }
        
        .unified-favorites-button.active {
          background: var(--token-gradient-primary);
          color: #fff;
          border: none;
          box-shadow: var(--token-shadow-primary);
          font-weight: 600;
        }
        
        /* Premium search bar matching landing page inputs */
        .frosted-search {
          background: #FFFFFF;
          border: 1px solid #E5EAF5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
        }
        
        /* Consistent micro-elevations */
        .micro-elevation {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }
        /* LOCKED STORE LOGO CONTAINER */
        .store-logo-container {
          width: clamp(64px, 8vw, 128px);
          height: clamp(64px, 8vw, 128px);
          aspect-ratio: 1 / 1; /* Lock 1:1 aspect ratio */
          border-radius: 16px;
          background: #FFFFFF;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 12px; /* Reduced by 4px from 16px */
          box-shadow: var(--store-logo-shadow);
          transition: var(--token-transition-default);
        }
        
        .store-logo-container img {
          width: 100%;
          height: 100%;
          object-fit: contain; /* Scale and center for non-square logos */
          object-position: center;
        }
        
        .store-logo-container:hover {
          transform: scale(var(--token-hover-scale));
        }
        
        /* LOGO v1.1 - LOCKED TOKEN SIZING */
        .shoplynk-avatar {
          width: var(--size-96);
          height: var(--size-96);
          border-radius: var(--radius-16);
          background: #FFFFFF;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
          transition: var(--token-transition-default);
        }
        
        @media (max-width: 768px) {
          .shoplynk-avatar {
            width: var(--size-80);
            height: var(--size-80);
          }
        }
        
        .shoplynk-avatar img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }
        
        .shoplynk-avatar:hover {
          transform: scale(var(--token-hover-scale));
        }
        
        .seller-avatar {
          width: var(--size-96);
          height: var(--size-96);
          border-radius: var(--radius-16);
          background-color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
        }
        
        @media (max-width: 768px) {
          .seller-avatar {
            width: var(--size-80);
            height: var(--size-80);
          }
        }
        
        .seller-avatar img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }
        
        /* Premium tagline styling */
        .powered-by {
          font-size: 14px;
          font-weight: 500;
          color: #2563eb;
          margin-top: 2px;
          letter-spacing: -0.2px;
        }
        
        /* GLOBAL STORE TITLE FONT - LOCKED TYPOGRAPHY */
        /* ENTERPRISE TYPOGRAPHY SYSTEM - CONTRAST TOKEN INHERITANCE */
        .store-title-locked {
          font-size: var(--font-store-name);
          font-weight: 700;
          color: var(--color-header-text-primary);
          line-height: 1.2;
          margin-bottom: var(--store-info-gap);
        }
        
        .powered-by-locked {
          font-size: var(--font-store-subtitle);
          font-weight: 500;
          color: var(--color-header-text-secondary);
          line-height: 20px;
          margin-bottom: var(--store-info-gap);
          letter-spacing: -0.2px;
        }
        
        .powered-by-locked a {
          color: var(--color-header-text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .powered-by-locked a:hover {
          color: var(--color-header-text-primary);
          text-decoration: underline;
        }
        
        .store-description-locked {
          font-size: var(--font-description);
          font-weight: 400;
          color: var(--color-header-text-secondary);
          line-height: 1.4;
          margin-top: var(--store-info-gap);
          margin-bottom: var(--store-info-gap);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .store-subtitle-locked {
          font-size: var(--font-action-label);
          font-weight: 400;
          color: var(--color-header-text-tertiary);
          line-height: 18px;
        }
        
        @media (max-width: 768px) {
          .store-description-locked {
            -webkit-line-clamp: 1;
            font-size: 14px;
          }
        }
        
        /* Legacy typography classes for backward compatibility */
        .store-name-championship {
          font-size: var(--store-title-font);
          font-weight: var(--store-title-weight);
          color: var(--store-title-color);
          line-height: 1.2;
          margin-bottom: var(--header-spacing-vertical);
        }
        
        .powered-by-championship {
          font-size: 14px;
          font-weight: 500;
          color: #3B82F6;
          margin-bottom: var(--header-spacing-minimal);
          letter-spacing: -0.2px;
        }
        
        .online-store-championship {
          font-size: 13px;
          font-weight: 400;
          color: #6B7280;
          line-height: 1.4;
        }
        
        /* Unified favorites badge pixel-perfect styling */
        .favorites-badge {
          background-color: #F43F5E;
          box-shadow: 0 2px 6px rgba(244, 63, 94, 0.4);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 50%;
        }
        
        /* ENTERPRISE BADGE SYSTEM - PAYMENT & DELIVERY PILLS */
        .payment-delivery-badge {
          background: var(--neutral-100);
          border-radius: 12px;
          box-shadow: var(--elevation-low);
          padding: var(--pill-padding);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
          font-size: var(--font-action-label);
          color: var(--text-primary);
          cursor: pointer;
          border: 1px solid var(--neutral-200);
          white-space: nowrap;
        }
        
        .payment-delivery-badge:hover {
          background: #F9FAFB;
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          box-shadow: var(--elevation-mid);
          transform: translateY(-1px);
        }
        
        .payment-delivery-badge:active {
          background: #DBEAFE;
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          box-shadow: var(--elevation-mid);
        }
        
        .payment-delivery-badge svg {
          width: 18px;
          height: 18px;
          color: var(--brand-primary);
          flex-shrink: 0;
        }
        
        /* ENTERPRISE CTA BUTTONS - TOKEN INHERITANCE */
        .enterprise-cta-primary {
          background: var(--brand-primary);
          color: var(--color-header-text-primary);
          border: none;
          border-radius: 8px;
          font-size: var(--font-action-label);
          font-weight: 600;
          padding: var(--cta-padding);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--elevation-card);
          text-decoration: none;
        }
        
        .enterprise-cta-primary:hover {
          background: var(--brand-secondary);
          box-shadow: var(--elevation-hover);
          transform: translateY(-1px);
        }
        
        .enterprise-cta-primary:active {
          background: #1E3A8A;
          transform: translateY(0);
          box-shadow: var(--elevation-card);
        }
        
        /* ENTERPRISE SECONDARY CTA - CONTRAST TOKEN INHERITANCE */
        .enterprise-cta-secondary {
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-primary);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          font-size: var(--font-action-label);
          font-weight: 600;
          padding: var(--cta-padding);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
          box-shadow: var(--elevation-card);
        }
        
        .enterprise-cta-secondary:hover {
          background: var(--color-header-text-primary);
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          box-shadow: var(--elevation-hover);
          transform: translateY(-1px);
        }
        
        .enterprise-cta-secondary:active {
          background: #F3F4F6;
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          transform: translateY(0);
        }
        
        /* ENTERPRISE HEADER CONTAINER - LOCKED GRADIENT TOKEN */
        .header-container-locked {
          background: var(--color-header-bg);
          border-radius: 16px;
          box-shadow: var(--elevation-card);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: var(--header-padding);
          min-height: var(--banner-min-height);
          color: var(--color-header-text-primary);
        }
        
        @media (max-width: 768px) {
          .header-container-locked {
            padding: 16px 20px;
          }
        }
        
        /* ENTERPRISE HEADER LAYOUT - TOKEN-DRIVEN ALIGNMENT */
        .header-row-locked {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--action-spacing);
        }
        
        /* ENTERPRISE THREE-ZONE LAYOUT - TOKEN SYSTEM */
        .store-info-block {
          display: flex;
          align-items: center;
          gap: var(--store-info-gap);
          flex: 1;
          min-width: 0;
        }
        
        .badges-block {
          display: flex;
          align-items: center;
          gap: var(--action-spacing);
          flex-wrap: wrap;
        }
        
        .cta-block {
          display: flex;
          align-items: center;
          flex-shrink: 0;
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
        
        /* RESPONSIVE BEHAVIOR - LOCKED TOKENS */
        @media (max-width: 1279px) and (min-width: 768px) {
          .store-title-locked {
            font-size: var(--store-title-font-tablet);
          }
          
          .store-logo-container,
          .shoplynk-avatar,
          .seller-avatar {
            transform: scale(var(--logo-scale-tablet));
          }
        }
        
        @media (max-width: 767px) {
          .store-logo-container,
          .shoplynk-avatar,
          .seller-avatar {
            transform: scale(var(--logo-scale-mobile));
          }
          
          .header-row-locked {
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          
          .store-info-block {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
          }
          
          .badges-block {
            justify-content: center;
            width: 100%;
            max-width: 400px;
          }
          
          .cta-block {
            width: 100%;
            justify-content: center;
          }
        }
        
        /* LOCKED HEADER BASELINE - TOKEN SYSTEM */
        .locked-header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 24px;
          background: var(--surface-elevated, #FFFFFF);
          border-radius: 16px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        
        .locked-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        
        .store-identity-block {
          display: flex;
          align-items: center;
          gap: var(--space-4, 16px);
          flex: 1;
          min-width: 0;
        }
        
        .store-logo-wrapper {
          flex-shrink: 0;
        }
        
        /* Avatar (logo) */
        .header-avatar {
          width: var(--avatar-size-lg, 96px);
          height: var(--avatar-size-lg, 96px);
          border-radius: var(--radius-2xl, 16px);
          overflow: hidden;
          border: 1px solid var(--surface-border, rgba(16,24,40,.08));
          box-shadow: var(--shadow-md, 0 4px 14px rgba(16,24,40,.08));
          background: var(--surface-elevated, #fff);
          flex: 0 0 auto;
          object-fit: cover;
        }
        
        /* Monogram fallback (when no logoUrl) */
        .header-avatar--fallback {
          display: grid;
          place-items: center;
          font: var(--text-brand-lg, 700 28px/1 system-ui, -apple-system, Segoe UI);
          color: var(--brand-primary-600, #2563EB);
          background: linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,0)),
                      var(--brand-primary-50, #EFF6FF);
        }
        
        .store-text-block {
          flex: 1;
          min-width: 0;
        }
        
        .locked-store-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary, #111827);
          margin: 0 0 4px 0;
          line-height: 1.2;
        }
        
        .locked-powered-by {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #6B7280);
          margin-bottom: 8px;
        }
        
        /* Store Description Block */
        .store-description-block {
          font-size: 14px;
          color: var(--text-subtle, #9CA3AF);
          line-height: 1.4;
          margin-top: 8px;
          max-width: 62ch;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Header meta block */
        .header-meta {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
        }
        
        /* Social Links Row (quiet style) */
        .header-social {
          display: inline-flex;
          gap: var(--space-2, 8px);
          margin-top: var(--space-2, 8px);
          flex-wrap: wrap;
        }
        
        .header-social a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full, 999px);
          color: var(--text-secondary, #667085);
          background: transparent;
          transition: color .15s ease, background-color .15s ease, box-shadow .15s ease;
          outline: none;
          text-decoration: none;
        }
        
        .header-social a:hover {
          color: var(--brand-primary-600, #2563EB);
          background: var(--brand-primary-50, #EFF6FF);
        }
        
        .header-social a:focus-visible {
          box-shadow: 0 0 0 2px var(--focus-ring, rgba(66,153,225,.6));
        }
        
        .header-social svg {
          width: 18px;
          height: 18px;
          stroke-width: 1.75;
        }
        
        .seller-actions-block {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .action-pills {
          display: flex;
          gap: 12px;
        }
        
        .locked-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--surface-elevated, #FFFFFF);
          border: 1px solid var(--border-default, #E5E7EB);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #111827);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .locked-pill:hover {
          background: #F9FAFB;
          border-color: var(--brand-primary, #2563EB);
          color: var(--brand-primary, #2563EB);
        }
        
        .locked-primary-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          height: 40px;
          background: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .locked-primary-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 168, 255, 0.3);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .locked-header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          
          .store-identity-block {
            justify-content: center;
            text-align: center;
          }
          
          .seller-actions-block {
            justify-content: center;
            flex-direction: column;
            gap: 12px;
          }
          
          .store-description-block {
            -webkit-line-clamp: 3;
          }
        }
        
        /* Enterprise responsive logo scaling handled by clamp */
        
        /* Hide Back to Dashboard button in public customer view */
        .sl-store-header .sl-cta {
          display: none !important;
        }
      `}</style>

      <div className="min-h-screen" style={{ background: '#f6f8ff' }}>
        {/* Premium Hero Store Header */}
        <div className="relative overflow-hidden">
          {/* Background pattern overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-25 to-pink-50 opacity-60"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(255, 159, 98, 0.3) 0%, transparent 50%)'
          }}></div>
          
          <div className="relative z-10 text-center py-16 px-6">
            {/* Large logo with animations */}
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-white rounded-full shadow-2xl border-4 border-white hover:scale-105 transition-all duration-300 flex items-center justify-center overflow-hidden">
                {seller?.logoUrl ? (
                  <img 
                    src={seller.logoUrl} 
                    alt={`${seller.storeName} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {seller?.storeName?.charAt(0) || 'S'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Store name as main heading */}
            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight">
              {seller?.storeName || 'Amazing Store'}
            </h1>

            {/* Powered by ShopLynk tagline */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="text-blue-600 font-bold text-lg">Powered by ShopLynk</span>
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>

            {/* Store description */}
            {seller?.storeDescription && (
              <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed mb-8">
                {seller.storeDescription}
              </p>
            )}

            {/* Trust signals row */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {/* Product count badge */}
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{products.length}</span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {products.length === 1 ? 'Product' : 'Products'}
                  </span>
                </div>
              </div>

              {/* Payment methods badge - clickable */}
              <Button
                variant="ghost"
                onClick={() => setShowPaymentModal(true)}
                className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-800">
                    {paymentMethods.length} Payment {paymentMethods.length === 1 ? 'Method' : 'Methods'}
                  </span>
                </div>
              </Button>

              {/* Delivery options badge - clickable */}
              <Button
                variant="ghost"
                onClick={() => setShowDeliveryModal(true)}
                className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-800">
                    {deliveryOptions.length} Delivery {deliveryOptions.length === 1 ? 'Option' : 'Options'}
                  </span>
                </div>
              </Button>
            </div>

            {/* Social media icons */}
            {(seller?.socialMedia?.instagram || seller?.socialMedia?.facebook) && (
              <div className="flex items-center justify-center gap-4 mb-8">
                {seller?.socialMedia?.instagram && (
                  <Button
                    variant="ghost"
                    onClick={() => window.open(normalizeUrl(seller.socialMedia?.instagram || '', 'instagram'), '_blank')}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <Instagram className="w-6 h-6 text-white" />
                  </Button>
                )}
                {seller?.socialMedia?.facebook && (
                  <Button
                    variant="ghost"
                    onClick={() => window.open(normalizeUrl(seller.socialMedia?.facebook || '', 'facebook'), '_blank')}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <Facebook className="w-6 h-6 text-white" />
                  </Button>
                )}
              </div>
            )}

            {/* Primary WhatsApp CTA button - Landing Page Style */}
            {seller?.whatsappNumber && (
              <Button
                onClick={() => openWhatsApp(seller.whatsappNumber, `Hi! I found your store on ShopLynk and I'm interested in your products.`)}
                style={{
                  height: '52px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#fff',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  backgroundSize: '180% 100%',
                  backgroundPosition: '0% 50%',
                  boxShadow: '0 12px 30px rgba(37, 211, 102, 0.28)',
                  border: 'none',
                  transition: 'transform .15s ease, box-shadow .15s ease, background-position .2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 50%';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(37, 211, 102, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 50%';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 211, 102, 0.28)';
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <MessageCircle className="w-6 h-6 mr-3" />
                Contact on WhatsApp
              </Button>
            )}
          </div>
        </div>

        {/* ShopLynk Branded Header Section - Landing Page Style */}
        <div className="glass card" style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          background: 'rgba(255,255,255,.85)',
          border: '1px solid rgba(255,255,255,.4)',
          backdropFilter: 'saturate(160%) blur(14px)',
          WebkitBackdropFilter: 'saturate(160%) blur(14px)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, .08)',
          borderRadius: '0',
          marginBottom: '24px'
        }}>
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* ShopLynk Brand */}
              <Link href="/" style={_brand.link}>
                <span style={_brand.text} className="brandText">
                  ShopLynk
                </span>
              </Link>
              
              {/* Powered by ShopLynk */}
              <div className="flex items-center gap-3" style={{ color: '#374151' }}>
                <span className="text-sm font-medium">Powered by</span>
                <Link href="/" className="text-sm font-bold" style={{ color: '#5a6bff' }}>
                  ShopLynk
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Edge-to-Edge Search & Filter Section - Landing Page Glass */}
        <div className="glass heroGlass" style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          background: 'rgba(255,255,255,.75)',
          border: '1px solid rgba(255,255,255,.4)',
          backdropFilter: 'saturate(160%) blur(14px)',
          WebkitBackdropFilter: 'saturate(160%) blur(14px)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, .08)',
          borderRadius: '24px',
          marginBottom: '24px',
          paddingTop: '64px',
          paddingBottom: '64px'
        }}>
          <div className="max-w-7xl mx-auto px-6">
            {/* Section title with exact landing page typography */}
            <div className="text-center mb-12">
              <h2 style={{
                fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
                fontSize: 'clamp(40px, 7vw, 64px)',
                lineHeight: 1.06,
                letterSpacing: '-0.02em',
                fontWeight: 900,
                color: '#111827',
                margin: '0 0 16px 0'
              }}>
                Discover Amazing Products
              </h2>
              <p style={{
                color: '#374151',
                fontSize: '18px',
                lineHeight: 1.65,
                margin: '0 0 24px 0',
                fontWeight: 500,
                maxWidth: '32rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                Explore our curated collection of premium products designed to exceed your expectations
              </p>
            </div>
            
            {/* Landing Page Style Search Bar */}
            <div className="glass card" style={{
              marginBottom: '32px',
              background: 'rgba(255,255,255,.75)',
              border: '1px solid rgba(255,255,255,.4)',
              backdropFilter: 'saturate(160%) blur(14px)',
              WebkitBackdropFilter: 'saturate(160%) blur(14px)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, .08)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6" style={{ color: '#374151', opacity: 0.6 }} />
                  <Input
                    type="text"
                    placeholder="Search for products, brands, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      height: '52px',
                      paddingLeft: '56px',
                      paddingRight: '56px',
                      fontSize: '16px',
                      fontWeight: 500,
                      border: '1px solid rgba(255,255,255,.4)',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,.85)',
                      backdropFilter: 'saturate(160%) blur(14px)',
                      WebkitBackdropFilter: 'saturate(160%) blur(14px)',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, .06)',
                      transition: 'all 0.15s ease'
                    }}
                    className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-white/50 transition-all duration-300"
                      style={{ background: 'transparent' }}
                    >
                      <X className="w-4 h-4" style={{ color: '#374151' }} />
                    </Button>
                  )}
                </div>
              </div>
            </div>

              {/* Smart filter container */}
              <div className="space-y-6">
                {/* Filter header with results counter */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Filter className="w-6 h-6 text-blue-600" />
                    <span className="text-lg font-bold text-gray-900">Smart Filters</span>
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-full text-base font-semibold shadow-lg animate-pulse">
                      {filteredProducts.length} {filteredProducts.length === 1 ? 'Result' : 'Results'}
                    </div>
                  </div>
                  
                  {/* Sort dropdown */}
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48 h-12 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">🆕 Newest First</SelectItem>
                        <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                        <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                        <SelectItem value="name">📝 Name A-Z</SelectItem>
                        <SelectItem value="popular">⭐ Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Category pills and favorites toggle */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category pills */}
                  {Array.from(new Set(products.map(p => p.category))).filter(Boolean).map(category => {
                    const count = products.filter(p => p.category === category).length;
                    const isActive = categoryFilter === category;
                    
                    return (
                      <Button
                        key={category}
                        variant={isActive ? "default" : "outline"}
                        onClick={() => setCategoryFilter(isActive ? 'all' : category)}
                        className={`rounded-full px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl hover:shadow-2xl' 
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md'
                        }`}
                      >
                        <span className="mr-2">{getCategoryIcon(category)}</span>
                        {category}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {count}
                        </span>
                      </Button>
                    );
                  })}

                  {/* Show all button */}
                  <Button
                    variant={categoryFilter === 'all' ? "default" : "outline"}
                    onClick={() => setCategoryFilter('all')}
                    className={`rounded-full px-6 py-3 font-bold transition-all duration-300 hover:scale-105 ${
                      categoryFilter === 'all'
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    🎯 Show All
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                      categoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {products.length}
                    </span>
                  </Button>

                  {/* Favorites toggle */}
                  <Button
                    variant={showFavorites ? "default" : "outline"}
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`rounded-full px-6 py-3 font-bold transition-all duration-300 hover:scale-105 ${
                      showFavorites
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
                    Favorites
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                      showFavorites ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                    }`}>
                      {favorites.size}
                    </span>
                  </Button>
                </div>
              </div>
          </div>
        </div>

        {/* Premium Products Section - Landing Page Glass */}
        <div className="glass heroGlass" style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          background: 'rgba(255,255,255,.75)',
          border: '1px solid rgba(255,255,255,.4)',
          backdropFilter: 'saturate(160%) blur(14px)',
          WebkitBackdropFilter: 'saturate(160%) blur(14px)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, .08)',
          borderRadius: '24px',
          marginBottom: '24px',
          paddingTop: '40px',
          paddingBottom: '40px'
        }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="space-y-8">
              
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
                      {!isOwner && (
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
                      )}

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
                          <div>
                            <span className="product-compare-price">
                              {formatPrice((product as any).compareAtPrice)}
                            </span>
                            <span className="product-discount-badge">
                              -{Math.round((((product as any).compareAtPrice - product.price) / (product as any).compareAtPrice) * 100)}%
                            </span>
                          </div>
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
                        {/* Primary CTA - Contact Seller */}
                        {seller?.whatsappNumber ? (
                          <button
                            className="product-cta-primary"
                            style={{
                              height: '52px',
                              borderRadius: '16px',
                              fontSize: '16px',
                              fontWeight: 700,
                              color: '#fff',
                              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                              backgroundSize: '180% 100%',
                              backgroundPosition: '0% 50%',
                              boxShadow: '0 12px 30px rgba(37, 211, 102, 0.28)',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'transform .15s ease, box-shadow .15s ease, background-position .2s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactProduct(product);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundPosition = '100% 50%';
                              e.currentTarget.style.boxShadow = '0 16px 40px rgba(37, 211, 102, 0.35)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundPosition = '0% 50%';
                              e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 211, 102, 0.28)';
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            aria-label={`Contact seller about ${product.name} on WhatsApp`}
                            data-testid={`button-whatsapp-${product.id}`}
                          >
                            <MessageCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                            Contact Seller
                          </button>
                        ) : isOwner ? (
                          // Seller console preview - disabled button with tooltip
                          <div className="relative group">
                            <Button
                              disabled
                              className="w-full font-medium opacity-60 cursor-not-allowed"
                              size="sm"
                              style={{
                                backgroundColor: '#25D366',
                                borderRadius: '10px',
                                color: 'white'
                              }}
                              data-testid={`button-whatsapp-disabled-${product.id}`}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                              Contact Seller
                            </Button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                              <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                Add a WhatsApp number in Settings to enable this
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                        
                        {/* Out of stock caption */}
                        {seller?.whatsappNumber && product.quantity <= 0 && (
                          <p className="text-xs text-gray-500 text-center">
                            Currently out of stock — message seller for availability
                          </p>
                        )}
                        
                        {/* View Details Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductView(product);
                          }}
                          className="w-full bg-white hover:bg-gray-50 transition-all duration-200 font-medium hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                          style={{
                            border: '1px solid #E0E0E0',
                            borderRadius: '10px',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#2C3E50';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '';
                          }}
                          data-testid={`button-view-${product.id}`}
                        >
                          View Details
                        </Button>
                      </div>

                      {/* Premium stock warning - #E63946 background, white bold text, ALL CAPS */}
                      {product.quantity <= 10 && (
                        <div className="pt-3 border-t border-slate-100">
                          <div className="inline-flex items-center rounded-md text-xs font-bold tracking-wide" 
                               style={{ 
                                 backgroundColor: '#E63946', 
                                 color: 'white',
                                 padding: '8px 12px'
                               }}>
                            <span className="mr-2 text-sm flex items-center">⚠️</span>
                            LIMITED STOCK — ONLY {product.quantity} LEFT
                          </div>
                        </div>
                      )}

                      {/* Premium refined badge system - max 4 badges per card */}
                      {(() => {
                        const badges = [];
                        const maxBadges = 4;
                        
                        // Priority 1: Physical attributes (light gray #F1F3F5 background, #333333 text)
                        if (product.color && badges.length < maxBadges) {
                          badges.push(
                            <div key="color" className="inline-flex items-center rounded-md text-xs font-medium" 
                                 style={{ 
                                   backgroundColor: '#F1F3F5', 
                                   color: '#333333',
                                   padding: '6px 12px'
                                 }}>
                              <span className="mr-1.5 text-sm flex items-center">🎨</span>
                              {product.color}
                            </div>
                          );
                        }
                        if (product.size && badges.length < maxBadges) {
                          badges.push(
                            <div key="size" className="inline-flex items-center rounded-md text-xs font-medium" 
                                 style={{ 
                                   backgroundColor: '#F1F3F5', 
                                   color: '#333333',
                                   padding: '6px 12px'
                                 }}>
                              <span className="mr-1.5 text-sm flex items-center">📏</span>
                              {product.size}
                            </div>
                          );
                        }
                        if (product.material && badges.length < maxBadges) {
                          badges.push(
                            <div key="material" className="inline-flex items-center rounded-md text-xs font-medium" 
                                 style={{ 
                                   backgroundColor: '#F1F3F5', 
                                   color: '#333333',
                                   padding: '6px 12px'
                                 }}>
                              <span className="mr-1.5 text-sm flex items-center">🧵</span>
                              {product.material}
                            </div>
                          );
                        }
                        
                        // Priority 2: Sustainability (soft green #DFF6E3 background, #1E7D3D text)
                        if (product.sustainability && badges.length < maxBadges) {
                          badges.push(
                            <div key="sustainability" className="inline-flex items-center rounded-md text-xs font-medium" 
                                 style={{ 
                                   backgroundColor: '#DFF6E3', 
                                   color: '#1E7D3D',
                                   padding: '6px 12px'
                                 }}>
                              <span className="mr-1.5 text-sm flex items-center">🌱</span>
                              Eco-friendly
                            </div>
                          );
                        }
                        
                        // Note: Handmade, Customizable, Gift Wrap moved to details view per specs
                        
                        return badges.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                            {badges}
                          </div>
                        );
                      })()}
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
            </div>
          </div>
        </div>

        {/* Floating FAB removed per v1.3.1_UI_UX_WHATSAPP_PER_CARD specification */}

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
        
        {/* ShopLynk Footer Branding */}
        <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-white border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-lg text-slate-600 font-medium">Powered by</span>
                <Link href="/" style={_brand.link}>
                  <span style={{..._brand.text, fontSize: 'clamp(28px, 2.5vw, 36px)'}} className="brandText">
                    ShopLynk
                  </span>
                </Link>
              </div>
              <p className="text-slate-600 max-w-lg mx-auto">
                Create your own premium online store in minutes. Join thousands of sellers building their business with ShopLynk.
              </p>
              <div className="mt-6">
                <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Start Your Store <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

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
            <div 
              className="max-w-7xl w-full max-h-[95vh] overflow-y-auto bg-white shadow-2xl border-0 rounded-3xl animate-fadeInScale" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hero Product Image */}
              <div className="relative">
                <div className="aspect-[21/9] relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-gray-100 via-white to-gray-50">
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
                    <div>
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
                    </div>
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
                          <div className="inline-flex items-center px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-semibold">
                            <span className="mr-2 text-sm flex items-center">📦</span>
                            {selectedProduct.category}
                          </div>
                          {(selectedProduct as any).subcategory && (
                            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-600 text-white text-sm font-medium">
                              {(selectedProduct as any).subcategory}
                            </div>
                          )}
                          {(Date.now() - (selectedProduct.createdAt || 0)) < 7 * 24 * 60 * 60 * 1000 && (
                            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-emerald-500 text-white text-sm font-semibold">
                              <span className="mr-1.5 text-sm flex items-center">🆕</span>
                              New arrival
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:text-right space-y-2">
                      <div className="text-3xl lg:text-4xl font-bold" style={{ color: '#27AE60' }}>
                        {formatPrice(selectedProduct.price)}
                      </div>
                      <div className="text-sm text-slate-500 font-medium">per unit</div>
                    </div>
                  </div>
                  
                  {/* Refined Stock Status */}
                  <div className="p-5 rounded-xl border-2" style={{
                    backgroundColor: selectedProduct.quantity > 10 ? '#E8F5E8' : 
                                   selectedProduct.quantity > 0 ? '#FFF4E6' : '#FFE6E6',
                    borderColor: selectedProduct.quantity > 10 ? '#27AE60' : 
                                selectedProduct.quantity > 0 ? '#F39C12' : '#E63946'
                  }}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                        selectedProduct.quantity > 10 ? 'bg-emerald-500' :
                        selectedProduct.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg" style={{
                          color: selectedProduct.quantity > 10 ? '#27AE60' : 
                                 selectedProduct.quantity > 0 ? '#D68910' : '#C0392B'
                        }}>
                          {selectedProduct.quantity > 10 ? 'In stock & ready to ship' :
                           selectedProduct.quantity > 0 ? `Limited stock — Only ${selectedProduct.quantity} left` : 
                           'Currently out of stock'}
                        </div>
                        <p className="text-slate-600 mt-1 text-sm font-medium">
                          {selectedProduct.quantity > 0 
                            ? `${selectedProduct.quantity} ${selectedProduct.quantity === 1 ? 'unit' : 'units'} available for immediate purchase`
                            : 'Contact seller for restocking information'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Feature Badges (moved from cards) */}
                  {((selectedProduct as any).isHandmade || (selectedProduct as any).isCustomizable || (selectedProduct as any).giftWrapping) && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        Special features
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedProduct as any).isHandmade && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium" 
                               style={{ backgroundColor: '#FEF7F0', color: '#EA580C' }}>
                            <span className="mr-1.5 text-sm flex items-center">🎨</span>
                            Handmade
                          </div>
                        )}
                        {(selectedProduct as any).isCustomizable && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium" 
                               style={{ backgroundColor: '#F0F9FF', color: '#0369A1' }}>
                            <span className="mr-1.5 text-sm flex items-center">⚙️</span>
                            Customizable
                          </div>
                        )}
                        {(selectedProduct as any).giftWrapping && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium" 
                               style={{ backgroundColor: '#FDF4FF', color: '#A21CAF' }}>
                            <span className="mr-1.5 text-sm flex items-center">🎁</span>
                            Gift wrap
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                
                {/* Attributes Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Product Attributes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { label: 'Brand', value: selectedProduct.brand, icon: '🏷️' },
                        { label: 'Condition', value: selectedProduct.condition, icon: '⭐' },
                        { label: 'Size', value: selectedProduct.size, icon: '📏' },
                        { label: 'Color', value: selectedProduct.color, icon: '🎨' },
                        { label: 'Material', value: selectedProduct.material, icon: '🧵' },
                        { label: 'Chain Length', value: (selectedProduct as any).chainLength, icon: '📐' },
                        { label: 'Pendant Size', value: (selectedProduct as any).pendantSize, icon: '💎' },
                      ].filter(item => item.value).map((item, index) => (
                        <div key={index} className="p-4 rounded-md border" 
                             style={{ backgroundColor: '#F1F3F5', borderColor: '#E5E7EB' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm flex items-center">{item.icon}</span>
                            <span className="text-xs font-semibold uppercase tracking-wide" 
                                  style={{ color: '#495057' }}>
                              {item.label}
                            </span>
                          </div>
                          <p className="font-bold text-lg capitalize" style={{ color: '#495057' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping & Logistics Section */}
                  {((selectedProduct as any).processingTime || (selectedProduct as any).shipsFrom) && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🚚</span>
                        Shipping & Processing
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(selectedProduct as any).processingTime && (
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">⏱️</span>
                              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                Processing Time
                              </span>
                            </div>
                            <p className="font-bold text-lg text-blue-800">{(selectedProduct as any).processingTime}</p>
                          </div>
                        )}
                        {(selectedProduct as any).shipsFrom && (
                          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">✈️</span>
                              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                                Ships From
                              </span>
                            </div>
                            <p className="font-bold text-lg text-indigo-800">{(selectedProduct as any).shipsFrom}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Occasion & Age Group Section */}
                  {((selectedProduct as any).occasion || (selectedProduct as any).targetAgeGroup) && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        Suitable For
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(selectedProduct as any).occasion && (
                          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🎉</span>
                              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                Occasion
                              </span>
                            </div>
                            <p className="font-bold text-lg text-purple-800 capitalize">{(selectedProduct as any).occasion}</p>
                          </div>
                        )}
                        {(selectedProduct as any).targetAgeGroup && (
                          <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">👥</span>
                              <span className="text-xs font-semibold text-pink-700 uppercase tracking-wide">
                                Age Group
                              </span>
                            </div>
                            <p className="font-bold text-lg text-pink-800 capitalize">{(selectedProduct as any).targetAgeGroup}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Policies Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Product Policies
                    </h3>
                    <div className="space-y-4">
                      {/* Personalization Options */}
                      {(selectedProduct as any).personalizationOptions && (
                        <div className="p-5 bg-indigo-50 rounded-2xl border-l-4 border-indigo-400">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">✏️</span>
                            <h4 className="text-lg font-bold text-indigo-800">Personalization Options</h4>
                          </div>
                          <p className="text-indigo-700 font-medium leading-relaxed">{(selectedProduct as any).personalizationOptions}</p>
                        </div>
                      )}

                      {/* Care Instructions */}
                      {(selectedProduct as any).careInstructions && (
                        <div className="p-5 bg-blue-50 rounded-2xl border-l-4 border-blue-400">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">🧼</span>
                            <h4 className="text-lg font-bold text-blue-800">Care Instructions</h4>
                          </div>
                          <p className="text-blue-700 font-medium leading-relaxed">{(selectedProduct as any).careInstructions}</p>
                        </div>
                      )}

                      {/* Sustainability */}
                      {(selectedProduct as any).sustainability && (
                        <div className="p-5 bg-green-50 rounded-2xl border-l-4 border-green-400">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">🌱</span>
                            <h4 className="text-lg font-bold text-green-800">Sustainability</h4>
                          </div>
                          <p className="text-green-700 font-medium leading-relaxed">{(selectedProduct as any).sustainability}</p>
                        </div>
                      )}

                      {/* Warranty */}
                      {(selectedProduct as any).warranty && (
                        <div className="p-5 bg-purple-50 rounded-2xl border-l-4 border-purple-400">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">🛡️</span>
                            <h4 className="text-lg font-bold text-purple-800">Warranty</h4>
                          </div>
                          <p className="text-purple-700 font-medium leading-relaxed">{(selectedProduct as any).warranty}</p>
                        </div>
                      )}
                    </div>
                  </div>
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
                    style={{
                      ..._ui.ctaPrimary,
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      boxShadow: '0 12px 30px rgba(37, 211, 102, 0.28)',
                      fontSize: '18px',
                      padding: '0 32px',
                      height: '60px'
                    }}
                    className="flex-1 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
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
            </div>
          </div>
        )}
      </div>
    </>
  );
}