// Canonical payment and delivery options - single source of truth
// These are the ONLY valid keys/slugs that should be used everywhere

export const CANONICAL_PAYMENT_METHODS = {
  cash: { label: "Cash", icon: "🪙", order: 10 },
  bank_transfer: { label: "Bank Transfer", icon: "🏦", order: 20 },
  card: { label: "Card Payment", icon: "💳", order: 30 },
  mobile_money: { label: "Mobile Money", icon: "📱", order: 40 },
  paypal: { label: "PayPal", icon: "🅿️", order: 50 },
  stripe: { label: "Stripe", icon: "⚡", order: 60 },
  crypto: { label: "Cryptocurrency", icon: "₿", order: 70 },
} as const;

export const CANONICAL_DELIVERY_OPTIONS = {
  pickup: { label: "Customer Pickup", icon: "🚶", order: 10 },
  home_delivery: { label: "Home Delivery", icon: "🏠", order: 20 },
  courier: { label: "Courier Service", icon: "📦", order: 30 },
  shipping: { label: "Shipping", icon: "✈️", order: 40 },
  local_delivery: { label: "Local Delivery", icon: "🛵", order: 50 },
  national_courier: { label: "National Courier", icon: "🚚", order: 60 },
  international: { label: "International", icon: "🌍", order: 70 },
} as const;

export type PaymentMethodSlug = keyof typeof CANONICAL_PAYMENT_METHODS;
export type DeliveryOptionSlug = keyof typeof CANONICAL_DELIVERY_OPTIONS;

// Migration function to normalize legacy/duplicate keys
export const normalizePaymentKey = (key: string): PaymentMethodSlug => {
  const keyMap: Record<string, PaymentMethodSlug> = {
    'banktransfer': 'bank_transfer',
    'bank-transfer': 'bank_transfer', 
    'mobilemoney': 'mobile_money',
    'mobile-money': 'mobile_money',
    'cash-on-delivery': 'cash',
    'cod': 'cash',
    'card-payments': 'card',
    'card-payment': 'card',
    'other-wallets': 'mobile_money', // fallback
    'other_wallets': 'mobile_money',
  };
  
  return keyMap[key.toLowerCase()] ?? (key as PaymentMethodSlug);
};

export const normalizeDeliveryKey = (key: string): DeliveryOptionSlug => {
  const keyMap: Record<string, DeliveryOptionSlug> = {
    'local-delivery': 'local_delivery',
    'localdelivery': 'local_delivery',
    'national-courier': 'national_courier',
    'nationalcourier': 'national_courier',
    'home-delivery': 'home_delivery',
    'homedelivery': 'home_delivery',
    'customer-pickup': 'pickup',
    'in-store-pickup': 'pickup',
    'customer_pickup': 'pickup',
  };
  
  return keyMap[key.toLowerCase()] ?? (key as DeliveryOptionSlug);
};

// Helper functions
export const getPaymentMethodsArray = () => 
  Object.entries(CANONICAL_PAYMENT_METHODS)
    .sort(([,a], [,b]) => a.order - b.order)
    .map(([slug, config]) => ({ slug, ...config }));

export const getDeliveryOptionsArray = () => 
  Object.entries(CANONICAL_DELIVERY_OPTIONS)
    .sort(([,a], [,b]) => a.order - b.order)
    .map(([slug, config]) => ({ slug, ...config }));