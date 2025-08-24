import { z } from "zod";

// User/Seller Schema
export const sellerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  storeName: z.string(),
  storeDescription: z.string().optional(),
  location: z.string().optional(),
  category: z.string(),
  whatsappNumber: z.string(),
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
  'electronics',
  'fashion',
  'jewelry',
  'home',
  'handmade',
  'food',
  'other'
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
