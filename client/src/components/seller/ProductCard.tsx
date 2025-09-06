import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ShopLynkIcons } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    imageUrl?: string
    category: string
    subcategory?: string
    brand?: string
    quantity: number
    isActive: boolean
    isHandmade?: boolean
    isCustomizable?: boolean
    giftWrapping?: boolean
    sustainability?: boolean
  }
  context: 'seller' | 'storefront' | 'analytics'
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onPreview?: (id: string) => void
  onContact?: (id: string) => void
  onFavorite?: (id: string) => void
  isFavorited?: boolean
  className?: string
}

/**
 * Standardized ProductCard component
 * Used across Products, Storefront, and Analytics pages
 * Fixed aspect-[4/3] image ratio, consistent layout, standardized CTAs
 */
export function ProductCard({
  product,
  context,
  onEdit,
  onDelete,
  onPreview,
  onContact,
  onFavorite,
  isFavorited = false,
  className
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const getStockStatus = () => {
    if (product.quantity === 0 && !product.isActive) {
      return { label: 'SOLD', color: 'bg-gray-900/90 text-white' }
    }
    if (product.quantity <= 5 && product.quantity > 0) {
      return { label: `${product.quantity} left`, color: 'bg-red-100 text-red-700 border border-red-200' }
    }
    if (product.quantity > 5) {
      return { label: 'In Stock', color: 'bg-green-100 text-green-700 border border-green-200' }
    }
    return null
  }

  const stockStatus = getStockStatus()
  const isOutOfStock = product.quantity === 0 && !product.isActive

  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-200",
      isOutOfStock && "opacity-75",
      className
    )}>
      {/* Image Section - Fixed aspect-[4/3] ratio */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.imageUrl || '/api/placeholder/400/300'}
          alt={product.name}
          className={cn(
            "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]",
            isOutOfStock && "grayscale"
          )}
          loading="lazy"
        />
        
        {/* Status Badge - Top Left */}
        {stockStatus && (
          <div className={cn(
            "absolute left-3 top-3 px-2.5 py-1 rounded-md text-xs font-medium z-10",
            stockStatus.color
          )}>
            {stockStatus.label}
          </div>
        )}

        {/* Favorite Button - Top Right */}
        {onFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90",
              isFavorited ? "text-red-500" : "text-gray-400"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onFavorite(product.id)
            }}
          >
            <ShopLynkIcons.wishlist
              className="w-4 h-4"
              fill={isFavorited ? "currentColor" : "none"}
            />
          </Button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Product Name & Brand */}
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-tight text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-sm text-gray-500">{product.brand}</p>
          )}
        </div>

        {/* Price & Stock - Right aligned price */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </div>
          {context === 'seller' && stockStatus && (
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              stockStatus.color
            )}>
              {stockStatus.label}
            </div>
          )}
        </div>

        {/* Category Pills - Below title */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
            <ShopLynkIcons.store className="w-3 h-3 mr-1" />
            {product.category}
          </div>
          {product.subcategory && (
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
              {product.subcategory}
            </div>
          )}
        </div>

        {/* Feature Badges */}
        {(product.isHandmade || product.isCustomizable || product.giftWrapping || product.sustainability) && (
          <div className="flex flex-wrap gap-1.5">
            {product.sustainability && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                <span className="mr-1">🌱</span>
                Eco-friendly
              </div>
            )}
            {product.isHandmade && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                <span className="mr-1">🎨</span>
                Handmade
              </div>
            )}
            {product.isCustomizable && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                <span className="mr-1">⚙️</span>
                Custom
              </div>
            )}
            {product.giftWrapping && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-medium">
                <span className="mr-1">🎁</span>
                Gift Wrap
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {context === 'seller' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(product.id)}
                className="flex-1"
              >
                <ShopLynkIcons.edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPreview?.(product.id)}
                className="flex-1"
              >
                <ShopLynkIcons.view className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(product.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <ShopLynkIcons.delete className="w-4 h-4" />
              </Button>
            </div>
          )}

          {context === 'storefront' && (
            <div className="space-y-2">
              <Button
                className="w-full bg-[#25D366] hover:bg-[#1EA952] text-white"
                onClick={() => onContact?.(product.id)}
              >
                <ShopLynkIcons.chat className="w-4 h-4 mr-2" />
                Contact Seller
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onPreview?.(product.id)}
              >
                <ShopLynkIcons.view className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ProductCard