import React from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Eye, Trash2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Single Source of Truth ProductCard Component
 * Used across Products, Storefront, and Analytics pages
 */

interface ProductCardProps {
  id: string
  title: string
  brand?: string
  price: number
  imageUrl?: string
  badges?: string[]
  tags?: string[]
  status?: string | null
  onEdit?: (id: string) => void
  onPreview?: (id: string) => void
  onDelete?: (id: string) => void
  onContact?: (id: string) => void
  variant?: "owner" | "public"
  className?: string
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  brand,
  price,
  imageUrl,
  badges = [],
  tags = [],
  status,
  onEdit,
  onPreview,
  onDelete,
  onContact,
  variant = "owner",
  className
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div className={cn(
      "rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] overflow-hidden",
      className
    )}>
      {/* Image Section - aspect-[4/3] */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={imageUrl || '/api/placeholder/400/300'}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          loading="lazy"
        />
        
        {/* Status Badge - Top Left */}
        {status && (
          <div className="absolute left-3 top-3 px-2.5 py-1 rounded-md text-xs font-medium z-10 bg-gray-900/90 text-white">
            {status}
          </div>
        )}

        {/* Badges overlay */}
        {badges.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {badges.map((badge, index) => (
              <div key={index} className="px-2 py-1 rounded-md text-xs font-medium bg-white/90 text-gray-800">
                {badge}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title row - text-[17px] font-semibold leading-tight */}
        <div className="space-y-1">
          <h3 className="text-[17px] font-semibold leading-tight text-gray-900 line-clamp-2">
            {title}
          </h3>
          {brand && (
            <p className="text-sm text-gray-500">{brand}</p>
          )}
        </div>

        {/* Price - right-aligned text-[18px] font-semibold text-emerald-600 */}
        <div className="flex items-center justify-between">
          <div className="text-[18px] font-semibold text-emerald-600">
            {formatPrice(price)}
          </div>
        </div>

        {/* Tag row - use Pill component (will be created in step 2) */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <div 
                key={index} 
                className="rounded-full px-3 py-1 text-[13px] leading-none bg-gray-100 text-gray-700"
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="pt-2">
          {variant === "owner" && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(id)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview?.(id)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete?.(id)}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}

          {variant === "public" && (
            <div className="space-y-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onContact?.(id)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Seller
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onPreview?.(id)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard