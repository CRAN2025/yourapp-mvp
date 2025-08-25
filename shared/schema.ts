import { z } from "zod";

// User/Seller Schema
export const sellerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  storeName: z.string(),
  storeDescription: z.string().optional(),
  businessEmail: z.string().email().optional(),
  category: z.string(),
  whatsappNumber: z.string(),
  country: z.string(),
  city: z.string().optional(),
  businessType: z.enum(['individual', 'business']).default('individual'),
  currency: z.string(),
  deliveryOptions: z.array(z.string()),
  paymentMethods: z.array(z.string()),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  isAdmin: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertSellerSchema = sellerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Seller = z.infer<typeof sellerSchema>;
export type InsertSeller = z.infer<typeof insertSellerSchema>;

// Product Schema
export const productSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  name: z.string().min(3).max(120),
  description: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().int().min(0),
  category: z.string(),
  subcategory: z.string().optional(),
  images: z.array(z.string()),
  isActive: z.boolean().default(true),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertProductSchema = productSchema.omit({
  id: true,
  sellerId: true,
  createdAt: true,
  updatedAt: true,
});

export type Product = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Analytics Event Schema
export const eventSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  type: z.enum(['wa_click', 'product_view', 'store_view']),
  productId: z.string().optional(),
  deviceType: z.enum(['mobile', 'desktop']),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional(),
});

export const insertEventSchema = eventSchema.omit({
  id: true,
  timestamp: true,
});

export type Event = z.infer<typeof eventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Onboarding Step Schema
export const onboardingStepSchema = z.object({
  storeDetails: z.boolean().default(false),
  whatsappNumber: z.boolean().default(false),
  branding: z.boolean().default(false),
  firstProduct: z.boolean().default(false),
});

export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

// Categories
export const categories = [
  '👗 Fashion & Clothing',
  '📱 Electronics',
  '🍔 Food & Beverages',
  '💄 Beauty & Cosmetics',
  '🏠 Home & Garden',
  '📚 Books & Education',
  '🎮 Sports & Gaming',
  '👶 Baby & Kids',
  '🚗 Automotive',
  '🎨 Arts & Crafts',
  '💊 Health & Wellness',
  '🔧 Tools & Hardware',
  '🎁 Gifts & Souvenirs',
  '💍 Jewelry & Accessories',
  '📦 Other',
] as const;

export const countries = [
  // Europe
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', region: 'Europe' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪', region: 'Europe' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷', region: 'Europe' },
  { code: 'IT', name: 'Italy', currency: 'EUR', flag: '🇮🇹', region: 'Europe' },
  { code: 'ES', name: 'Spain', currency: 'EUR', flag: '🇪🇸', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', flag: '🇳🇱', region: 'Europe' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', flag: '🇧🇪', region: 'Europe' },
  { code: 'AT', name: 'Austria', currency: 'EUR', flag: '🇦🇹', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', flag: '🇨🇭', region: 'Europe' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', flag: '🇸🇪', region: 'Europe' },
  { code: 'NO', name: 'Norway', currency: 'NOK', flag: '🇳🇴', region: 'Europe' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', flag: '🇩🇰', region: 'Europe' },
  { code: 'FI', name: 'Finland', currency: 'EUR', flag: '🇫🇮', region: 'Europe' },
  { code: 'PL', name: 'Poland', currency: 'PLN', flag: '🇵🇱', region: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', flag: '🇨🇿', region: 'Europe' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', flag: '🇮🇪', region: 'Europe' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', flag: '🇵🇹', region: 'Europe' },
  
  // North America
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', region: 'North America' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', region: 'North America' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽', region: 'North America' },
  
  // Asia Pacific
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺', region: 'Asia Pacific' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', flag: '🇳🇿', region: 'Asia Pacific' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵', region: 'Asia Pacific' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬', region: 'Asia Pacific' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', flag: '🇭🇰', region: 'Asia Pacific' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', flag: '🇰🇷', region: 'Asia Pacific' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳', region: 'Asia Pacific' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', flag: '🇲🇾', region: 'Asia Pacific' },
  { code: 'TH', name: 'Thailand', currency: 'THB', flag: '🇹🇭', region: 'Asia Pacific' },
  
  // Africa
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦', region: 'Africa' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬', region: 'Africa' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭', region: 'Africa' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪', region: 'Africa' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬', region: 'Africa' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿', region: 'Africa' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', flag: '🇪🇬', region: 'Africa' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', flag: '🇲🇦', region: 'Africa' },
  
  // Middle East
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪', region: 'Middle East' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦', region: 'Middle East' },
  { code: 'IL', name: 'Israel', currency: 'ILS', flag: '🇮🇱', region: 'Middle East' },
  
  // South America
  { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷', region: 'South America' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', flag: '🇦🇷', region: 'South America' },
  { code: 'CL', name: 'Chile', currency: 'CLP', flag: '🇨🇱', region: 'South America' },
  { code: 'CO', name: 'Colombia', currency: 'COP', flag: '🇨🇴', region: 'South America' },
] as const;

export const deliveryOptions = [
  { id: 'pickup', label: '🚶 Customer Pickup', desc: 'Customers collect from your location' },
  { id: 'delivery', label: '🚚 Home Delivery', desc: 'You deliver to customers' },
  { id: 'courier', label: '📦 Courier Service', desc: 'Third-party delivery' },
  { id: 'shipping', label: '✈️ Shipping', desc: 'Postal/shipping services' },
] as const;

export const paymentMethods = [
  { id: 'cash', label: '💵 Cash', desc: 'Cash on delivery/pickup' },
  { id: 'mobile_money', label: '📱 Mobile Money', desc: 'MTN, Vodafone, AirtelTigo' },
  { id: 'bank_transfer', label: '🏦 Bank Transfer', desc: 'Direct bank deposits' },
  { id: 'card', label: '💳 Card Payment', desc: 'Credit/Debit cards' },
  { id: 'paypal', label: '🅿️ PayPal', desc: 'PayPal payments' },
  { id: 'stripe', label: '💠 Stripe', desc: 'Online card payments' },
  { id: 'crypto', label: '₿ Cryptocurrency', desc: 'Bitcoin, Ethereum, etc.' },
] as const;

export type Category = typeof categories[number];

// Keep existing user schema for compatibility
export const users = {
  id: z.string(),
  username: z.string(),
  password: z.string(),
};

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = {
  id: string;
  username: string;
  password: string;
};
