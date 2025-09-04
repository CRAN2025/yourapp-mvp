import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, ShoppingBag, Store, BarChart3, Settings, Package, LogOut } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logoUrl from '@/assets/logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
  hideTopNav?: boolean;
}

export default function DashboardLayout({ children, hideTopNav = false }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { seller, signOut } = useAuthContext();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Storefront', href: '/storefront', icon: Store },
    { name: 'Orders', href: '/orders', icon: ShoppingBag },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {!hideTopNav && (
        <header 
          data-scrolled={scrolled ? 'true' : 'false'}
          className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-100 data-[scrolled=true]:shadow-sm">
          <div className="mx-auto max-w-7xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg" aria-label="ShopLynk">
                <span className="font-black tracking-tight text-lg text-slate-900">
                  ShopLynk
                </span>
              </a>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={`relative px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg ${
                        isActive
                          ? 'text-slate-900'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                      data-testid={`nav-${item.name.toLowerCase()}`}
                    >
                      {item.name}
                      {isActive && <span className="absolute inset-x-2 -bottom-[2px] h-[2px] rounded-full bg-gradient-to-r from-sky-500 to-violet-500" />}
                    </a>
                  </Link>
                );
              })}
            </nav>

          </div>
        </header>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex justify-around py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-gray-600'
                  }`}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile spacing */}
      <div className="md:hidden h-16" />
    </div>
  );
}
