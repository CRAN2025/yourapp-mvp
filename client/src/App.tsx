import { Switch, Route, useLocation } from "wouter";
import { useEffect } from 'react';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/use-auth";
// Auth guards no longer needed for auth route
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { AppGuard } from "@/components/AppGuard";
import RequireAuth from "@/routes/guards/RequireAuth";

// Import all pages
import MarketLanding from "@/pages/MarketLanding";
import Auth from "@/pages/Auth";
import OnboardingNew from "@/pages/OnboardingNew";
import Products from "@/pages/Products";
import Analytics from "@/pages/Analytics";
import Orders from "@/pages/Orders";
import Settings from "@/pages/Settings";
import Storefront from "@/pages/Storefront";
import StorefrontPublic from "@/pages/StorefrontPublic";
import Admin from "@/pages/Admin";
import Upgrade from "@/pages/Upgrade";
import SellerDashboard from "@/pages/SellerDashboard";
import SimpleSellerDashboard from "@/pages/SimpleSellerDashboard";
import MarketplaceOwnerConsole from "@/pages/MarketplaceOwnerConsole";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CookiePolicy from "@/pages/CookiePolicy";
import GDPRCompliance from "@/pages/GDPRCompliance";
import DataSubjectRequest from "@/pages/DataSubjectRequest";
import SubprocessorList from "@/pages/SubprocessorList";
import DataProcessingAddendum from "@/pages/DataProcessingAddendum";
import FAQ from "@/pages/FAQ";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import ContactSupport from "@/pages/ContactSupport";
import DataMigration from "@/pages/DataMigration";
import NotFound from "@/pages/not-found";
import CustomerStorefrontEntry from "@/components/CustomerStorefrontEntry";

// App Router - handles unified /app destination and smart routing
function AppRouter() {
  const [, navigate] = useLocation();
  const { user, seller, loading } = useAuth();
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      // Not authenticated - redirect to auth
      navigate('/auth?mode=signin', { replace: true });
      return;
    }
    
    if (seller?.isAdmin) {
      // Marketplace owner - redirect to admin console
      navigate('/marketplace-console', { replace: true });
      return;
    }
    
    if (seller?.onboardingCompleted) {
      // Existing seller - redirect to seller dashboard
      navigate('/seller-dashboard', { replace: true });
      return;
    }
    
    // Incomplete onboarding - redirect to onboarding
    navigate('/onboarding/step-1', { replace: true });
  }, [user, seller, loading, navigate]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={MarketLanding} />
      <Route path="/auth" component={Auth} />
      <Route path="/app">
        <AppRouter />
      </Route>
      <Route path="/store/:sellerId" component={StorefrontPublic} />
      <Route path="/customer/:sellerId">
        {(params) => <CustomerStorefrontEntry sellerId={params.sellerId} />}
      </Route>
      
      {/* Legal and support pages */}
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/cookies" component={CookiePolicy} />
      <Route path="/gdpr" component={GDPRCompliance} />
      <Route path="/data-request" component={DataSubjectRequest} />
      <Route path="/subprocessors" component={SubprocessorList} />
      <Route path="/dpa" component={DataProcessingAddendum} />
      <Route path="/faq" component={FAQ} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/support" component={ContactSupport} />

      {/* Onboarding routes - protected by RequireAuth */}
      <Route path="/onboarding/step-1">
        <RequireAuth>
          <OnboardingNew step="step-1" />
        </RequireAuth>
      </Route>
      <Route path="/onboarding/step-2">
        <RequireAuth>
          <OnboardingNew step="step-2" />
        </RequireAuth>
      </Route>
      <Route path="/onboarding/step-3">
        <RequireAuth>
          <OnboardingNew step="step-3" />
        </RequireAuth>
      </Route>

      {/* Protected routes - require authentication */}
      <Route path="/dashboard">
        <AppGuard>
          <Products />
        </AppGuard>
      </Route>
      <Route path="/seller-dashboard">
        <SimpleSellerDashboard />
      </Route>
      <Route path="/marketplace-console">
        <MarketplaceOwnerConsole />
      </Route>
      <Route path="/products">
        <AppGuard>
          <Products />
        </AppGuard>
      </Route>
      <Route path="/analytics">
        <AppGuard>
          <Analytics />
        </AppGuard>
      </Route>
      <Route path="/orders">
        <AppGuard>
          <Orders />
        </AppGuard>
      </Route>
      <Route path="/settings">
        <AppGuard>
          <Settings />
        </AppGuard>
      </Route>
      <Route path="/storefront">
        <AppGuard>
          <Storefront />
        </AppGuard>
      </Route>
      <Route path="/upgrade">
        <AppGuard>
          <Upgrade />
        </AppGuard>
      </Route>

      {/* Admin routes - require admin privileges */}
      <Route path="/admin">
        <AppGuard>
          <Admin />
        </AppGuard>
      </Route>
      <Route path="/admin/analytics">
        <AppGuard>
          <Analytics />
        </AppGuard>
      </Route>
      <Route path="/admin/settings">
        <AppGuard>
          <Settings />
        </AppGuard>
      </Route>
      <Route path="/admin/migration">
        <AppGuard>
          <DataMigration />
        </AppGuard>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
