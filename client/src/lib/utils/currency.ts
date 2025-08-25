// Currency formatting utilities for ShoplYnk

export const currencySymbols: Record<string, string> = {
  'USD': '$', 'CAD': 'C$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
  'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'INR': '₹', 'KRW': '₩',
  'GHS': '₵', 'NGN': '₦', 'ZAR': 'R', 'AED': 'د.إ', 'SAR': 'ر.س',
  'BRL': 'R$', 'MXN': '$', 'SGD': 'S$', 'HKD': 'HK$', 'NOK': 'kr',
  'SEK': 'kr', 'DKK': 'kr', 'PLN': 'zł', 'CZK': 'Kč', 'ILS': '₪',
  'TRY': '₺', 'RUB': '₽', 'THB': '฿', 'MYR': 'RM', 'IDR': 'Rp',
  'PHP': '₱', 'VND': '₫', 'KES': 'KSh', 'UGX': 'USh', 'TZS': 'TSh',
  'EGP': 'E£', 'MAD': 'د.م.', 'COP': '$', 'CLP': '$', 'ARS': '$'
};

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] || currency;
  
  // Handle special formatting for different currencies
  if (currency === 'JPY' || currency === 'KRW') {
    // No decimal places for Japanese Yen and Korean Won
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}

/**
 * Parse price string to number, removing currency symbols
 */
export function parsePrice(priceString: string): number {
  // Remove all non-digit characters except decimal point
  const cleanString = priceString.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format price input for display in forms
 */
export function formatPriceInput(value: string, currency: string): string {
  const numValue = parsePrice(value);
  if (numValue === 0) return '';
  return formatPrice(numValue, currency);
}