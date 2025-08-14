import React, { useState } from 'react';
import { CheckCircle, MessageCircle, X, ArrowLeft } from 'lucide-react';

const OrderSuccessModal = ({ isOpen, onClose, orderDetails, sellerData }) => {
  const [isHovering, setIsHovering] = useState(false);

  if (!isOpen) return null;

  const formatPrice = (price) => {
    const currency = sellerData?.currency || 'GHS';
    return new Intl.NumberFormat('en-NG', { 
      style:'currency', 
      currency: currency, 
      minimumFractionDigits:0 
    }).format(price);
  };

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
      maxWidth: '400px',
      width: '100%',
      padding: '32px 24px',
      textAlign: 'center'
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
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
    successIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 24px',
      background: 'rgba(34,197,94,0.1)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      margin: '0 0 12px',
      color: '#1f2937'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0 0 32px',
      lineHeight: 1.5
    },
    orderSummary: {
      background: 'rgba(90,107,255,0.05)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      textAlign: 'left'
    },
    summaryTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#374151'
    },
    orderItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    itemName: {
      fontSize: '14px',
      color: '#374151'
    },
    itemPrice: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#059669'
    },
    total: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '12px',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      marginTop: '12px'
    },
    totalLabel: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937'
    },
    totalPrice: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#059669'
    },
    notes: {
      marginTop: '12px',
      padding: '8px 12px',
      background: 'rgba(0,0,0,0.05)',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#6b7280'
    },
    whatsappBanner: {
      background: 'rgba(37,211,102,0.1)',
      border: '1px solid rgba(37,211,102,0.2)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    bannerText: {
      fontSize: '14px',
      color: '#059669',
      fontWeight: '500'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px'
    },
    backButton: {
      flex: 1,
      padding: '12px 20px',
      background: 'rgba(0,0,0,0.05)',
      border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      color: '#374151'
    },
    whatsappButton: {
      flex: 1,
      padding: '12px 20px',
      background: isHovering ? '#128C7E' : '#25D366',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s ease'
    }
  };

  const openWhatsApp = () => {
    if (orderDetails && sellerData) {
      const message = `Hi! I'd like to order:

📦 PRODUCT: ${orderDetails.product.name} x ${orderDetails.quantity}
💰 TOTAL: ${formatPrice(orderDetails.totalPrice)}
🆔 ORDER ID: #${orderDetails.orderId}

👤 CUSTOMER INFO:
Name: ${orderDetails.customerInfo.name}
Phone: ${orderDetails.customerInfo.phone}
${orderDetails.customerInfo.deliveryAddress ? `Delivery: ${orderDetails.customerInfo.deliveryAddress}` : 'Delivery: To be discussed'}
${orderDetails.customerInfo.preferredPayment ? `Preferred Payment: ${orderDetails.customerInfo.preferredPayment}` : 'Payment: To be discussed'}

${orderDetails.customerInfo.notes ? `📝 SPECIAL NOTES:\n${orderDetails.customerInfo.notes}\n` : ''}
🏪 FROM: ${sellerData.storeName || 'Your Store'}

Please confirm availability and payment details. Thank you!`;

      const whatsappUrl = `https://wa.me/${sellerData.whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{...styles.modal, position: 'relative'}} onClick={e => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>
          <X size={16} />
        </button>

        <div style={styles.successIcon}>
          <CheckCircle size={32} style={{ color: '#22c55e' }} />
        </div>

        <h2 style={styles.title}>Order Ready!</h2>
        <p style={styles.subtitle}>
          Your order details are ready to send via WhatsApp. Complete your purchase by sending the message below.
        </p>

        {/* WhatsApp Banner */}
        <div style={styles.whatsappBanner}>
          <MessageCircle size={20} style={{ color: '#25D366' }} />
          <div style={styles.bannerText}>
            WhatsApp will open with your order details pre-filled
          </div>
        </div>

        {/* Order Summary */}
        {orderDetails && (
          <div style={styles.orderSummary}>
            <div style={styles.summaryTitle}>Order Summary</div>
            
            <div style={styles.orderItem}>
              <span style={styles.itemName}>
                {orderDetails.product.name} × {orderDetails.quantity}
              </span>
              <span style={styles.itemPrice}>
                {formatPrice(orderDetails.totalPrice)}
              </span>
            </div>

            {orderDetails.customerInfo.notes && (
              <div style={styles.notes}>
                <strong>Note:</strong> {orderDetails.customerInfo.notes}
              </div>
            )}

            <div style={styles.total}>
              <span style={styles.totalLabel}>Total</span>
              <span style={styles.totalPrice}>
                {formatPrice(orderDetails.totalPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button style={styles.backButton} onClick={onClose}>
            <ArrowLeft size={16} />
            Back to Store
          </button>
          <button 
            style={styles.whatsappButton} 
            onClick={openWhatsApp}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <MessageCircle size={16} />
            Send Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;