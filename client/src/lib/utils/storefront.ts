/**
 * Storefront utility functions for currency formatting and display
 */

import { getCountryByCode, formatCurrency as baseFormatCurrency } from '@/lib/data/countries';

export interface Product {
  id: string;
  name: string;
  price: number;
  sellerCountry?: string;
  // ... other product fields
}

export interface Seller {
  country?: string;
  // ... other seller fields
}

/**
 * Format price with appropriate currency symbol based on seller's country
 */
export const formatPrice = (price: number, sellerCountry?: string): string => {
  if (!sellerCountry) {
    return `$${price.toLocaleString()}`; // Default to USD
  }
  
  return baseFormatCurrency(price, sellerCountry);
};

/**
 * Get currency symbol for a seller's country
 */
export const getCurrencySymbol = (countryCode?: string): string => {
  if (!countryCode) return '$';
  
  const country = getCountryByCode(countryCode);
  return country?.currencySymbol || '$';
};

/**
 * Format price for product display with seller context
 */
export const formatProductPrice = (product: Product, seller?: Seller): string => {
  const country = product.sellerCountry || seller?.country;
  return formatPrice(product.price, country);
};

/**
 * Get currency display name for a country
 */
export const getCurrencyName = (countryCode?: string): string => {
  if (!countryCode) return 'US Dollar';
  
  const country = getCountryByCode(countryCode);
  return country?.currency || 'US Dollar';
};

export default {
  formatPrice,
  getCurrencySymbol,
  formatProductPrice,
  getCurrencyName,
};