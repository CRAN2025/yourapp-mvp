import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/auth',
}: AuthGuardProps) {
  const { user, seller, loading } = useAuthContext();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = currentPath === '/' ? redirectTo : `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      navigate(redirectUrl);
      return;
    }

    if (requireAdmin && (!seller?.isAdmin)) {
      navigate('/'); // Redirect non-admins to home
      return;
    }

    // Check if user needs to complete onboarding
    if (requireAuth && user && seller && (!seller.storeName || !seller.whatsappNumber)) {
      if (window.location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
      return;
    }

    // Redirect authenticated users from auth page
    if (!requireAuth && user && window.location.pathname === '/auth') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/products';
      navigate(redirectUrl);
    }
  }, [user, seller, loading, requireAuth, requireAdmin, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show 403 page for admin-required routes
  if (requireAdmin && user && !seller?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">403</h1>
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
