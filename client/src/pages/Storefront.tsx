import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { ref, onValue, off, get } from 'firebase/database';
import { ExternalLink, Eye, Search, Heart, RefreshCw, X, MessageCircle, ChevronDown, ArrowLeft, CreditCard, Truck, MapPin, Phone, Info, Star, Clock, Globe, CheckCircle, Sparkles, Award, Shield, Zap, Share2, UserPlus, Filter, Instagram, Facebook, ArrowUpRight, Loader2 } from 'lucide-react';
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
  
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
    return '';
  }
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  let handle = trimmed;
  if (handle.startsWith('@')) {
    handle = handle.slice(1);
  }
  
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

// Championship Full-Width Container
const FullWidthContainer = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`w-full max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 xl:px-32 ${className}`}>
    {children}
  </div>
);

// Advanced Skeleton Loading Component
const ProductCardSkeleton = () => (
  <div className="championship-card-skeleton">
    <div className="championship-skeleton-image"></div>
    <div className="championship-skeleton-content">
      <div className="championship-skeleton-title"></div>
      <div className="championship-skeleton-brand"></div>
      <div className="championship-skeleton-price"></div>
      <div className="championship-skeleton-category"></div>
      <div className="championship-skeleton-buttons">
        <div className="championship-skeleton-btn-primary"></div>
        <div className="championship-skeleton-btn-secondary"></div>
      </div>
    </div>
  </div>
);

export default function Storefront() {
  const { user, seller } = useAuthContext();
  
  // Check if current user is the store owner
  const isOwner = user && seller && user.uid === seller.id;
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
  
  // Advanced loading states
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [cardLoadingStates, setCardLoadingStates] = useState<Record<string, boolean>>({});
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Enhanced image quality detection
  const MIN_WIDTH = 800;
  const MIN_HEIGHT = 600;
  
  const handleImageLoad = (productId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageLoadingStates(prev => ({ ...prev, [productId]: false }));
    
    if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
      setLowResImages(prev => ({ ...prev, [productId]: true }));
    }
  };

  const handleImageStart = (productId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [productId]: true }));
  };

  const PLACEHOLDER_IMAGE = '/placeholder-product.png';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    const productId = target.getAttribute('data-product-id');
    if (productId) {
      setImageLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
    target.src = PLACEHOLDER_IMAGE;
  };

  // Memoized favorites key
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

  // Enhanced filtering logic
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(Boolean);
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.brand,
        product.material,
        product.color,
        (product as any).tags?.join(' '),
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchTerms.length === 0 || 
        searchTerms.every(term => 
          searchableText.includes(term) || 
          searchableText.split(' ').some(word => 
            word.includes(term) || term.includes(word)
          )
        );
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesFavorites = !showFavorites || favorites.has(product.id);
      
      return matchesSearch && matchesCategory && matchesFavorites;
    });

    // Enhanced sorting
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

  // Enhanced category extraction
  const categories = useMemo(() => {
    const categoryCount = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);
  }, [products]);

  // Enhanced favorite toggling
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
    
    // Advanced animation
    if (e?.target) {
      const button = (e.target as HTMLElement).closest('button');
      if (button) {
        button.style.transform = 'scale(0.85)';
        button.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
          button.style.transform = 'scale(1.15)';
          setTimeout(() => {
            button.style.transform = 'scale(1)';
            button.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          }, 120);
        }, 100);
      }
    }
    
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
    
    return options.sort((a, b) => {
      const order = ['pickup', 'local', 'courier', 'nationwide', 'international'];
      const aIndex = order.findIndex(o => a.toLowerCase().includes(o));
      const bIndex = order.findIndex(o => b.toLowerCase().includes(o));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }, [seller?.deliveryOptions]);

  // Enhanced product view with analytics
  const handleProductView = async (product: Product) => {
    setCardLoadingStates(prev => ({ ...prev, [product.id]: true }));
    
    try {
      setSelectedProduct(product);
      setShowProductModal(true);
      window.history.pushState(null, '', `#${product.id}`);
    } catch (error) {
      console.error('Error viewing product:', error);
      setSelectedProduct(product);
      setShowProductModal(true);
    } finally {
      setCardLoadingStates(prev => ({ ...prev, [product.id]: false }));
    }
  };

  // Quick view functionality
  const handleQuickView = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  // Enhanced contact product functionality
  const handleContactProduct = async (product: Product) => {
    setCardLoadingStates(prev => ({ ...prev, [`contact-${product.id}`]: true }));
    
    try {
      if (!seller?.whatsappNumber) {
        toast({
          title: 'WhatsApp Required',
          description: 'Add your WhatsApp number in Settings to enable customer contact.',
          variant: 'destructive',
        });
        return;
      }

      // Show contact notification for preview
      setContactNotification({ show: true, product });
      setTimeout(() => {
        setContactNotification({ show: false, product: null });
      }, 3000);

      toast({
        title: 'Preview Mode',
        description: 'This is how customers will contact you about this product.',
      });
    } catch (error) {
      console.error('Error in contact preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to preview contact feature.',
        variant: 'destructive',
      });
    } finally {
      setCardLoadingStates(prev => ({ ...prev, [`contact-${product.id}`]: false }));
    }
  };

  // Championship Loading State
  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}>
          <div className="text-center space-y-8 p-16 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 max-w-md">
            <div className="relative">
              <div className="w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-white"></div>
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Loading Preview
              </h2>
              <p className="text-slate-600 font-medium text-lg">
                Preparing your storefront preview...
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        /* ULTIMATE CHAMPIONSHIP DESIGN SYSTEM FOR SELLER PREVIEW */
        :root {
          --championship-blue: #1d4ed8;
          --championship-blue-light: #3b82f6;
          --championship-blue-lighter: #60a5fa;
          --championship-gradient: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
          --championship-shadow: 0 10px 40px rgba(29, 78, 216, 0.15);
          --championship-shadow-hover: 0 20px 60px rgba(29, 78, 216, 0.25);
          --whatsapp-green: #25d366;
          --whatsapp-green-hover: #22c55e;
          --glass-bg: rgba(255, 255, 255, 0.95);
          --glass-border: rgba(255, 255, 255, 0.3);
        }
        
        /* ADVANCED ANIMATIONS */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes shimmerFlow {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        
        @keyframes morphBorder {
          0%, 100% { border-radius: 32px; }
          33% { border-radius: 40px 20px 40px 20px; }
          66% { border-radius: 20px 40px 20px 40px; }
        }
        
        @keyframes floatingGlow {
          0%, 100% { box-shadow: 0 8px 32px rgba(29, 78, 216, 0.15); }
          50% { box-shadow: 0 16px 48px rgba(29, 78, 216, 0.25); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        /* ULTIMATE SEARCH BAR */
        .ultimate-search {
          position: relative;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .ultimate-search::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: var(--championship-gradient);
          border-radius: 36px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
        }
        
        .ultimate-search:focus-within::before {
          opacity: 1;
          animation: floatingGlow 2s ease-in-out infinite;
        }
        
        .ultimate-search-input {
          width: 100%;
          height: 72px;
          padding: 0 80px 0 80px;
          background: var(--glass-bg);
          backdrop-filter: blur(24px);
          border: 2px solid transparent;
          border-radius: 36px;
          font-size: 20px;
          font-weight: 500;
          color: #1f2937;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 12px 40px rgba(29, 78, 216, 0.08);
          position: relative;
          z-index: 2;
        }
        
        .ultimate-search-input:focus {
          outline: none;
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(29, 78, 216, 0.15);
        }
        
        .ultimate-search-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }
        
        .ultimate-search-icon {
          position: absolute;
          left: 28px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--championship-blue);
          transition: all 0.3s ease;
          z-index: 3;
        }
        
        .ultimate-search:focus-within .ultimate-search-icon {
          color: var(--championship-blue-light);
          transform: translateY(-50%) scale(1.1);
        }
        
        .ultimate-search-clear {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(71, 85, 105, 0.1);
          color: #64748b;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
        }
        
        .ultimate-search-clear:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          transform: translateY(-50%) scale(1.15) rotate(90deg);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
        }
        
        /* ULTIMATE FILTER SYSTEM */
        .ultimate-filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          padding: 40px 0;
          flex-wrap: wrap;
        }
        
        .ultimate-categories {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        
        .ultimate-category-label {
          font-size: 18px;
          font-weight: 800;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }
        
        .ultimate-category-label::after {
          content: '';
          width: 4px;
          height: 24px;
          background: var(--championship-gradient);
          border-radius: 2px;
          margin-left: 8px;
        }
        
        .ultimate-category-pill {
          padding: 16px 28px;
          border-radius: 24px;
          font-size: 16px;
          font-weight: 700;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          white-space: nowrap;
          letter-spacing: 0.025em;
        }
        
        .ultimate-category-pill-inactive {
          background: var(--glass-bg);
          color: #64748b;
          border-color: rgba(226, 232, 240, 0.8);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
          backdrop-filter: blur(16px);
        }
        
        .ultimate-category-pill-inactive:hover {
          background: rgba(239, 246, 255, 0.98);
          color: var(--championship-blue);
          border-color: rgba(29, 78, 216, 0.4);
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 32px rgba(29, 78, 216, 0.12);
        }
        
        .ultimate-category-pill-active {
          background: var(--championship-gradient);
          color: white;
          border-color: var(--championship-blue);
          box-shadow: var(--championship-shadow);
          transform: translateY(-2px);
          animation: morphBorder 4s ease-in-out infinite;
        }
        
        .ultimate-category-pill-active::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmerFlow 3s infinite;
        }
        
        .ultimate-category-pill-active:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: var(--championship-shadow-hover);
        }
        
        /* ULTIMATE CONTROLS */
        .ultimate-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .ultimate-select {
          min-width: 240px;
          height: 56px;
          padding: 0 24px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(226, 232, 240, 0.6);
          border-radius: 20px;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
          appearance: none;
        }
        
        .ultimate-select:hover {
          border-color: rgba(29, 78, 216, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(29, 78, 216, 0.1);
        }
        
        .ultimate-favorites {
          height: 56px;
          padding: 0 28px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(226, 232, 240, 0.6);
          border-radius: 20px;
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        
        .ultimate-favorites:hover {
          border-color: rgba(239, 68, 68, 0.5);
          color: #ef4444;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.15);
        }
        
        .ultimate-favorites-active {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-color: #ef4444;
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.3);
          transform: translateY(-2px);
        }
        
        .ultimate-favorites-badge {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #92400e;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 4px 16px rgba(251, 191, 36, 0.4);
          animation: pulse 2s infinite;
        }
        
        /* ULTIMATE PRODUCT GRID */
        .ultimate-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 40px;
          padding: 48px 0;
        }
        
        /* ULTIMATE PRODUCT CARDS */
        .ultimate-card {
          background: linear-gradient(145deg, #ffffff 0%, #fdfdfd 100%);
          border-radius: 32px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 12px 48px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.8);
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ultimate-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 32px 64px rgba(15, 23, 42, 0.16);
          border-color: rgba(29, 78, 216, 0.3);
        }
        
        .ultimate-card-image-container {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        
        .ultimate-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ultimate-card:hover .ultimate-card-image {
          transform: scale(1.1) rotate(1deg);
        }
        
        .ultimate-quick-actions {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transform: translateY(-8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ultimate-card:hover .ultimate-quick-actions {
          opacity: 1;
          transform: translateY(0);
        }
        
        .ultimate-quick-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ultimate-quick-btn:hover {
          background: rgba(29, 78, 216, 0.1);
          color: var(--championship-blue);
          transform: scale(1.1);
          box-shadow: 0 8px 24px rgba(29, 78, 216, 0.2);
        }
        
        .ultimate-favorite-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        
        .ultimate-favorite-btn:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.15);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.25);
        }
        
        .ultimate-badge-overlay {
          position: absolute;
          bottom: 16px;
          left: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .ultimate-badge {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          backdrop-filter: blur(8px);
        }
        
        .ultimate-badge-new {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        }
        
        .ultimate-badge-limited {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }
        
        .ultimate-badge-featured {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }
        
        .ultimate-card-content {
          padding: 28px;
        }
        
        .ultimate-card-title {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          line-height: 1.3;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .ultimate-card-brand {
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .ultimate-card-price {
          font-size: 28px;
          font-weight: 900;
          color: #111827;
          margin-bottom: 16px;
          background: var(--championship-gradient);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .ultimate-card-category {
          margin-bottom: 24px;
        }
        
        .ultimate-card-category span {
          display: inline-block;
          padding: 8px 16px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          color: #374151;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .ultimate-card-actions {
          display: flex;
          gap: 12px;
        }
        
        .ultimate-whatsapp-btn {
          flex: 1;
          height: 52px;
          background: linear-gradient(135deg, var(--whatsapp-green) 0%, var(--whatsapp-green-hover) 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        
        .ultimate-whatsapp-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(37, 211, 102, 0.4);
        }
        
        .ultimate-whatsapp-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .ultimate-whatsapp-btn:hover::before {
          left: 100%;
        }
        
        .ultimate-details-btn {
          width: 52px;
          height: 52px;
          background: rgba(29, 78, 216, 0.1);
          color: var(--championship-blue);
          border: 2px solid rgba(29, 78, 216, 0.2);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ultimate-details-btn:hover {
          background: rgba(29, 78, 216, 0.15);
          border-color: rgba(29, 78, 216, 0.4);
          transform: translateY(-2px) scale(1.05);
        }
        
        .ultimate-loading-btn {
          opacity: 0.7;
          pointer-events: none;
        }
        
        /* ULTIMATE EMPTY STATE */
        .ultimate-empty {
          text-align: center;
          padding: 120px 40px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 40px;
          border: 2px dashed #cbd5e1;
          margin: 48px 0;
        }
        
        .ultimate-clear-btn {
          padding: 16px 32px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
        }
        
        .ultimate-clear-btn:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 16px 40px rgba(239, 68, 68, 0.4);
        }
        
        /* SKELETON LOADING SYSTEM */
        .championship-card-skeleton {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 28px;
          overflow: hidden;
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .championship-skeleton-image {
          aspect-ratio: 1;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmerFlow 2s infinite;
        }
        
        .championship-skeleton-content {
          padding: 24px;
          space-y: 16px;
        }
        
        .championship-skeleton-title,
        .championship-skeleton-brand,
        .championship-skeleton-price,
        .championship-skeleton-category {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmerFlow 2s infinite;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        
        .championship-skeleton-title {
          height: 24px;
          width: 80%;
        }
        
        .championship-skeleton-brand {
          height: 16px;
          width: 60%;
        }
        
        .championship-skeleton-price {
          height: 32px;
          width: 50%;
        }
        
        .championship-skeleton-category {
          height: 20px;
          width: 40%;
        }
        
        .championship-skeleton-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        
        .championship-skeleton-btn-primary,
        .championship-skeleton-btn-secondary {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmerFlow 2s infinite;
          border-radius: 12px;
          height: 48px;
        }
        
        .championship-skeleton-btn-primary {
          flex: 1;
        }
        
        .championship-skeleton-btn-secondary {
          width: 48px;
        }
        
        /* RESPONSIVE DESIGN */
        @media (max-width: 768px) {
          .ultimate-grid {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 24px 0;
          }
          
          .ultimate-filters {
            flex-direction: column;
            align-items: stretch;
            gap: 24px;
          }
          
          .ultimate-categories {
            justify-content: center;
          }
          
          .ultimate-controls {
            justify-content: center;
          }
          
          .ultimate-search-input {
            height: 64px;
            padding: 0 70px 0 70px;
            font-size: 18px;
          }
          
          .ultimate-card-title {
            font-size: 20px;
          }
          
          .ultimate-card-price {
            font-size: 24px;
          }
        }
        
        /* ENTERPRISE PRODUCT CARD CONTAINER */
        .product-card-v11 {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          overflow: hidden;
          padding: 16px;
        }
        
        .product-card-v11:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }
        
        /* Image Section */
        .product-image-container {
          position: relative;
          overflow: hidden;
        }
        
        .product-image-wrapper {
          aspect-ratio: 1;
          position: relative;
          background: #f8f9fa;
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
          background: #ffffff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }
        
        .product-favorite-btn:hover {
          transform: scale(1.1);
        }
        
        .product-favorite-idle {
          color: #9CA3AF;
        }
        
        .product-favorite-active {
          color: #EF4444;
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
          color: #2563EB;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }
        
        .product-badge-limited {
          background: #EF4444;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }
        
        .product-badge-featured {
          background: #FACC15;
          color: #92400E;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
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
          font-size: 16px;
          font-weight: 700;
          color: #111827;
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
          font-size: 14px;
          font-weight: 500;
          color: #6B7280;
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
          font-size: 18px;
          font-weight: 700;
          color: #16A34A;
          letter-spacing: -0.02em;
        }
        
        .product-compare-price {
          font-size: 14px;
          color: #6B7280;
          text-decoration: line-through;
        }
        
        .product-discount-badge {
          background: #EF4444;
          color: #ffffff;
          font-size: 12px;
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
          background: #ffffff;
          color: #2563EB;
          font-size: 13px;
          font-weight: 500;
          padding: 4px 12px;
          border-radius: 18px;
          border: 1px solid #2563EB;
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
        
        /* ENTERPRISE CTA SYSTEM */
        .product-cta-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }
        
        .product-cta-primary {
          width: 100%;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);
        }
        
        .product-cta-primary:hover {
          background: #1DA851;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(37, 211, 102, 0.4);
        }
        
        .whatsapp-cta-primary {
          width: 100%;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .whatsapp-cta-primary:hover {
          background: #1DA851;
          transform: translateY(-1px);
        }
        
        .whatsapp-cta-disabled {
          width: 100%;
          background: #E5E7EB;
          color: #6B7280;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .whatsapp-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 20;
        }
        
        .whatsapp-tooltip-content {
          background: black;
          color: white;
          font-size: 12px;
          border-radius: 8px;
          padding: 8px 12px;
          white-space: nowrap;
          font-weight: 600;
          position: relative;
        }
        
        .whatsapp-tooltip-arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid black;
        }
        
        .relative.group:hover .whatsapp-tooltip {
          opacity: 1;
        }
        
        /* Hide Back to Dashboard button in seller storefront view */
        .sl-store-header .sl-cta {
          display: none !important;
        }
        
        /* Enhanced disabled state for seller preview mode */
        .product-favorite-btn:disabled {
          pointer-events: none;
          filter: grayscale(0.3);
        }
        
        .product-cta-primary:disabled {
          pointer-events: none;
          filter: grayscale(0.2);
        }
        
        .ultimate-favorites:disabled {
          pointer-events: none;
          filter: grayscale(0.3);
        }
      `}</style>

      <DashboardLayout>
        <div className="min-h-screen" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}>
          {/* Premium Hero Store Header - Seller Preview */}
          <div className="relative overflow-hidden">
            {/* Background pattern overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-25 to-pink-50 opacity-60"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(255, 159, 98, 0.3) 0%, transparent 50%)'
            }}></div>
            
            {/* Seller Preview Notice */}
            <div className="relative z-20 text-white text-center py-3" style={{
              background: 'linear-gradient(135deg, #5a6bff 0%, #67d1ff 100%)'
            }}>
              <div className="flex items-center justify-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="font-bold">Store Preview Mode</span>
                <span className="text-blue-100">•</span>
                <span className="text-blue-100">This is how customers see your store</span>
              </div>
            </div>
            
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
                    <div className="relative group">
                      <Button
                        variant="ghost"
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 opacity-50 cursor-not-allowed shadow-lg"
                        disabled
                      >
                        <Instagram className="w-6 h-6 text-white" />
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Preview Mode - Not clickable for sellers
                      </div>
                    </div>
                  )}
                  {seller?.socialMedia?.facebook && (
                    <div className="relative group">
                      <Button
                        variant="ghost"
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 opacity-50 cursor-not-allowed shadow-lg"
                        disabled
                      >
                        <Facebook className="w-6 h-6 text-white" />
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Preview Mode - Not clickable for sellers
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp CTA button - disabled for seller preview */}
              {seller?.whatsappNumber && (
                <div className="relative group">
                  <Button
                    disabled
                    className="bg-gray-300 text-gray-500 font-bold px-8 py-4 rounded-2xl text-lg shadow-xl cursor-not-allowed opacity-60"
                  >
                    <MessageCircle className="w-6 h-6 mr-3" />
                    Contact on WhatsApp (Preview Mode)
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    This button works for customers, not in preview mode
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Edge-to-Edge Search & Filter Section - Seller Preview */}
          <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-white py-16">
            <div className="max-w-7xl mx-auto px-6">
              {/* Section title */}
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-gray-900 mb-4">
                  Discover Amazing Products
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Preview how customers explore your curated collection
                </p>
              </div>

            {/* Ultra-Premium search and filter container */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-black/10 mb-12" style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}>
                {/* Ultra-Premium Search Bar */}
                <div className="relative mb-8">
                  <div className="relative group">
                    {/* Animated gradient border on focus */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                    <div className="relative">
                      {/* Enhanced search icon with color transition */}
                      <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-blue-600 transition-all duration-300" />
                      <Input
                        type="text"
                        placeholder="Search for products, brands, categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-16 pr-16 text-lg bg-white/80 border-2 border-gray-200 rounded-2xl focus:border-transparent focus:ring-0 transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl"
                        style={{ 
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)'
                        }}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-110"
                        >
                          <X className="w-4 h-4" />
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

                    {/* Category pills */}
                    {categories.map(category => {
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

                    {/* Favorites toggle - disabled for seller preview */}
                    <div className="relative group">
                      <Button
                        variant="outline"
                        disabled
                        className="rounded-full px-6 py-3 font-bold bg-white border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        Favorites (Preview)
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-400">
                          0
                        </span>
                      </Button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Customers can favorite products here
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <FullWidthContainer>
            <div className="py-0">
              {/* Enhanced Results Summary */}
              {(searchQuery || categoryFilter !== 'all' || showFavorites) && (
                <div className="mb-16">
                  <div className="p-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-indigo-100/20"></div>
                    <div className="relative z-10 flex items-center justify-between flex-wrap gap-8">
                      <div className="space-y-4">
                        <h3 className="text-3xl font-bold text-slate-800">
                          Found {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          {searchQuery && (
                            <span className="inline-flex items-center gap-3 px-6 py-3 bg-blue-100 text-blue-800 rounded-full font-bold text-sm backdrop-blur-xl">
                              <Search className="w-4 h-4" />
                              "{searchQuery}"
                            </span>
                          )}
                          {categoryFilter !== 'all' && (
                            <span className="inline-flex items-center gap-3 px-6 py-3 bg-purple-100 text-purple-800 rounded-full font-bold text-sm backdrop-blur-xl">
                              <Filter className="w-4 h-4" />
                              {categoryFilter}
                            </span>
                          )}
                          {showFavorites && (
                            <span className="inline-flex items-center gap-3 px-6 py-3 bg-red-100 text-red-800 rounded-full font-bold text-sm backdrop-blur-xl">
                              <Heart className="w-4 h-4 fill-current" />
                              Favorites Only
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                          setShowFavorites(false);
                        }}
                        className="ultimate-clear-btn"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Ultimate Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="ultimate-empty">
                  <Search className="w-24 h-24 text-slate-400 mx-auto mb-8" />
                  <h3 className="text-4xl font-bold text-slate-800 mb-4">
                    {searchQuery || categoryFilter !== 'all' || showFavorites ? "No products match your filters" : "No products in storefront"}
                  </h3>
                  <p className="text-xl text-slate-600 leading-relaxed mb-8">
                    {searchQuery || categoryFilter !== 'all' || showFavorites
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Add products to your catalog to see how they'll appear to customers."
                    }
                  </p>
                  {(searchQuery || categoryFilter !== 'all' || showFavorites) ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setShowFavorites(false);
                      }}
                      className="ultimate-clear-btn"
                    >
                      Clear All Filters
                    </button>
                  ) : (
                    <Button 
                      onClick={() => window.location.href = '/products'}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-6 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      size="lg"
                    >
                      <ArrowUpRight className="w-6 h-6 mr-3" />
                      Manage Products
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                            onLoadStart={() => handleImageStart(product.id)}
                            data-product-id={product.id}
                            loading="lazy"
                            decoding="async"
                          />
                          
                          {/* Image Loading State */}
                          {imageLoadingStates[product.id] && (
                            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                            </div>
                          )}
                          
                          {/* Favorite button - disabled for sellers */}
                          <button
                            className="product-favorite-btn opacity-50 cursor-not-allowed"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                            title="Sellers cannot favorite their own products"
                            data-testid={`button-favorite-disabled-${product.id}`}
                          >
                            <Heart className="h-4 w-4 product-favorite-idle" />
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
                            {/* Primary CTA - Contact Seller (disabled for sellers) */}
                            {seller?.whatsappNumber ? (
                              <button
                                className="product-cta-primary opacity-60 cursor-not-allowed"
                                onClick={(e) => e.stopPropagation()}
                                disabled
                                title="Sellers cannot contact themselves - this is how customers will see it"
                                aria-label={`Contact seller button (preview mode)`}
                                data-testid={`button-whatsapp-preview-${product.id}`}
                              >
                                <MessageCircle className="h-4 w-4" aria-hidden="true" />
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
                            if ((product as any).color && badges.length < maxBadges) {
                              badges.push(
                                <div key="color" className="inline-flex items-center rounded-md text-xs font-medium" 
                                     style={{ 
                                       backgroundColor: '#F1F3F5', 
                                       color: '#333333',
                                       padding: '6px 12px'
                                     }}>
                                  <span className="mr-1.5 text-sm flex items-center">🎨</span>
                                  {(product as any).color}
                                </div>
                              );
                            }
                            if ((product as any).size && badges.length < maxBadges) {
                              badges.push(
                                <div key="size" className="inline-flex items-center rounded-md text-xs font-medium" 
                                     style={{ 
                                       backgroundColor: '#F1F3F5', 
                                       color: '#333333',
                                       padding: '6px 12px'
                                     }}>
                                  <span className="mr-1.5 text-sm flex items-center">📏</span>
                                  {(product as any).size}
                                </div>
                              );
                            }
                            if ((product as any).material && badges.length < maxBadges) {
                              badges.push(
                                <div key="material" className="inline-flex items-center rounded-md text-xs font-medium" 
                                     style={{ 
                                       backgroundColor: '#F1F3F5', 
                                       color: '#333333',
                                       padding: '6px 12px'
                                     }}>
                                  <span className="mr-1.5 text-sm flex items-center">🧵</span>
                                  {(product as any).material}
                                </div>
                              );
                            }
                            
                            // Priority 2: Sustainability (soft green #DFF6E3 background, #1E7D3D text)
                            if ((product as any).sustainability && badges.length < maxBadges) {
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
            </div>
          </FullWidthContainer>

          {/* Contact Notification */}
          {contactNotification.show && contactNotification.product && (
            <div className="fixed bottom-8 right-8 z-50">
              <div className="bg-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-2xl backdrop-blur-xl max-w-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900 mb-1">Preview Mode</h4>
                    <p className="text-green-800 text-sm">
                      Customer would contact you about <strong>{contactNotification.product.name}</strong> via WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Revolutionary Product Detail Modal */}
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
                      src={getProductImageUrl(selectedProduct) || '/placeholder.jpg'}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => handleImageLoad(selectedProduct.id, e)}
                      onError={handleImageError}
                    />
                    
                    {/* Premium overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    
                    {/* Quality warning for sellers */}
                    {lowResImages[selectedProduct.id] && isOwner && (
                      <div className="absolute top-6 left-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold shadow-xl animate-pulse">
                        ⚠️ Low Quality Image - Upload HD for better conversions
                      </div>
                    )}
                    
                    {/* Navigation Controls */}
                    <Button
                      variant="ghost"
                      onClick={() => setShowProductModal(false)}
                      className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border border-white/20"
                    >
                      <X className="w-6 h-6 text-white" />
                    </Button>

                    {/* Navigation Arrows */}
                    {filteredProducts.length > 1 && (
                      <>
                        {filteredProducts.findIndex((p: Product) => p.id === selectedProduct.id) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentIndex = filteredProducts.findIndex((p: Product) => p.id === selectedProduct.id);
                              const prevProduct = filteredProducts[currentIndex - 1];
                              setSelectedProduct(prevProduct);
                              window.history.replaceState(null, '', `#${prevProduct.id}`);
                            }}
                            className="absolute left-1/2 top-1/2 transform -translate-x-20 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110"
                          >
                            <ChevronDown className="w-7 h-7 rotate-90" />
                          </Button>
                        )}
                        
                        {filteredProducts.findIndex((p: Product) => p.id === selectedProduct.id) < filteredProducts.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentIndex = filteredProducts.findIndex((p: Product) => p.id === selectedProduct.id);
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

                    {/* Premium floating info card */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/50">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-2xl font-black text-gray-900">
                                {selectedProduct.name}
                              </h2>
                              <Badge className="bg-blue-500 text-white px-3 py-1 text-sm">
                                {selectedProduct.category}
                              </Badge>
                            </div>
                            
                            {selectedProduct.brand && (
                              <p className="text-gray-600 font-medium mb-3 uppercase tracking-wider text-sm">
                                {selectedProduct.brand}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4">
                              <div className="text-3xl font-black text-green-600">
                                {formatPrice(selectedProduct.price)}
                              </div>
                              {(selectedProduct as any).compareAtPrice && (selectedProduct as any).compareAtPrice > selectedProduct.price && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xl text-gray-400 line-through">
                                    {formatPrice((selectedProduct as any).compareAtPrice)}
                                  </span>
                                  <Badge className="bg-red-500 text-white">
                                    -{Math.round((((selectedProduct as any).compareAtPrice - selectedProduct.price) / (selectedProduct as any).compareAtPrice) * 100)}% OFF
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Quick action buttons */}
                          <div className="flex gap-3">
                            {seller?.whatsappNumber && !isOwner && (
                              <Button
                                onClick={() => handleContactProduct(selectedProduct)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                              >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Contact Now
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
                            {selectedProduct.subcategory && (
                              <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-600 text-white text-sm font-medium">
                                {selectedProduct.subcategory}
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
                          <div className="text-sm text-slate-600">
                            {selectedProduct.quantity > 10 ? 'Available for immediate delivery' :
                             selectedProduct.quantity > 0 ? 'Order soon to secure your item' :
                             'Contact seller for availability updates'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Description */}
                  {selectedProduct.description && (
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <Info className="w-6 h-6 text-blue-600" />
                        Product Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Product Attributes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { label: 'Brand', value: selectedProduct.brand, icon: '🏷️', color: 'blue' },
                      { label: 'Condition', value: selectedProduct.condition, icon: '⭐', color: 'green' },
                      { label: 'Size', value: selectedProduct.size, icon: '📏', color: 'purple' },
                      { label: 'Color', value: selectedProduct.color, icon: '🎨', color: 'pink' },
                      { label: 'Material', value: selectedProduct.material, icon: '🧵', color: 'indigo' },
                      { label: 'Weight', value: (selectedProduct as any).weight, icon: '⚖️', color: 'gray' },
                    ].filter(item => item.value).map((item, index) => (
                      <div key={index} className={`bg-${item.color}-50 border border-${item.color}-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{item.icon}</span>
                          <span className={`text-sm font-bold text-${item.color}-700 uppercase tracking-wider`}>
                            {item.label}
                          </span>
                        </div>
                        <p className={`font-bold text-xl text-${item.color}-900 capitalize`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Special Features */}
                  {((selectedProduct as any).isHandmade || (selectedProduct as any).isCustomizable || (selectedProduct as any).giftWrapping) && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        Special Features
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(selectedProduct as any).isHandmade && (
                          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">🎨</span>
                            </div>
                            <div>
                              <p className="font-bold text-purple-900">Handmade</p>
                              <p className="text-purple-700 text-sm">Crafted with care</p>
                            </div>
                          </div>
                        )}
                        {(selectedProduct as any).isCustomizable && (
                          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">⚙️</span>
                            </div>
                            <div>
                              <p className="font-bold text-blue-900">Customizable</p>
                              <p className="text-blue-700 text-sm">Made to order</p>
                            </div>
                          </div>
                        )}
                        {(selectedProduct as any).giftWrapping && (
                          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                            <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">🎁</span>
                            </div>
                            <div>
                              <p className="font-bold text-pink-900">Gift Wrapping</p>
                              <p className="text-pink-700 text-sm">Available upon request</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Special Features Showcase */}
                  {(selectedProduct.isHandmade || selectedProduct.isCustomizable || selectedProduct.giftWrapping) && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="text-2xl">⭐</span>
                        Special features
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProduct.isHandmade && (
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">🎨</span>
                              <h4 className="font-bold text-amber-800">Handmade</h4>
                            </div>
                            <p className="text-sm text-amber-700">Crafted with care by skilled artisans</p>
                          </div>
                        )}
                        {selectedProduct.isCustomizable && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">⚙️</span>
                              <h4 className="font-bold text-blue-800">Customizable</h4>
                            </div>
                            <p className="text-sm text-blue-700">Can be personalized to your preferences</p>
                          </div>
                        )}
                        {selectedProduct.giftWrapping && (
                          <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">🎁</span>
                              <h4 className="font-bold text-pink-800">Gift Wrapping</h4>
                            </div>
                            <p className="text-sm text-pink-700">Beautiful gift wrapping available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Product Description */}
                  {selectedProduct.description && (
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-800">Description</h3>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {selectedProduct.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Premium Product Attributes Section */}
                  {(() => {
                    const attributes = [];
                    if (selectedProduct.brand) attributes.push(['Brand', selectedProduct.brand, '🏷️']);
                    if (selectedProduct.condition) attributes.push(['Condition', selectedProduct.condition, '⭐']);
                    if (selectedProduct.size) attributes.push(['Size', selectedProduct.size, '📏']);
                    if (selectedProduct.color) attributes.push(['Color', selectedProduct.color, '🎨']);
                    if (selectedProduct.material) attributes.push(['Material', selectedProduct.material, '🧵']);
                    if ((selectedProduct as any).chain_length) attributes.push(['Chain Length', (selectedProduct as any).chain_length, '📐']);
                    if ((selectedProduct as any).pendant_size) attributes.push(['Pendant Size', (selectedProduct as any).pendant_size, '💎']);
                    
                    return attributes.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <span className="text-2xl">📋</span>
                          Product Attributes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {attributes.map(([label, value, icon], index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{icon}</span>
                                <span className="font-medium text-slate-700">{label}</span>
                              </div>
                              <span className="font-bold text-slate-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Enhanced Shipping & Processing Section */}
                  {(() => {
                    const shippingInfo = [];
                    if ((selectedProduct as any).processing_time) shippingInfo.push(['Processing Time', (selectedProduct as any).processing_time, '⏱️']);
                    if ((selectedProduct as any).ships_from) shippingInfo.push(['Ships From', (selectedProduct as any).ships_from, '✈️']);
                    
                    return shippingInfo.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <span className="text-2xl">🚚</span>
                          Shipping & Processing
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {shippingInfo.map(([label, value, icon], index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{icon}</span>
                                <span className="font-medium text-blue-700">{label}</span>
                              </div>
                              <span className="font-bold text-blue-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Premium Suitability Section */}
                  {(() => {
                    const suitabilityInfo = [];
                    if ((selectedProduct as any).occasion) suitabilityInfo.push(['Occasion', (selectedProduct as any).occasion, '🎉']);
                    if ((selectedProduct as any).age_group) suitabilityInfo.push(['Age Group', (selectedProduct as any).age_group, '👥']);
                    
                    return suitabilityInfo.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <span className="text-2xl">🎯</span>
                          Suitable For
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {suitabilityInfo.map(([label, value, icon], index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{icon}</span>
                                <span className="font-medium text-purple-700">{label}</span>
                              </div>
                              <span className="font-bold text-purple-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Enhanced Product Policies Section */}
                  {(() => {
                    const policyInfo = [];
                    if ((selectedProduct as any).personalization_options) policyInfo.push(['Personalization Options', (selectedProduct as any).personalization_options, '✏️']);
                    if ((selectedProduct as any).care_instructions) policyInfo.push(['Care Instructions', (selectedProduct as any).care_instructions, '🧼']);
                    if (selectedProduct.sustainability) policyInfo.push(['Sustainability', 'Eco-friendly', '🌱']);
                    if ((selectedProduct as any).warranty) policyInfo.push(['Warranty', (selectedProduct as any).warranty, '🛡️']);
                    
                    return policyInfo.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <span className="text-2xl">📋</span>
                          Product Policies
                        </h3>
                        <div className="space-y-3">
                          {policyInfo.map(([label, value, icon], index) => (
                            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <span className="text-lg mt-0.5">{icon}</span>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-700 mb-1">{label}</h4>
                                <p className="text-sm text-gray-600">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Premium WhatsApp CTA */}
                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {seller?.whatsappNumber ? (
                        <Button
                          size="lg"
                          className="flex-1 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          onClick={() => {
                            if (selectedProduct) {
                              handleContactProduct(selectedProduct);
                            }
                          }}
                        >
                          <MessageCircle className="w-6 h-6 mr-3" />
                          Contact Seller on WhatsApp
                        </Button>
                      ) : (
                        <div className="flex-1 p-4 bg-gray-100 rounded-xl text-center">
                          <p className="text-gray-600 font-medium">Preview Mode - WhatsApp Required</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Navigation Footer */}
                  {filteredProducts.length > 1 && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>
                          Product {filteredProducts.findIndex((p: Product) => p.id === selectedProduct.id) + 1} of {filteredProducts.length}
                        </span>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                          Use ← → arrow keys to navigate
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}