// MarketLanding.tsx - Enhanced Logo Version (50% larger)
// Saved on August 27, 2025
// Features: Production-ready refinements + Enhanced logo visibility (50% increase)

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { useOnboardingProgress } from '../hooks/useOnboardingProgress';
import { trackEvent } from '../utils/analytics';
import logoUrl from '@assets/shoplynk-logo.png';

export default function MarketLanding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { determineRedirectTarget } = useOnboardingProgress();
  const [isLoading, setIsLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Enhanced FAQ data
  const faqs = [
    {
      q: "How does WhatsApp integration work?",
      a: "When customers click 'Contact on WhatsApp' on your products, they're taken directly to a WhatsApp chat with you. The message includes the product name and a link back to your store. You handle the conversation and payment as you normally would via WhatsApp Business."
    },
    {
      q: "Is it really free during beta?",
      a: "Yes! While we're in beta (currently 200+ spots remaining), everything is completely free. This includes unlimited products, WhatsApp integration, analytics, and all core features. We'll give beta users advance notice before any pricing takes effect."
    },
    {
      q: "Do I need technical skills to set up my store?",
      a: "Not at all. Our setup takes about 5 minutes: upload your logo, add your products with photos and prices, customize your store colors, and share your link. Everything is point-and-click, no coding required."
    },
    {
      q: "Can I use my own domain?",
      a: "Currently, all stores use shoplynk.store/yourname URLs, which are perfect for sharing on social media and WhatsApp. Custom domain support is planned for our Pro tier launch."
    },
    {
      q: "What payment methods do you support?",
      a: "ShopLynk handles the storefront, while you manage payments through your preferred method (mobile money, bank transfer, cash on delivery, etc.) via WhatsApp conversations with customers."
    },
    {
      q: "Can I track my sales and visitors?",
      a: "Yes! You get a dashboard showing store visits, product views, WhatsApp clicks, and other key metrics. Perfect for understanding what products customers like most."
    }
  ];

  const testimonials = [
    {
      name: "Akosua M.",
      business: "Handmade Jewelry",
      text: "I was skeptical at first, but ShopLynk transformed my WhatsApp business. Customers love browsing my products before messaging me. Sales increased 40% in the first month!",
      location: "Accra, Ghana",
      avatar: "A"
    },
    {
      name: "James K.",
      business: "Fashion & Accessories",
      text: "Setting up took literally 10 minutes. The professional look of my store makes customers trust me more. Getting orders through WhatsApp is so much easier now.",
      location: "Lagos, Nigeria",
      avatar: "J"
    },
    {
      name: "Fatima A.",
      business: "Beauty Products",
      text: "My customers were asking for a catalog for months. ShopLynk gave me exactly what I needed - now they browse first, then WhatsApp me ready to buy.",
      location: "Cairo, Egypt",
      avatar: "F"
    }
  ];

  // Track page view
  useEffect(() => {
    trackEvent('page_view', {
      page: 'marketing_landing',
      user_type: user ? 'authenticated' : 'anonymous'
    });
  }, [user]);

  // Scroll reveal animation
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const elements = rootRef.current?.querySelectorAll('.reveal-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const goCreate = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    trackEvent('cta_click', {
      location: 'hero',
      button_text: 'Create your free store',
      user_authenticated: !!user
    });

    try {
      if (user) {
        const target = await determineRedirectTarget();
        setLocation(target);
      } else {
        setLocation('/signup');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setLocation('/signup');
    } finally {
      setIsLoading(false);
    }
  };

  const goLogin = () => {
    trackEvent('cta_click', {
      location: 'hero',
      button_text: 'Sign in',
      user_authenticated: !!user
    });
    setLocation('/login');
  };

  const winDot = (color: string) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color
  });

  // PreviewDevice component with demo products - production ready
  function PreviewDevice() {
    return (
      <div className="glass heroGlass" style={{ padding: 16, boxShadow: 'var(--shadow-strong)' }}>
        <div style={{ height: 18, display: 'flex', gap: 6, marginBottom: 12 }}>
          <div style={winDot('#ff5f57')} />
          <div style={winDot('#ffbd2e')} />
          <div style={winDot('#28c840')} />
        </div>
        <div className="glass card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, letterSpacing: '-0.01em', fontSize: 16 }}>Demo Store</div>
          <div style={{ fontSize: 14, opacity: 0.8, color: '#374151' }}>whatsapp orders • no code</div>
        </div>
        <div className="demo-product-grid">
          {[
            ['Sunset Earrings', 'GHS 120'],
            ['Handwoven Basket', 'GHS 240'],
            ['Shea Body Butter', 'GHS 85'],
            ['Tie-Dye Tee', 'GHS 150'],
          ].map(([name, price], i) => (
            <div
              key={i}
              className="glass card demo-product-card"
              role="article"
              aria-label={`Product: ${name}, Price: ${price}`}
            >
              <div className="demo-product-image" />
              <div className="demo-product-content">
                <div className="demo-product-name" title={name}>
                  {name}
                </div>
                <div className="demo-product-price">{price}</div>
              </div>
              <button
                className="btn btnPrimary demo-contact-button"
                aria-label={`Contact seller about ${name} via WhatsApp`}
                tabIndex={-1}
              >
                Contact on WhatsApp
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* Design tokens */
        :root{
          --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          --ink: #111827;
          --ink-light: #374151;
          --surface: rgba(255,255,255,.75);
          --surface-strong: rgba(255,255,255,.85);
          --border: rgba(255,255,255,.4);
          --shadow: 0 10px 30px rgba(15, 23, 42, .08);
          --shadow-strong: 0 30px 80px rgba(15,23,42,.18);
          --grad: linear-gradient(135deg,#5a6bff 0%, #67d1ff 100%);
          --radius-card: 16px;
          --radius-hero: 24px;
          --radius-button: 16px;
          --radius-image: 12px;
          --focus-ring: 2px solid #5a6bff;
          --focus-offset: 2px;
        }

        html, body, #root { height: 100%; }
        * { box-sizing: border-box; }
        body { margin: 0; color: var(--ink); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; background: #f6f8ff; }

        a { color: inherit; text-decoration: none; }
        button { font-family: var(--font-sans); }

        /* Accessibility: Enhanced focus states */
        :where(button,a,input):focus-visible { 
          outline: var(--focus-ring); 
          outline-offset: var(--focus-offset);
        }

        /* Animations with reduced-motion support */
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px) } to { opacity:1; transform: translateY(0) } }
        .reveal-on-scroll { 
          opacity: 0; 
          transform: translateY(12px); 
          transition: transform .6s cubic-bezier(.2,.7,.2,1), opacity .6s ease; 
        }
        .reveal-on-scroll.is-visible { opacity: 1; transform: translateY(0); }

        @media (prefers-reduced-motion: reduce) {
          .reveal-on-scroll { opacity: 1; transform: none; transition: none; }
          * { animation: none !important; transition: none !important; }
          .cta-pulse { animation: none !important; }
          .logo-enhanced:hover { transform: none; }
        }

        /* Layout */
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Responsive breakpoints */
        @media (max-width: 768px) {
          .container { padding: 0 16px; }
          .glass { padding: 20px !important; }
          .heroGlass { padding: 20px !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .hero-text { order: 1; text-align: center; }
          .hero-demo { order: 2; max-width: 400px; margin: 0 auto; }
          .mobile-hidden { display: none !important; }
          .nav-mobile { flex-direction: column; gap: 12px; }
          .header-container { min-height: 70px; } /* Slightly reduced for mobile */
        }

        /* Tablet specific adjustments */
        @media (min-width: 769px) and (max-width: 1023px) {
          .header-container { min-height: 75px; }
        }

        /* Desktop optimization */
        @media (min-width: 1024px) {
          .header-container { min-height: 80px; }
        }

        /* Glass morphism */
        .glass {
          background: var(--surface);
          border: 1px solid var(--border);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
          box-shadow: var(--shadow);
        }
        .card { border-radius: var(--radius-card); }
        .heroGlass { border-radius: var(--radius-hero); }

        /* Button system - unified heights and styles */
        .btn { 
          border: none; 
          cursor: pointer; 
          font-weight: 700; 
          font-size: 16px;
          height: 52px;
          padding: 0 24px;
          border-radius: var(--radius-button);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform .15s ease, box-shadow .15s ease, background-position .2s ease; 
          will-change: transform;
          box-sizing: border-box;
        }
        .btn:active { transform: translateY(1px); }
        .btn:focus-visible { 
          outline: var(--focus-ring); 
          outline-offset: var(--focus-offset);
        }

        .btnNav { /* Legacy class for existing buttons */ }

        .btnPrimary { 
          color: #fff; 
          background: var(--grad); 
          background-size: 180% 100%; 
          background-position: 0% 50%; 
          box-shadow: 0 12px 30px rgba(90,107,255,.28); 
        }
        .btnPrimary:hover { 
          background-position: 100% 50%; 
          box-shadow: 0 16px 40px rgba(90,107,255,.35); 
        }

        .btnSecondary { 
          background: transparent; 
          border: 1.5px solid rgba(17,24,39,.15); 
          color: var(--ink);
        }
        .btnSecondary:hover {
          background: rgba(90,107,255,.05);
          border-color: rgba(90,107,255,.2);
        }

        /* Demo product grid - responsive and accessible */
        .demo-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        @media (max-width: 520px) {
          .demo-product-grid {
            grid-template-columns: 1fr;
          }
        }

        .demo-product-card {
          padding: 12px;
          border-radius: var(--radius-card);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 200px;
          position: relative;
        }

        .demo-product-image {
          height: 92px;
          border-radius: var(--radius-image);
          background: linear-gradient(135deg,#e7ecff,#f6f9ff);
          flex-shrink: 0;
        }

        .demo-product-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px 0;
        }

        .demo-product-name {
          font-weight: 700;
          font-size: 14px;
          line-height: 1.3;
          color: var(--ink);
          letter-spacing: -0.01em;
          /* Max 2 lines with ellipsis */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .demo-product-price {
          font-weight: 600;
          font-size: 13px;
          color: var(--ink-light);
        }

        .demo-contact-button {
          width: 100%;
          height: 36px;
          font-size: 14px;
          font-weight: 700;
          margin-top: 8px;
          flex-shrink: 0;
        }

        /* Utility classes */
        .badge { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          padding: 8px 12px; 
          border-radius: 999px; 
          background: rgba(17,24,39,.08); 
          font-weight: 600; 
          font-size: 13px; 
          color: var(--ink-light);
        }
        
        .logoDot { 
          width: 36px; 
          height: 36px; 
          border-radius: 50%; 
          background: #e8ecff; 
          border: 1px solid #dee3ff; 
        }
        
        .faq-item { 
          cursor: pointer; 
          transition: all 0.2s ease; 
          border-radius: var(--radius-card);
        }
        .faq-item:hover { background: rgba(90,107,255,.05); }
        .faq-item:focus-visible {
          outline: var(--focus-ring);
          outline-offset: var(--focus-offset);
        }
        
        .testimonial-card { transition: transform 0.3s ease, opacity 0.3s ease; }
        .testimonial-card.active { transform: scale(1.02); }
        
        .cta-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 
          0%, 100% { transform: scale(1); } 
          50% { transform: scale(1.02); } 
        }
        
        .mobile-optimized {
          @media (max-width: 768px) {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
        }
        
        .pricing-grid {
          @media (max-width: 768px) {
            grid-template-columns: 1fr !important;
            max-width: 400px;
            margin: 0 auto;
          }
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Enhanced logo styling for better brand visibility */
        .logo-enhanced {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .logo-enhanced:hover {
          transform: scale(1.02) translateZ(0);
        }
        
        /* Ensure proper logo-nav spacing */
        .header-container {
          min-height: 80px;
          display: flex;
          align-items: center;
        }
      `}</style>

      {/* Background accents */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '30%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(90,107,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '25%',
        height: '35%',
        background: 'radial-gradient(circle, rgba(103,209,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        zIndex: -1
      }} />

      {/* Nav - Full Bleed */}
      <header 
        className=""
        style={{ 
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          zIndex: 2,
          paddingTop: '20px',
          paddingBottom: '20px'
        }}
      >
        <div 
          className="mx-auto"
          style={{
            maxWidth: '1200px',
            paddingInline: 'clamp(16px, 4vw, 20px)',
            paddingLeft: 'max(20px, env(safe-area-inset-left))',
            paddingRight: 'max(20px, env(safe-area-inset-right))'
          }}
        >
          <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <Link to="/" aria-label="ShopLynk home">
              <img 
                src={logoUrl} 
                alt="ShopLynk - Create your WhatsApp storefront" 
                className="h-12 sm:h-14 md:h-16 w-auto cursor-pointer logo-enhanced"
                style={{
                  maxHeight: '64px',
                  height: 'auto',
                  filter: 'contrast(1.1)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: 14, alignItems: 'center' }} className="nav-mobile">
            <a href="#faq" className="mobile-hidden" style={{ marginRight: 20, fontWeight: 600, color: 'var(--ink)', opacity: 0.8, cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}>FAQ</a>
            <button 
              onClick={goCreate} 
              className="btn btnNav btnPrimary cta-pulse" 
              data-testid="header-create-store"
              disabled={isLoading}
              aria-label="Create your free store"
              style={{ fontSize: 14, padding: '0 20px' }}
            >
              {isLoading ? <div className="loading-spinner"></div> : 'Create Store'}
            </button>
          </nav>
          </div>
        </div>
      </header>

      {/* Hero - Full Bleed */}
      <section 
        id="signup" 
        className="reveal-on-scroll is-visible"
        style={{ 
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          marginTop: 28
        }}
      >
        <div className="glass heroGlass" style={{ paddingTop: 28, paddingBottom: 28 }}>
          <div 
            className="mx-auto"
            style={{
              maxWidth: '1200px',
              paddingInline: 'clamp(16px, 4vw, 28px)',
              paddingLeft: 'max(28px, env(safe-area-inset-left))',
              paddingRight: 'max(28px, env(safe-area-inset-right))'
            }}
          >
            <div className="hero-grid" style={{ display:'grid', gridTemplateColumns: '1.05fr .95fr', gap: 28, alignItems:'center' }}>
            {/* Left copy */}
            <div className="hero-text">
              <h1 style={{ fontSize: 'clamp(40px, 7vw, 64px)', lineHeight: 1.06, margin: '0 0 16px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                Launch a WhatsApp-ready storefront in minutes
              </h1>
              <p style={{ color: 'var(--ink-light)', fontSize: 18, lineHeight: 1.65, margin: '0 0 24px', fontWeight: 500 }}>
                Add products, share a single link, and start getting orders via WhatsApp.<strong style={{ color: 'var(--ink)' }}> Free during beta.</strong>
              </p>

              {/* Primary CTA only (demo button removed) */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom: 12 }}>
                <button 
                  onClick={goCreate} 
                  className="btn btnPrimary cta-pulse" 
                  data-testid="hero-create-store"
                  disabled={isLoading}
                  aria-label="Create your free store - Start your free trial"
                >
                  {isLoading ? <div className="loading-spinner" aria-label="Loading"></div> : 'Create your free store'}
                </button>
              </div>
              
              {/* Urgency messaging */}
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'linear-gradient(90deg, rgba(255,107,107,0.1), rgba(78,205,196,0.1))', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                🔥 Limited Beta Access • <span style={{ color: '#dc2626' }}>200+ spots remaining</span>
              </div>

              {/* Sign-in hint for scrollers */}
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-light)' }}>
                Already have a store?{' '}
                <button 
                  onClick={goLogin} 
                  style={{ color: '#5a6bff', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
                  aria-label="Sign in to existing store"
                >
                  Sign in
                </button>
              </div>

              {/* Enhanced Social proof */}
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-light)' }}>
                ⭐ Trusted by 200+ sellers • 🌍 8 countries • 💰 $50K+ in sales this month
              </div>

              {/* Badges */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:16 }}>
                <span className="badge">⭐ 4.8/5 from early sellers</span>
                <span className="badge">🧰 No code required</span>
                <span className="badge">🔒 Backed by Firebase</span>
                <span className="badge">⏱️ Set up in ~5 minutes</span>
              </div>
            </div>

            {/* Right: Preview Device with demo products */}
            <div className="reveal-on-scroll hero-demo">
              <PreviewDevice />
            </div>
            </div>
          </div>
        </div>
      </section>



      {/* Enhanced Social Proof Section */}
      <section className="container reveal-on-scroll" style={{ marginTop: 32 }}>
        <div className="glass card" style={{ padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--ink-light)' }}>Trusted by sellers worldwide</h3>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="logoDot" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 12, 
                fontWeight: 700, 
                color: '#5a6bff',
                opacity: 0.6 + (i * 0.05)
              }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="container" style={{ marginTop: 40 }}>
        {/* How it Works Section */}
        <section className="reveal-on-scroll" style={{ marginTop: 32 }}>
          <h3 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.01em', color: 'var(--ink)' }}>What our sellers say</h3>
          <div className="glass card testimonial-card" style={{ 
            padding: 22, 
            display:'flex', 
            alignItems:'center', 
            gap:20,
            textAlign:'left'
          }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontWeight: 800, 
              fontSize: 16,
              flexShrink: 0
            }}>
              {testimonials[0].avatar}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 8px', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5 }}>
                "{testimonials[0].text}"
              </p>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {testimonials[0].name} • {testimonials[0].business}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                {testimonials[0].location}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="reveal-on-scroll" style={{ marginTop: 40 }}>
          <h3 style={{ textAlign: 'center', fontSize: 24, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Simple, transparent pricing</h3>
          <p style={{ textAlign: 'center', color: 'var(--ink-light)', marginBottom: 24 }}>Start free, upgrade when you're ready</p>
          
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { name: 'Free Beta', price: '$0', period: 'forever', features: ['Up to 50 products', 'WhatsApp integration', 'Basic analytics', 'Community support'], highlight: false, badge: 'Current' },
              { name: 'Pro', price: '$15', period: 'per month', features: ['Unlimited products', 'Custom domain', 'Advanced analytics', 'Priority support', 'Custom branding'], highlight: true, badge: 'Coming Soon' },
              { name: 'Enterprise', price: 'Custom', period: 'pricing', features: ['White-label solution', 'API access', 'Custom integrations', 'Dedicated support', 'SLA guarantee'], highlight: false, badge: 'Contact Us' }
            ].map((plan, i) => (
              <div key={i} className={`glass card ${plan.highlight ? 'cta-pulse' : ''}`} style={{ 
                padding: 24, 
                position: 'relative',
                border: plan.highlight ? '2px solid #5a6bff' : undefined,
                transform: plan.highlight ? 'scale(1.05)' : undefined
              }}>
                {plan.badge && (
                  <div style={{ 
                    position: 'absolute', 
                    top: -8, 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    background: plan.highlight ? '#5a6bff' : '#374151', 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: 12, 
                    fontSize: 12, 
                    fontWeight: 700 
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>{plan.name}</h4>
                  <div style={{ fontSize: 32, fontWeight: 900, margin: '0 0 4px' }}>
                    {plan.price}
                    <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.7 }}>/{plan.period}</span>
                  </div>
                </div>
                <ul style={{ margin: '20px 0', padding: 0, listStyle: 'none' }}>
                  {plan.features.map((feature, j) => (
                    <li key={j} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#10b981', fontSize: 16 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  className={`btn ${plan.highlight ? 'btnPrimary' : 'btnSecondary'}`}
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={plan.name === 'Free Beta' ? goCreate : undefined}
                  disabled={plan.name !== 'Free Beta'}
                >
                  {plan.name === 'Free Beta' ? 'Get Started' : plan.badge}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FAQ Section */}
      <section id="faq" className="container reveal-on-scroll" style={{ marginTop: 48 }}>
        <h3 style={{ textAlign: 'center', fontSize: 24, fontWeight: 900, marginBottom: 24, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Frequently asked questions</h3>
        <div className="glass card" style={{ padding: 24 }}>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item" style={{ 
              padding: 16, 
              borderBottom: i < faqs.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
            }} onClick={() => setShowFAQ(showFAQ === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 16 }}>
                {faq.q}
                <span style={{ fontSize: 18, transform: showFAQ === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>+</span>
              </div>
              {showFAQ === i && (
                <div style={{ marginTop: 12, opacity: 0.8, lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container reveal-on-scroll" style={{ marginTop: 48, marginBottom: 48 }}>
        <div className="glass heroGlass" style={{ padding: 40, textAlign: 'center' }}>
          <h3 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.01em' }}>
            Ready to launch your store?
          </h3>
          <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Join 200+ sellers who've already started their WhatsApp commerce journey
          </p>
          <button onClick={goCreate} className="btn btnPrimary cta-pulse" style={{ fontSize: 18, padding: '0 32px' }} disabled={isLoading}>
            {isLoading ? <div className="loading-spinner"></div> : 'Create your free store'}
          </button>
          <div style={{ marginTop: 16, fontSize: 14, opacity: 0.7 }}>
            ✨ No credit card required • ⚡ Set up in 5 minutes • 🎯 Free during beta
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: 'rgba(255,255,255,0.9)', 
        borderTop: '1px solid rgba(0,0,0,0.08)', 
        padding: '24px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
            <Link to="/" style={{ fontWeight: 700, opacity: 0.8 }}>ShopLynk</Link>
            <a href="mailto:brock1kai@gmail.com" style={{ opacity: 0.7 }}>Contact</a>
            <a href="#faq" style={{ opacity: 0.7 }} onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}>FAQ</a>
          </div>
          <div style={{ fontSize: 14, opacity: 0.6 }}>
            © 2024 ShopLynk. Made for ambitious sellers worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}