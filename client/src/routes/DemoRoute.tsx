import { useEffect } from "react";
import { useParams, useLocation } from "wouter";

// Extend window object for analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    rudderanalytics?: {
      track?: (event: string, properties?: any) => void;
    };
  }
}

const DEMO_TARGETS = {
  // DEMO 2 → link exactly to the seller storefront on the host Senait provided
  "coastal-treasures":
    "https://e5bc3ac1-f41b-4b3a-a672-3e8cd165ff35-00-1ppiewcg3zuzb.picard.replit.dev/storefront",
  // Grow Up demo mapping
  "grow-up": 
    "https://e5bc3ac1-f41b-4b3a-a672-3e8cd165ff35-00-1ppiewcg3zuzb.picard.replit.dev/storefront",
  // Leave other demos unmapped for now; they'll 404 until we add them.
};

export default function DemoRoute() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const slug = params.slug;
  const target = DEMO_TARGETS[slug as keyof typeof DEMO_TARGETS];

  // a11y/SEO: prevent indexing of the demo route shell
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,follow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Analytics events (safe guards)
  useEffect(() => {
    if (slug && target) {
      try {
        // gtag example
        if (window.gtag) {
          window.gtag("event", "demo_store_click", { slug });
        }
        // rudder/segment example
        if (window.rudderanalytics?.track) {
          window.rudderanalytics.track("demo_store_click", { slug });
        }
      } catch (e) {
        // no-op: never let analytics break navigation
      }
    }
  }, [slug, target]);

  // Handle unknown slugs
  useEffect(() => {
    if (slug && !target) {
      setLocation("/404");
    }
  }, [slug, target, setLocation]);

  // Preserve UTM params and redirect
  useEffect(() => {
    if (target) {
      const search = window.location.search || "";
      window.location.replace(`${target}${search}`);
    }
  }, [target]);

  return null;
}