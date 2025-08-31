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
      `}</style>

      <DashboardLayout>
        <div className="min-h-screen" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}>
          {/* Store Header Component */}
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

          <FullWidthContainer>
            {/* Ultimate Search and Filter System */}
            <div className="py-16">
              {/* Ultimate Search Bar */}
              <div className="ultimate-search">
                <Search className="ultimate-search-icon w-8 h-8" />
                <input
                  type="text"
                  placeholder="Search for products, brands, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ultimate-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ultimate-search-clear"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Ultimate Filters */}
              <div className="ultimate-filters">
                <div className="ultimate-categories">
                  <div className="ultimate-category-label">
                    <Filter className="w-6 h-6" />
                    Categories
                  </div>
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`ultimate-category-pill ${
                      categoryFilter === 'all' 
                        ? 'ultimate-category-pill-active' 
                        : 'ultimate-category-pill-inactive'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`ultimate-category-pill ${
                        categoryFilter === category 
                          ? 'ultimate-category-pill-active' 
                          : 'ultimate-category-pill-inactive'
                      }`}
                    >
                      {category} ({products.filter(p => p.category === category).length})
                    </button>
                  ))}
                </div>

                <div className="ultimate-controls">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="ultimate-select">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">🆕 Newest First</SelectItem>
                      <SelectItem value="popular">🔥 Most Popular</SelectItem>
                      <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                      <SelectItem value="price-high">💎 Price: High to Low</SelectItem>
                      <SelectItem value="name">📝 Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>

                  <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`ultimate-favorites ${
                      showFavorites ? 'ultimate-favorites-active' : ''
                    }`}
                  >
                    <Heart className={`w-7 h-7 ${showFavorites ? 'fill-current' : ''}`} />
                    Favorites
                    {favorites.size > 0 && (
                      <span className="ultimate-favorites-badge">
                        {favorites.size}
                      </span>
                    )}
                  </button>
                </div>
              </div>

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
                    {searchQuery || categoryFilter !== 'all' || showFavorites ? "No products match your filters" : "No products in preview"}
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
                <div className="ultimate-grid">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="ultimate-card"
                      onClick={() => handleProductView(product)}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="ultimate-card-image-container">
                        <img
                          src={getProductImageUrl(product) || PLACEHOLDER_IMAGE}
                          alt={product.name}
                          className="ultimate-card-image"
                          onLoad={(e) => handleImageLoad(product.id, e)}
                          onError={handleImageError}
                          onLoadStart={() => handleImageStart(product.id)}
                          data-product-id={product.id}
                          loading="lazy"
                        />
                        
                        {/* Image Loading State */}
                        {imageLoadingStates[product.id] && (
                          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                          </div>
                        )}
                        
                        {/* Quick Actions */}
                        <div className="ultimate-quick-actions">
                          <button
                            className="ultimate-quick-btn"
                            onClick={(e) => handleQuickView(product, e)}
                            title="Quick Preview"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            className="ultimate-quick-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (navigator.share) {
                                navigator.share({
                                  title: product.name,
                                  text: `Check out ${product.name} for ${formatPrice(product.price)}`,
                                  url: `${window.location.origin}/store/${user?.uid}#${product.id}`
                                });
                              }
                            }}
                            title="Share Product"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Favorite Button */}
                        <button
                          className="ultimate-favorite-btn"
                          onClick={(e) => toggleFavorite(product.id, e)}
                          aria-pressed={favorites.has(product.id)}
                          title={favorites.has(product.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart
                            className={`w-6 h-6 transition-all duration-300 ${
                              favorites.has(product.id)
                                ? 'fill-current text-red-500'
                                : 'text-slate-400'
                            }`}
                          />
                        </button>

                        {/* Product Badges */}
                        <div className="ultimate-badge-overlay">
                          {(Date.now() - (product.createdAt || 0)) < 7 * 24 * 60 * 60 * 1000 && (
                            <span className="ultimate-badge ultimate-badge-new">
                              New
                            </span>
                          )}
                          {product.quantity < 5 && (
                            <span className="ultimate-badge ultimate-badge-limited">
                              Limited
                            </span>
                          )}
                          {product.features?.includes('featured') && (
                            <span className="ultimate-badge ultimate-badge-featured">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ultimate-card-content">
                        <h3 className="ultimate-card-title">
                          {product.name}
                        </h3>
                        
                        {product.brand && (
                          <p className="ultimate-card-brand">
                            {product.brand}
                          </p>
                        )}

                        <div className="ultimate-card-price">
                          {formatPrice(product.price)}
                        </div>

                        <div className="ultimate-card-category">
                          <span>{product.category}</span>
                        </div>

                        <div className="ultimate-card-actions">
                          {/* WhatsApp Contact Button - Preview Mode */}
                          {seller?.whatsappNumber ? (
                            <button
                              className={`ultimate-whatsapp-btn ${
                                cardLoadingStates[`contact-${product.id}`] ? 'ultimate-loading-btn' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactProduct(product);
                              }}
                              disabled={cardLoadingStates[`contact-${product.id}`]}
                            >
                              {cardLoadingStates[`contact-${product.id}`] ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <MessageCircle className="w-6 h-6" />
                              )}
                              Contact Seller (Preview)
                            </button>
                          ) : (
                            <div className="relative group">
                              <button
                                disabled
                                className="ultimate-whatsapp-btn opacity-60 cursor-not-allowed"
                              >
                                <MessageCircle className="w-6 h-6" />
                                WhatsApp Required
                              </button>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                <div className="bg-black text-white text-xs rounded-xl px-4 py-3 whitespace-nowrap font-semibold">
                                  Add WhatsApp number in Settings
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <button
                            className="ultimate-details-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductView(product);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
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
        </div>
      </DashboardLayout>
    </>
  );
}