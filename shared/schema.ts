import { z } from "zod";

// User/Seller Schema
export const sellerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  fullName: z.string().optional(), // Added from onboarding step 1
  storeName: z.string(),
  storeDescription: z.string().optional(),
  businessEmail: z.string().email().optional(),
  category: z.string(),
  whatsappNumber: z.string(),
  country: z.string(),
  city: z.string().optional(),
  location: z.string().optional(),
  businessType: z.enum(['individual', 'business']).default('individual'),
  currency: z.string().optional(),
  deliveryOptions: z.array(z.string()).default([]),
  paymentMethods: z.array(z.string()).default([]),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  bannerUrl: z.string().optional(), // For store banner
  // Added from onboarding step 2
  socialMedia: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    facebook: z.string().optional(),
  }).optional(),
  preferredLanguage: z.string().optional(),
  tags: z.array(z.string()).default([]), // Store tags/keywords
  operatingHours: z.string().optional(),
  returnPolicy: z.string().optional(),
  // Added from onboarding step 1
  subscriptionPlan: z.string().default('beta-free'),
  onboardingCompleted: z.boolean().default(false),
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

// Product Schema with enhanced e-commerce attributes
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
  // Enhanced attributes for e-commerce (like Etsy)
  brand: z.string().optional(),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'vintage']).default('new'),
  size: z.string().optional(), // e.g., "XL", "32 inches", "One Size"
  color: z.string().optional(),
  material: z.string().optional(), // e.g., "Cotton", "Stainless Steel"
  weight: z.string().optional(), // e.g., "500g", "2 lbs"
  dimensions: z.string().optional(), // e.g., "30x20x10 cm"
  tags: z.array(z.string()).default([]), // Additional searchable tags
  sku: z.string().optional(), // Stock Keeping Unit
  isHandmade: z.boolean().default(false),
  isCustomizable: z.boolean().default(false),
  processingTime: z.string().optional(), // e.g., "1-3 business days"
  // New attributes based on Etsy listing analysis
  madeToOrder: z.boolean().default(false),
  materials: z.array(z.string()).default([]), // Multiple materials like "14k gold fill, sterling silver"
  chainLength: z.string().optional(), // "19-21 inches, adjustable"
  pendantSize: z.string().optional(), // "13mm"
  personalizationOptions: z.string().optional(), // Custom engraving, etc.
  giftWrapping: z.boolean().default(false),
  returnPolicy: z.string().optional(), // "45 days returns accepted"
  shipsFrom: z.string().optional(), // Country/region where item ships from
  careInstructions: z.string().optional(), // How to maintain the product
  occasion: z.string().optional(), // "Birthday, Wedding, Anniversary"
  style: z.string().optional(), // "Minimalist, Vintage, Boho"
  targetAgeGroup: z.string().optional(), // "Adults, Teen, Kids"
  features: z.array(z.string()).default([]), // "Adjustable, Waterproof, Hypoallergenic"
  sustainability: z.string().optional(), // Eco-friendly aspects
  warranty: z.string().optional(), // Quality guarantee info
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
  '🎨 Arts & Crafts',
  '🚗 Automotive',
  '👶 Baby & Kids',
  '💄 Beauty & Cosmetics',
  '📚 Books & Education',
  '📱 Electronics',
  '👗 Fashion & Clothing',
  '🍔 Food & Beverages',
  '🎁 Gifts & Souvenirs',
  '💊 Health & Wellness',
  '🏠 Home & Garden',
  '💍 Jewelry & Accessories',
  '📦 Other',
  '🎮 Sports & Gaming',
  '🔧 Tools & Hardware',
] as const;

// Product conditions for e-commerce
export const productConditions = [
  { value: 'new', label: 'New', description: 'Brand new, never used' },
  { value: 'like-new', label: 'Like New', description: 'Excellent condition, barely used' },
  { value: 'good', label: 'Good', description: 'Good condition with minor signs of use' },
  { value: 'fair', label: 'Fair', description: 'Functional with noticeable wear' },
  { value: 'vintage', label: 'Vintage', description: 'Vintage or antique item' },
] as const;

// Common product sizes
export const commonSizes = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  'One Size', 'Free Size', 
  'Custom Size', 'See Description'
] as const;

export const countries = [
  { code: 'AR', name: 'Argentina', currency: 'ARS', flag: '🇦🇷', region: 'South America' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺', region: 'Asia Pacific' },
  { code: 'AT', name: 'Austria', currency: 'EUR', flag: '🇦🇹', region: 'Europe' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', flag: '🇧🇪', region: 'Europe' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷', region: 'South America' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', region: 'North America' },
  { code: 'CL', name: 'Chile', currency: 'CLP', flag: '🇨🇱', region: 'South America' },
  { code: 'CO', name: 'Colombia', currency: 'COP', flag: '🇨🇴', region: 'South America' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', flag: '🇨🇿', region: 'Europe' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', flag: '🇩🇰', region: 'Europe' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', flag: '🇪🇬', region: 'Africa' },
  { code: 'FI', name: 'Finland', currency: 'EUR', flag: '🇫🇮', region: 'Europe' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷', region: 'Europe' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪', region: 'Europe' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭', region: 'Africa' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', flag: '🇭🇰', region: 'Asia Pacific' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳', region: 'Asia Pacific' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', flag: '🇮🇪', region: 'Europe' },
  { code: 'IL', name: 'Israel', currency: 'ILS', flag: '🇮🇱', region: 'Middle East' },
  { code: 'IT', name: 'Italy', currency: 'EUR', flag: '🇮🇹', region: 'Europe' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵', region: 'Asia Pacific' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪', region: 'Africa' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', flag: '🇲🇾', region: 'Asia Pacific' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽', region: 'North America' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', flag: '🇲🇦', region: 'Africa' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', flag: '🇳🇱', region: 'Europe' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', flag: '🇳🇿', region: 'Asia Pacific' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬', region: 'Africa' },
  { code: 'NO', name: 'Norway', currency: 'NOK', flag: '🇳🇴', region: 'Europe' },
  { code: 'PL', name: 'Poland', currency: 'PLN', flag: '🇵🇱', region: 'Europe' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', flag: '🇵🇹', region: 'Europe' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦', region: 'Middle East' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬', region: 'Asia Pacific' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦', region: 'Africa' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', flag: '🇰🇷', region: 'Asia Pacific' },
  { code: 'ES', name: 'Spain', currency: 'EUR', flag: '🇪🇸', region: 'Europe' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', flag: '🇸🇪', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', flag: '🇨🇭', region: 'Europe' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿', region: 'Africa' },
  { code: 'TH', name: 'Thailand', currency: 'THB', flag: '🇹🇭', region: 'Asia Pacific' },
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪', region: 'Middle East' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬', region: 'Africa' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', region: 'Europe' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', region: 'North America' },
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
export type ProductCondition = typeof productConditions[number]['value'];
export type CommonSize = typeof commonSizes[number];

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
