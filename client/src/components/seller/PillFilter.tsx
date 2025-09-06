import React from 'react'
import { cn } from '@/lib/utils'

interface PillFilterProps {
  label: string
  isActive?: boolean
  count?: number
  variant?: 'category' | 'filter' | 'status' | 'feature'
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
}

/**
 * Standardized PillFilter component
 * Used for category pills and tags across Products + Storefront filters
 * Consistent rounded-full design, px-3 py-1 spacing, color-coded by category
 */
export function PillFilter({
  label,
  isActive = false,
  count,
  variant = 'filter',
  onClick,
  className,
  icon
}: PillFilterProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'category':
        return isActive
          ? 'bg-blue-500 text-white border-blue-500 shadow-md'
          : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      
      case 'filter':
        return isActive
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-md'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      
      case 'status':
        return isActive
          ? 'bg-green-500 text-white border-green-500'
          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
      
      case 'feature':
        return isActive
          ? 'bg-purple-500 text-white border-purple-500'
          : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
      
      default:
        return isActive
          ? 'bg-gray-500 text-white border-gray-500'
          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
    }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1',
        
        // Variant-specific styles
        getVariantStyles(),
        
        // Hover animation
        'hover:scale-105 active:scale-95',
        
        // Disabled state
        onClick ? 'cursor-pointer' : 'cursor-default',
        
        className
      )}
      disabled={!onClick}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      
      <span className="whitespace-nowrap">{label}</span>
      
      {count !== undefined && (
        <span className={cn(
          'ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
          isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-gray-100 text-gray-600'
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

// Predefined category pill variants for common use cases
export const CategoryPill = ({ category, isActive, onClick, count }: {
  category: string
  isActive?: boolean
  onClick?: () => void
  count?: number
}) => (
  <PillFilter
    label={category}
    isActive={isActive}
    onClick={onClick}
    count={count}
    variant="category"
    icon={<span>📦</span>}
  />
)

export const FeaturePill = ({ feature, isActive, onClick }: {
  feature: string
  isActive?: boolean
  onClick?: () => void
}) => {
  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'handmade': return '🎨'
      case 'eco-friendly': return '🌱'
      case 'gift wrap': return '🎁'
      case 'customizable': return '⚙️'
      default: return '✨'
    }
  }

  return (
    <PillFilter
      label={feature}
      isActive={isActive}
      onClick={onClick}
      variant="feature"
      icon={<span>{getFeatureIcon(feature)}</span>}
    />
  )
}

export const StatusPill = ({ status, count }: {
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  count?: number
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'in-stock':
        return { label: 'In Stock', icon: '✅', variant: 'status' as const }
      case 'low-stock':
        return { label: 'Low Stock', icon: '⚠️', variant: 'status' as const }
      case 'out-of-stock':
        return { label: 'Out of Stock', icon: '❌', variant: 'status' as const }
      default:
        return { label: status, icon: '📦', variant: 'status' as const }
    }
  }

  const config = getStatusConfig(status)
  
  return (
    <PillFilter
      label={config.label}
      count={count}
      variant={config.variant}
      icon={<span>{config.icon}</span>}
    />
  )
}

export default PillFilter