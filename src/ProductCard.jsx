import React, { useState } from 'react';
import { Eye, MessageCircle } from 'lucide-react';
import { getProductImageUrl, formatPrice } from '../sharedUtils';

const ProductCard = ({
  product,
  sellerCurrency = 'GHS',
  onContact,          // (product) => void
  onView,             // (product) => void
  onToggleFavorite,   // (productId, event) => void
  isFavorited = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [lowRes, setLowRes] = useState(false);

  const MIN_W = 600;
  const MIN_H = 600;

  const handleLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (w < MIN_W || h < MIN_H) setLowRes(true);
  };

  return (
    <div
      className="product-card"
      onClick={() => onView(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
        transition: 'all .3s cubic-bezier(.4,0,.2,1)'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f8fafc' }}>
        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          onLoad={handleLoad}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s ease' }}
          className="product-image"
        />
        <div className="product-overlay" style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,.06), rgba(0,0,0,.3))', opacity:isHovered?1:0, transition:'opacity .3s ease' }} />

        {/* Low-res badge */}
        {lowRes && (
          <div style={{ position:'absolute', top:12, left:12, background:'rgba(255,255,255,.95)', color:'#dc2626', padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:700, boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
            Low-res image
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={(e) => onToggleFavorite(product.productId, e)}
          className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
          style={{ position:'absolute', top:12, right:12, width:40, height:40, borderRadius:'50%', border:'none', background:'rgba(255,255,255,.95)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18, zIndex:10, boxShadow:'0 6px 14px rgba(0,0,0,.1)' }}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? '❤️' : '🤍'}
        </button>

        {/* Featured / Low stock */}
        {product.featured && (
          <div style={{ position:'absolute', top: lowRes ? 46 : 12, left:12, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:700, boxShadow:'0 4px 12px rgba(245,158,11,.3)' }}>
            ⭐ Featured
          </div>
        )}
        {product.isLowStock && (
          <div style={{ position:'absolute', top: product.featured ? (lowRes ? 86 : 52) : (lowRes ? 46 : 12), left:12, background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:700, boxShadow:'0 4px 12px rgba(239,68,68,.3)', animation:'pulse 2s infinite' }}>
            🔥 Only {product.quantity} left!
          </div>
        )}

        {/* Views */}
        <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,.65)', color:'#fff', padding:'6px 10px', borderRadius:20, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
          <Eye size={14} /> {product.analytics?.views || 0}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'22px', display:'flex', flexDirection:'column', flex:1 }}>
        <div style={{ marginBottom:10 }}>
          <h3 style={{ fontSize:22, fontWeight:800, margin:'0 0 8px', color:'#111827', lineHeight:1.25 }}>
            {product.name}
          </h3>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span className="price-badge" style={{ fontSize:28, fontWeight:900, color:'#fff', padding:'8px 16px', borderRadius:12, textShadow:'0 2px 4px rgba(0,0,0,.08)', background:'linear-gradient(135deg,#047857,#10b981)', boxShadow:'0 2px 6px rgba(0,0,0,.15)' }}>
              {formatPrice(product.price, sellerCurrency)}
            </span>
            <div style={{ fontSize:13, background:'rgba(34,197,94,.12)', color:'#059669', padding:'6px 12px', borderRadius:20, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
              📦 {product.quantity} left
            </div>
          </div>
        </div>

        {product.description && (
          <p style={{ fontSize:14, color:'#6b7280', margin:'0 0 16px', lineHeight:1.5, height:42, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {product.description}
          </p>
        )}

        {(product.analytics?.views > 0 || product.analytics?.contacts > 0) && (
          <div style={{ display:'flex', gap:16, fontSize:13, color:'#6b7280', padding:'8px 12px', background:'rgba(107,114,128,.1)', borderRadius:12, marginBottom:18 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Eye size={14} /> {product.analytics?.views || 0} views
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <MessageCircle size={14} /> {product.analytics?.contacts || 0} contacts
            </span>
          </div>
        )}

        <div style={{ flex:1 }} />

        <button
          onClick={(e) => { e.stopPropagation(); onContact(product); }}
          className="contact-btn"
          style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#25D366,#128C7E)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:'0 4px 16px rgba(37,211,102,.25)' }}
        >
          <MessageCircle size={18} />
          Contact Seller
          <span style={{ background:'rgba(255,255,255,.22)', padding:'2px 8px', borderRadius:12, fontSize:12, marginLeft:4 }}>
            WhatsApp
          </span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
