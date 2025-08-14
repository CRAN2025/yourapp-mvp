import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Eye } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { db } from './firebase';
import {
  standardizeSellerData,
  getProductImageUrl,
  formatProductForDisplay,
  formatPrice,
  trackInteraction,
  createWhatsAppMessage,
  generateWhatsAppUrl,
  isMobileDevice,
  // Optional UI chips (category/location/etc.)
  buildStoreDetailChips,
} from './sharedUtils';

const StorefrontPublicView = () => {
  const { sellerId } = useParams();

  const [sellerData, setSellerData] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [contactNotification, setContactNotification] = useState({
    show: false,
    product: null,
  });

  // Image quality helpers
  const [lowResImages, setLowResImages] = useState({});
  const PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
         <defs>
           <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
             <stop offset="0" stop-color="#eef2ff"/>
             <stop offset="1" stop-color="#e0f2fe"/>
           </linearGradient>
         </defs>
         <rect width="100%" height="100%" fill="url(#g)"/>
         <g fill="#64748b" font-family="Arial, Helvetica, sans-serif">
           <text x="50%" y="46%" font-size="28" text-anchor="middle">No Image</text>
           <text x="50%" y="56%" font-size="14" text-anchor="middle">Upload a clear 1200×900 image</text>
         </g>
       </svg>`
    );
  const MIN_W = 600, MIN_H = 600;

  const handleImageLoad = (productId, e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (w < MIN_W || h < MIN_H) {
      setLowResImages((prev) => ({ ...prev, [productId]: true }));
    }
  };
  const handleImageError = (e) => {
    e.currentTarget.src = PLACEHOLDER;
  };

  // Optional: mobile-only FAB show after scroll
  const [showChatFab, setShowChatFab] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth > 768) {
        setShowChatFab(true); // keep visible on desktop
      } else {
        setShowChatFab(window.scrollY > 300);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Load seller + products
  useEffect(() => {
    const loadStorefront = async () => {
      if (!sellerId) return;
      try {
        const sellerRef = ref(db, `users/${sellerId}`);
        const sellerSnap = await get(sellerRef);
        if (!sellerSnap.exists()) {
          setError('Store not found');
          return;
        }
        const normalized = standardizeSellerData(sellerSnap.val());
        setSellerData(normalized);

        const productsRef = ref(db, `users/${sellerId}/products`);
        const prodSnap = await get(productsRef);
        if (prodSnap.exists()) {
          const productsData = prodSnap.val();
          const productsArray = Object.entries(productsData).map(([id, data]) => ({
            productId: id,
            ...formatProductForDisplay(data),
          }));

          const activeProducts = productsArray
            .filter((p) => p.status === 'active' && p.quantity > 0)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

          const uniqueProducts = activeProducts.filter(
            (p, i, self) => self.findIndex((pp) => pp.name === p.name) === i
          );

          setProducts(uniqueProducts);
        }
      } catch (err) {
        console.error('Error loading storefront:', err);
        setError('Failed to load store');
      } finally {
        setLoading(false);
      }
    };
    loadStorefront();
  }, [sellerId]);

  // Filters/sort
  useEffect(() => {
    let filtered = [...products];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s) ||
          p.category?.toLowerCase().includes(s)
      );
    }
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

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
        filtered.sort(
          (a, b) => (b.analytics?.views || 0) - (a.analytics?.views || 0)
        );
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
    }
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem('favorites');
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch {
      /* ignore */
    }
  }, []);

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Optional chips using sharedUtils helper (safe no-op if fields missing)
  const chips = useMemo(
    () => buildStoreDetailChips ? buildStoreDetailChips(sellerData || {}) : [],
    [sellerData]
  );

  // Actions
  const handleContactSeller = async (product) => {
    await trackInteraction(sellerId, product.productId, 'contact');
    const productUrl = `${window.location.origin}/store/${sellerId}#${product.productId}`;
    const message = createWhatsAppMessage.productInquiry(product, sellerData, productUrl);
    const whatsappUrl = generateWhatsAppUrl(sellerData.whatsappNumber, message);
    if (isMobileDevice()) {
      window.location.href = whatsappUrl;
      setTimeout(() => setContactNotification({ show: true, product }), 1000);
    } else {
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleFloatingChatClick = () => {
    if (!sellerData?.whatsappNumber) return;
    const storeUrl = `${window.location.origin}/store/${sellerId}`;
    const msg = createWhatsAppMessage.storeShare(sellerData, storeUrl);
    const url = generateWhatsAppUrl(sellerData.whatsappNumber, msg);
    if (isMobileDevice()) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  };

  const handleToggleFavorite = (productId, e) => {
    e.stopPropagation();
    const s = new Set(favorites);
    s.has(productId) ? s.delete(productId) : s.add(productId);
    setFavorites(s);
    try {
      localStorage.setItem('favorites', JSON.stringify([...s]));
    } catch {
      /* ignore */
    }
    const btn = e.target?.closest?.('button');
    if (btn) {
      btn.style.animation = 'heartBeat 0.6s ease-in-out';
      setTimeout(() => {
        btn.style.animation = '';
      }, 600);
    }
  };

  const handleProductView = async (product) => {
    await trackInteraction(sellerId, product.productId, 'view');
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // Loading / error UIs
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background:
            'linear-gradient(180deg, #eef2ff 0%, #e0f2fe 50%, #e6fffb 100%)',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid #eee',
              borderTop: '3px solid #5a6bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p className="typ-body">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background:
            'linear-gradient(180deg, #eef2ff 0%, #e0f2fe 50%, #e6fffb 100%)',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Store Not Found</h2>
          <p className="typ-body" style={{ marginBottom: '24px' }}>
            {error}
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px',
              background: '#5a6bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(180deg, #eef2ff 0%, #e0f2fe 50%, #e6fffb 100%)',
          padding: '20px',
        }}
      >
        {/* quick keyframes used by the loader & favorite pulse */}
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes heartBeat { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
          @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
        `}</style>

        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          {/* ===== Header / Banner ===== */}
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              padding: '0 0 24px',
              marginBottom: '24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                height: 160,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                background: sellerData?.bannerUrl
                  ? `url(${sellerData.bannerUrl}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #c7d2fe 0%, #bae6fd 60%, #ccfbf1 100%)',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '0 24px',
                marginTop: -30,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #5a6bff, #67d1ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                  border: '3px solid #fff',
                }}
              >
                🛍️
              </div>
              <div style={{ flex: 1 }}>
                <h1 className="typ-title" style={{ fontSize: 28, margin: '0 0 4px' }}>
                  {sellerData?.storeName || 'Store'}
                </h1>
                <p className="typ-meta" style={{ margin: 0 }}>
                  {sellerData?.location || 'Online Store'}
                </p>
              </div>
            </div>

            {/* OPTIONAL: chips (category/location/payment/delivery counts) */}
            {!!chips.length && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  padding: '12px 24px 0',
                }}
              >
                {chips.map((c, i) => (
                  <span
                    key={`${c.label}-${i}`}
                    className="typ-meta"
                    style={{
                      background: '#f3f4f6',
                      color: '#4b5563',
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontWeight: 600,
                    }}
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                flexWrap: 'wrap',
                padding: '12px 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>⭐ 4.9</span>
                <span className="typ-meta">({products.length} reviews)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>
                  {products.length}
                </span>
                <span className="typ-meta">products</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>🚚 Fast</span>
                <span className="typ-meta">shipping</span>
              </div>
            </div>

            <p className="typ-body" style={{ margin: '0 24px 16px', textAlign: 'center' }}>
              {sellerData?.storeDescription || 'Welcome to our store!'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                padding: '0 24px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(37,211,102,0.12)',
                  color: '#25D366',
                  padding: '8px 16px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <MessageCircle size={16} /> Chat with seller on WhatsApp
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(59,130,246,0.12)',
                  color: '#3b82f6',
                  padding: '8px 16px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                ⚡ Usually responds within 2 hours
              </div>
            </div>
          </div>

          {/* ===== Filters ===== */}
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 8px 22px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: 16,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#5a6bff')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="typ-meta" style={{ fontWeight: 600 }}>
                  Categories:
                </span>
                {['All', ...new Set(products.map((p) => p.category).filter(Boolean))].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="typ-meta"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: selectedCategory === category ? '#5a6bff' : '#f3f4f6',
                      color: selectedCategory === category ? 'white' : '#6b7280',
                    }}
                  >
                    {category}{' '}
                    {category !== 'All' &&
                      `(${products.filter((p) => p.category === category).length})`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="typ-meta" style={{ fontWeight: 600 }}>
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="typ-meta"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '2px solid #e5e7eb',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            <div className="typ-meta" style={{ marginTop: 16 }}>
              Showing {filteredProducts.length} of {products.length} products
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </div>
          </div>

          {/* ===== Products Grid ===== */}
          {filteredProducts.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredProducts.map((product) => {
                const hasAnalytics =
                  (product.analytics?.views || 0) > 0 ||
                  (product.analytics?.contacts || 0) > 0;
                const isLow = !!lowResImages[product.productId];

                return (
                  <div
                    key={product.productId}
                    className="product-card"
                    onClick={() => handleProductView(product)}
                    onMouseEnter={() => setHoveredProduct(product.productId)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                        aspectRatio: '4 / 3',
                        background: '#f8fafc',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="product-image"
                        onLoad={(e) => handleImageLoad(product.productId, e)}
                        onError={handleImageError}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />

                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.3) 100%)',
                          opacity: hoveredProduct === product.productId ? 1 : 0,
                          visibility:
                            hoveredProduct === product.productId ? 'visible' : 'hidden',
                          transition: 'all .3s ease',
                        }}
                      />

                      {isLow && (
                        <div
                          className="typ-meta"
                          style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            background: 'rgba(255,255,255,0.95)',
                            color: '#dc2626',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontWeight: 700,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          }}
                        >
                          Low-res image
                        </div>
                      )}

                      <button
                        onClick={(e) => handleToggleFavorite(product.productId, e)}
                        className={`favorite-btn ${favorites.has(product.productId) ? 'favorited' : ''}`}
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(255,255,255,0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: 18,
                          zIndex: 10,
                          boxShadow: '0 6px 14px rgba(0,0,0,0.1)',
                        }}
                        aria-label={
                          favorites.has(product.productId)
                            ? 'Remove from favorites'
                            : 'Add to favorites'
                        }
                        title={
                          favorites.has(product.productId)
                            ? 'Remove from favorites'
                            : 'Add to favorites'
                        }
                      >
                        {favorites.has(product.productId) ? '❤️' : '🤍'}
                      </button>

                      {product.featured && (
                        <div
                          className="typ-meta"
                          style={{
                            position: 'absolute',
                            top: isLow ? 46 : 12,
                            left: 12,
                            background:
                              'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          ⭐ Featured
                        </div>
                      )}

                      {product.isLowStock && (
                        <div
                          className="typ-meta"
                          style={{
                            position: 'absolute',
                            top: product.featured ? (isLow ? 86 : 52) : (isLow ? 46 : 12),
                            left: 12,
                            background:
                              'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                            animation: 'pulse 2s infinite',
                          }}
                        >
                          🔥 Only {product.quantity} left!
                        </div>
                      )}

                      <div
                        className="typ-meta"
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          right: 12,
                          background: 'rgba(0,0,0,0.65)',
                          color: 'white',
                          padding: '6px 10px',
                          borderRadius: 20,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Eye size={14} /> {product.analytics?.views || 0}
                      </div>

                      {hoveredProduct === product.productId && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 12,
                            left: 12,
                            display: 'flex',
                            gap: 8,
                            animation: 'slideUp .3s ease-out',
                          }}
                        >
                          <div
                            className="typ-meta"
                            style={{
                              background: 'rgba(255,255,255,0.95)',
                              color: '#1f2937',
                              padding: '6px 10px',
                              borderRadius: 20,
                              fontWeight: 600,
                              backdropFilter: 'blur(10px)',
                            }}
                          >
                            📦 {product.category || 'General'}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ marginBottom: 10 }}>
                        <h3 className="typ-title" style={{ margin: '0 0 8px' }}>
                          {product.name}
                        </h3>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                          }}
                        >
                          <span className="badge-price">
                            {formatPrice(product.price, sellerData?.currency)}
                          </span>
                          <div className="chip">📦 {product.quantity} left</div>
                        </div>
                      </div>

                      {product.description && (
                        <p
                          className="typ-body"
                          style={{
                            margin: '0 0 16px',
                            height: 42,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {product.description}
                        </p>
                      )}

                      <div style={{ marginBottom: 18, minHeight: hasAnalytics ? undefined : 40 }}>
                        {hasAnalytics && (
                          <div
                            className="typ-meta"
                            style={{
                              display: 'flex',
                              gap: 16,
                              color: '#6b7280',
                              padding: '8px 12px',
                              background: 'rgba(107,114,128,0.1)',
                              borderRadius: 12,
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Eye size={14} /> {product.analytics?.views || 0} views
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MessageCircle size={14} />{' '}
                              {product.analytics?.contacts || 0} contacts
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1 }} />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactSeller(product);
                        }}
                        className="btn-primary-whatsapp"
                        style={{ width: '100%' }}
                      >
                        <MessageCircle size={18} />
                        Contact Seller
                        <span
                          className="typ-meta"
                          style={{
                            background: 'rgba(255,255,255,0.22)',
                            padding: '2px 8px',
                            borderRadius: 12,
                            marginLeft: 4,
                          }}
                        >
                          WhatsApp
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '16px',
                padding: '60px',
                textAlign: 'center',
              }}
            >
              <h3 className="typ-title" style={{ opacity: 0.7, margin: '0 0 8px' }}>
                {products.length === 0 ? 'No products available' : 'No products found'}
              </h3>
              <p className="typ-meta" style={{ margin: 0 }}>
                {products.length === 0
                  ? 'This store is being set up. Check back soon!'
                  : 'Try adjusting your search or filters.'}
              </p>
              {(searchTerm || selectedCategory !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                  style={{
                    marginTop: 16,
                    padding: '8px 16px',
                    background: '#5a6bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 40, padding: '20px', opacity: 0.6 }}>
            <p className="typ-meta" style={{ margin: 0 }}>
              Powered by 🛍️ ShopLink
            </p>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp FAB */}
      {showChatFab && (
        <button
          className="whatsapp-fab"
          onClick={handleFloatingChatClick}
          aria-label="Chat with seller on WhatsApp"
          title="Chat with seller on WhatsApp"
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              background: 'rgba(255,255,255,.22)',
              borderRadius: '50%',
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ✆
          </span>
          <span style={{ fontWeight: 800 }}>Chat</span>
        </button>
      )}

      {/* Contact confirmation (mobile) */}
      {contactNotification.show && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 24px',
                background: 'rgba(37,211,102,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircle size={32} style={{ color: '#25D366' }} />
            </div>
            <h2 className="typ-title" style={{ margin: '0 0 12px' }}>
              Welcome Back!
            </h2>
            <p className="typ-body" style={{ margin: '0 0 32px' }}>
              Your WhatsApp message about {contactNotification.product?.name} has been
              sent. Continue browsing for more great products!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setContactNotification({ show: false, product: null })}
                style={{
                  padding: '12px 32px',
                  background: '#5a6bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product detail modal */}
      {showProductModal && selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <h2 className="typ-title" style={{ margin: '0 0 8px' }}>
                  {selectedProduct.name}
                </h2>
                {selectedProduct.category && (
                  <span
                    className="typ-meta"
                    style={{
                      background: '#f3f4f6',
                      color: '#6b7280',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontWeight: 600,
                    }}
                  >
                    📦 {selectedProduct.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div
                style={{
                  position: 'relative',
                  marginBottom: '24px',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  background: '#f8fafc',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={getProductImageUrl(selectedProduct)}
                  alt={selectedProduct.name}
                  onLoad={(e) => handleImageLoad(selectedProduct.productId, e)}
                  onError={handleImageError}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {selectedProduct.featured && (
                  <div
                    className="typ-meta"
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 20,
                      fontWeight: 700,
                    }}
                  >
                    ⭐ Featured Product
                  </div>
                )}
                {lowResImages[selectedProduct.productId] && (
                  <div
                    className="typ-meta"
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'rgba(255,255,255,0.95)',
                      color: '#dc2626',
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    Low-res image
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  borderRadius: 16,
                  border: '1px solid #e0f2fe',
                }}
              >
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#059669', marginBottom: 4 }}>
                    {formatPrice(selectedProduct.price, sellerData?.currency)}
                  </div>
                  <div className="typ-meta">Price per unit</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color:
                        selectedProduct.quantity > 10
                          ? '#059669'
                          : selectedProduct.quantity > 0
                          ? '#f59e0b'
                          : '#ef4444',
                      marginBottom: 4,
                    }}
                  >
                    {selectedProduct.quantity} {selectedProduct.quantity === 1 ? 'unit' : 'units'}
                  </div>
                  <div
                    className="typ-meta"
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontWeight: 600,
                      display: 'inline-block',
                      background:
                        selectedProduct.quantity > 10
                          ? '#dcfce7'
                          : selectedProduct.quantity > 0
                          ? '#fef3c7'
                          : '#fee2e2',
                      color:
                        selectedProduct.quantity > 10
                          ? '#059669'
                          : selectedProduct.quantity > 0
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  >
                    {selectedProduct.quantity > 10
                      ? '✅ In Stock'
                      : selectedProduct.quantity > 0
                      ? '⚠️ Low Stock'
                      : '❌ Out of Stock'}
                  </div>
                </div>
              </div>

              {selectedProduct.description && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 className="typ-title" style={{ margin: '0 0 12px' }}>
                    📝 Description
                  </h3>
                  <p className="typ-body" style={{ margin: 0 }}>
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {(selectedProduct.analytics?.views > 0 ||
                selectedProduct.analytics?.contacts > 0) && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 className="typ-title" style={{ margin: '0 0 12px' }}>
                    📊 Product Stats
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                        {selectedProduct.analytics?.views || 0}
                      </div>
                      <div className="typ-meta">👁️ Views</div>
                    </div>
                    <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                        {selectedProduct.analytics?.contacts || 0}
                      </div>
                      <div className="typ-meta">💬 Contacts</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gap: 12 }}>
                <button
                  onClick={() => {
                    handleContactSeller(selectedProduct);
                    setShowProductModal(false);
                  }}
                  className="btn-primary-whatsapp"
                  style={{ width: '100%', padding: 16 }}
                >
                  <MessageCircle size={20} />
                  Contact Seller on WhatsApp
                </button>

                <button
                  onClick={() =>
                    handleToggleFavorite(selectedProduct.productId, { stopPropagation: () => {} })
                  }
                  className="typ-meta"
                  style={{
                    width: '100%',
                    padding: 12,
                    background: favorites.has(selectedProduct.productId) ? '#fee2e2' : '#f3f4f6',
                    color: favorites.has(selectedProduct.productId) ? '#dc2626' : '#6b7280',
                    border: '1px solid',
                    borderColor: favorites.has(selectedProduct.productId) ? '#fecaca' : '#e5e7eb',
                    borderRadius: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {favorites.has(selectedProduct.productId)
                    ? '❤️ Remove from Favorites'
                    : '🤍 Add to Favorites'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StorefrontPublicView;
