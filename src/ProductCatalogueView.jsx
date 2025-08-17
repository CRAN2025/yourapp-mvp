import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Wifi, WifiOff, MoreVertical, Edit, Trash2, Package, User,
  Settings, BarChart3, ShoppingBag, ExternalLink, Eye, MessageCircle, Star, Filter, Archive
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { ref, get, remove, onValue, set } from 'firebase/database';
import AddProductModal from './AddProductModal';
import ProductSelectionModal from './ProductSelectionModal';
import { useNavigate } from 'react-router-dom';
import {
  getProductImageUrl,
  formatProductForDisplay,
  formatPrice,
  trackInteraction,
  standardizeSellerData
} from './sharedUtils';

const ProductCatalogueView = ({ user = null, userProfile = null }) => {
  const navigate = useNavigate();

  // Core state
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Product interaction state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  // System state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('synced');

  // Standardized seller data - memoized to prevent unnecessary re-renders
  const sellerData = useMemo(() => {
    return standardizeSellerData({ userProfile });
  }, [userProfile]);

  const categories = [
    '👗 Fashion & Clothing', '📱 Electronics', '🍔 Food & Beverages', '💄 Beauty & Cosmetics',
    '🏠 Home & Garden', '📚 Books & Education', '🎮 Sports & Gaming', '👶 Baby & Kids',
    '🚗 Automotive', '🎨 Arts & Crafts', '💊 Health & Wellness', '🔧 Tools & Hardware',
    '🎁 Gifts & Souvenirs', '💍 Jewelry & Accessories', '📦 Other'
  ];

  // Data normalization function to handle different formats
  const normalizeProductData = useCallback((product) => {
    // Handle different image formats
    let normalizedImages;
    if (Array.isArray(product.images)) {
      // Seed format: ["url1", "url2"]
      normalizedImages = {
        primary: product.images[0] || '',
        gallery: product.images.slice(1) || []
      };
    } else if (product.images && typeof product.images === 'object') {
      // Already in correct format
      normalizedImages = product.images;
    } else if (typeof product.images === 'string') {
      // Single image as string
      normalizedImages = {
        primary: product.images,
        gallery: []
      };
    } else {
      // Fallback
      normalizedImages = { primary: '', gallery: [] };
    }

    return {
      ...product,
      images: normalizedImages,
      // Ensure imageUrl is set for backward compatibility
      imageUrl: normalizedImages.primary,
      // Ensure other fields are consistent
      description: typeof product.description === 'string'
        ? product.description
        : product.description?.full || product.shortDescription || '',
      shortDescription: product.shortDescription ||
        (typeof product.description === 'string'
          ? (product.description.length > 100 ? `${product.description.substring(0, 100)}...` : product.description)
          : product.description?.short || ''),
      // Ensure numeric fields
      price: Number(product.price || 0),
      quantity: Number(product.quantity || 0),
      // Ensure timestamps
      createdAt: product.createdAt || Date.now(),
      updatedAt: product.updatedAt || Date.now(),
      // Ensure analytics object
      analytics: product.analytics || { views: 0, contacts: 0, orders: 0 },
      // Ensure status
      status: product.status || 'active'
    };
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`favorites_${user?.uid}`);
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch (error) {
      console.warn('Failed to load favorites:', error);
    }
  }, [user?.uid]);

  // Load products with real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const productsRef = ref(db, `users/${user.uid}/products`);

    // Use the unsubscribe that onValue returns
    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const productsData = snapshot.val();
            const productsArray = Object.entries(productsData).map(([id, data]) => ({
              productId: id,
              ...formatProductForDisplay(normalizeProductData(data)),
            }));

            const sorted = [...productsArray].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setProducts(sorted);
          } else {
            setProducts([]);
          }
        } catch (err) {
          console.error('Error processing products:', err);
          setError('Failed to process product data');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error loading products:', err);
        setError('Failed to load products');
        setLoading(false);
      }
    );

    return () => {
      try { unsubscribe(); } catch {}
    };
  }, [user?.uid, normalizeProductData]);

  // Global event listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    const handleClickOutside = (e) => {
      if (!e.target.closest('.product-menu') && !e.target.closest('.menu-button')) {
        setShowProductMenu(null);
      }
      if (!e.target.closest('.user-menu') && !e.target.closest('.user-button')) {
        setShowUserMenu(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowProductMenu(null);
        setShowUserMenu(false);
        setShowProductModal(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Filter by status
    if (filterBy !== 'archived') {
      filtered = filtered.filter((p) => p.status !== 'deleted');
    } else {
      filtered = filtered.filter((p) => p.status === 'deleted');
    }

    // Search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        (p.name || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.tags && p.tags.some((t) => (t || '').toLowerCase().includes(query)))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Additional filters
    if (filterBy !== 'all' && filterBy !== 'archived') {
      filtered = filtered.filter((p) => {
        const qty = p.quantity || 0;
        switch (filterBy) {
          case 'in-stock': return qty > 0;
          case 'out-of-stock': return qty === 0;
          case 'low-stock': return qty > 0 && qty <= 5;
          case 'featured': return p.featured === true;
          default: return true;
        }
      });
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest': sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); break;
      case 'oldest': sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); break;
      case 'price-high': sorted.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'price-low': sorted.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'name': sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      case 'views': sorted.sort((a, b) => (b.analytics?.views || 0) - (a.analytics?.views || 0)); break;
      case 'contacts': sorted.sort((a, b) => (b.analytics?.contacts || 0) - (a.analytics?.contacts || 0)); break;
      default: break;
    }

    setFilteredProducts(sorted);
  }, [products, searchTerm, selectedCategory, filterBy, sortBy]);

  // Action handlers
  const handleSync = async () => {
    if (!user?.uid) return;
    setSyncStatus('syncing');
    try {
      const productsRef = ref(db, `users/${user.uid}/products`);
      const snapshot = await get(productsRef);
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsArray = Object.entries(productsData).map(([id, data]) => ({
          productId: id,
          ...formatProductForDisplay(normalizeProductData(data)),
        }));
        const sorted = [...productsArray].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setProducts(sorted);
      }
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncStatus('error');
    }
    setTimeout(() => setShowSyncModal(false), 1000);
  };

  const handleArchiveProduct = async (productId, productName) => {
    if (!user?.uid) return;
    const confirmMessage = `Archive "${productName}"?\n\nIt will be hidden from your store but not permanently deleted.`;
    if (!window.confirm(confirmMessage)) return;

    const prev = products;
    setProducts((cur) => cur.map((p) => (p.productId === productId ? { ...p, status: 'deleted' } : p)));
    setShowProductMenu(null);

    try {
      const statusRef = ref(db, `users/${user.uid}/products/${productId}/status`);
      await set(statusRef, 'deleted');
    } catch (error) {
      console.error('Error archiving product:', error);
      setProducts(prev);
      alert('Failed to archive. Please try again.');
    }
  };

  const handleUnarchiveProduct = async (productId, productName) => {
    if (!user?.uid) return;
    const confirmMessage = `Unarchive "${productName}"?\n\nIt will reappear in your catalog.`;
    if (!window.confirm(confirmMessage)) return;

    const prev = products;
    setProducts((cur) => cur.map((p) => (p.productId === productId ? { ...p, status: 'active' } : p)));
    setShowProductMenu(null);

    try {
      const statusRef = ref(db, `users/${user.uid}/products/${productId}/status`);
      await set(statusRef, 'active');
    } catch (error) {
      console.error('Error unarchiving product:', error);
      setProducts(prev);
      alert('Failed to unarchive. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!user?.uid) return;
    const confirmMessage = `Permanently delete "${productName}"?\n\nThis cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    const prev = products;
    setProducts((cur) => cur.filter((p) => p.productId !== productId));
    setShowProductMenu(null);

    try {
      const productRef = ref(db, `users/${user.uid}/products/${productId}`);
      await remove(productRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      setProducts(prev);
      alert('Error deleting product. Please try again.');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddProductModal(true);
    setShowProductMenu(null);
  };

  const handleToggleFeatured = async (productId, currentFeatured) => {
    if (!user?.uid) return;
    try {
      const productRef = ref(db, `users/${user.uid}/products/${productId}`);
      const snapshot = await get(productRef);
      if (snapshot.exists()) {
        const currentData = snapshot.val();
        await set(productRef, {
          ...currentData,
          featured: !currentFeatured,
          updatedAt: Date.now(),
        });
      }
      setShowProductMenu(null);
    } catch (error) {
      console.error('Error updating featured status:', error);
      alert('Error updating product. Please try again.');
    }
  };

  const handleViewPublic = (productId) => {
    const publicUrl = `${window.location.origin}/store/${user?.uid}#${productId}`;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
    setShowProductMenu(null);
  };

  // Product card handlers with analytics tracking
  const handleProductView = useCallback(async (product) => {
    if (user?.uid && product.productId) {
      await trackInteraction(user.uid, product.productId, 'view');
    }
    setSelectedProduct(product);
    setShowProductModal(true);
  }, [user?.uid]);

  const handleContactSeller = useCallback(async (product) => {
    if (user?.uid && product.productId) {
      await trackInteraction(user.uid, product.productId, 'contact');
    }
    setSelectedProduct(product);
    setShowProductModal(true);
  }, [user?.uid]);

  const handleToggleFavorite = useCallback((productId, e) => {
    e?.stopPropagation?.();
    const newFavorites = new Set(favorites);

    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }

    setFavorites(newFavorites);

    try {
      localStorage.setItem(`favorites_${user?.uid}`, JSON.stringify([...newFavorites]));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  }, [favorites, user?.uid]);

  const handleProductAdded = () => {
    if (editingProduct) setEditingProduct(null);

    // Real-time listener will update automatically; force a tiny tick to show progress
    setTimeout(() => {
      setLoading(true);
      setTimeout(() => setLoading(false), 100);
    }, 500);
  };

  const handleCloseModal = () => {
    setShowAddProductModal(false);
    setEditingProduct(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.reload();
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setFilterBy('all');
    setSortBy('newest');
  };

  // ---- Helper functions ----

  // Style helpers
  const getBadgeStyle = (q, featured = false, status) => {
    if (status === 'deleted')
      return { padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'rgba(107,114,128,.12)', color: '#6b7280' };
    if (featured)
      return { padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'rgba(255, 193, 7, 0.1)', color: '#f59e0b' };
    if ((q || 0) === 0)
      return { padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,.1)', color: '#dc2626' };
    if ((q || 0) <= 5)
      return { padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'rgba(245,158,11,.1)', color: '#d97706' };
    return { padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,.1)', color: '#059669' };
  };

  const getBadgeText = (q, featured = false, status) => {
    if (status === 'deleted') return 'Archived';
    if (featured) return '⭐ Featured';
    const qty = q || 0;
    return qty === 0 ? 'Out of Stock' : qty <= 5 ? `${qty} left` : `${qty} in stock`;
  };

  // Image URL with cache-busting that DOES NOT trigger CORS (no crossOrigin needed)
  const buildImgSrc = (prod) => {
    const base = getProductImageUrl(prod) || '';
    if (!base) return '';
    const sep = base.includes('?') ? '&' : '?';
    const version = prod.updatedAt || prod.images?.version || 0;
    return `${base}${sep}v=${version}`;
  };

  // Derived stats
  const visibleProducts = products.filter((p) => p.status !== 'deleted');
  const archivedCount = products.filter((p) => p.status === 'deleted').length;
  const totalProducts = visibleProducts.length;
  const inStockProducts = visibleProducts.filter((p) => (p.quantity || 0) > 0).length;
  const lowStockProducts = visibleProducts.filter((p) => (p.quantity || 0) > 0 && (p.quantity || 0) <= 5).length;
  const featuredProducts = visibleProducts.filter((p) => p.featured).length;
  const totalViews = visibleProducts.reduce((sum, p) => sum + (p.analytics?.views || 0), 0);
  const totalContacts = visibleProducts.reduce((sum, p) => sum + (p.analytics?.contacts || 0), 0);

  const styles = {
    container: { position: 'relative', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    bgGradient: { position: 'absolute', inset: 0, background: 'radial-gradient(1200px 800px at 10% 10%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(135deg, #6a5cff 0%, #7aa0ff 40%, #67d1ff 100%)', opacity: .8 },

    header: { position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '16px 20px' },
    headerContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' },
    title: { fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
    nav: { display: 'flex', gap: 8 },
    navButton: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none' },
    navButtonActive: { background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', color: 'white', border: '1px solid transparent' },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
    syncButton: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
    userButton: { position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
    userMenu: { position: 'absolute', top: '100%', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', border: '1px solid rgba(0,0,0,.06)', minWidth: 180, zIndex: 2000, marginTop: 6, padding: 6 },
    userMenuItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', fontSize: 13, cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left', transition: 'background .15s' },

    content: { position: 'relative', zIndex: 1, flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '20px', width: '100%' },
    offlineBanner: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 },

    searchSection: { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '20px', marginBottom: 20, border: '1px solid rgba(255,255,255,0.2)' },
    searchBar: { position: 'relative', marginBottom: 16 },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, background: 'rgba(255,255,255,0.8)', fontSize: 14, outline: 'none' },
    searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', width: 16, height: 16 },

    filterSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 },
    filterSelect: { padding: '8px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, background: 'rgba(255,255,255,0.8)', fontSize: 12, outline: 'none' },
    filterTabs: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    filterTab: { padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    filterTabActive: { background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', color: '#fff', border: '1px solid transparent' },

    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 },
    statCard: { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' },
    statNumber: { fontSize: 24, fontWeight: 800, margin: '0 0 4px 0' },
    statLabel: { fontSize: 12, opacity: .7, margin: 0 },

    addButton: { position: 'fixed', bottom: 20, right: 20, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(34,197,94,.3)', zIndex: 1500 },

    productsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },

    productCard: { background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: 16, overflow: 'visible', border: '1px solid rgba(255,255,255,0.2)', transition: 'all .2s', cursor: 'pointer', position: 'relative' },
    productImage: { width: '100%', height: 200, objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    productInfo: { padding: 16 },
    productHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    productName: { fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: '#1f2937' },
    productPrice: { fontSize: 18, fontWeight: 800, color: '#059669', margin: '0 0 8px 0' },
    productMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    productAnalytics: { display: 'flex', gap: 8, fontSize: 12, opacity: 0.7 },

    menuButton: {
      backgroundColor: 'rgba(255,255,255,.7)', border: 'none', cursor: 'pointer', padding: 6,
      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 0 1px rgba(0,0,0,.06)'
    },

    productMenu: {
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff',
      borderRadius: 12, boxShadow: '0 12px 28px rgba(0,0,0,.18)', border: '1px solid rgba(0,0,0,.06)',
      minWidth: 200, maxHeight: 300, overflowY: 'auto', zIndex: 3000, padding: 6
    },
    menuItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 14, cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left', transition: 'background .15s' },
    deleteMenuItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 14, cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left', color: '#dc2626', transition: 'background .15s' },

    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' },
    emptyIcon: { width: 64, height: 64, margin: '0 auto 16px', opacity: .4 },

    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 },
    modalContent: { background: '#fff', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%', textAlign: 'center' },
    spinner: { width: 20, height: 20, border: '2px solid #e5e7eb', borderTop: '2px solid #5a6bff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' },
    loadingState: { textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.bgGradient} />
        <div style={styles.content}>
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <h3>Loading your products...</h3>
            <p>Please wait while we fetch your catalog</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.bgGradient} />
        <div style={styles.content}>
          <div style={styles.emptyState}>
            <h3 style={{ color: '#dc2626', marginBottom: '16px' }}>Error Loading Products</h3>
            <p style={{ marginBottom: '24px' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #5a6bff, #67d1ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .product-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .add-button:hover { transform: scale(1.1); }
        .menu-item:hover { background:#f3f4f6; }
        .delete-menu-item:hover { background:#fef2f2; }
        .user-menu-item:hover { background:#f3f4f6; }
        .search-input:focus { border-color:#5a6bff; box-shadow:0 0 0 3px rgba(90,107,255,.1); }
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      `}</style>

      <div style={styles.container}>
        <div style={styles.bgGradient} />

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>📦 {userProfile?.storeName || 'My Products'}</h1>

            <div style={styles.headerRight}>
              <nav style={styles.nav}>
                <button onClick={() => navigate('/catalog')} style={{ ...styles.navButton, ...styles.navButtonActive }}>
                  <Package size={16} />
                  Catalog
                </button>
                <button onClick={() => navigate('/storefront')} style={styles.navButton} className="btn-hover">
                  <ExternalLink size={16} />
                  Storefront
                </button>
                <button onClick={() => navigate('/orders')} style={styles.navButton} className="btn-hover">
                  <ShoppingBag size={16} />
                  Orders
                </button>
                <button onClick={() => navigate('/analytics')} style={styles.navButton} className="btn-hover">
                  <BarChart3 size={16} />
                  Analytics
                </button>
                <button onClick={() => navigate('/settings')} style={styles.navButton} className="btn-hover">
                  <Settings size={16} />
                  Settings
                </button>
              </nav>

              <button style={styles.syncButton} onClick={() => setShowSyncModal(true)}>
                {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
                {syncStatus === 'syncing' ? 'Syncing…' : isOffline ? 'Offline' : 'Synced'}
              </button>

              <div className="user-button" style={styles.userButton} onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}>
                <User size={16} />
                <span>{user?.email?.split('@')[0] || 'User'}</span>
                {showUserMenu && (
                  <div className="user-menu" style={styles.userMenu}>
                    <button style={styles.userMenuItem} className="user-menu-item" onClick={() => navigate('/storefront')}>
                      <ExternalLink size={14} /> My Storefront
                    </button>
                    <button style={styles.userMenuItem} className="user-menu-item" onClick={() => navigate('/orders')}>
                      <ShoppingBag size={14} /> Orders
                    </button>
                    <button style={styles.userMenuItem} className="user-menu-item" onClick={() => navigate('/analytics')}>
                      <BarChart3 size={14} /> Analytics
                    </button>
                    <button style={styles.userMenuItem} className="user-menu-item" onClick={() => navigate('/settings')}>
                      <Settings size={14} /> Settings
                    </button>
                    <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #eee' }} />
                    <button style={styles.userMenuItem} className="user-menu-item" onClick={handleSignOut}>
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {isOffline && (
            <div style={styles.offlineBanner}>
              <WifiOff size={16} /> Offline Mode – Changes will sync when connected
            </div>
          )}

          <div style={styles.searchSection}>
            <div style={styles.searchBar}>
              <Search style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search products, SKU, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                className="search-input"
              />
            </div>

            <div style={styles.filterSection}>
              <select style={styles.filterSelect} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <select style={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="views">Most Views</option>
                <option value="contacts">Most Contacts</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  ...styles.filterSelect,
                  cursor: 'pointer',
                  border: showFilters ? '1px solid #5a6bff' : '1px solid rgba(0,0,0,0.1)',
                  background: showFilters ? 'rgba(90,107,255,0.1)' : 'rgba(255,255,255,0.8)',
                }}
              >
                <Filter size={14} style={{ marginRight: 6 }} />
                More Filters
              </button>

              <button
                onClick={handleClearFilters}
                style={{ ...styles.filterSelect, cursor: 'pointer' }}
                title="Clear all filters"
              >
                Reset
              </button>
            </div>

            {showFilters && (
              <div style={styles.filterTabs}>
                {[
                  { key: 'all', label: 'All Products' },
                  { key: 'in-stock', label: 'In Stock' },
                  { key: 'low-stock', label: 'Low Stock' },
                  { key: 'out-of-stock', label: 'Out of Stock' },
                  { key: 'featured', label: '⭐ Featured' },
                  { key: 'archived', label: '🗄 Archived' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterBy(f.key)}
                    style={{ ...styles.filterTab, ...(filterBy === f.key ? styles.filterTabActive : {}) }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}><p style={styles.statNumber}>{totalProducts}</p><p style={styles.statLabel}>Total Products</p></div>
            <div style={styles.statCard}><p style={styles.statNumber}>{inStockProducts}</p><p style={styles.statLabel}>In Stock</p></div>
            <div style={styles.statCard}><p style={styles.statNumber}>{lowStockProducts}</p><p style={styles.statLabel}>Low Stock</p></div>
            <div style={styles.statCard}><p style={styles.statNumber}>{featuredProducts}</p><p style={styles.statLabel}>Featured</p></div>
            <div style={styles.statCard}><p style={styles.statNumber}>{totalViews}</p><p style={styles.statLabel}>Total Views</p></div>
            <div style={styles.statCard}><p style={styles.statNumber}>{totalContacts}</p><p style={styles.statLabel}>WhatsApp Contacts</p></div>
            <div style={styles.statCard}><p style={styles.statNumber}>{archivedCount}</p><p style={styles.statLabel}>Archived</p></div>
          </div>

          {/* Results Summary */}
          <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.7 }} aria-live="polite">
            Showing {filteredProducts.length} of {filterBy === 'archived' ? archivedCount : totalProducts} products
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </div>

          {filteredProducts.length ? (
            <div style={styles.productsGrid}>
              {filteredProducts.map((p) => (
                <div key={p.productId} style={styles.productCard} className="product-card">
                  <div style={{ position: 'relative' }}>
                    <img
                      src={buildImgSrc(p)}
                      alt={p.name || 'Product image'}
                      style={styles.productImage}
                      loading="lazy"
                      onError={(e) => {
                        const fallback =
                          'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80';
                        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                      }}
                    />

                    {p.featured && p.status !== 'deleted' && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
                        padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <Star size={10} /> Featured
                      </div>
                    )}

                    {p.status === 'deleted' && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: 'rgba(107,114,128,.9)', color: '#fff',
                        padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600
                      }}>
                        Archived
                      </div>
                    )}

                    {p.status !== 'deleted' && (p.quantity || 0) > 0 && (p.quantity || 0) <= 5 && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(245,158,11,.9)', color: '#fff',
                        padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600
                      }}>
                        Low Stock!
                      </div>
                    )}
                  </div>

                  <div style={styles.productInfo}>
                    <div style={styles.productHeader}>
                      <div style={{ flex: 1 }}>
                        <h3 style={styles.productName}>{p.name}</h3>
                        <p style={styles.productPrice}>{formatPrice(p.price, sellerData.currency)}</p>
                        {p.shortDescription && (
                          <p style={{ fontSize: 12, opacity: 0.7, margin: '4px 0 8px', lineHeight: 1.3 }}>
                            {p.shortDescription}
                          </p>
                        )}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button
                          className="menu-button"
                          aria-haspopup="menu"
                          aria-expanded={showProductMenu === p.productId}
                          aria-label="Open product menu"
                          style={styles.menuButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProductMenu(showProductMenu === p.productId ? null : p.productId);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {showProductMenu === p.productId && (
                          <div className="product-menu" role="menu" style={styles.productMenu}>
                            <button
                              style={styles.menuItem}
                              className="menu-item"
                              onClick={(e) => { e.stopPropagation(); handleEditProduct(p); }}
                              aria-label="Edit product"
                            >
                              <Edit size={14} /> Edit
                            </button>

                            {p.status !== 'deleted' ? (
                              <>
                                <button
                                  style={styles.menuItem}
                                  className="menu-item"
                                  onClick={(e) => { e.stopPropagation(); handleToggleFeatured(p.productId, p.featured); }}
                                  aria-label={p.featured ? 'Remove featured' : 'Make featured'}
                                >
                                  <Star size={14} />
                                  {p.featured ? 'Remove Featured' : 'Make Featured'}
                                </button>
                                <button
                                  style={styles.menuItem}
                                  className="menu-item"
                                  onClick={(e) => { e.stopPropagation(); handleViewPublic(p.productId); }}
                                  aria-label="View public page"
                                >
                                  <ExternalLink size={14} /> View Public
                                </button>
                                <button
                                  style={styles.menuItem}
                                  className="menu-item"
                                  onClick={(e) => { e.stopPropagation(); handleArchiveProduct(p.productId, p.name); }}
                                  aria-label="Archive product"
                                >
                                  <Archive size={14} /> Archive
                                </button>
                              </>
                            ) : (
                              <>
                                <div style={{ padding: '8px 14px', fontSize: 12, opacity: 0.6 }}>
                                  Archived items are hidden from your store
                                </div>
                                <button
                                  style={styles.menuItem}
                                  className="menu-item"
                                  onClick={(e) => { e.stopPropagation(); handleUnarchiveProduct(p.productId, p.name); }}
                                  aria-label="Unarchive product"
                                >
                                  <Archive size={14} /> Unarchive
                                </button>
                              </>
                            )}

                            <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #eee' }} />

                            <button
                              style={styles.deleteMenuItem}
                              className="delete-menu-item"
                              onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.productId, p.name); }}
                              aria-label="Delete product"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={styles.productMeta}>
                      <span style={getBadgeStyle(p.quantity, p.featured, p.status)}>
                        {getBadgeText(p.quantity, p.featured, p.status)}
                      </span>
                      <small style={{ opacity: .6, fontSize: 12 }}>{p.category || 'Uncategorized'}</small>
                    </div>

                    <div style={styles.productAnalytics}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={12} />
                        {p.analytics?.views || 0} views
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MessageCircle size={12} />
                        {p.analytics?.contacts || 0} contacts
                      </div>
                      {p.sku && <div>SKU: {p.sku}</div>}
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, opacity: 0.6 }}>
                      <span>Condition: {p.specifications?.condition || 'New'}</span>
                      <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'No date'}</span>
                    </div>

                    {/* Product interaction buttons */}
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleProductView(p); }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: 'rgba(90,107,255,0.1)',
                          color: '#5a6bff',
                          border: '1px solid rgba(90,107,255,0.2)',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                        }}
                      >
                        <Eye size={12} /> View
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleContactSeller(p); }}
                        disabled={p.quantity === 0}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: p.quantity === 0 ? 'rgba(107,114,128,0.1)' : 'rgba(37,211,102,0.1)',
                          color: p.quantity === 0 ? '#6b7280' : '#25D366',
                          border: `1px solid ${p.quantity === 0 ? 'rgba(107,114,128,0.2)' : 'rgba(37,211,102,0.2)'}`,
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: p.quantity === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          opacity: p.quantity === 0 ? 0.6 : 1
                        }}
                      >
                        <MessageCircle size={12} /> {p.quantity === 0 ? 'Out of Stock' : 'Contact'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Package style={styles.emptyIcon} />
              <h3>No products found</h3>
              <p>
                {searchTerm || selectedCategory !== 'all' || filterBy !== 'all'
                  ? `No products match your current filters. Try adjusting your search criteria.`
                  : 'Start by adding your first product to your catalog'
                }
              </p>
              {(!searchTerm && selectedCategory === 'all' && filterBy === 'all') && (
                <button
                  onClick={() => setShowAddProductModal(true)}
                  style={{
                    marginTop: 16, padding: '12px 24px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white', border: 'none', borderRadius: 8,
                    cursor: 'pointer', fontSize: 14, fontWeight: 600
                  }}
                >
                  Add Your First Product
                </button>
              )}
            </div>
          )}

          <button style={styles.addButton} className="add-button" onClick={() => setShowAddProductModal(true)}>
            <Plus size={24} color="#fff" />
          </button>
        </div>

        {/* Sync Modal */}
        {showSyncModal && (
          <div style={styles.modal} onClick={() => setShowSyncModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              {syncStatus === 'syncing' ? (
                <>
                  <div style={styles.spinner} />
                  <h3>Syncing your products…</h3>
                  <p>Please wait while we update your catalog</p>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <h3>Sync Error</h3>
                  <p>Failed to sync products. Please try again.</p>
                  <button
                    onClick={handleSync}
                    style={{ position: 'static', width: 'auto', height: 'auto', borderRadius: 8, padding: '12px 24px', marginTop: 16, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    Retry Sync
                  </button>
                </>
              ) : (
                <>
                  <h3>Sync Status</h3>
                  <p>All changes are up to date</p>
                  <button
                    onClick={handleSync}
                    style={{ position: 'static', width: 'auto', height: 'auto', borderRadius: 8, padding: '12px 24px', marginTop: 16, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    Force Sync
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={handleCloseModal}
        user={user}
        userProfile={userProfile}
        onProductAdded={handleProductAdded}
        editProduct={editingProduct}
      />

      {/* Product Selection Modal */}
      {showProductModal && selectedProduct && (
        <ProductSelectionModal
          product={selectedProduct}
          sellerData={sellerData}
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onOrderSubmit={(orderDetails) => {
            console.log('Order submitted:', orderDetails);
            // Handle order submission if needed
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
};

export default ProductCatalogueView;
