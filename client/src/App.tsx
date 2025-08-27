import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import SellerAuthGuard from "@/components/auth/AuthGuard";

// Import all pages
import MarketingLanding from "@/pages/MarketingLanding";
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
import SubprocessorList from "@/pages/SubprocessorList";
import DataProcessingAddendum from "@/pages/DataProcessingAddendum";
import FAQ from "@/pages/FAQ";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import ContactSupport from "@/pages/ContactSupport";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={MarketingLanding} />
      <Route path="/app">
        <AuthGuard requireAuth={false}>
          <Auth />
        </AuthGuard>
      </Route>
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
      <Route path="/subprocessors" component={SubprocessorList} />
      <Route path="/dpa" component={DataProcessingAddendum} />
      <Route path="/faq" component={FAQ} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/support" component={ContactSupport} />

      {/* Protected routes - require authentication */}
      <Route path="/onboarding">
        <AuthGuard>
          <Onboarding />
        </AuthGuard>
      </Route>
      <Route path="/products">
        <SellerAuthGuard>
          <Products />
        </SellerAuthGuard>
      </Route>
      <Route path="/analytics">
        <SellerAuthGuard>
          <Analytics />
        </SellerAuthGuard>
      </Route>
      <Route path="/orders">
        <SellerAuthGuard>
          <Orders />
        </SellerAuthGuard>
      </Route>
      <Route path="/settings">
        <SellerAuthGuard>
          <Settings />
        </SellerAuthGuard>
      </Route>
      <Route path="/storefront">
        <SellerAuthGuard>
          <Storefront />
        </SellerAuthGuard>
      </Route>
      <Route path="/upgrade">
        <AuthGuard>
          <Upgrade />
        </AuthGuard>
      </Route>

      {/* Admin routes - require admin privileges */}
      <Route path="/admin">
        <SellerAuthGuard>
          <Admin />
        </SellerAuthGuard>
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
