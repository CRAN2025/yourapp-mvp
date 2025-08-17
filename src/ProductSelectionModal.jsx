import React, { useState } from 'react';
import {
  MessageCircle, X, Plus, Minus, Phone, Smartphone,
  Info, CreditCard, Truck, MapPin, Store as StoreIcon
} from 'lucide-react';
import {
  standardizeSellerData,
  getProductImageUrl,
  formatPrice,
  createWhatsAppMessage,
  generateWhatsAppUrl,
  validateOrderForm,
  trackInteraction
} from './sharedUtils';

const ProductSelectionModal = ({
  product,
  sellerData: rawSellerData,
  isOpen,
  onClose,
  onOrderSubmit
}) => {
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    deliveryAddress: '',
    notes: '',
    preferredPayment: ''
  });

  if (!isOpen || !product) return null;
  const sellerData = standardizeSellerData(rawSellerData);

  const totalPrice = Number(product.price || 0) * Number(quantity || 0);
  const orderId = `ORD${Date.now().toString().slice(-6)}`;
  const { isValid: isFormValid, errors } = validateOrderForm(customerInfo);

  const handleQty = (q) => {
    const max = Number(product.quantity || 0);
    if (q >= 1 && q <= max) setQuantity(q);
  };

  const handleContact = async (method) => {
    const orderDetails = { product, quantity, customerInfo, totalPrice, orderId, contactMethod: method };

    if (sellerData.uid && product.productId) {
      await trackInteraction(sellerData.uid, product.productId, 'order_attempt', {
        quantity, totalPrice, contactMethod: method
      });
    }

    const msg = createWhatsAppMessage.orderPlacement(orderDetails, sellerData);

    if (method === 'whatsapp') {
      window.open(generateWhatsAppUrl(sellerData.whatsappNumber, msg), '_blank');
      onOrderSubmit?.(orderDetails);
    } else if (method === 'call') {
      if (window.confirm(
        `Call ${sellerData.storeName}?\n\n${product.name} × ${quantity}\nTotal: ${formatPrice(totalPrice, sellerData.currency)}\nOrder ID: #${orderId}`
      )) {
        window.open(`tel:${sellerData.whatsappNumber}`, '_self');
      }
    } else if (method === 'sms') {
      window.open(`sms:${sellerData.whatsappNumber}?body=${encodeURIComponent(msg)}`, '_self');
    }
    onClose();
  };

  const styles = {
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 },
    modal: { background:'#fff', borderRadius:20, maxWidth:520, width:'100%', maxHeight:'90vh', overflow:'auto' },
    header: { position:'relative', padding:'20px 20px 0' },
    close: { position:'absolute', top:20, right:20, background:'rgba(0,0,0,.1)', border:'none', borderRadius:16, width:32, height:32, display:'grid', placeItems:'center', cursor:'pointer' },
    hero: { width:'100%', height:220, objectFit:'cover', borderRadius:12 },
    content: { padding:20 },
    title: { fontSize:22, fontWeight:800, margin:'16px 0 6px', color:'#1f2937' },
    price: { fontSize:20, fontWeight:700, color:'#059669', marginBottom:12 },
    desc: { fontSize:14, color:'#6b7280', lineHeight:1.5, marginBottom:16 },
    badge: { display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, padding:'4px 8px', borderRadius:999, background:'rgba(0,0,0,.05)', marginRight:6 },
    section: { margin:'16px 0' },
    label: { fontSize:14, fontWeight:700, color:'#374151', marginBottom:8, display:'block' },
    qtyRow: { display:'flex', alignItems:'center', gap:12, marginBottom:8 },
    qtyBtn: { width:40, height:40, border:'2px solid #e5e7eb', borderRadius:8, background:'#fff', display:'grid', placeItems:'center', cursor:'pointer' },
    qtyDisplay: { fontSize:18, fontWeight:700, minWidth:60, textAlign:'center', padding:'8px 16px', border:'2px solid #e5e7eb', borderRadius:8 },
    small: { fontSize:12, color:'#6b7280' },
    input: { width:'100%', padding:'12px 14px', border:'2px solid #e5e7eb', borderRadius:12, fontSize:14, marginBottom:10 },
    select: { width:'100%', padding:'12px 14px', border:'2px solid #e5e7eb', borderRadius:12, fontSize:14, background:'#fff', marginBottom:10 },
    textarea: { width:'100%', padding:'12px 14px', border:'2px solid #e5e7eb', borderRadius:12, fontSize:14, minHeight:80 },
    totalBox: { background:'rgba(90,107,255,.06)', padding:16, borderRadius:12, marginTop:8 },
    total: { fontSize:26, fontWeight:800, color:'#059669' },
    contactGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:8 },
    contactBtn: { padding:'12px 8px', border:'2px solid #e5e7eb', borderRadius:12, background:'#fff', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, fontSize:12, fontWeight:700 },
    disabled: { opacity:.5, cursor:'not-allowed' },
    note: { fontSize:12, color:'#dc2626', background:'rgba(220,38,38,.08)', padding:'8px 10px', borderRadius:8, marginTop:8, textAlign:'center' },
    infoCard: { background:'rgba(59,130,246,.05)', border:'1px solid rgba(59,130,246,.2)', borderRadius:12, padding:14 },
    infoTitle: { fontSize:13, fontWeight:800, color:'#2563eb', display:'flex', alignItems:'center', gap:6, marginBottom:8 },
    row: { display:'grid', gap:6, fontSize:13, color:'#374151' },
    chips: { display:'flex', flexWrap:'wrap', gap:6, marginTop:6 },
    sumCard: { background:'rgba(0,0,0,.02)', padding:14, borderRadius:12, marginTop:12 }
  };

  const payments = sellerData.paymentMethods || [];
  const deliveries = sellerData.deliveryOptions || [];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <button style={styles.close} onClick={onClose}><X size={16} /></button>
          <img src={getProductImageUrl(product)} alt={product.name} style={styles.hero} />
        </div>

        <div style={styles.content}>
          <h2 style={styles.title}>{product.name}</h2>
          <div style={styles.price}>{formatPrice(product.price, sellerData.currency)} each</div>

          {product.description && <p style={styles.desc}>{product.description}</p>}

          {/* contextual badges */}
          <div style={{ marginBottom:12 }}>
            {product.isLowStock && <span style={{ ...styles.badge, background:'rgba(245,158,11,.15)', color:'#b45309' }}>Low Stock</span>}
            <span style={styles.badge}>In stock: {product.quantity}</span>
            {product.category && <span style={styles.badge}>{product.category}</span>}
          </div>

          {/* Order ref */}
          <div style={{ ...styles.badge, background:'rgba(0,0,0,.06)' }}>Order Ref: #{orderId}</div>

          {/* Store info (read-only) */}
          <div style={{ ...styles.section, ...styles.infoCard }}>
            <div style={styles.infoTitle}><Info size={16} /> Store Information</div>
            <div style={styles.row}>
              <div><StoreIcon size={14} /> <strong>Store:</strong> {sellerData.storeName}</div>
              <div><MapPin size={14} /> <strong>Location:</strong> {sellerData.location || 'Available on request'}</div>
              <div style={styles.chips}>
                <span style={{ ...styles.badge, background:'rgba(16,185,129,.12)', color:'#065f46' }}>
                  <CreditCard size={12}/> Payments: {payments.length ? payments.join(', ') : 'See chat'}
                </span>
                <span style={{ ...styles.badge, background:'rgba(59,130,246,.12)', color:'#1e40af' }}>
                  <Truck size={12}/> Delivery: {deliveries.length ? deliveries.join(', ') : 'To be discussed'}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div style={styles.section}>
            <label style={styles.label}>Quantity</label>
            <div style={styles.qtyRow}>
              <button style={styles.qtyBtn} onClick={() => handleQty(quantity - 1)} disabled={quantity <= 1}><Minus size={16} /></button>
              <div style={styles.qtyDisplay}>{quantity}</div>
              <button style={styles.qtyBtn} onClick={() => handleQty(quantity + 1)} disabled={quantity >= product.quantity}><Plus size={16} /></button>
            </div>
            <div style={styles.small}>{product.quantity} available</div>
          </div>

          {/* Customer info */}
          <div style={styles.section}>
            <label style={styles.label}>Customer Information</label>
            <input
              style={{ ...styles.input, ...(errors.name ? { borderColor:'#dc2626' } : {}) }}
              placeholder="Your full name *"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, name: e.target.value }))} />
            {errors.name ? <div style={styles.small} className="error">{errors.name}</div> : <div style={styles.small}>Required</div>}

            <input
              style={{ ...styles.input, ...(errors.phone ? { borderColor:'#dc2626' } : {}) }}
              placeholder="Your phone number *"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, phone: e.target.value }))} />
            {errors.phone ? <div style={styles.small} className="error">{errors.phone}</div> : <div style={styles.small}>Used for confirmation & delivery</div>}

            <input
              style={styles.input}
              placeholder="Delivery address (optional)"
              value={customerInfo.deliveryAddress}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, deliveryAddress: e.target.value }))} />

            <select
              style={styles.select}
              value={customerInfo.preferredPayment}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, preferredPayment: e.target.value }))}>
              <option value="">Select preferred payment (optional)</option>
              {[...payments, 'Other (discuss with seller)'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <textarea
              style={styles.textarea}
              placeholder="Special instructions — size, color, delivery preferences, etc. (optional)"
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, notes: e.target.value }))} />
          </div>

          {/* Total */}
          <div style={styles.totalBox}>
            <div style={styles.small}>Total Amount</div>
            <div style={styles.total}>{formatPrice(totalPrice, sellerData.currency)}</div>
            {quantity > 1 && (
              <div style={styles.small}>{formatPrice(product.price, sellerData.currency)} × {quantity}</div>
            )}
          </div>

          {!isFormValid && (
            <div style={styles.note}>Please provide your name and phone number to proceed</div>
          )}

          {/* Contact methods */}
          <div style={styles.section}>
            <label style={styles.label}>Contact the seller to place your order:</label>
            <div style={styles.contactGrid}>
              <button
                style={{ ...styles.contactBtn, ...(isFormValid ? { borderColor:'#25D366', background:'rgba(37,211,102,.1)', color:'#1a7f43' } : styles.disabled) }}
                disabled={!isFormValid}
                onClick={() => handleContact('whatsapp')}>
                <MessageCircle size={24} /> WhatsApp
                <span style={styles.small}>Recommended</span>
              </button>
              <button
                style={{ ...styles.contactBtn, ...(isFormValid ? {} : styles.disabled) }}
                disabled={!isFormValid}
                onClick={() => handleContact('call')}>
                <Phone size={24} /> Call Now
                <span style={styles.small}>Direct</span>
              </button>
              <button
                style={{ ...styles.contactBtn, ...(isFormValid ? {} : styles.disabled) }}
                disabled={!isFormValid}
                onClick={() => handleContact('sms')}>
                <Smartphone size={24} /> Text/SMS
                <span style={styles.small}>Message</span>
              </button>
            </div>
            <div style={{ ...styles.small, marginTop:8 }}>💡 <strong>WhatsApp</strong> is fastest and great for sharing photos/details</div>
          </div>

          {/* Order summary */}
          <div style={styles.sumCard}>
            <h4 style={{ margin:'0 0 8px', fontSize:14, fontWeight:800, color:'#374151' }}>📋 Order Summary</h4>
            <div style={{ display:'grid', gap:6, fontSize:13 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span>Product:</span><span style={{ fontWeight:600 }}>{product.name}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span>Quantity:</span><span style={{ fontWeight:600 }}>{quantity}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span>Unit Price:</span><span style={{ fontWeight:600 }}>{formatPrice(product.price, sellerData.currency)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:6, borderTop:'1px solid rgba(0,0,0,.08)' }}>
                <span style={{ fontWeight:700 }}>Total:</span><span style={{ fontWeight:800, color:'#059669' }}>{formatPrice(totalPrice, sellerData.currency)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span>Order ID:</span><span style={{ fontWeight:600, fontFamily:'monospace' }}>#{orderId}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;
