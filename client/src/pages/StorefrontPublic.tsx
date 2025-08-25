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
    if (key.includes('post')) return 'Postal Service';
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  // Ultra-premium loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl p-16 shadow-2xl border border-white/20 max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-8">
            {/* Enhanced loading spinner */}
            <div className="relative">
              <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-transparent border-b-purple-400 rounded-full animate-spin animate-reverse"></div>
              <div className="absolute inset-4 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-slate-800">Loading Store...</h3>
              <p className="text-slate-600 leading-relaxed">
                Fetching the latest products and store information
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>This may take a few moments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl p-16 shadow-2xl border border-white/20 text-center max-w-lg mx-4">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <X className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Store Unavailable</h2>
          <p className="text-slate-600 mb-8 leading-relaxed text-lg">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.history.back()}
              className="bg-slate-600 hover:bg-slate-700 text-white shadow-lg"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-2 border-slate-200 hover:bg-slate-50"
              size="lg"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) return null;

  return (
    <>
      <style>{`
        @keyframes heartBeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1.2); }
          75% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes slideUp {
          from { 
            transform: translateY(30px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(1deg); }
          66% { transform: translateY(4px) rotate(-1deg); }
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeInScale {
          0% { 
            opacity: 0; 
            transform: scale(0.8); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-reverse {
          animation-direction: reverse;
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
        {/* Ultra-Premium Store Header - Full Bleed */}
        <header 
          className="
            w-screen relative overflow-hidden
            left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]
          "
        >
          {/* Hero Banner - Full Viewport Width */}
          <div 
            className="h-56 md:h-72 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 relative w-full"
            style={seller.coverUrl ? {
              backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.6)), url(${seller.coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          >
            {/* Animated overlay elements */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full animate-float animation-delay-2000"></div>
              <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/5 rounded-full animate-float"></div>
              <div className="absolute bottom-1/4 left-1/2 w-16 h-16 bg-white/15 rounded-full animate-float animation-delay-4000"></div>
            </div>
            
            {/* Gradient overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
          </div>

          {/* Store Information Card - Centered with Safe Gutters */}
          <div className="mx-auto max-w-7xl relative" style={{
            paddingInline: 'clamp(12px, 4vw, 24px)',
            paddingLeft: 'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))'
          }}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 lg:p-10 -mt-28 relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                {/* Store Avatar with Status Indicator */}
                <div className="relative flex-shrink-0">
                  <div className="relative">
                    <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 p-1 shadow-2xl">
                      <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden">
                        {seller.logoUrl ? (
                          <img
                            src={seller.logoUrl}
                            alt={seller.storeName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-3xl lg:text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                            {seller.storeName[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced online indicator */}
                    <div className="absolute -bottom-2 -right-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Store rating badge (if available) */}
                  <div className="absolute -top-2 -left-2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-2 border-white shadow-lg font-bold px-3 py-1">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      4.9
                    </Badge>
                  </div>
                </div>

                {/* Store Details */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-3">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-800 leading-tight">
                      {seller.storeName}
                    </h1>
                    {seller.storeDescription && (
                      <p className="text-slate-600 text-lg lg:text-xl leading-relaxed line-clamp-2 max-w-3xl">
                        {seller.storeDescription}
                      </p>
                    )}
                  </div>

                  {/* Enhanced Info Badges */}
                  <div className="flex flex-wrap gap-3">
                    {(seller.city || seller.country) && (
                      <Badge 
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 hover:from-blue-100 hover:to-indigo-100 px-4 py-2.5 text-sm font-bold border border-blue-200 transition-all duration-300 hover:scale-105"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {seller.city ? `${seller.city}, ${seller.country}` : seller.country}
                      </Badge>
                    )}
                    
                    {paymentMethods.length > 0 && (
                      <Badge 
                        className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 hover:from-emerald-100 hover:to-green-100 cursor-pointer px-4 py-2.5 text-sm font-bold border border-emerald-200 transition-all duration-300 hover:scale-105"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {paymentMethods.length} Payment Method{paymentMethods.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    
                    {deliveryOptions.length > 0 && (
                      <Badge 
                        className="bg-gradient-to-r from-purple-50 to-violet-50 text-purple-800 hover:from-purple-100 hover:to-violet-100 cursor-pointer px-4 py-2.5 text-sm font-bold border border-purple-200 transition-all duration-300 hover:scale-105"
                        onClick={() => setShowDeliveryModal(true)}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        {deliveryOptions.length} Delivery Option{deliveryOptions.length > 1 ? 's' : ''}
                      </Badge>
                    )}

                    {seller.currency && (
                      <Badge className="bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 px-4 py-2.5 text-sm font-bold border border-orange-200">
                        <Globe className="w-4 h-4 mr-2" />
                        {seller.currency} Currency
                      </Badge>
                    )}

                    <Badge className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 px-4 py-2.5 text-sm font-bold border border-emerald-200">
                      <Clock className="w-4 h-4 mr-2" />
                      Usually responds within 2 hours
                    </Badge>
                    
                    <Badge className="bg-gradient-to-r from-violet-50 to-purple-50 text-violet-800 px-4 py-2.5 text-sm font-bold border border-violet-200">
                      <Shield className="w-4 h-4 mr-2" />
                      Verified Seller
                    </Badge>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex flex-wrap gap-4 pt-4">
                    <Button
                      onClick={handleFloatingChatClick}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-4 text-lg font-bold rounded-2xl"
                      size="lg"
                    >
                      <MessageCircle className="w-6 h-6 mr-3" />
                      Chat on WhatsApp
                    </Button>
                    
                    <Button
                      variant="outline"
                      asChild
                      className="border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 hover:scale-105 px-8 py-4 text-lg font-bold rounded-2xl bg-white/80 backdrop-blur-sm"
                      size="lg"
                      onClick={() => handleMarketingClick('header_cta')}
                    >
                      <a
                        href={`${SHOPLINK_MARKETING_URL}?utm_source=storefront&utm_medium=header_cta&utm_campaign=public&seller=${sellerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Sparkles className="w-6 h-6 mr-3" />
                        Create Your Store
                      </a>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-6 py-4 rounded-2xl font-semibold"
                    >
                      <Award className="w-5 h-5 mr-2" />
                      {products.length} Products
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

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
                    {['all', ...categories].map((category) => (
                      <Button
                        key={category}
                        variant={categoryFilter === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoryFilter(category)}
                        className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                          categoryFilter === category 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl scale-105' 
                            : 'bg-white/80 backdrop-blur-sm hover:bg-blue-50 border-2 hover:border-blue-300 hover:scale-105'
                        }`}
                      >
                        {category === 'all' ? (
                          <>
                            <span>All Products</span>
                            <Badge className="ml-2 bg-white/20 text-current border-0 text-xs">
                              {products.length}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <span className="capitalize">{category}</span>
                            <Badge className="ml-2 bg-white/20 text-current border-0 text-xs">
                              {products.filter(p => p.category === category).length}
                            </Badge>
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort and Favorites */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap">Sort:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-52 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/80 backdrop-blur-sm" data-testid="select-sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 shadow-2xl">
                        <SelectItem value="newest">🆕 Newest First</SelectItem>
                        <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                        <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                        <SelectItem value="name">🔤 Name A-Z</SelectItem>
                        <SelectItem value="popular">🔥 Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant={showFavorites ? 'default' : 'outline'}
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`rounded-xl px-6 py-3 transition-all duration-300 font-semibold ${
                      showFavorites 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:scale-105' 
                        : 'border-2 hover:border-red-300 hover:bg-red-50 bg-white/80 backdrop-blur-sm hover:scale-105'
                    }`}
                    data-testid="button-favorites"
                  >
                    <Heart className="w-5 h-5 mr-2" fill={showFavorites ? 'currentColor' : 'none'} />
                    <span className="hidden sm:inline">Favorites</span>
                    {favorites.size > 0 && (
                      <Badge className="ml-2 bg-white/20 text-current border-0 text-xs">
                        {favorites.size}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enhanced Results Summary */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="font-semibold">
                    Showing {filteredProducts.length} of {products.length} products
                  </span>
                  {searchQuery && (
                    <Badge variant="outline" className="font-semibold">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                  {categoryFilter !== 'all' && (
                    <Badge variant="outline" className="font-semibold capitalize">
                      Category: {categoryFilter}
                    </Badge>
                  )}
                  {showFavorites && (
                    <Badge variant="outline" className="font-semibold text-red-600 border-red-200">
                      Favorites Only
                    </Badge>
                  )}
                </div>
                
                {(searchQuery || categoryFilter !== 'all' || showFavorites) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setShowFavorites(false);
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Enhanced Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-20 text-center shadow-2xl border border-white/20">
              <div className="max-w-md mx-auto space-y-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <Search className="w-16 h-16 text-slate-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-slate-800">
                    {products.length === 0 ? 'No Products Yet' : 'No Matches Found'}
                  </h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {products.length === 0
                      ? 'This amazing store is being set up with incredible products. Check back soon for the latest arrivals!'
                      : 'We couldn\'t find any products matching your criteria. Try adjusting your search or browse our categories.'}
                  </p>
                </div>
                
                {(searchQuery || categoryFilter !== 'all' || showFavorites) && (
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setShowFavorites(false);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-4 rounded-2xl font-semibold"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Show All Products
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden bg-white/95 backdrop-blur-sm hover:bg-white transition-all duration-700 hover:shadow-2xl hover:scale-[1.03] cursor-pointer border-0 rounded-3xl relative"
                  style={{
                    animation: `slideUp 0.8s ease-out ${index * 0.1}s both`
                  }}
                  onClick={() => handleProductView(product)}
                  data-testid={`product-card-${product.id}`}
                >
                  {/* Product Image Container */}
                  <div className="relative overflow-hidden rounded-t-3xl">
                    <div className="aspect-square relative bg-gradient-to-br from-slate-100 to-slate-50">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        onLoad={(e) => handleImageLoad(product.id, e)}
                        onError={handleImageError}
                      />
                      
                      {/* Enhanced image overlay with shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-black/0 group-hover:from-black/10 transition-all duration-700"></div>
                      
                      {/* Premium quality warning */}
                      {lowResImages[product.id] && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-2 rounded-full font-bold shadow-lg">
                          ⚠️ Low Quality
                        </div>
                      )}
                      
                      {/* Enhanced Favorite Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`absolute top-4 right-4 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg ${
                          favorites.has(product.id) ? 'text-red-500 opacity-100 bg-red-50' : 'text-slate-600'
                        }`}
                        onClick={(e) => toggleFavorite(product.id, e)}
                        data-testid={`button-favorite-${product.id}`}
                      >
                        <Heart 
                          className="w-6 h-6" 
                          fill={favorites.has(product.id) ? 'currentColor' : 'none'} 
                        />
                      </Button>

                      {/* Enhanced Stock Status Badge */}
                      <div className="absolute bottom-4 left-4">
                        <Badge 
                          className={`font-bold text-sm px-3 py-2 shadow-lg ${
                            product.quantity > 10 
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' 
                              : product.quantity > 0 
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          }`}
                        >
                          {product.quantity > 10 
                            ? '✅ In Stock' 
                            : product.quantity > 0 
                            ? `⚠️ ${product.quantity} Left` 
                            : '❌ Sold Out'
                          }
                        </Badge>
                      </div>

                      {/* New/Featured Badge */}
                      {(Date.now() - (product.createdAt || 0)) < 7 * 24 * 60 * 60 * 1000 && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-2 rounded-full font-bold shadow-lg animate-pulse">
                          🆕 NEW
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Product Info */}
                  <CardContent className="p-6 space-y-5">
                    {/* Product Title and Description */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Enhanced Product Attributes */}
                    <div className="space-y-3">
                      {product.brand && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Brand:</span>
                          <Badge variant="secondary" className="text-xs font-bold bg-slate-100 text-slate-800">
                            {product.brand}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Attribute Pills */}
                      <div className="flex flex-wrap gap-2">
                        {product.condition && (
                          <Badge variant="outline" className="text-xs font-semibold capitalize bg-white">
                            {product.condition}
                          </Badge>
                        )}
                        {product.size && (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            Size {product.size}
                          </Badge>
                        )}
                        {product.color && (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {product.color}
                          </Badge>
                        )}
                        {product.material && (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {product.material}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Special Features */}
                      <div className="flex flex-wrap gap-2">
                        {product.isHandmade && (
                          <Badge className="text-xs bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200">
                            🎨 Handmade
                          </Badge>
                        )}
                        {product.isCustomizable && (
                          <Badge className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                            ⚙️ Customizable
                          </Badge>
                        )}
                        {product.madeToOrder && (
                          <Badge className="text-xs bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200">
                            📋 Made to Order
                          </Badge>
                        )}
                        {product.giftWrapping && (
                          <Badge className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                            🎁 Gift Wrap
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Price Section */}
                    <div className="flex items-end justify-between pt-4 border-t border-slate-100">
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text">
                          {formatPrice(product.price)}
                        </div>
                        <div className="text-xs text-slate-500">per unit</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 hover:from-blue-100 hover:to-indigo-100 px-4 py-2.5 text-sm font-bold border border-blue-200 transition-all duration-300 hover:scale-105"
                      >
                        📦 {product.category}
                      </Badge>
                    </div>
                    
                    {/* Premium WhatsApp Contact Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white transition-all duration-300 hover:shadow-xl font-bold py-4 rounded-2xl group-hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactProduct(product);
                      }}
                      data-testid={`button-whatsapp-${product.id}`}
                    >
                      <MessageCircle className="w-5 h-5 mr-3" />
                      Contact on WhatsApp
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Enhanced Footer */}
          <div className="text-center mt-20 py-16">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 max-w-2xl mx-auto shadow-2xl border border-white/20">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-800">
                    Powered by <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">ShopLink</span>
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Create your own beautiful online store in minutes, just like this one!
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  asChild
                  className="border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:scale-105 px-8 py-4 rounded-2xl font-bold bg-white/80 backdrop-blur-sm"
                  onClick={() => handleMarketingClick('footer_cta')}
                  size="lg"
                >
                  <a
                    href={`${SHOPLINK_MARKETING_URL}?utm_source=storefront&utm_medium=footer&utm_campaign=public&seller=${sellerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Create Your Store Free
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Ultra-Premium Floating WhatsApp Button */}
        {showChatFab && seller.whatsappNumber && (
          <button
            onClick={handleFloatingChatClick}
            className="fixed bottom-8 right-8 w-18 h-18 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-500 hover:scale-110 animate-float group"
            aria-label="Chat with seller on WhatsApp"
            style={{
              animation: 'float 4s ease-in-out infinite'
            }}
          >
            <div className="relative">
              <MessageCircle className="w-8 h-8" />
              {/* Notification dot with pulse */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg">
                <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping"></div>
              </div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
              <div className="bg-black/90 text-white text-sm font-semibold px-4 py-2 rounded-xl whitespace-nowrap shadow-xl">
                Chat with {seller.storeName}
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
          </button>
        )}
        
        {/* Enhanced Contact Success Notification */}
        {contactNotification.show && (
          <div className="fixed top-8 right-8 z-50 max-w-sm animate-slideUp">
            <Card className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-2xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-lg">Message Sent! 📱</h4>
                    <p className="text-sm opacity-95 leading-relaxed">
                      Opening WhatsApp to continue your conversation about <strong>{contactNotification.product?.name}</strong>. The seller will respond soon!
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContactNotification({show: false, product: null})}
                    className="text-white hover:bg-white/20 p-2 h-8 w-8 rounded-full flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
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
                    src={getProductImageUrl(selectedProduct)}
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
              
              {/* Ultra-Premium Product Details */}
              <CardContent className="p-10 space-y-8">
                {/* Enhanced Header Section */}
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-3">
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-800 leading-tight">
                          {selectedProduct.name}
                        </h2>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 font-bold px-4 py-2 text-lg border border-blue-200">
                            📦 {selectedProduct.category}
                          </Badge>
                          {(Date.now() - (selectedProduct.createdAt || 0)) < 7 * 24 * 60 * 60 * 1000 && (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold px-4 py-2 text-lg animate-pulse">
                              🆕 NEW ARRIVAL
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:text-right space-y-2">
                      <div className="text-5xl lg:text-6xl font-black text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text">
                        {formatPrice(selectedProduct.price)}
                      </div>
                      <div className="text-lg text-slate-500 font-semibold">per unit</div>
                    </div>
                  </div>
                  
                  {/* Enhanced Stock Status */}
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200">
                    <div className={`w-6 h-6 rounded-full shadow-lg ${
                      selectedProduct.quantity > 10 ? 'bg-emerald-500' :
                      selectedProduct.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <div className="w-full h-full rounded-full animate-pulse opacity-50"></div>
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-xl text-slate-800">
                        {selectedProduct.quantity > 10 ? '✅ In Stock & Ready to Ship' :
                         selectedProduct.quantity > 0 ? `⚠️ Limited Stock - Only ${selectedProduct.quantity} Left` : 
                         '❌ Currently Out of Stock'}
                      </span>
                      <p className="text-slate-600 mt-1">
                        {selectedProduct.quantity > 0 
                          ? `${selectedProduct.quantity} ${selectedProduct.quantity === 1 ? 'unit' : 'units'} available for immediate purchase`
                          : 'Contact seller for restocking information'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Description */}
                {selectedProduct.description && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      Product Description
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
                
                {/* Ultra-Enhanced Product Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: 'Brand', value: selectedProduct.brand, icon: '🏷️' },
                    { label: 'Condition', value: selectedProduct.condition, icon: '⭐' },
                    { label: 'Size', value: selectedProduct.size, icon: '📏' },
                    { label: 'Color', value: selectedProduct.color, icon: '🎨' },
                    { label: 'Material', value: selectedProduct.material, icon: '🧵' },
                    { label: 'Chain Length', value: selectedProduct.chainLength, icon: '📐' },
                    { label: 'Pendant Size', value: selectedProduct.pendantSize, icon: '💎' },
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="p-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>
                      <p className="font-bold text-xl text-slate-800 capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Enhanced Special Features */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    Special Features
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {selectedProduct.isHandmade && (
                      <Badge className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-6 py-3 text-lg font-bold border-2 border-orange-200">
                        🎨 Handcrafted with Care
                      </Badge>
                    )}
                    {selectedProduct.isCustomizable && (
                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-6 py-3 text-lg font-bold border-2 border-blue-200">
                        ⚙️ Fully Customizable
                      </Badge>
                    )}
                    {selectedProduct.madeToOrder && (
                      <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 px-6 py-3 text-lg font-bold border-2 border-purple-200">
                        📋 Made to Order
                      </Badge>
                    )}
                    {selectedProduct.giftWrapping && (
                      <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-3 text-lg font-bold border-2 border-green-200">
                        🎁 Gift Wrapping Available
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
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