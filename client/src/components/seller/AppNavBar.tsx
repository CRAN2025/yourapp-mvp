import React from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { ShopLynkIcons } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: keyof typeof ShopLynkIcons
}

interface AppNavBarProps {
  onSignOut?: () => void
  className?: string
}

/**
 * Standardized AppNavBar component
 * Used across Products, Orders, Analytics, and Settings
 * Left-aligned logo, right-aligned nav links, active route indicator, hover transitions
 */
export function AppNavBar({ onSignOut, className }: AppNavBarProps) {
  const [location] = useLocation()

  const navigation: NavItem[] = [
    { name: 'Products', href: '/products', icon: 'products' },
    { name: 'Storefront', href: '/storefront', icon: 'store' },
    { name: 'Orders', href: '/orders', icon: 'cart' },
    { name: 'Analytics', href: '/analytics', icon: 'analytics' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ]

  return (
    <header className={cn(
      "sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm",
      className
    )}>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg p-1 -m-1">
              <span className="font-bold text-2xl text-gray-900">
                Shop<span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Lynk</span>
              </span>
            </a>
          </Link>

          {/* Right: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location === item.href
              const Icon = ShopLynkIcons[item.icon]
              
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      'relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-blue-400',
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                    
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute inset-x-2 -bottom-[2px] h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    )}
                  </a>
                </Link>
              )
            })}
            
            {/* Sign Out Button */}
            {onSignOut && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="ml-2 text-gray-600 hover:text-gray-900"
              >
                <ShopLynkIcons.profile className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            data-testid="mobile-menu-button"
          >
            <ShopLynkIcons.menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex justify-around py-1">
          {navigation.map((item) => {
            const isActive = location === item.href
            const Icon = ShopLynkIcons[item.icon]
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  )}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile spacing */}
      <div className="md:hidden h-16" />
    </header>
  )
}

export default AppNavBar