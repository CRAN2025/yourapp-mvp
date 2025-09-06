import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'products' | 'cards' | 'default'
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
}

/**
 * ShopLynk Responsive Grid Component
 * Mobile-first responsive design with consistent spacing
 */
const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, type = 'default', cols, children, ...props }, ref) => {
    // Default column configurations
    const defaultCols = {
      products: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4
      },
      cards: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 3
      },
      default: {
        mobile: 1,
        tablet: 2,
        desktop: 2,
        wide: 3
      }
    }

    const columns = cols || defaultCols[type]

    const gridClasses = cn(
      // Base grid styles
      "grid gap-4 w-full",
      
      // Mobile (default - 1 column unless specified)
      `grid-cols-${columns.mobile}`,
      
      // Tablet breakpoint (md: 768px+)
      `md:grid-cols-${columns.tablet}`,
      
      // Desktop breakpoint (lg: 1024px+)
      `lg:grid-cols-${columns.desktop}`,
      
      // Wide breakpoint (xl: 1280px+)
      `xl:grid-cols-${columns.wide}`,
      
      // Responsive gaps
      "sm:gap-6 lg:gap-8",
      
      className
    )

    return (
      <div
        ref={ref}
        className={gridClasses}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveGrid.displayName = "ResponsiveGrid"

/**
 * Container component with consistent padding and max-width
 */
const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
      className
    )}
    {...props}
  />
))

Container.displayName = "Container"

/**
 * Section wrapper with consistent vertical spacing
 */
const Section = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      "py-8 sm:py-12 lg:py-16",
      className
    )}
    {...props}
  />
))

Section.displayName = "Section"

export { ResponsiveGrid, Container, Section }
export type { ResponsiveGridProps }