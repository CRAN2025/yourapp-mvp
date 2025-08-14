import React, { useState } from 'react';
import { MessageCircle, X, Plus, Minus, Phone, Smartphone, MapPin, CreditCard, Truck, Info } from 'lucide-react';
import {
  standardizeSellerData,
  getProductImageUrl,
  formatPrice,
  createWhatsAppMessage,
  generateWhatsAppUrl,
  validateOrderForm,
  trackInteraction
} from './sharedUtils';

const ProductSelectionModal = ({ product, sellerData: rawSellerData, isOpen, onClose, onOrderSubmit }) => {
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    deliveryAddress: '',
    notes: '',
    preferredPayment: ''
  });

  if (!isOpen || !product) return null;

  // Standardize seller data structure
  const sellerData = standardizeSellerData(rawSellerData);

  const totalPrice = product.price * quantity;
  const orderId = `ORD${Date.now().toString().slice(-6)}`;

  // Use shared validation utility
  const { isValid: isFormValid, errors } = validateOrderForm(customerInfo);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleContactMethodSelect = async (method) => {
    const orderDetails = {
      product,
      quantity,
      customerInfo,
      totalPrice,
      orderId,
      contactMethod: method
    };

    // Track order attempt using shared utility
    if (sellerData.uid) {
      await trackInteraction(sellerData.uid, product.productId, 'order_attempt', {
        quantity,
        totalPrice,
        contactMethod: method
      });
    }

    // Create standardized order message
    const message = createWhatsAppMessage.orderPlacement(orderDetails, sellerData);

    if (method === 'whatsapp') {
      // Generate WhatsApp URL using shared utility
      const whatsappUrl = generateWhatsAppUrl(sellerData.whatsappNumber, message);
      window.open(whatsappUrl, '_blank');
      onOrderSubmit?.(orderDetails);
    } else if (method === 'call') {
      // For calls, show confirmation with order details
      if (window.confirm(`Call ${sellerData.storeName}?\n\nYour order details:\n${product.name} x ${quantity}\nTotal: ${formatPrice(totalPrice, sellerData.currency)}\n\nOrder ID: #${orderId} for reference`)) {
        window.open(`tel:${sellerData.whatsappNumber}`, '_self');
      }
    } else if (method === 'sms') {
      window.open(`sms:${sellerData.whatsappNumber}?body=${encodeURIComponent(message)}`, '_self');
    }
    onClose();
  };

  // Enhanced payment methods with regional options
  const paymentMethods = [
    'Mobile Money (MTN/Vodafone)',
    'Bank Transfer',
    'Cash on Delivery',
    'Cash on Pickup',
    'Credit/Debit Card',
    'Other (discuss with seller)'
  ];

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      background: 'white',
      borderRadius: '20px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    header: {
      position: 'relative',
      padding: '20px 20px 0'
    },
    closeButton: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.1)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    },
    productImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      borderRadius: '12px'
    },
    content: {
      padding: '20px'
    },
    productName: {
      fontSize: '24px',
      fontWeight: '700',
      margin: '16px 0 8px',
      color: '#1f2937'
    },
    productPrice: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#059669',
      marginBottom: '24px'
    },
    section: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#374151'
    },
    quantitySelector: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px'
    },
    quantityButton: {
      width: '40px',
      height: '40px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    quantityButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    quantityDisplay: {
      fontSize: '20px',
      fontWeight: '600',
      minWidth: '60px',
      textAlign: 'center',
      padding: '8px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px'
    },
    stockInfo: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
      marginBottom: '12px'
    },
    inputError: {
      borderColor: '#dc2626'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
      marginBottom: '12px',
      background: 'white'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '80px',
      fontFamily: 'inherit'
    },
    totalSection: {
      background: 'rgba(90,107,255,0.05)',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '24px'
    },
    totalLabel: {
      fontSize: '16px',
      color: '#6b7280',
      marginBottom: '4px'
    },
    totalPrice: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#059669'
    },
    orderIdSection: {
      background: 'rgba(0,0,0,0.05)',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '24px',
      textAlign: 'center'
    },
    orderId: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#6b7280'
    },
    infoSection: {
      background: 'rgba(59,130,246,0.05)',
      border: '1px solid rgba(59,130,246,0.2)',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '24px'
    },
    infoTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#2563eb',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    infoText: {
      fontSize: '13px',
      color: '#374151',
      lineHeight: 1.4
    },
    contactMethodsSection: {
      marginBottom: '16px'
    },
    contactMethodsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px'
    },
    contactButton: {
      padding: '12px 8px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      background: 'white',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      fontWeight: '600',
      transition: 'all 0.2s',
      textAlign: 'center'
    },
    contactButtonActive: {
      borderColor: '#059669',
      background: 'rgba(5,150,105,0.1)',
      color: '#059669'
    },
    contactButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    requiredNote: {
      fontSize: '12px',
      color: '#dc2626',
      marginBottom: '16px',
      textAlign: 'center',
      background: 'rgba(220,38,38,0.1)',
      padding: '8px 12px',
      borderRadius: '8px'
    },
    validationText: {
      fontSize: '11px',
      color: '#6b7280',
      marginTop: '4px'
    },
    errorText: {
      fontSize: '11px',
      color: '#dc2626',
      marginTop: '4px'
    },
    featuredBadge: {
      position: 'absolute',
      top: '8px',
      left: '8px',
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    lowStockBadge: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: 'rgba(245, 158, 11, 0.9)',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
          <div style={{ position: 'relative' }}>
            <img 
              src={getProductImageUrl(product)} 
              alt={product.name}
              style={styles.productImage}
            />
            
            {/* Product badges */}
            {product.featured && (
              <div style={styles.featuredBadge}>
                ⭐ Featured
              </div>
            )}
            
            {product.isLowStock && (
              <div style={styles.lowStockBadge}>
                Low Stock
              </div>
            )}
          </div>
        </div>
        
        <div style={styles.content}>
          <h2 style={styles.productName}>{product.name}</h2>
          <div style={styles.productPrice}>{formatPrice(product.price, sellerData.currency)} each</div>
          
          {/* Product description */}
          {product.description && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}
          
          {/* Order ID */}
          <div style={styles.orderIdSection}>
            <div style={styles.orderId}>Order Reference: #{orderId}</div>
          </div>

          {/* Store Information */}
          <div style={styles.infoSection}>
            <div style={styles.infoTitle}>
              <Info size={16} />
              Store Information
            </div>
            <div style={styles.infoText}>
              <strong>Store:</strong> {sellerData?.storeName || 'Our Store'}<br/>
              <strong>Location:</strong> {sellerData?.location || 'Available on request'}<br/>
              <strong>Payment Methods:</strong> Mobile Money, Bank Transfer, Cash on Delivery<br/>
              <strong>Delivery:</strong> Available (terms to be discussed)<br/>
              <strong>Contact:</strong> {sellerData?.whatsappNumber || 'Available below'}
            </div>
          </div>

          {/* Quantity Selection */}
          <div style={styles.section}>
            <label style={styles.label}>Quantity</label>
            <div style={styles.quantitySelector}>
              <button 
                style={{
                  ...styles.quantityButton,
                  ...(quantity <= 1 ? styles.quantityButtonDisabled : {})
                }}
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              
              <div style={styles.quantityDisplay}>{quantity}</div>
              
              <button 
                style={{
                  ...styles.quantityButton,
                  ...(quantity >= product.quantity ? styles.quantityButtonDisabled : {})
                }}
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.quantity}
              >
                <Plus size={16} />
              </button>
            </div>
            <div style={styles.stockInfo}>
              {product.quantity} available in stock
              {product.isLowStock && (
                <span style={{ color: '#f59e0b', fontWeight: '600', marginLeft: '8px' }}>
                  ⚠️ Low stock!
                </span>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div style={styles.section}>
            <label style={styles.label}>Customer Information</label>
            <input
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {})
              }}
              placeholder="Your full name *"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
            />
            {errors.name ? (
              <div style={styles.errorText}>{errors.name}</div>
            ) : (
              <div style={styles.validationText}>Required - helps us process your order</div>
            )}
            
            <input
              style={{
                ...styles.input,
                ...(errors.phone ? styles.inputError : {})
              }}
              placeholder="Your phone number *"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
            />
            {errors.phone ? (
              <div style={styles.errorText}>{errors.phone}</div>
            ) : (
              <div style={styles.validationText}>Required - for order confirmation and delivery coordination</div>
            )}
            
            <input
              style={styles.input}
              placeholder="Delivery address (optional)"
              value={customerInfo.deliveryAddress}
              onChange={(e) => setCustomerInfo(prev => ({...prev, deliveryAddress: e.target.value}))}
            />
            <div style={styles.validationText}>Optional - can be discussed with seller if not provided</div>

            <select
              style={styles.select}
              value={customerInfo.preferredPayment}
              onChange={(e) => setCustomerInfo(prev => ({...prev, preferredPayment: e.target.value}))}
            >
              <option value="">Select preferred payment method (optional)</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            
            <textarea
              style={styles.textarea}
              placeholder="Special instructions - size, color, delivery preferences, etc. (optional)"
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo(prev => ({...prev, notes: e.target.value}))}
            />
          </div>

          {/* Total Price */}
          <div style={styles.totalSection}>
            <div style={styles.totalLabel}>Total Amount</div>
            <div style={styles.totalPrice}>{formatPrice(totalPrice, sellerData.currency)}</div>
            {quantity > 1 && (
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {formatPrice(product.price, sellerData.currency)} × {quantity}
              </div>
            )}
          </div>

          {!isFormValid && (
            <div style={styles.requiredNote}>
              Please provide your name and phone number to proceed with the order
            </div>
          )}

          {/* Contact Method Selection */}
          <div style={styles.contactMethodsSection}>
            <label style={styles.label}>Contact the seller to place your order:</label>
            <div style={styles.contactMethodsGrid}>
              <button
                style={{
                  ...styles.contactButton,
                  ...(isFormValid ? {} : styles.contactButtonDisabled),
                  ...(isFormValid ? { borderColor: '#25D366', background: 'rgba(37,211,102,0.1)' } : {})
                }}
                onClick={() => handleContactMethodSelect('whatsapp')}
                disabled={!isFormValid}
              >
                <MessageCircle size={24} style={{ color: isFormValid ? '#25D366' : 'inherit' }} />
                <span style={{ color: isFormValid ? '#25D366' : 'inherit' }}>WhatsApp</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Recommended</span>
              </button>
              
              <button
                style={{
                  ...styles.contactButton,
                  ...(isFormValid ? {} : styles.contactButtonDisabled)
                }}
                onClick={() => handleContactMethodSelect('call')}
                disabled={!isFormValid}
              >
                <Phone size={24} />
                <span>Call Now</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Direct</span>
              </button>
              
              <button
                style={{
                  ...styles.contactButton,
                  ...(isFormValid ? {} : styles.contactButtonDisabled)
                }}
                onClick={() => handleContactMethodSelect('sms')}
                disabled={!isFormValid}
              >
                <Smartphone size={24} />
                <span>Text/SMS</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Message</span>
              </button>
            </div>
            
            {/* Contact method info */}
            <div style={{ 
              background: 'rgba(59,130,246,0.05)', 
              padding: '12px', 
              borderRadius: '8px', 
              marginTop: '12px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              💡 <strong>WhatsApp is recommended</strong> - fastest response time and easiest for sharing photos/details
            </div>
          </div>

          {/* Enhanced order summary */}
          <div style={{
            background: 'rgba(0,0,0,0.02)',
            padding: '16px',
            borderRadius: '12px',
            marginTop: '16px'
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              📋 Order Summary
            </h4>
            <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Product:</span>
                <span style={{ fontWeight: '600' }}>{product.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quantity:</span>
                <span style={{ fontWeight: '600' }}>{quantity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Unit Price:</span>
                <span style={{ fontWeight: '600' }}>{formatPrice(product.price, sellerData.currency)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '8px', 
                borderTop: '1px solid rgba(0,0,0,0.1)',
                fontSize: '14px',
                fontWeight: '700'
              }}>
                <span>Total:</span>
                <span style={{ color: '#059669' }}>{formatPrice(totalPrice, sellerData.currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Order ID:</span>
                <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>#{orderId}</span>
              </div>
              {customerInfo.name && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Customer:</span>
                  <span style={{ fontWeight: '600' }}>{customerInfo.name}</span>
                </div>
              )}
              {customerInfo.preferredPayment && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Payment:</span>
                  <span style={{ fontWeight: '600' }}>{customerInfo.preferredPayment}</span>
                </div>
              )}
            </div>
          </div>

          {/* Analytics info for seller (if viewing own product) */}
          {product.analytics && (product.analytics.views > 0 || product.analytics.contacts > 0) && (
            <div style={{
              background: 'rgba(99,102,241,0.05)',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '16px',
              display: 'flex',
              gap: '16px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <span>👁️ {product.analytics.views || 0} views</span>
              <span>💬 {product.analytics.contacts || 0} contacts</span>
              {product.analytics.orders > 0 && (
                <span>🛒 {product.analytics.orders} orders</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;