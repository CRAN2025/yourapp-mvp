import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";

// Import all pages
import MarketLanding from "@/pages/MarketLanding";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Products from "@/pages/Products";
import Analytics from "@/pages/Analytics";
import Orders from "@/pages/Orders";
import Settings from "@/pages/Settings";
import Storefront from "@/pages/Storefront";
import StorefrontPublic from "@/pages/StorefrontPublic";
import Admin from "@/pages/Admin";
import Upgrade from "@/pages/Upgrade";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CookiePolicy from "@/pages/CookiePolicy";
import GDPRCompliance from "@/pages/GDPRCompliance";
import DataSubjectRequest from "@/pages/DataSubjectRequest";
import ContactSupport from "@/pages/ContactSupport";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={MarketLanding} />
      <Route path="/auth">
        <AuthGuard requireAuth={false}>
          <Auth />
        </AuthGuard>
      </Route>
      <Route path="/store/:sellerId" component={StorefrontPublic} />
      
      {/* Legal and support pages */}
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/cookies" component={CookiePolicy} />
      <Route path="/gdpr" component={GDPRCompliance} />
      <Route path="/data-request" component={DataSubjectRequest} />
      <Route path="/support" component={ContactSupport} />

      {/* Protected routes - require authentication */}
      <Route path="/onboarding">
        <AuthGuard>
          <Onboarding />
        </AuthGuard>
      </Route>
      <Route path="/products">
        <AuthGuard>
          <Products />
        </AuthGuard>
      </Route>
      <Route path="/analytics">
        <AuthGuard>
          <Analytics />
        </AuthGuard>
      </Route>
      <Route path="/orders">
        <AuthGuard>
          <Orders />
        </AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard>
          <Settings />
        </AuthGuard>
      </Route>
      <Route path="/storefront">
        <AuthGuard>
          <Storefront />
        </AuthGuard>
      </Route>
      <Route path="/upgrade">
        <AuthGuard>
          <Upgrade />
        </AuthGuard>
      </Route>

      {/* Admin routes - require admin privileges */}
      <Route path="/admin">
        <AuthGuard requireAdmin>
          <Admin />
        </AuthGuard>
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
