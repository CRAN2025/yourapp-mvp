import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ref, get } from 'firebase/database';
import { Search, Heart, MessageCircle, ChevronDown, X, ArrowLeft, CreditCard, Truck, MapPin, Phone, Info, Star, Clock, Globe, CheckCircle } from 'lucide-react';
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

  // Image quality detection
  const MIN_WIDTH = 600;
  const MIN_HEIGHT = 600;
  
  const handleImageLoad = (productId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
      setLowResImages(prev => ({ ...prev, [productId]: true }));
    }
  };

  // Premium placeholder for missing images
  const PREMIUM_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eef2ff"/>
          <stop offset="50%" stop-color="#e0f2fe"/>
          <stop offset="100%" stop-color="#e6fffb"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#gradient)"/>
      <g fill="#64748b" font-family="Arial, sans-serif">
        <text x="50%" y="45%" font-size="32" text-anchor="middle" font-weight="600">No Image Available</text>
        <text x="50%" y="55%" font-size="16" text-anchor="middle" opacity="0.7">Upload a clear 1200×900 image for best results</text>
      </g>
    </svg>
  `)}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = PREMIUM_PLACEHOLDER;
  };

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('favorites');
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
  }, []);

  // Handle floating chat button visibility with smooth transitions
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 300 || window.innerWidth > 768;
      setShowChatFab(shouldShow);
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Handle product deep linking
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && products.length > 0) {
      const product = products.find(p => p.id === hash);
      if (product) {
        setSelectedProduct(product);
        setShowProductModal(true);
      }
    }
  }, [products]);

  // Handle ESC key for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProductModal(false);
        setShowPaymentModal(false);
        setShowDeliveryModal(false);
        setContactNotification({show: false, product: null});
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-dismiss contact notification
  useEffect(() => {
    if (contactNotification.show) {
      const timer = setTimeout(() => {
        setContactNotification({show: false, product: null});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [contactNotification.show]);

  // Load seller and products data
  useEffect(() => {
    if (!sellerId) return;

    const loadStoreData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load seller data
        const sellerRef = ref(database, `sellers/${sellerId}`);
        const sellerSnapshot = await get(sellerRef);
        
        if (!sellerSnapshot.exists()) {
          setError('Store not found');
          return;
        }

        const sellerData = sellerSnapshot.val();
        setSeller(sellerData);

        // Load products
        const productsRef = ref(database, `sellers/${sellerId}/products`);
        const productsSnapshot = await get(productsRef);

        if (productsSnapshot.exists()) {
          const data = productsSnapshot.val();
          const productsList = Object.entries(data).map(([id, productData]) => ({
            id,
            ...(productData as Omit<Product, 'id'>),
          })).filter(product => product.isActive && product.quantity > 0);
          
          // Sort by creation date initially
          productsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setProducts(productsList);
        }

        // Track store view
        await trackInteraction({
          type: 'store_view',
          sellerId,
        });

      } catch (error) {
        console.error('Error loading store:', error);
        setError('Failed to load store');
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [sellerId]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesFavorites = !showFavorites || favorites.has(product.id);
      
      return matchesSearch && matchesCategory && matchesFavorites;
    });

    // Sort products
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
        // Sort by views if available, otherwise by creation date
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, showFavorites, favorites, sortBy]);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category)));

  const toggleFavorite = (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
    
    // Save to localStorage
    try {
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }

    // Add heartbeat animation
    if (e?.target) {
      const button = (e.target as HTMLElement).closest('button');
      if (button) {
        button.style.animation = 'heartBeat 0.6s ease-in-out';
        setTimeout(() => {
          button.style.animation = '';
        }, 600);
      }
    }
  };

  const handleProductView = async (product: Product) => {
    try {
      await trackInteraction({
        type: 'product_view',
        sellerId: sellerId!,
        productId: product.id,
        metadata: {
          productName: product.name,
          productPrice: product.price,
        },
      });
      
      setSelectedProduct(product);
      setShowProductModal(true);
      
      // Update URL hash for deep linking
      window.history.pushState(null, '', `#${product.id}`);
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  const handleFloatingChatClick = async () => {
    if (!seller?.whatsappNumber || !sellerId) return;
    
    try {
      await trackInteraction({
        type: 'store_contact',
        sellerId,
      });
      
      const storeUrl = `${window.location.origin}/store/${sellerId}`;
      const message = `👋 Hi! I'm interested in your products at *${seller.storeName}*.\nCould you share availability, payment, and delivery options?\n\n🔗 ${storeUrl}`;
      
      openWhatsApp(seller.whatsappNumber, message);
    } catch (error) {
      console.error('Error contacting seller:', error);
    }
  };

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
        },
      });
      
      const message = createWhatsAppMessage({
        storeName: seller.storeName,
        productName: product.name,
        productId: product.id,
        url: `${window.location.origin}/store/${sellerId}`,
      });
      
      const productUrl = `${window.location.origin}/store/${sellerId}#${product.id}`;
      const fullMessage = `${message}\n\n🔗 ${productUrl}`;
      
      openWhatsApp(seller.whatsappNumber, fullMessage);
      
      // Show notification on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          setContactNotification({show: true, product});
        }, 1000);
      }
    } catch (error) {
      console.error('Error contacting seller:', error);
    }
  };

  const handleMarketingClick = () => {
    try {
      // Track marketing CTA clicks
      if (typeof gtag !== 'undefined') {
        gtag('event', 'marketing_cta_click', { sellerId });
      }
    } catch (error) {
      console.error('Error tracking marketing click:', error);
    }
  };

  // Helper functions for payment and delivery
  const paymentMethods = useMemo(() => {
    if (!seller?.paymentMethods) return [];
    return Array.isArray(seller.paymentMethods) 
      ? seller.paymentMethods.filter(Boolean) 
      : Object.entries(seller.paymentMethods)
          .filter(([, value]) => !!value)
          .map(([key]) => key);
  }, [seller?.paymentMethods]);

  const deliveryOptions = useMemo(() => {
    if (!seller?.deliveryOptions) return [];
    return Array.isArray(seller.deliveryOptions) 
      ? seller.deliveryOptions.filter(Boolean)
      : Object.entries(seller.deliveryOptions)
          .filter(([, value]) => !!value)
          .map(([key]) => key);
  }, [seller?.deliveryOptions]);

  const getPaymentIcon = (method: string) => {
    const key = method.toLowerCase();
    if (key.includes('mobile') || key.includes('momo')) return '📱';
    if (key.includes('card')) return '💳';
    if (key.includes('bank')) return '🏦';
    if (key.includes('cash')) return '💵';
    if (key.includes('pos')) return '🧾';
    if (key.includes('paypal')) return '🅿️';
    return '💳';
  };

  const getPaymentLabel = (method: string) => {
    const key = method.toLowerCase();
    if (key.includes('mobile') || key.includes('momo')) return 'Mobile Money';
    if (key.includes('card')) return 'Card Payment';
    if (key.includes('bank')) return 'Bank Transfer';
    if (key.includes('cash')) return 'Cash Payment';
    if (key.includes('pos')) return 'POS Terminal';
    if (key.includes('paypal')) return 'PayPal';
    return method;
  };

  const getDeliveryIcon = (option: string) => {
    const key = option.toLowerCase();
    if (key.includes('pickup')) return '🧍';
    if (key.includes('local')) return '🚲';
    if (key.includes('courier')) return '🚚';
    if (key.includes('nation')) return '🛣️';
    if (key.includes('inter')) return '✈️';
    return '🚚';
  };

  const getDeliveryLabel = (option: string) => {
    const key = option.toLowerCase();
    if (key.includes('pickup')) return 'Self Pickup';
    if (key.includes('local')) return 'Local Delivery';
    if (key.includes('courier')) return 'Courier Service';
    if (key.includes('nation')) return 'Nationwide Shipping';
    if (key.includes('inter')) return 'International Shipping';
    return option;
  };

  // Loading state with premium design
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold text-gray-800">Loading Store...</h3>
              <p className="text-gray-600">Please wait while we fetch the latest products</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Store Not Found</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
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
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Premium Store Header */}
        <header className="relative">
          {/* Banner Background */}
          <div 
            className="h-48 md:h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 relative overflow-hidden"
            style={seller.bannerUrl ? {
              backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3)), url(${seller.bannerUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          >
            {/* Overlay pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          </div>

          {/* Store Info Card */}
          <div className="max-w-6xl mx-auto px-4 relative">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 -mt-24 relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Store Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl border-4 border-white">
                    {seller.logoUrl ? (
                      <img
                        src={seller.logoUrl}
                        alt={seller.storeName}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {seller.storeName[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Store Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                      {seller.storeName}
                    </h1>
                    {seller.storeDescription && (
                      <p className="text-gray-600 text-lg leading-relaxed line-clamp-2">
                        {seller.storeDescription}
                      </p>
                    )}
                  </div>

                  {/* Info Badges */}
                  <div className="flex flex-wrap gap-3">
                    {(seller.city || seller.country) && (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2 text-sm font-semibold">
                        <MapPin className="w-4 h-4 mr-2" />
                        {seller.city ? `${seller.city}, ${seller.country}` : seller.country}
                      </Badge>
                    )}
                    
                    {paymentMethods.length > 0 && (
                      <Badge 
                        className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer px-4 py-2 text-sm font-semibold transition-all hover:scale-105"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {paymentMethods.length} Payment Methods
                      </Badge>
                    )}
                    
                    {deliveryOptions.length > 0 && (
                      <Badge 
                        className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer px-4 py-2 text-sm font-semibold transition-all hover:scale-105"
                        onClick={() => setShowDeliveryModal(true)}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        {deliveryOptions.length} Delivery Options
                      </Badge>
                    )}

                    {seller.currency && (
                      <Badge className="bg-orange-100 text-orange-800 px-4 py-2 text-sm font-semibold">
                        <Globe className="w-4 h-4 mr-2" />
                        {seller.currency} Currency
                      </Badge>
                    )}

                    <Badge className="bg-emerald-100 text-emerald-800 px-4 py-2 text-sm font-semibold">
                      <Clock className="w-4 h-4 mr-2" />
                      Usually responds within 2 hours
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Button
                      onClick={handleFloatingChatClick}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      size="lg"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Chat with seller on WhatsApp
                    </Button>
                    
                    <Button
                      variant="outline"
                      asChild
                      className="border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                      size="lg"
                      onClick={handleMarketingClick}
                    >
                      <a
                        href={SHOPLINK_MARKETING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Star className="w-5 h-5 mr-2" />
                        Create your own store like this
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Search and Filters Section */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <Card className="bg-white/90 backdrop-blur-lg shadow-xl border border-white/20 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                  data-testid="input-search-products"
                />
              </div>
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500" data-testid="select-category">
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
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Favorites Filter */}
              <Button
                variant={showFavorites ? 'default' : 'outline'}
                onClick={() => setShowFavorites(!showFavorites)}
                className={`h-12 rounded-xl font-semibold transition-all duration-300 ${
                  showFavorites 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                    : 'border-2 border-gray-200 hover:bg-red-50 hover:border-red-300'
                }`}
                data-testid="button-favorites"
              >
                <Heart className={`w-5 h-5 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
                Favorites ({favorites.size})
              </Button>
            </div>
          </Card>
        </section>

        {/* Products Grid */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          {filteredProducts.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-lg shadow-xl border border-white/20 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {products.length === 0 ? "No products available" : "No products found"}
              </h3>
              <p className="text-gray-600 text-lg">
                {products.length === 0
                  ? "This store doesn't have any products yet. Check back later!"
                  : "Try adjusting your search or filter criteria to find what you're looking for."}
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden bg-white/90 backdrop-blur-lg shadow-xl border border-white/20 rounded-3xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer"
                  onClick={() => handleProductView(product)}
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="relative">
                    <div className="aspect-square overflow-hidden rounded-t-3xl">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onLoad={(e) => handleImageLoad(product.id, e)}
                        onError={handleImageError}
                      />
                    </div>
                    
                    {/* Low res warning */}
                    {lowResImages[product.id] && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full font-semibold text-xs">
                        ⚠️ Low Quality
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                        favorites.has(product.id) ? 'text-red-500 opacity-100' : 'text-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id, e);
                      }}
                      data-testid={`button-favorite-${product.id}`}
                    >
                      <Heart className="w-5 h-5" fill={favorites.has(product.id) ? 'currentColor' : 'none'} />
                    </Button>

                    {/* Stock Badge */}
                    <div className="absolute bottom-3 left-3">
                      <Badge className={`font-semibold text-xs ${
                        product.quantity > 10 
                          ? 'bg-green-500 text-white'
                          : product.quantity > 0 
                            ? 'bg-yellow-500 text-black'
                            : 'bg-red-500 text-white'
                      }`}>
                        {product.quantity > 10 ? '✅ In Stock' :
                         product.quantity > 0 ? '⚠️ Low Stock' : '❌ Out of Stock'}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Product Features */}
                    <div className="flex flex-wrap gap-2">
                      {product.brand && (
                        <Badge variant="secondary" className="text-xs font-semibold">
                          🏷️ {product.brand}
                        </Badge>
                      )}
                      {product.condition && (
                        <Badge variant="outline" className="text-xs font-semibold capitalize">
                          {product.condition}
                        </Badge>
                      )}
                      {product.isHandmade && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs font-semibold">
                          🎨 Handmade
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(product.price)}
                        </div>
                        <div className="text-xs text-gray-500">per unit</div>
                      </div>
                      <Badge variant="outline" className="font-semibold">
                        📦 {product.category}
                      </Badge>
                    </div>
                    
                    {/* WhatsApp Button */}
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-3 font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactProduct(product);
                      }}
                      data-testid={`button-whatsapp-${product.id}`}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contact Seller
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
        
        {/* Floating Chat Button */}
        {showChatFab && seller.whatsappNumber && (
          <button
            onClick={handleFloatingChatClick}
            className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 hover:scale-110 animate-float"
            aria-label="Chat with store owner"
          >
            <MessageCircle className="w-8 h-8" />
          </button>
        )}
        
        {/* Contact Notification */}
        {contactNotification.show && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-sm animate-slideUp">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Message sent!</p>
                <p className="text-xs opacity-90 mt-1">
                  Check WhatsApp to continue your conversation about {contactNotification.product?.name}.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Methods Modal */}
        {showPaymentModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={() => setShowPaymentModal(false)}
          >
            <Card 
              className="max-w-md w-full bg-white shadow-2xl border-0 rounded-3xl animate-slideUp" 
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    Payment Methods
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowPaymentModal(false)}
                    className="hover:bg-gray-100 rounded-full p-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                        {getPaymentIcon(method)}
                      </div>
                      <span className="font-semibold text-gray-800">{getPaymentLabel(method)}</span>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && (
                    <div className="text-center py-8">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Payment methods will be discussed when you contact the seller.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Delivery Options Modal */}
        {showDeliveryModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={() => setShowDeliveryModal(false)}
          >
            <Card 
              className="max-w-md w-full bg-white shadow-2xl border-0 rounded-3xl animate-slideUp" 
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-purple-600" />
                    </div>
                    Delivery Options
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDeliveryModal(false)}
                    className="hover:bg-gray-100 rounded-full p-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {deliveryOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                        {getDeliveryIcon(option)}
                      </div>
                      <span className="font-semibold text-gray-800">{getDeliveryLabel(option)}</span>
                    </div>
                  ))}
                  {deliveryOptions.length === 0 && (
                    <div className="text-center py-8">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Delivery options will be discussed when you contact the seller.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Product Detail Modal */}
        {showProductModal && selectedProduct && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={() => setShowProductModal(false)}
          >
            <Card 
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white shadow-2xl border-0 rounded-3xl animate-slideUp" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Product Image Header */}
              <div className="relative">
                <div className="aspect-video relative overflow-hidden rounded-t-3xl">
                  <img
                    src={getProductImageUrl(selectedProduct)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onLoad={(e) => handleImageLoad(selectedProduct.id, e)}
                    onError={handleImageError}
                  />
                  
                  {/* Low res warning */}
                  {lowResImages[selectedProduct.id] && (
                    <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-2 rounded-full font-semibold text-sm">
                      ⚠️ Low Quality Image
                    </div>
                  )}
                  
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProductModal(false)}
                    className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  
                  {/* Favorite Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                    className={`absolute top-4 left-4 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full ${
                      favorites.has(selectedProduct.id) ? 'text-red-500' : 'text-gray-600'
                    }`}
                  >
                    <Heart 
                      className="w-6 h-6" 
                      fill={favorites.has(selectedProduct.id) ? 'currentColor' : 'none'} 
                    />
                  </Button>
                </div>
              </div>
              
              {/* Product Details */}
              <CardContent className="p-8 space-y-6">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h2>
                      <Badge variant="outline" className="font-semibold">
                        📦 {selectedProduct.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-green-600 mb-1">
                        {formatPrice(selectedProduct.price)}
                      </div>
                      <div className="text-sm text-gray-500">per unit</div>
                    </div>
                  </div>
                  
                  {/* Stock Status */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className={`w-4 h-4 rounded-full ${
                      selectedProduct.quantity > 10 ? 'bg-green-500' :
                      selectedProduct.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-semibold">
                      {selectedProduct.quantity > 10 ? '✅ In Stock' :
                       selectedProduct.quantity > 0 ? '⚠️ Low Stock' : '❌ Out of Stock'}
                    </span>
                    <span className="text-gray-600">
                      ({selectedProduct.quantity} {selectedProduct.quantity === 1 ? 'unit' : 'units'} available)
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-800">📝 Description</h3>
                    <p className="text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                  </div>
                )}
                
                {/* Product Attributes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Brand', value: selectedProduct.brand },
                    { label: 'Condition', value: selectedProduct.condition },
                    { label: 'Size', value: selectedProduct.size },
                    { label: 'Color', value: selectedProduct.color },
                    { label: 'Material', value: selectedProduct.material },
                    { label: 'Chain Length', value: selectedProduct.chainLength },
                    { label: 'Pendant Size', value: selectedProduct.pendantSize },
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="space-y-1">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        {item.label}
                      </span>
                      <p className="font-semibold text-gray-800 capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Special Features */}
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.isHandmade && (
                    <Badge className="bg-orange-100 text-orange-800 px-4 py-2">🎨 Handmade</Badge>
                  )}
                  {selectedProduct.isCustomizable && (
                    <Badge className="bg-blue-100 text-blue-800 px-4 py-2">⚙️ Customizable</Badge>
                  )}
                  {selectedProduct.madeToOrder && (
                    <Badge className="bg-purple-100 text-purple-800 px-4 py-2">📋 Made to Order</Badge>
                  )}
                  {selectedProduct.giftWrapping && (
                    <Badge className="bg-green-100 text-green-800 px-4 py-2">🎁 Gift Wrapping Available</Badge>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => handleContactProduct(selectedProduct)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 py-4 text-lg font-semibold rounded-xl"
                  >
                    <MessageCircle className="w-6 h-6 mr-3" />
                    Contact Seller on WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                    className="px-8 py-4 border-2 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all duration-300"
                  >
                    <Heart 
                      className={`w-6 h-6 ${favorites.has(selectedProduct.id) ? 'fill-current text-red-500' : 'text-gray-400'}`} 
                    />
                    <span className="ml-2 font-semibold">
                      {favorites.has(selectedProduct.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}