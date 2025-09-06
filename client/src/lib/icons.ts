/**
 * ShopLynk Standardized Icon System
 * Consistent Lucide React icons across all components
 */

import {
  // Navigation & Actions
  Home,
  ShoppingBag,
  Settings,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Upload,
  Download,
  
  // E-commerce
  CreditCard,
  Truck,
  Package,
  ShoppingCart,
  Heart,
  Star,
  Search,
  Filter,
  Eye,
  EyeOff,
  
  // Communication
  MessageCircle,
  Phone,
  Mail,
  Send,
  
  // Status & Feedback
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X as XCircle,
  Loader2,
  
  // Business
  Store,
  BarChart3,
  TrendingUp,
  DollarSign,
  Globe,
  Calendar,
  Clock,
  MapPin,
  
  // Media
  Image,
  Camera,
  FileImage,
  
  // Social (Use branded versions when available)
  Instagram,
  Facebook,
  Share2,
  
  // System
  Zap,
  Shield,
  Award,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

// Standardized icon mapping for consistent usage
export const ShopLynkIcons = {
  // Navigation
  home: Home,
  products: ShoppingBag,
  settings: Settings,
  profile: User,
  menu: Menu,
  close: X,
  
  // Actions
  add: Plus,
  remove: Minus,
  edit: Edit,
  delete: Trash2,
  save: Save,
  upload: Upload,
  download: Download,
  
  // Navigation arrows
  back: ArrowLeft,
  forward: ArrowRight,
  previous: ChevronLeft,
  next: ChevronRight,
  expand: ChevronDown,
  
  // E-commerce
  payment: CreditCard,
  delivery: Truck,
  order: Package,
  cart: ShoppingCart,
  wishlist: Heart,
  rating: Star,
  search: Search,
  filter: Filter,
  view: Eye,
  hide: EyeOff,
  
  // Communication
  chat: MessageCircle,
  phone: Phone,
  email: Mail,
  send: Send,
  
  // Status
  success: CheckCircle,
  check: Check,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
  
  // Business
  store: Store,
  analytics: BarChart3,
  growth: TrendingUp,
  revenue: DollarSign,
  website: Globe,
  calendar: Calendar,
  time: Clock,
  location: MapPin,
  
  // Media
  image: Image,
  camera: Camera,
  photo: FileImage,
  
  // Social
  instagram: Instagram,
  facebook: Facebook,
  share: Share2,
  
  // System
  premium: Zap,
  security: Shield,
  achievement: Award,
  featured: Sparkles,
  refresh: RefreshCw,
} as const

// Icon size standardization
export const iconSizes = {
  xs: 12,   // 12px
  sm: 16,   // 16px  
  md: 20,   // 20px - default
  lg: 24,   // 24px
  xl: 32,   // 32px
  '2xl': 48, // 48px
} as const

// Helper function to get standardized icon props
export const getIconProps = (size: keyof typeof iconSizes = 'md') => ({
  size: iconSizes[size],
  strokeWidth: 2,
})

// Commonly used icon combinations
export const IconPresets = {
  navigationButton: { size: iconSizes.md, strokeWidth: 2 },
  cardAction: { size: iconSizes.sm, strokeWidth: 2 },
  headerIcon: { size: iconSizes.lg, strokeWidth: 2 },
  statusIcon: { size: iconSizes.sm, strokeWidth: 2.5 },
  featureIcon: { size: iconSizes.xl, strokeWidth: 1.5 },
} as const

export type IconName = keyof typeof ShopLynkIcons
export type IconSize = keyof typeof iconSizes

export default ShopLynkIcons