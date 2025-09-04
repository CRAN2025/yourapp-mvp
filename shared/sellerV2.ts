import { z } from "zod";

// Constants - Single source of truth
export const PAYMENT_METHODS = [
  "Mobile money",
  "Card", 
  "Bank transfer",
  "Cash on delivery",
  "PayPal",
  "Other wallet"
] as const;

export const DELIVERY_OPTIONS = [
  "Pickup",
  "Local delivery", 
  "Courier",
  "Nationwide shipping",
  "International shipping"
] as const;

export const BUSINESS_TYPES = [
  "individual",
  "business"
] as const;

export const SUBSCRIPTION_PLANS = [
  "beta-free",
  "starter",
  "professional",
  "enterprise"
] as const;

// Type definitions
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type DeliveryOption = typeof DELIVERY_OPTIONS[number];
export type BusinessType = typeof BUSINESS_TYPES[number];
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

// SellerV2 Schema - Canonical shape
export const sellerV2Schema = z.object({
  // Core identity
  id: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  fullName: z.string().optional(),
  
  // Store information
  storeName: z.string(),
  storeDescription: z.string().optional(),
  businessEmail: z.string().email().optional(),
  category: z.string(),
  businessType: z.enum(BUSINESS_TYPES).default("individual"),
  
  // Location and contact
  country: z.string().default("UG"), // ISO-2 country code, default Uganda
  city: z.string().optional(),
  location: z.string().optional(),
  whatsappNumber: z.string(), // E.164 format when possible
  currency: z.string().default("UGX"), // ISO-4217 currency code, default UGX
  
  // Business operations
  paymentMethods: z.array(z.enum(PAYMENT_METHODS)).default([]),
  deliveryOptions: z.array(z.enum(DELIVERY_OPTIONS)).default([]),
  operatingHours: z.string().optional(),
  returnPolicy: z.string().optional(),
  
  // Branding and media
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  socialMedia: z.object({
    instagram: z.string().optional(), // Normalized URL
    facebook: z.string().optional(),  // Normalized URL
    tiktok: z.string().optional(),    // Normalized URL
  }).optional(),
  
  // Preferences and metadata
  preferredLanguage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  subscriptionPlan: z.enum(SUBSCRIPTION_PLANS).default("beta-free"),
  
  // System fields
  onboardingCompleted: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  createdAt: z.number(), // Unix timestamp in milliseconds
  updatedAt: z.number(), // Unix timestamp in milliseconds
});

export type SellerV2 = z.infer<typeof sellerV2Schema>;

// Helper functions for social media URL normalization
export function normalizeInstagramUrl(input: string): string {
  if (!input) return '';
  
  // Remove leading @ and whitespace
  const cleaned = input.trim().replace(/^@/, '');
  
  // If it's already a full URL, return as-is
  if (cleaned.startsWith('https://') || cleaned.startsWith('http://')) {
    return cleaned;
  }
  
  // If it's just a handle, construct the URL
  return `https://instagram.com/${cleaned}`;
}

export function normalizeFacebookUrl(input: string): string {
  if (!input) return '';
  
  const cleaned = input.trim();
  
  // If it's already a full URL, return as-is
  if (cleaned.startsWith('https://') || cleaned.startsWith('http://')) {
    return cleaned;
  }
  
  // If it's just a handle, construct the URL
  return `https://facebook.com/${cleaned}`;
}

export function normalizeTikTokUrl(input: string): string {
  if (!input) return '';
  
  // Remove leading @ and whitespace
  const cleaned = input.trim().replace(/^@/, '');
  
  // If it's already a full URL, return as-is
  if (cleaned.startsWith('https://') || cleaned.startsWith('http://')) {
    return cleaned;
  }
  
  // If it's just a handle, construct the URL
  return `https://tiktok.com/@${cleaned}`;
}

// WhatsApp number normalization (basic E.164 attempt)
export function normalizeWhatsAppNumber(input: string): string {
  if (!input) return '';
  
  const cleaned = input.trim();
  
  // If it already starts with +, assume it's E.164
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it starts with 256 (Uganda), add +
  if (cleaned.startsWith('256')) {
    return `+${cleaned}`;
  }
  
  // If it starts with 0 (local format), convert to Uganda
  if (cleaned.startsWith('0') && cleaned.length >= 10) {
    return `+256${cleaned.slice(1)}`;
  }
  
  // Return original if we can't normalize confidently
  return cleaned;
}

// Payment methods normalization
export function normalizePaymentMethods(input: unknown): PaymentMethod[] {
  if (!input) return [];
  
  // Handle array format
  if (Array.isArray(input)) {
    return input
      .map(item => typeof item === 'string' ? item.trim() : String(item))
      .filter(item => PAYMENT_METHODS.includes(item as PaymentMethod))
      .map(item => item as PaymentMethod);
  }
  
  // Handle object/map format (legacy)
  if (typeof input === 'object' && input !== null) {
    const methods: PaymentMethod[] = [];
    const obj = input as Record<string, unknown>;
    
    for (const [key, value] of Object.entries(obj)) {
      if (value && PAYMENT_METHODS.includes(key as PaymentMethod)) {
        methods.push(key as PaymentMethod);
      }
    }
    
    return methods;
  }
  
  return [];
}

// Delivery options normalization
export function normalizeDeliveryOptions(input: unknown): DeliveryOption[] {
  if (!input) return [];
  
  // Handle array format
  if (Array.isArray(input)) {
    return input
      .map(item => typeof item === 'string' ? item.trim() : String(item))
      .filter(item => DELIVERY_OPTIONS.includes(item as DeliveryOption))
      .map(item => item as DeliveryOption);
  }
  
  // Handle object/map format (legacy)
  if (typeof input === 'object' && input !== null) {
    const options: DeliveryOption[] = [];
    const obj = input as Record<string, unknown>;
    
    for (const [key, value] of Object.entries(obj)) {
      if (value && DELIVERY_OPTIONS.includes(key as DeliveryOption)) {
        options.push(key as DeliveryOption);
      }
    }
    
    return options;
  }
  
  return [];
}

// Timestamp normalization
export function normalizeTimestamp(input: unknown): number {
  if (typeof input === 'number') return input;
  
  if (typeof input === 'string') {
    const parsed = Date.parse(input);
    if (!isNaN(parsed)) return parsed;
  }
  
  // Handle Firebase Timestamp-like objects
  if (input && typeof input === 'object') {
    const obj = input as any;
    if (typeof obj.toMillis === 'function') {
      return obj.toMillis();
    }
    if (typeof obj.seconds === 'number') {
      return obj.seconds * 1000;
    }
  }
  
  // Default to current timestamp
  return Date.now();
}

// Main normalization function
export function normalizeSeller(legacy: unknown): SellerV2 {
  const debug = process.env.NODE_ENV === 'development';
  
  if (!legacy || typeof legacy !== 'object') {
    if (debug) {
      console.warn('SellerV2 Adapter: Invalid input, using minimal defaults', legacy);
    }
    
    return sellerV2Schema.parse({
      id: '',
      email: '',
      storeName: 'Unnamed Store',
      whatsappNumber: '',
      category: 'Other',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  
  const data = legacy as Record<string, unknown>;
  let hasCoercion = false;
  
  try {
    // Extract and normalize all fields
    const normalized: Partial<SellerV2> = {
      id: String(data.id || ''),
      email: String(data.email || ''),
      phone: data.phone ? String(data.phone) : undefined,
      fullName: data.fullName ? String(data.fullName) : undefined,
      
      storeName: String(data.storeName || 'Unnamed Store'),
      storeDescription: data.storeDescription ? String(data.storeDescription) : undefined,
      businessEmail: data.businessEmail ? String(data.businessEmail) : undefined,
      category: String(data.category || 'Other'),
      businessType: BUSINESS_TYPES.includes(data.businessType as BusinessType) 
        ? (data.businessType as BusinessType) 
        : 'individual',
      
      country: String(data.country || 'UG'),
      city: data.city ? String(data.city) : undefined,
      location: data.location ? String(data.location) : undefined,
      whatsappNumber: normalizeWhatsAppNumber(String(data.whatsappNumber || '')),
      currency: String(data.currency || 'UGX'),
      
      paymentMethods: normalizePaymentMethods(data.paymentMethods),
      deliveryOptions: normalizeDeliveryOptions(data.deliveryOptions),
      operatingHours: data.operatingHours ? String(data.operatingHours) : undefined,
      returnPolicy: data.returnPolicy ? String(data.returnPolicy) : undefined,
      
      logoUrl: data.logoUrl ? String(data.logoUrl) : undefined,
      coverUrl: data.coverUrl ? String(data.coverUrl) : undefined,
      bannerUrl: data.bannerUrl ? String(data.bannerUrl) : undefined,
      
      preferredLanguage: data.preferredLanguage ? String(data.preferredLanguage) : undefined,
      tags: Array.isArray(data.tags) 
        ? data.tags.map(t => String(t)).filter(Boolean)
        : [],
      subscriptionPlan: SUBSCRIPTION_PLANS.includes(data.subscriptionPlan as SubscriptionPlan)
        ? (data.subscriptionPlan as SubscriptionPlan)
        : 'beta-free',
      
      onboardingCompleted: Boolean(data.onboardingCompleted),
      isAdmin: Boolean(data.isAdmin),
      createdAt: normalizeTimestamp(data.createdAt),
      updatedAt: normalizeTimestamp(data.updatedAt),
    };
    
    // Handle social media normalization
    if (data.socialMedia && typeof data.socialMedia === 'object') {
      const social = data.socialMedia as Record<string, unknown>;
      normalized.socialMedia = {
        instagram: social.instagram ? normalizeInstagramUrl(String(social.instagram)) : undefined,
        facebook: social.facebook ? normalizeFacebookUrl(String(social.facebook)) : undefined,
        tiktok: social.tiktok ? normalizeTikTokUrl(String(social.tiktok)) : undefined,
      };
    }
    
    // Check if we had to do significant coercion
    if (
      !Array.isArray(data.paymentMethods) ||
      !Array.isArray(data.deliveryOptions) ||
      (data.socialMedia && (
        (data.socialMedia as any).instagram?.includes('@') ||
        !(data.socialMedia as any).instagram?.startsWith('https://')
      ))
    ) {
      hasCoercion = true;
    }
    
    const result = sellerV2Schema.parse(normalized);
    
    if (debug && hasCoercion) {
      console.warn('SellerV2 Adapter: Applied data coercion during normalization', {
        original: legacy,
        normalized: result
      });
    }
    
    return result;
    
  } catch (error) {
    if (debug) {
      console.error('SellerV2 Adapter: Normalization failed, using safe defaults', error, legacy);
    }
    
    // Return safe defaults on parsing failure
    return sellerV2Schema.parse({
      id: String(data.id || ''),
      email: String(data.email || ''),
      storeName: String(data.storeName || 'Unnamed Store'),
      whatsappNumber: String(data.whatsappNumber || ''),
      category: String(data.category || 'Other'),
      createdAt: normalizeTimestamp(data.createdAt) || Date.now(),
      updatedAt: normalizeTimestamp(data.updatedAt) || Date.now(),
    });
  }
}

// Export the insert schema for forms
export const insertSellerV2Schema = sellerV2Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSellerV2 = z.infer<typeof insertSellerV2Schema>;