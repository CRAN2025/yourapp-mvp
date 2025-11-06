// Phone number validation and formatting utilities

export const validatePhoneNumber = (phone, country = 'GH') => {
  if (!phone) return { isValid: false, message: 'Phone number is required' };
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (country.toUpperCase() === 'GH') {
    if (cleanPhone.startsWith('+233') && cleanPhone.length === 13) {
      const digits = cleanPhone.slice(4);
      if (/^[245]\d{8}$/.test(digits)) {
        return { isValid: true, message: 'Valid Ghana number', e164: cleanPhone };
      }
    }
    
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      const digits = cleanPhone.slice(1);
      if (/^[245]\d{8}$/.test(digits)) {
        return { isValid: true, message: 'Valid Ghana number', e164: `+233${digits}` };
      }
    }
    
    if (cleanPhone.length === 9 && /^[245]\d{8}$/.test(cleanPhone)) {
      return { isValid: true, message: 'Valid Ghana number', e164: `+233${cleanPhone}` };
    }
    
    return { isValid: false, message: 'Invalid Ghana number' };
  }
  
  if (country.toUpperCase() === 'NG') {
    if (cleanPhone.startsWith('+234') && cleanPhone.length === 14) {
      const digits = cleanPhone.slice(4);
      if (/^[789]\d{9}$/.test(digits)) {
        return { isValid: true, message: 'Valid Nigeria number', e164: cleanPhone };
      }
    }
    
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      const digits = cleanPhone.slice(1);
      if (/^[789]\d{9}$/.test(digits)) {
        return { isValid: true, message: 'Valid Nigeria number', e164: `+234${digits}` };
      }
    }
    
    return { isValid: false, message: 'Invalid Nigeria number' };
  }
  
  if (country.toUpperCase() === 'KE') {
    if (cleanPhone.startsWith('+254') && cleanPhone.length === 13) {
      const digits = cleanPhone.slice(4);
      if (/^[17]\d{8}$/.test(digits)) {
        return { isValid: true, message: 'Valid Kenya number', e164: cleanPhone };
      }
    }
    
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      const digits = cleanPhone.slice(1);
      if (/^[17]\d{8}$/.test(digits)) {
        return { isValid: true, message: 'Valid Kenya number', e164: `+254${digits}` };
      }
    }
    
    return { isValid: false, message: 'Invalid Kenya number' };
  }
  
  if (cleanPhone.startsWith('+') && cleanPhone.length >= 8 && cleanPhone.length <= 15) {
    if (/^\+\d{7,14}$/.test(cleanPhone)) {
      return { isValid: true, message: 'Valid international number', e164: cleanPhone };
    }
  }
  
  return { isValid: false, message: 'Invalid phone number format' };
};

export const isValidPhoneE164 = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const e164Regex = /^\+\d{1,15}$/;
  if (e164Regex.test(phone)) {
    if (phone.startsWith('+233')) return phone.length === 13;
    if (phone.startsWith('+234')) return phone.length === 14;
    if (phone.startsWith('+254')) return phone.length === 13;
    return true;
  }
  return false;
};

export const formatPhoneForDisplay = (e164) => {
  if (!e164 || typeof e164 !== 'string') return e164 || '';
  
  if (e164.startsWith('+233') && e164.length === 13) {
    return `+233 ${e164.slice(4, 6)} ${e164.slice(6, 9)} ${e164.slice(9)}`;
  } else if (e164.startsWith('+234') && e164.length === 14) {
    return `+234 ${e164.slice(4, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}`;
  } else if (e164.startsWith('+254') && e164.length === 13) {
    return `+254 ${e164.slice(4, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}`;
  }

  return e164;
};

export const getPhoneHint = (country = 'GH') => {
  const hints = {
    GH: 'Include country code, e.g., +233 24 123 4567 or 0241234567',
    NG: 'Include country code, e.g., +234 803 123 4567 or 08031234567',
    KE: 'Include country code, e.g., +254 712 345 678 or 0712345678',
  };
  return hints[country.toUpperCase()] || hints.GH;
};

export const phoneNeedsUpdate = (phone) => {
  if (!phone) return true;
  return !phone.startsWith('+') || phone.length < 10;
};

// Product-related utilities
export const createEnhancedProduct = (productData, user) => {
  const timestamp = new Date().toISOString();
  
  return {
    ...productData,
    name: productData.name || '',
    price: productData.price || 0,
    category: productData.category || 'other',
    condition: productData.condition || 'used',
    description: productData.description || '',
    images: productData.images || [],
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: user?.uid || '',
    createdByEmail: user?.email || '',
    status: productData.status || 'active',
    inventory: productData.inventory !== undefined ? productData.inventory : 1,
    searchKeywords: generateSearchKeywords(productData),
    views: 0,
    likes: 0,
    shares: 0,
  };
};

export const validateProductData = (productData) => {
  const errors = [];
  
  if (!productData.name || productData.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long');
  }
  
  if (!productData.price || productData.price < 0) {
    errors.push('Price must be a positive number');
  }
  
  if (!productData.category) {
    errors.push('Category is required');
  }
  
  if (!productData.condition) {
    errors.push('Condition is required');
  }
  
  if (!productData.description || productData.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }
  
  if (!productData.images || productData.images.length === 0) {
    errors.push('At least one product image is required');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const formatProductForDisplay = (product) => {
  if (!product) return null;
  
  return {
    id: product.id || product.productId,
    name: product.name || 'Unnamed Product',
    price: product.price || 0,
    originalPrice: product.originalPrice || product.price || 0,
    category: product.category || 'Uncategorized',
    condition: product.condition || 'New',
    description: product.description || '',
    shortDescription: product.shortDescription || product.description?.substring(0, 150) || '',
    images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
    inventory: product.inventory !== undefined ? product.inventory : product.quantity || 0,
    status: product.status || 'active',
    brand: product.brand || '',
    features: Array.isArray(product.features) ? product.features : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    specifications: product.specifications || {},
    analytics: product.analytics || { views: 0, likes: 0, shares: 0 },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    sellerId: product.sellerId || product.createdBy,
    hasDiscount: product.originalPrice && product.originalPrice > product.price,
    discountPercentage: product.originalPrice && product.price 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0,
    isLowStock: (product.inventory !== undefined && product.inventory < 5) || 
                (product.quantity !== undefined && product.quantity < 5),
    isOutOfStock: (product.inventory !== undefined && product.inventory === 0) ||
                  (product.quantity !== undefined && product.quantity === 0)
  };
};

export const getProductImageUrl = (imagePath, size = 'medium') => {
  if (!imagePath) return '/placeholder-product.jpg';
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath;
};

export const formatPrice = (price, currency = 'GHS') => {
  if (typeof price !== 'number') price = parseFloat(price) || 0;
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

// Image constants
export const MIN_IMG_W = 400;
export const MIN_IMG_H = 400;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// WhatsApp and messaging utilities
export const createWhatsAppMessage = (products, customerName = '', storeInfo = {}) => {
  if (!products || products.length === 0) return '';
  
  const storeName = storeInfo.storeName || 'our store';
  const greeting = customerName ? `Hello ${customerName}!` : 'Hello!';
  let message = `${greeting} Here are the products you selected from ${storeName}:\n\n`;
  
  products.forEach((product, index) => {
    const price = product.price ? ` - ${formatPrice(product.price)}` : '';
    message += `${index + 1}. ${product.name}${price}\n`;
    
    if (product.description) {
      const desc = product.description.length > 100 
        ? product.description.substring(0, 100) + '...' 
        : product.description;
      message += `   ${desc}\n`;
    }
    
    message += '\n';
  });

  if (storeInfo.phone) {
    const phone = storeInfo.phone.startsWith('+') ? storeInfo.phone : `+${storeInfo.phone}`;
    message += `To place your order, contact ${storeName} at: ${phone}\n\n`;
  }
  
  message += 'Thank you for your interest!';
  return encodeURIComponent(message);
};

export const generateWhatsAppUrl = (phone, message = '') => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  let whatsappPhone = cleanPhone;
  
  if (!cleanPhone.startsWith('233') && cleanPhone.length === 9) {
    whatsappPhone = '233' + cleanPhone;
  } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    whatsappPhone = '233' + cleanPhone.slice(1);
  }
  
  const baseUrl = `https://wa.me/${whatsappPhone}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
};

// Order validation
export const validateOrderForm = (formData) => {
  const errors = {};
  
  if (!formData.customerName?.trim()) errors.customerName = 'Customer name is required';
  if (!formData.customerPhone?.trim()) errors.customerPhone = 'Phone number is required';
  if (!formData.deliveryAddress?.trim()) errors.deliveryAddress = 'Delivery address is required';
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

// Analytics and tracking
export const trackInteraction = (type, data = {}) => {
  const event = { type, timestamp: new Date().toISOString(), ...data };
  console.log('Tracked interaction:', event);
  return event;
};

// Seller data standardization
export const standardizeSellerData = (sellerData) => {
  if (!sellerData) return {};
  
  return {
    storeName: sellerData.storeName || '',
    description: sellerData.description || '',
    phone: sellerData.phone || '',
    email: sellerData.email || '',
    address: sellerData.address || '',
    categories: Array.isArray(sellerData.categories) ? sellerData.categories : [],
    businessHours: sellerData.businessHours || {},
    socialMedia: sellerData.socialMedia || {},
    isActive: sellerData.isActive !== undefined ? sellerData.isActive : true,
    createdAt: sellerData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Helper function
const generateSearchKeywords = (productData) => {
  const keywords = new Set();
  
  if (productData.name) {
    productData.name.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) keywords.add(word);
    });
  }
  
  if (productData.category) keywords.add(productData.category.toLowerCase());
  if (productData.brand) keywords.add(productData.brand.toLowerCase());
  if (productData.condition) keywords.add(productData.condition.toLowerCase());
  
  if (productData.description) {
    productData.description.toLowerCase().split(/\s+/).slice(0, 10).forEach(word => {
      if (word.length > 3) keywords.add(word);
    });
  }
  
  return Array.from(keywords);
};
