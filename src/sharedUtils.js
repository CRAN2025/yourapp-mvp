// sharedUtils.js - unified utilities

export const MIN_IMG_W = 300;
export const MIN_IMG_H = 300;

/* ----------------- Device ----------------- */
export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/* ----------------- UI helpers ----------------- */
export const buildStoreDetailChips = (sellerData = {}) => {
  const chips = [];
  if (sellerData.businessType) {
    chips.push({ label: `${sellerData.businessType[0].toUpperCase()}${sellerData.businessType.slice(1)} Business` });
  }
  if (Array.isArray(sellerData.paymentMethods) && sellerData.paymentMethods.length) {
    chips.push({ label: `${sellerData.paymentMethods.length} Payment ${sellerData.paymentMethods.length === 1 ? 'Method' : 'Methods'}` });
  }
  if (Array.isArray(sellerData.deliveryOptions) && sellerData.deliveryOptions.length) {
    chips.push({ label: `${sellerData.deliveryOptions.length} Delivery ${sellerData.deliveryOptions.length === 1 ? 'Option' : 'Options'}` });
  }
  if (sellerData.currency && sellerData.currency !== 'GHS') chips.push({ label: `${sellerData.currency} Currency` });
  if (sellerData.businessHours && Object.keys(sellerData.businessHours).length) chips.push({ label: 'Business Hours Available' });
  if (sellerData.website) chips.push({ label: 'Website Available' });
  return chips;
};

/* ----------------- Phone ----------------- */
export const normalizeToE164 = (rawNumber, defaultCountry = 'GH') => {
  if (!rawNumber || typeof rawNumber !== 'string') return null;
  let cleaned = rawNumber.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    if (/^\+[1-9]\d{1,3}\d{4,14}$/.test(cleaned) && cleaned.length >= 8 && cleaned.length <= 18) return cleaned;
    return null;
  }
  const rules = {
    GH: { prefix: '+233', len: [9], norm: n => (n.startsWith('0') ? n.slice(1) : n) },
    NG: { prefix: '+234', len: [10], norm: n => (n.startsWith('0') ? n.slice(1) : n) },
    KE: { prefix: '+254', len: [9], norm: n => (n.startsWith('0') ? n.slice(1) : n) },
    ZA: { prefix: '+27',  len: [9], norm: n => (n.startsWith('0') ? n.slice(1) : n) },
    US: { prefix: '+1',   len: [10], norm: n => n },
  };
  const rule = rules[defaultCountry.toUpperCase()];
  if (!rule) {
    const local = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    return local.length === 9 ? `+233${local}` : null;
  }
  const local = rule.norm(cleaned);
  if (rule.len.includes(local.length)) return `${rule.prefix}${local}`;
  if (cleaned.startsWith(rule.prefix.substring(1))) return `+${cleaned}`;
  return null;
};

export const isValidPhoneE164 = (phone) =>
  typeof phone === 'string' &&
  /^\+[1-9]\d{1,3}\d{4,14}$/.test(phone) &&
  phone.length >= 8 &&
  phone.length <= 18;

export const validatePhoneNumber = (phone, country = 'GH') => {
  if (!phone || typeof phone !== 'string')
    return { isValid: false, error: 'Phone number is required', normalized: null };
  const normalized = normalizeToE164(phone, country);
  if (!normalized) return { isValid: false, error: 'Please enter a valid phone number with country code', normalized: null };
  if (!isValidPhoneE164(normalized)) return { isValid: false, error: 'Invalid phone number format', normalized: null };
  return { isValid: true, error: null, normalized };
};

export const phoneNeedsUpdate = (phone) => !!phone && !isValidPhoneE164(phone);

export const getPhoneHint = (country = 'GH') => {
  const hints = {
    GH: 'Include country code, e.g., +233 24 123 4567 or 0241234567',
    NG: 'Include country code, e.g., +234 803 123 4567 or 08031234567',
    KE: 'Include country code, e.g., +254 712 345 678 or 0712345678',
    ZA: 'Include country code, e.g., +27 82 123 4567 or 0821234567',
    US: 'Include country code, e.g., +1 555 123 4567',
  };
  return hints[country.toUpperCase()] || hints.GH;
};

export const formatPhoneForDisplay = (e164) => {
  if (!isValidPhoneE164(e164)) return e164 || '';
  if (e164.startsWith('+233')) {
    const l = e164.slice(4); if (l.length === 9) return `+233 ${l.slice(0,2)} ${l.slice(2,5)} ${l.slice(5)}`;
  } else if (e164.startsWith('+234')) {
    const l = e164.slice(4); if (l.length === 10) return `+234 ${l.slice(0,3)} ${l.slice(3,6)} ${l.slice(6)}`;
  } else if (e164.startsWith('+1')) {
    const l = e164.slice(2); if (l.length === 10) return `+1 (${l.slice(0,3)}) ${l.slice(3,6)}-${l.slice(6)}`;
  }
  return e164;
};

export const generateWhatsAppURL = (phone, message = '') => {
  const normalized = normalizeToE164(phone) || phone;
  const onlyDigits = (normalized || '').replace('+', '');
  return `https://wa.me/${onlyDigits}?text=${encodeURIComponent(message)}`;
};
export const generateWhatsAppUrl = generateWhatsAppURL;

/* ----------------- Price ----------------- */
export const formatPrice = (amount, currency = 'GHS') => {
  if (amount == null || isNaN(amount)) return `${currency} 0.00`;
  const n = Number(amount);
  const symbols = { GHS: '₵', USD: '$', EUR: '€', GBP: '£', NGN: '₦' };
  const s = symbols[currency] || currency;
  if (n >= 1_000_000) return `${s} ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${s} ${(n / 1_000).toFixed(1)}K`;
  return `${s} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* ----------------- Images / descriptions ----------------- */
const PLACEHOLDER = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80';

const extractUrl = (v) => (typeof v === 'string' ? v : (v?.url || v?.src || v?.preview || v?.path || '') || '');
const isUrlLike = (u) => typeof u === 'string' && /^(https?:|blob:|data:)/i.test(u.trim());

export const getProductImageUrl = (p = {}) => {
  const candidates = [
    p.images?.primary, p.image, p.imageUrl, p.coverImage, p.thumbnailUrl,
    ...(Array.isArray(p.images) ? p.images : []),
    ...(Array.isArray(p.images?.gallery) ? p.images.gallery : []),
  ].map(extractUrl).filter(isUrlLike);
  return candidates[0] || PLACEHOLDER;
};

export const getProductImages = (p = {}) => {
  const primary = extractUrl(p.images?.primary);
  const flat = [
    ...(Array.isArray(p.images) ? p.images : []),
    ...(Array.isArray(p.images?.gallery) ? p.images.gallery : []),
  ].map(extractUrl).filter(isUrlLike);
  const all = [primary, ...flat, extractUrl(p.imageUrl), extractUrl(p.coverImage), extractUrl(p.thumbnailUrl)].filter(isUrlLike);
  return [...new Set(all)].length ? [...new Set(all)] : [PLACEHOLDER];
};

export const getProductDescription = (p = {}, type = 'full') => {
  const full = typeof p.description === 'string' ? p.description : (p.description?.full || '');
  const short = typeof p.description === 'string'
    ? (p.description.length > 100 ? `${p.description.slice(0,100)}...` : p.description)
    : (p.description?.short || (full.length > 100 ? `${full.slice(0,100)}...` : full));
  return type === 'short' ? short : full;
};

export const isLowStock = (p = {}, threshold = 5) => {
  const q = Number(p.quantity ?? 0);
  return q > 0 && q <= threshold;
};

/* ----------------- Product shaping ----------------- */
const generateSKU = (name) => `${(name || 'PRD').slice(0,3).toUpperCase()}${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;

export const createEnhancedProduct = (b = {}) => ({
  name: b.name || '',
  price: Number(b.price || 0),
  quantity: Number(b.quantity || 0),
  category: b.category || '',
  subcategory: b.subcategory || '',
  description: typeof b.description === 'string'
    ? { short: b.description.length > 100 ? `${b.description.slice(0,100)}...` : b.description, full: b.description }
    : { short: b.description?.short || '', full: b.description?.full || '' },
  images: {
    primary: extractUrl(b.images?.primary) || extractUrl(b.image) || extractUrl(b.imageUrl) || '',
    gallery: Array.isArray(b.images?.gallery) ? b.images.gallery.map(extractUrl).filter(Boolean)
      : Array.isArray(b.images) ? b.images.map(extractUrl).filter(Boolean) : [],
  },
  specifications: b.specifications || { dimensions: '', weight: '', materials: '', care: '', condition: 'New', origin: '' },
  features: b.features || [],
  tags: b.tags || [],
  seo: b.seo || { title: b.name || '', metaDescription: '' },
  sku: b.sku || generateSKU(b.name),
  status: b.status || 'active',
  featured: !!b.featured,
  createdAt: b.createdAt || Date.now(),
  updatedAt: Date.now(),
  analytics: b.analytics || { views: 0, contacts: 0, orders: 0, lastViewed: null },
});

export const formatProductForDisplay = (p = {}) => {
  const price = Number(p.price ?? 0);
  const quantity = Number(p.quantity ?? 0);
  const images = getProductImages(p);
  return {
    ...p,
    price,
    quantity,
    imageUrl: images[0] || PLACEHOLDER,
    images,
    description: getProductDescription(p, 'full'),
    shortDescription: getProductDescription(p, 'short'),
    isLowStock: isLowStock({ quantity }),
    hasSpecs: Object.keys(p.specifications || {}).some(k => (p.specifications || {})[k]),
    hasFeatures: (p.features || []).length > 0,
  };
};

export const validateProductData = (p = {}) => {
  const errors = [];
  if (!p.name?.trim()) errors.push('Product name is required');
  if (!p.price || Number(p.price) <= 0) errors.push('Valid price is required');
  if (p.quantity == null || Number(p.quantity) < 0) errors.push('Valid quantity is required');
  if (!p.category?.trim()) errors.push('Category is required');
  if (getProductImages(p).filter(isUrlLike).length === 0) errors.push('Product image is required');
  return { isValid: errors.length === 0, errors };
};

export const trackInteraction = async (userId, productId, action, metadata = {}) => {
  if (!userId || !productId || !action) { console.warn('trackInteraction: missing params'); return false; }
  try {
    console.log('Tracking interaction:', { userId, productId, action, metadata, timestamp: Date.now() });
    await new Promise(r => setTimeout(r, 100));
    return true;
  } catch (e) { console.error('trackInteraction error:', e); return false; }
};

export const updateProductAnalytics = (p = {}, action) => {
  const a = p.analytics || { views: 0, contacts: 0, orders: 0, lastViewed: null };
  if (action === 'view') { a.views = (a.views || 0) + 1; a.lastViewed = Date.now(); }
  if (action === 'contact') a.contacts = (a.contacts || 0) + 1;
  if (action === 'order') a.orders = (a.orders || 0) + 1;
  return { ...p, analytics: a, updatedAt: Date.now() };
};

/* ----------------- Seller data ----------------- */
export const standardizeSellerData = (raw = {}) => {
  const up = raw.userProfile || raw;

  const normalized = normalizeToE164(up.whatsappNumber || up.phone || '');
  const whatsappNumber = normalized || (up.whatsappNumber || up.phone || '');

  const paymentMethods = Array.isArray(up.paymentMethods) && up.paymentMethods.length
    ? up.paymentMethods
    : ['Mobile Money', 'Bank Transfer', 'Cash on Delivery'];

  const deliveryOptions = Array.isArray(up.deliveryOptions) && up.deliveryOptions.length
    ? up.deliveryOptions
    : ['Pickup', 'Delivery'];

  return {
    uid: raw.uid || up.uid || '',
    storeName: up.storeName || up.businessName || up.name || 'Store',
    storeDescription: up.storeDescription || up.description || '',
    location: up.location || up.address || 'Location available on request',
    whatsappNumber,
    currency: up.currency || 'GHS',
    businessType: up.businessType || 'retail',
    businessCategory: up.businessCategory || up.category || '',
    category: up.category || up.businessCategory || '',
    email: up.email || '',
    website: up.website || '',
    socialMedia: up.socialMedia || {},
    businessHours: up.businessHours || {},
    paymentMethods,
    deliveryOptions,
    policies: up.policies || { returns: '', shipping: '', privacy: '' },
  };
};

/* ----------------- WhatsApp message builders ----------------- */
export const createWhatsAppMessage = {
  orderPlacement: (order, seller) => {
    const s = standardizeSellerData(seller);
    const { product, quantity, customerInfo, totalPrice, orderId } = order;
    let msg = `🛒 *New Order for ${s.storeName}*\n\n`;
    msg += `📦 *Product:* ${product.name}\n`;
    msg += `🔢 *Quantity:* ${quantity}\n`;
    msg += `💰 *Total:* ${formatPrice(totalPrice, s.currency)}\n`;
    msg += `🆔 *Order ID:* #${orderId}\n\n`;
    msg += `👤 *Customer*\n• ${customerInfo.name}\n• ${customerInfo.phone}\n`;
    if (customerInfo.deliveryAddress) msg += `• ${customerInfo.deliveryAddress}\n`;
    if (customerInfo.preferredPayment) msg += `• Payment: ${customerInfo.preferredPayment}\n`;
    if (customerInfo.notes) msg += `• Notes: ${customerInfo.notes}\n`;
    msg += `\nPlease confirm availability and discuss delivery/pickup.`;
    return msg;
  },

  productInquiry: (product, customerInfo, seller) => {
    const s = standardizeSellerData(seller);
    let msg = `👋 Hi! I'm interested in:\n\n`;
    msg += `📦 *${product.name}*\n`;
    msg += `💰 ${formatPrice(product.price, s.currency)}\n\n`;
    if (customerInfo?.name) msg += `My name is ${customerInfo.name}.\n`;
    msg += `Could you share availability, payment, and delivery options?\n\nThanks!`;
    return msg;
  },

  storeShare: (seller, url) => {
    const s = standardizeSellerData(seller);
    let msg = `🛍️ *Check out ${s.storeName}!*`;
    if (s.storeDescription) msg += `\n\n${s.storeDescription}`;
    if (s.location) msg += `\n\n📍 ${s.location}`;
    if (s.category) msg += `\n📦 Category: ${s.category}`;
    msg += `\n\n🔗 ${url}\n\n💬 Chat with us for details!`;
    return msg;
  },

  statusUpdate: (seller, url) => {
    const s = standardizeSellerData(seller);
    return `🛍️ ${s.storeName} — new items just added! ${url}`;
  }
};

/* ----------------- Order form validation ----------------- */
export const validateOrderForm = (info) => {
  const errors = {};
  if (!info.name || info.name.trim().length < 2) errors.name = 'Name is required (minimum 2 characters)';
  if (!info.phone || info.phone.trim().length < 10) errors.phone = 'Valid phone number is required';
  else if (!isValidPhoneE164(normalizeToE164(info.phone))) errors.phone = 'Please enter a valid phone number';
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateCustomerInfo = (info) => {
  const errors = {};
  if (!info.name?.trim()) errors.name = 'Customer name is required';
  if (!info.phone?.trim()) errors.phone = 'Phone number is required';
  else if (!isValidPhoneE164(normalizeToE164(info.phone))) errors.phone = 'Please enter a valid phone number';
  if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errors.email = 'Please enter a valid email address';
  return { isValid: Object.keys(errors).length === 0, errors };
};

export default {
  MIN_IMG_W, MIN_IMG_H,
  isMobileDevice, buildStoreDetailChips,
  normalizeToE164, isValidPhoneE164, formatPhoneForDisplay, validatePhoneNumber, phoneNeedsUpdate, getPhoneHint,
  generateWhatsAppURL, generateWhatsAppUrl,
  formatPrice,
  getProductImageUrl, getProductImages, getProductDescription,
  createEnhancedProduct, formatProductForDisplay, validateProductData, isLowStock,
  standardizeSellerData, trackInteraction, updateProductAnalytics,
  createWhatsAppMessage, validateOrderForm, validateCustomerInfo,
};
