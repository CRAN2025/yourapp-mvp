// src/ProductCard.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { Eye, MessageCircle } from 'lucide-react';
import { getProductImageUrl, formatPrice, MIN_IMG_W, MIN_IMG_H } from './sharedUtils';

const ProductCard = ({
  product,
  sellerCurrency = 'GHS',
  onContact,
  onView,
  onToggleFavorite,
  isFavorited = false,
  isLoading = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [lowRes, setLowRes] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ---- Guards ---------------------------------------------------------------
  const isValidProduct = useMemo(() => {
    return (
      product &&
      typeof product === 'object' &&
      product.name &&
      typeof Number(product.price) === 'number' &&
      !Number.isNaN(Number(product.price)) &&
      typeof Number(product.quantity) === 'number' &&
      !Number.isNaN(Number(product.quantity))
    );
  }, [product]);

  // ---- Derived, safe data ---------------------------------------------------
  const analytics = useMemo(() => {
    const d = { views: 0, contacts: 0, orders: 0 };
    return product?.analytics ? { ...d, ...product.analytics } : d;
  }, [product?.analytics]);

  const specSrc =
    product?.specifications ||
    product?.specs ||
    {}; // tolerate different shapes

  const brand =
    product?.brand ||
    specSrc.brand ||
    specSrc.manufacturer ||
    '';

  const weight =
    specSrc.weight ||
    product?.weight ||
    '';

  const dimensions =
    specSrc.dimensions ||
    [specSrc.length, specSrc.width, specSrc.height].filter(Boolean).join(' × ') ||
    '';

  // Normalize features/tags into flat strings and trim/display only a few
  const featureList = useMemo(() => {
    const f = Array.isArray(product?.features) ? product.features : [];
    const t = Array.isArray(product?.tags) ? product.tags : [];
    return [...f, ...t]
      .map(x => (typeof x === 'string' ? x : x?.name || x?.label || ''))
      .filter(Boolean)
      .slice(0, 2);
  }, [product?.features, product?.tags]);

  const safe = useMemo(() => {
    if (!isValidProduct) return null;
    return {
      name: product.name || 'Untitled Product',
      price: Number(product.price) || 0,
      quantity: Number(product.quantity) || 0,
      description: product.description || product.shortDescription || '',
      category: product.category || 'Uncategorized',
      condition: specSrc?.condition || product?.condition || 'New',
      featured: Boolean(product.featured),
      isLowStock: Boolean(product.isLowStock),
      createdAt: product.createdAt,
      productId: product.productId,
    };
  }, [product, isValidProduct, specSrc?.condition]);

  // ---- Handlers -------------------------------------------------------------
  const handleContact = useCallback(
    (e) => {
      e.stopPropagation();
      if (isLoading || typeof onContact !== 'function') return;
      try {
        onContact(product);
      } catch (err) {
        console.error('Contact handler failed:', err);
      }
    },
    [product, onContact, isLoading]
  );

  const handleView = useCallback(() => {
    if (isLoading || typeof onView !== 'function') return;
    try {
      onView(product);
    } catch (err) {
      console.error('View handler failed:', err);
    }
  }, [product, onView, isLoading]);

  const handleFav = useCallback(
    (e) => {
      e.stopPropagation();
      if (isLoading || typeof onToggleFavorite !== 'function') return;
      try {
        onToggleFavorite(product.productId, e);
      } catch (err) {
        console.error('Favorite handler failed:', err);
      }
    },
    [product?.productId, onToggleFavorite, isLoading]
  );

  const handleLoad = useCallback((e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (w < MIN_IMG_W || h < MIN_IMG_H) setLowRes(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setLowRes(false);
  }, []);

  const imageUrl = useMemo(() => getProductImageUrl(product), [product]);

  if (!isValidProduct) {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 20,
          padding: 20,
          textAlign: 'center',
          color: '#6b7280',
          border: '1px solid #e5e7eb',
        }}
      >
        <p>Invalid product data</p>
      </div>
    );
  }

  const {
    name,
    price,
    quantity,
    description,
    category,
    condition,
    featured,
    isLowStock,
    createdAt,
  } = safe;

  // ---- UI -------------------------------------------------------------------
  const MetaChip = ({ children, tone = 'neutral' }) => {
    const tones = {
      neutral: { bg: '#f3f4f6', fg: '#4b5563', border: '#e5e7eb' },
      green: { bg: 'rgba(34,197,94,.12)', fg: '#059669', border: 'rgba(34,197,94,.2)' },
      red: { bg: 'rgba(239,68,68,.12)', fg: '#dc2626', border: 'rgba(239,68,68,.2)' },
      blue: { bg: 'rgba(59,130,246,.12)', fg: '#2563eb', border: 'rgba(59,130,246,.2)' },
    }[tone];
    return (
      <span
        style={{
          background: tones.bg,
          color: tones.fg,
          border: `1px solid ${tones.border}`,
          padding: '6px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    );
  };

  return (
    <div
      className="product-card"
      onClick={handleView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: isLoading ? 'wait' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
        transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f8fafc' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            onLoad={handleLoad}
            onError={handleImageError}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform .3s ease',
            }}
            className="product-image"
          />
        ) : null}

        <div
          className="product-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,.06), rgba(0,0,0,.3))',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity .3s ease',
          }}
        />

        {lowRes && !imageError && imageUrl && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'rgba(255,255,255,.95)',
              color: '#dc2626',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,.08)',
            }}
          >
            Low-res image
          </div>
        )}

        <button
          onClick={handleFav}
          disabled={isLoading}
          className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isLoading ? 'wait' : 'pointer',
            fontSize: 18,
            zIndex: 10,
            boxShadow: '0 6px 14px rgba(0,0,0,.1)',
            opacity: isLoading ? 0.6 : 1,
          }}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? '❤️' : '🤍'}
        </button>

        {featured && (
          <div
            style={{
              position: 'absolute',
              top: lowRes && imageUrl ? 46 : 12,
              left: 12,
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(245,158,11,.3)',
            }}
          >
            ⭐ Featured
          </div>
        )}

        {isLowStock && quantity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: featured ? (lowRes && imageUrl ? 86 : 52) : (lowRes && imageUrl ? 46 : 12),
              left: 12,
              background: 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(239,68,68,.3)',
              animation: 'pulse 2s infinite',
            }}
          >
            🔥 Only {quantity} left!
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'rgba(0,0,0,.65)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Eye size={14} /> {analytics.views}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ marginBottom: 10 }}>
          <h3
            style={{
              fontSize: 22,
              fontWeight: 800,
              margin: '0 0 8px',
              color: '#111827',
              lineHeight: 1.25,
            }}
          >
            {name}
          </h3>

        {/* Price + stock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 12,
                textShadow: '0 2px 4px rgba(0,0,0,.08)',
                background: 'linear-gradient(135deg,#047857,#10b981)',
                boxShadow: '0 2px 6px rgba(0,0,0,.15)',
              }}
            >
              {formatPrice(price, sellerCurrency)}
            </span>

            <MetaChip tone={quantity > 0 ? 'green' : 'red'}>
              📦 {quantity > 0 ? `${quantity} left` : 'Out of stock'}
            </MetaChip>
          </div>
        </div>

        {/* Description (two lines) */}
        {description && (
          <p
            style={{
              fontSize: 14,
              color: '#6b7280',
              margin: '0 0 12px',
              lineHeight: 1.5,
              height: 42,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </p>
        )}

        {/* NEW: spec chips row (brand / weight / dimensions if available) */}
        {(brand || weight || dimensions) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {brand && <MetaChip tone="neutral">🏷️ {brand}</MetaChip>}
            {weight && <MetaChip tone="neutral">⚖️ {weight}</MetaChip>}
            {dimensions && <MetaChip tone="neutral">📐 {dimensions}</MetaChip>}
          </div>
        )}

        {/* NEW: 1–2 features/tags badges */}
        {featureList.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {featureList.map((f) => (
              <span
                key={f}
                style={{
                  background: '#eef2ff',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
                title={f}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {(analytics.views > 0 || analytics.contacts > 0) && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: 13,
              color: '#6b7280',
              padding: '8px 12px',
              background: 'rgba(107,114,128,.1)',
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={14} /> {analytics.views} views
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MessageCircle size={14} /> {analytics.contacts} contacts
            </span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Contact CTA */}
        <button
          onClick={handleContact}
          disabled={isLoading || quantity === 0}
          className="contact-btn"
          style={{
            width: '100%',
            padding: 14,
            background:
              quantity === 0 || isLoading
                ? 'rgba(107,114,128,.3)'
                : 'linear-gradient(135deg,#25D366,#128C7E)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            cursor: quantity === 0 || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow:
              quantity === 0 || isLoading ? 'none' : '0 4px 16px rgba(37,211,102,.25)',
            opacity: quantity === 0 || isLoading ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <MessageCircle size={18} />
          {isLoading ? 'Loading…' : quantity === 0 ? 'Out of Stock' : 'Contact Seller'}
          {quantity > 0 && !isLoading && (
            <span
              style={{
                background: 'rgba(255,255,255,.22)',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
                marginLeft: 4,
              }}
            >
              WhatsApp
            </span>
          )}
        </button>

        {/* Bottom meta line */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10,
            opacity: 0.6,
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span>Category: {category}</span>
          <span>Condition: {condition || 'New'}</span>
          {createdAt && <span>{new Date(createdAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
