// utils/productHelpers.js
// Helper functions for enhanced product schema (backward-compatible)

import {
  normalizeToE164,
  isValidPhoneE164,
  formatPhoneForDisplay,
  generateWhatsAppURL,
} from './Phone';

// Single placeholder used anywhere we must show *something*
const PLACEHOLDER =
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80';

/* -------------------------------------------
   URL utils
-------------------------------------------- */
const extractUrl = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    // Common shapes from upload/preview libs
    return val.url || val.src || val.preview || val.path || '';
  }
  return '';
};

const isUrlLike = (u) =>
  typeof u === 'string' && /^(https?:|blob:|data:)/i.test(u.trim());

/* -------------------------------------------
   Primary image (handles arrays/objects/legacy)
   Returns a valid URL or the placeholder.
-------------------------------------------- */
export const getProductImageUrl = (product = {}) => {
  const candidatesRaw = [
    product.images?.primary,
    product.image,
    product.imageUrl,
    product.coverImage,
    product.thumbnailUrl,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.images?.gallery) ? product.images.gallery : []),
  ];

  const candidates = candidatesRaw.map(extractUrl).filter(isUrlLike);
  return candidates[0] || PLACEHOLDER;
};

/* -------------------------------------------
   Gallery: normalize to a unique array of URLs
   (primary first), accepting all shapes
-------------------------------------------- */
export const getProductImages = (product = {}) => {
  const primary = extractUrl(product.images?.primary);
  const arrays = [
    Array.isArray(product.images) ? product.images : [],
    Array.isArray(product.images?.gallery) ? product.images.gallery : [],
  ];

  const flat = arrays.flat().map(extractUrl).filter(isUrlLike);
  const all = [primary, ...flat, extractUrl(product.imageUrl), extractUrl(product.coverImage), extractUrl(product.thumbnailUrl)]
    .filter(isUrlLike);

  // de-dup while keeping order
  const uniq = [...new Set(all)];
  return uniq.length ? uniq : [PLACEHOLDER];
};

/* -------------------------------------------
   Descriptions can be strings or {short,full}
-------------------------------------------- */
export const getProductDescription = (product = {}, type = 'full') => {
  if (typeof product.description === 'string') {
    const full = product.description;
    const short = full.length > 100 ? `${full.substring(0, 100)}...` : full;
    return type === 'short' ? short : full;
  }
  const full = product.description?.full || '';
  const short =
    product.description?.short ||
    (full.length > 100 ? `${full.substring(0, 100)}...` : full);
  return type === 'short' ? short : full;
};

/* -------------------------------------------
   Low stock helper (UI uses threshold <= 5)
-------------------------------------------- */
export const isLowStock = (product = {}, threshold = 5) => {
  const q = Number(product.quantity ?? 0);
  return q > 0 && q <= threshold;
};

/* -------------------------------------------
   Create/normalize a product object
-------------------------------------------- */
export const createEnhancedProduct = (basicProduct = {}) => {
  return {
    // Basic Info
    name: basicProduct.name || '',
    price: Number(basicProduct.price || 0),
    quantity: Number(basicProduct.quantity || 0),
    category: basicProduct.category || '',
    subcategory: basicProduct.subcategory || '',

    // Enhanced Description
    description:
      typeof basicProduct.description === 'string'
        ? {
            short:
              basicProduct.description.length > 100
                ? `${basicProduct.description.substring(0, 100)}...`
                : basicProduct.description,
            full: basicProduct.description,
          }
        : {
            short: basicProduct.description?.short || '',
            full: basicProduct.description?.full || '',
          },

    // Multiple Images Support (preserve original shape if provided)
    images: {
      primary:
        extractUrl(basicProduct.images?.primary) ||
        extractUrl(basicProduct.image) ||
        extractUrl(basicProduct.imageUrl) ||
        '',
      gallery: Array.isArray(basicProduct.images?.gallery)
        ? basicProduct.images.gallery.map(extractUrl).filter(Boolean)
        : Array.isArray(basicProduct.images)
        ? basicProduct.images.map(extractUrl).filter(Boolean)
        : [],
    },

    // Product Specifications
    specifications:
      basicProduct.specifications || {
        dimensions: '',
        weight: '',
        materials: '',
        care: '',
        condition: 'New',
        origin: '',
      },

    // Key Features
    features: basicProduct.features || [],

    // SEO & Discovery
    tags: basicProduct.tags || [],
    seo: basicProduct.seo || {
      title: basicProduct.name || '',
      metaDescription: '',
    },

    // Inventory & Tracking
    sku: basicProduct.sku || generateSKU(basicProduct.name),
    status: basicProduct.status || 'active',

    // Timestamps
    createdAt: basicProduct.createdAt || Date.now(),
    updatedAt: Date.now(),

    // Analytics
    analytics: basicProduct.analytics || {
      views: 0,
      contacts: 0,
      lastViewed: null,
    },
  };
};

/* -------------------------------------------
   Format for UI
-------------------------------------------- */
export const formatProductForDisplay = (product = {}) => {
  const price = Number(product.price ?? 0);
  const quantity = Number(product.quantity ?? 0);

  const images = getProductImages(product);
  const primary = images[0] || PLACEHOLDER;

  return {
    ...product,
    price,
    quantity,
    imageUrl: primary, // legacy field used by UI
    images,
    description: getProductDescription(product, 'full'),
    shortDescription: getProductDescription(product, 'short'),
    isLowStock: isLowStock({ quantity }),
    hasSpecs: Object.keys(product.specifications || {}).some(
      (k) => (product.specifications || {})[k]
    ),
    hasFeatures: (product.features || []).length > 0,
  };
};

/* -------------------------------------------
   SKU helper
-------------------------------------------- */
const generateSKU = (productName) => {
  const prefix = productName ? productName.substring(0, 3).toUpperCase() : 'PRD';
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}${randomNum}`;
};

/* -------------------------------------------
   Analytics helper
-------------------------------------------- */
export const updateProductAnalytics = (product = {}, action) => {
  const analytics = product.analytics || {
    views: 0,
    contacts: 0,
    lastViewed: null,
  };

  switch (action) {
    case 'view':
      analytics.views = (analytics.views || 0) + 1;
      analytics.lastViewed = Date.now();
      break;
    case 'contact':
      analytics.contacts = (analytics.contacts || 0) + 1;
      break;
    default:
      break;
  }

  return {
    ...product,
    analytics,
    updatedAt: Date.now(),
  };
};

/* -------------------------------------------
   Validation helper
   (accepts https, blob, data URLs and object/array shapes)
-------------------------------------------- */
export const validateProductData = (product = {}) => {
  const errors = [];

  if (!product.name || product.name.trim() === '') {
    errors.push('Product name is required');
  }
  if (!product.price || Number(product.price) <= 0) {
    errors.push('Valid price is required');
  }
  if (product.quantity == null || Number(product.quantity) < 0) {
    errors.push('Valid quantity is required');
  }
  if (!product.category || product.category.trim() === '') {
    errors.push('Category is required');
  }

  const images = getProductImages(product).filter(isUrlLike);
  if (images.length === 0) {
    errors.push('Product image is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/* -------------------------------------------
   Default export + convenience re-exports
-------------------------------------------- */
export default {
  createEnhancedProduct,
  getProductImageUrl,
  getProductImages,
  getProductDescription,
  isLowStock,
  formatProductForDisplay,
  updateProductAnalytics,
  validateProductData,
  // phone utilities
  normalizeToE164,
  isValidPhoneE164,
  formatPhoneForDisplay,
  generateWhatsAppURL,
};
