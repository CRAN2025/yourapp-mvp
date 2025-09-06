/**
 * ShopLynk Seller Core UI Components
 * Centralized exports for standardized components across seller dashboard
 */

export { ProductCard } from './ProductCard'
export { PillFilter, CategoryPill, FeaturePill, StatusPill } from './PillFilter'
export { AppNavBar } from './AppNavBar'

// Re-export enhanced Button component
export { Button, buttonVariants } from '@/components/ui/button'

// Re-export for convenience
import { ProductCard } from './ProductCard'
import { PillFilter, CategoryPill, FeaturePill, StatusPill } from './PillFilter'
import { AppNavBar } from './AppNavBar'

// Usage examples and component combinations
export const SellerComponents = {
  ProductCard,
  PillFilter,
  CategoryPill,
  FeaturePill,
  StatusPill,
  AppNavBar,
} as const

export type SellerComponentsType = typeof SellerComponents