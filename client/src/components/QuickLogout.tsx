import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface QuickLogoutProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export default function QuickLogout({ 
  variant = 'outline',
  size = 'sm',
  className = '',
  showIcon = true,
  showText = true
}: QuickLogoutProps) {
  const { signOut } = useAuthContext();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      console.log('🔐 QuickLogout: Initiating logout...');
      
      // Clear all storage
      sessionStorage.clear();
      localStorage.clear();
      
      // Sign out from Firebase
      await signOut();
      
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out of your account.',
      });
      
      console.log('✅ QuickLogout: Successfully signed out');
      
      // Force reload to clear any remaining state
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ QuickLogout error:', error);
      toast({
        title: 'Logout failed',
        description: 'There was an error signing you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={`flex items-center gap-2 ${className}`}
      data-testid="quick-logout-button"
    >
      {showIcon && <LogOut className="w-4 h-4" />}
      {showText && 'Sign Out'}
    </Button>
  );
}