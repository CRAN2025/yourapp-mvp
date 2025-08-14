// sharedUtils.js - Centralized utilities for consistent behavior across components

import { ref, push, serverTimestamp, get, update } from 'firebase/database';
import { db } from './firebase';

/* =========================================================
   GLOBAL CONSTANTS (used by UI for #1 visual polish)
========================================================= */
export const PLACEHOLDER_IMG =
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

export const MIN_IMG_W = 600;
export const MIN_IMG_H = 600;
export const LOW_STOCK_THRESHOLD = 5;

/* =========================================================
   PHONE NUMBER UTILITIES
========================================================= */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) {
    return `+233 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  } else if (digits.startsWith('234')) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  } else if (digits.length === 10 && !digits.startsWith('0')) {
    return `+233 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  return phone;
};

export const isValidPhoneE164 = (phone) => {
  if (!phone) return false;
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

export const phoneNeedsUpdate = (phone) => !isValidPhoneE164(phone);

export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');

  // 00-prefixed international → strip the 00
  if (digits.startsWith('00')) digits = digits.slice(2);

  // Local Ghana (10 or 9 digits) → add +233
  if ((digits.length === 10 || digits.length === 9) && !digits.startsWith('233')) {
    return `+233${digits}`;
  }

  // Already country code (233/234/etc.)
  if (/^\d{10,15}$/.test(digits)) return `+${digits}`;

  return phone; // fallback
};

/* =========================================================
   PRODUCT UTILITIES
========================================================= */
export const getProductImageUrl = (product) => {
  if (!product) return PLACEHOLDER_IMG;

  const pickUrlFromValue = (v) => {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object') {
      return (
        v.url ||
        v.downloadURL ||
        v.src ||
        v.href ||
        v.link ||
        null
      );
    }
    return null;
  };

  let imageUrl = null;

  // Array of images
  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const item of product.images) {
      const u = pickUrlFromValue(item);
      if (u) { imageUrl = u; break; }
    }
  }

  // Object of images
  if (!imageUrl && product.images && typeof product.images === 'object' && !Array.isArray(product.images)) {
    const keys = Object.keys(product.images);
    for (const k of keys) {
      const u = pickUrlFromValue(product.images[k]);
      if (u) { imageUrl = u; break; }
    }
  }

  // Direct fields
  imageUrl =
    imageUrl ||
    product.imageUrl ||
    product.image ||
    product.productImage ||
    product.photoURL ||
    null;

  return typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl : PLACEHOLDER_IMG;
};

export const formatProductForDisplay = (productData) => {
  if (!productData) return null;

  const description =
    typeof productData.description === 'object'
      ? (productData.description.short || productData.description.full || '')
      : (productData.description || '');

  const name =
    typeof productData.name === 'object'
      ? (productData.name.full || productData.name.short || '')
      : (productData.name || '');

  const price = Number(productData.price) || 0;
  const quantity = Number(productData.quantity) || 0;

  return {
    ...productData,
    description,
    name,
    featured: Boolean(productData.featured),
    isLowStock: quantity < LOW_STOCK_THRESHOLD,
    price,
    quantity,
    analytics: {
      views: Number(productData.analytics?.views) || 0,
      contacts: Number(productData.analytics?.contacts) || 0,
      orders: Number(productData.analytics?.orders) || 0,
      ...productData.analytics,
    },
  };
};

/* =========================================================
   CURRENCY UTILITIES
========================================================= */
export const formatPrice = (price, currency = 'GHS') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price || 0);

/* =========================================================
   ANALYTICS UTILITIES
========================================================= */
export const trackInteraction = async (sellerId, productId, action, additionalData = {}) => {
  if (!sellerId || !productId || !action) {
    console.warn('Missing required analytics parameters');
    return;
  }

  try {
    const date = new Date().toISOString().split('T')[0];
    const analyticsRef = ref(db, `users/${sellerId}/analytics/${date}`);

    await push(analyticsRef, {
      productId,
      action,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      ...additionalData,
    });

    const productAnalyticsRef = ref(db, `users/${sellerId}/products/${productId}/analytics`);
    const snap = await get(productAnalyticsRef);
    const current = snap.exists() ? snap.val() : {};

    const updates = {};
    if (action === 'view') updates.views = (current.views || 0) + 1;
    if (action === 'contact') updates.contacts = (current.contacts || 0) + 1;
    if (action === 'order_attempt' || action === 'order_placed') updates.orders = (current.orders || 0) + 1;

    if (Object.keys(updates).length > 0) {
      await update(productAnalyticsRef, updates);
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};

/* =========================================================
   WHATSAPP MESSAGE UTILITIES
========================================================= */
export const createWhatsAppMessage = {
  productInquiry: (product, sellerData, productUrl) => {
    const productRef = product.productId?.slice(-6).toUpperCase() || 'REF';
    return `Hi! I'm interested in your ${product.name} for ${formatPrice(
      product.price,
      sellerData?.currency
    )}.

📦 Product: ${product.name}
💰 Price: ${formatPrice(product.price, sellerData?.currency)}
🔗 Ref: #${productRef} (${product.name}${product.category ? ` - ${product.category}` : ''})

${productUrl}

Is it still available?`;
  },

  orderPlacement: (orderDetails, sellerData) => {
    const { product, quantity, customerInfo, totalPrice, orderId } = orderDetails;
    return `Hi! I'd like to order:

📦 PRODUCT: ${product.name} x ${quantity}
💰 TOTAL: ${formatPrice(totalPrice, sellerData?.currency)}
🆔 ORDER ID: #${orderId}

👤 CUSTOMER INFO:
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}
${customerInfo.deliveryAddress ? `Delivery: ${customerInfo.deliveryAddress}` : 'Delivery: To be discussed'}
${customerInfo.preferredPayment ? `Preferred Payment: ${customerInfo.preferredPayment}` : 'Payment: To be discussed'}

${customerInfo.notes ? `📝 SPECIAL NOTES:\n${customerInfo.notes}\n` : ''}
🏪 FROM: ${sellerData?.storeName || 'Your Store'}

Please confirm availability and payment details. Thank you!`;
  },

  storeShare: (sellerData, storeUrl) => {
    const displayPhone = sellerData?.whatsappNumber ? formatPhoneForDisplay(sellerData.whatsappNumber) : '';
    return `🛍️ Check out my store: ${sellerData?.storeName || 'My Store'}

${storeUrl}${displayPhone ? `\n\n📱 WhatsApp: ${displayPhone}` : ''}`;
  },

  statusUpdate: (sellerData, storeUrl) =>
    `🛍️ My ${sellerData?.storeName || 'store'} is now open! Check out what I'm selling: ${storeUrl}`,
};

/* =========================================================
   DATA STANDARDIZATION
========================================================= */
export const standardizeSellerData = (data) => {
  const normalized = data?.userProfile || data?.sellerData || data || {};
  return {
    uid: normalized.uid,
    storeName: normalized.storeName,
    storeDescription: normalized.storeDescription,
    businessCategory: normalized.businessCategory,
    whatsappNumber: normalizePhoneNumber(normalized.whatsappNumber),
    location: normalized.location,
    currency: normalized.currency || 'GHS',
    bannerUrl: normalized.bannerUrl || normalized.coverImage || '',
    ...normalized,
  };
};

/* =========================================================
   DEVICE & URL HELPERS
========================================================= */
export const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
  'ontouchstart' in window;

// NOTE: wa.me must NOT include "+" in the phone number
export const generateWhatsAppUrl = (phoneNumber, message) => {
  const normalized = normalizePhoneNumber(phoneNumber);
  const digitsOnly = normalized.replace(/\D/g, '');
  const encoded = encodeURIComponent(message || '');
  return isMobileDevice()
    ? `whatsapp://send?phone=${digitsOnly}&text=${encoded}`
    : `https://wa.me/${digitsOnly}?text=${encoded}`;
};

/* =========================================================
   UI HELPERS
========================================================= */
export function buildStoreDetailChips(seller = {}) {
  const chips = [];
  if (seller.category || seller.businessCategory) {
    chips.push({ label: seller.category || seller.businessCategory });
  }
  const city = seller.city || seller.location?.city;
  const country = seller.country || seller.location?.country;
  if (city && country) chips.push({ label: `${city}, ${country}` });
  else if (city) chips.push({ label: city });
  else if (country) chips.push({ label: country });
  if (Array.isArray(seller.deliveryOptions) && seller.deliveryOptions.length) {
    chips.push({ label: `${seller.deliveryOptions.length} delivery option(s)` });
  }
  if (Array.isArray(seller.paymentMethods) && seller.paymentMethods.length) {
    chips.push({ label: `${seller.paymentMethods.length} payment method(s)` });
  }
  return chips;
}

/* =========================================================
   ERROR & VALIDATION
========================================================= */
export const handleAsyncError = (operation) => async (...args) => {
  try {
    return await operation(...args);
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
};

export const validateOrderForm = (customerInfo) => {
  const errors = {};
  if (!customerInfo.name || customerInfo.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  if (!customerInfo.phone || customerInfo.phone.trim().replace(/\D/g, '').length < 10) {
    errors.phone = 'Valid phone number is required';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};

export default {
  formatPhoneForDisplay,
  isValidPhoneE164,
  phoneNeedsUpdate,
  normalizePhoneNumber,
  getProductImageUrl,
  formatProductForDisplay,
  formatPrice,
  trackInteraction,
  createWhatsAppMessage,
  generateWhatsAppUrl,
  isMobileDevice,
  standardizeSellerData,
  validateOrderForm,
  handleAsyncError,
  buildStoreDetailChips,
  PLACEHOLDER_IMG,
  MIN_IMG_W,
  MIN_IMG_H,
  LOW_STOCK_THRESHOLD,
};
