// utils/productHelpers.js
// Helper functions for enhanced product schema

import { normalizeToE164, isValidPhoneE164, formatPhoneForDisplay, generateWhatsAppURL } from './Phone';

export const createEnhancedProduct = (basicProduct) => {
  return {
    // Basic Info (existing)
    name: basicProduct.name || '',
    price: basicProduct.price || 0,
    quantity: basicProduct.quantity || 0,
    category: basicProduct.category || '',
    subcategory: basicProduct.subcategory || '',
    
    // Enhanced Description
    description: {
      short: typeof basicProduct.description === 'string' 
        ? basicProduct.description.substring(0, 100) + (basicProduct.description.length > 100 ? '...' : '')
        : basicProduct.description?.short || '',
      full: typeof basicProduct.description === 'string' 
        ? basicProduct.description 
        : basicProduct.description?.full || ''
    },
    
    // Multiple Images Support
    images: {
      primary: basicProduct.images?.primary || basicProduct.imageUrl || '',
      gallery: basicProduct.images?.gallery || []
    },
    
    // Product Specifications
    specifications: basicProduct.specifications || {
      dimensions: '',
      weight: '',
      materials: '',
      care: '',
      condition: 'New',
      origin: ''
    },
    
    // Key Features
    features: basicProduct.features || [],
    
    // SEO & Discovery
    tags: basicProduct.tags || [],
    seo: basicProduct.seo || {
      title: basicProduct.name || '',
      metaDescription: ''
    },
    
    // Inventory & Tracking
    sku: basicProduct.sku || generateSKU(basicProduct.name),
    status: basicProduct.status || 'active',
    
    // Timestamps
    createdAt: basicProduct.createdAt || Date.now(),
    updatedAt: Date.now(),
    
    // Analytics Tracking
    analytics: basicProduct.analytics || {
      views: 0,
      contacts: 0,
      lastViewed: null
    }
  }
}

// Helper to get primary image URL (backward compatible)
export const getProductImageUrl = (product) => {
  return product.images?.primary || product.imageUrl || 'https://via.placeholder.com/300x200'
}

// Helper to get all product images for gallery
export const getProductImages = (product) => {
  const primary = product.images?.primary || product.imageUrl
  const gallery = product.images?.gallery || []
  return primary ? [primary, ...gallery] : gallery.length > 0 ? gallery : ['https://via.placeholder.com/300x200']
}

// Helper to get product description (backward compatible)
export const getProductDescription = (product, type = 'full') => {
  if (typeof product.description === 'string') {
    return type === 'short' 
      ? product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '')
      : product.description
  }
  return product.description?.[type] || ''
}

// Helper to check if product has low stock
export const isLowStock = (product, threshold = 10) => {
  return product.quantity <= threshold
}

// Helper to format product for display
export const formatProductForDisplay = (product) => {
  return {
    ...product,
    imageUrl: getProductImageUrl(product), // For backward compatibility
    description: getProductDescription(product, 'full'),
    shortDescription: getProductDescription(product, 'short'),
    images: getProductImages(product),
    isLowStock: isLowStock(product),
    hasSpecs: Object.keys(product.specifications || {}).some(key => product.specifications[key]),
    hasFeatures: (product.features || []).length > 0
  }
}

// Generate SKU if not provided
const generateSKU = (productName) => {
  const prefix = productName ? productName.substring(0, 3).toUpperCase() : 'PRD'
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${randomNum}`
}

// Helper to update product analytics
export const updateProductAnalytics = (product, action) => {
  const analytics = product.analytics || { views: 0, contacts: 0, lastViewed: null }
  
  switch(action) {
    case 'view':
      analytics.views = (analytics.views || 0) + 1
      analytics.lastViewed = Date.now()
      break
    case 'contact':
      analytics.contacts = (analytics.contacts || 0) + 1
      break
  }
  
  return {
    ...product,
    analytics,
    updatedAt: Date.now()
  }
}

// Helper to validate product data
export const validateProductData = (product) => {
  const errors = []
  
  if (!product.name || product.name.trim() === '') {
    errors.push('Product name is required')
  }
  
  if (!product.price || product.price <= 0) {
    errors.push('Valid price is required')
  }
  
  if (!product.quantity || product.quantity < 0) {
    errors.push('Valid quantity is required')
  }
  
  if (!product.category || product.category.trim() === '') {
    errors.push('Category is required')
  }
  
  const primaryImage = getProductImageUrl(product)
  if (!primaryImage || primaryImage === 'https://via.placeholder.com/300x200') {
    errors.push('Product image is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export default object with all helpers (excluding phone utilities since they're imported)
export default {
  createEnhancedProduct,
  getProductImageUrl,
  getProductImages,
  getProductDescription,
  isLowStock,
  formatProductForDisplay,
  updateProductAnalytics,
  validateProductData,
  // Re-export phone utilities for convenience
  normalizeToE164,
  isValidPhoneE164,
  formatPhoneForDisplay,
  generateWhatsAppURL
}