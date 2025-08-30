import { ReactNode } from 'react';
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
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { seller, signOut } = useAuthContext();

  const navigation = [
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Storefront', href: seller?.id ? `/store/${seller.id}` : '/storefront', icon: Store },
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <img 
                    src={logoUrl} 
                    alt="ShoplYnk" 
                    className="w-8 h-8"
                  />
                  <span className="text-xl font-bold text-primary">
                    ShoplYnk
                  </span>
                </div>
              </Link>
              
              <nav className="hidden md:flex space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'text-primary bg-primary/10'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        data-testid={`nav-${item.name.toLowerCase()}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </a>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" data-testid="notifications">
                <Bell className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={seller?.logoUrl} alt={seller?.storeName} />
                      <AvatarFallback>
                        {seller?.storeName?.[0]?.toUpperCase() || seller?.fullName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{seller?.storeName || 'Your Store'}</p>
                    <p className="text-muted-foreground">{seller?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} data-testid="sign-out">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

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
