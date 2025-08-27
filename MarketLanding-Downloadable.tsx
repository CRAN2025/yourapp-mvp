import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { auth } from '@/lib/firebase';
import { ensureAnonymousEventsAuth } from '@/lib/firebaseEvents';
import { trackInteraction } from '@/lib/utils/analytics';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useRouteDecision } from '@/hooks/useRouteDecision';
import logoUrl from '@/assets/logo.png';

export default function MarketLanding() {
  const [location, navigate] = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState(-1);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  // Auth and onboarding state
  const { user } = useAuth();
  const { ready, status, nextStep } = useOnboardingProgress();
  // Don't apply route decision logic on marketing landing page - let users browse freely

  // Extract hash and search from current location
  const [path, search] = location.split('?');
  const hash = path.includes('#') ? '#' + path.split('#')[1] : '';

  // Environment variables
  const APP_ORIGIN = import.meta.env.VITE_APP_ORIGIN;
  const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://shoplynk.app';
  
  // Enable debug mode in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__debugOnboarding = true;
    }
  }, []);

  // Anonymous events and auth detection
  useEffect(() => {
    // Track marketing page view
    const trackMarketingView = async () => {
      try {
        await ensureAnonymousEventsAuth();
        await trackInteraction({
          type: 'store_view',
          sellerId: 'marketing',
          metadata: { source: 'marketing_landing', page: 'home' },
        });
      } catch (error) {
        console.warn('Failed to track marketing view:', error);
      }
    };

    // Only attempt anonymous auth if no user is signed in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        trackMarketingView();
      }
    });

    return () => unsubscribe();
  }, []);

  // Smooth-scroll when arriving with /#signup
  useEffect(() => {
    if (hash === '#signup') {
      const el = document.getElementById('signup');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hash]);

  // Scroll reveal animations
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.reveal-on-scroll') as NodeListOf<HTMLElement>;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible')),
      { threshold: 0.12 }
    );
    els.forEach((el: HTMLElement) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const goCreate = async () => {
    setIsLoading(true);
    
    // Track CTA click
    try {
      await trackInteraction({
        type: 'store_view',
        sellerId: 'marketing',
        metadata: { source: 'cta_click', action: 'signup' },
      });
    } catch (error) {
      console.warn('Failed to track CTA click:', error);
    }
    
    try { (window as any).gtag?.('event', 'begin_signup', { source: 'marketing_landing' }); } catch {}
    
    // Smart CTA routing based on user state
    if (!ready) {
      // Still loading, just go to auth
      navigate('/auth');
    } else if (!user) {
      // Anonymous user
      navigate('/auth');
    } else if (status === 'completed') {
      // Completed user
      navigate('/app');
    } else {
      // In progress or not started
      navigate(`/onboarding?step=${nextStep}`);
    }
    
    setIsLoading(false);
  };

  const goLogin = async () => {
    setIsLoading(true);
    
    // Track login click
    try {
      await trackInteraction({
        type: 'store_view',
        sellerId: 'marketing',
        metadata: { source: 'cta_click', action: 'login' },
      });
    } catch (error) {
      console.warn('Failed to track login click:', error);
    }
    
    try { (window as any).gtag?.('event', 'login_attempt', { source: 'marketing_landing' }); } catch {}
    
    // Direct sign-in navigation
    navigate('/auth');
    
    setIsLoading(false);
  };


  // Testimonials data
  const testimonials = [
    { name: "Sarah K.", business: "Boutique Owner", quote: "We listed 8 products and got our first 3 WhatsApp orders the same day.", rating: 5 },
    { name: "Marcus T.", business: "Craft Seller", quote: "Setup was incredibly easy. I was selling within 5 minutes!", rating: 5 },
    { name: "Aisha M.", business: "Food Business", quote: "WhatsApp integration changed everything. Direct customer contact boosted our sales 300%.", rating: 5 }
  ];

  // FAQ data
  // Top 3 most essential FAQs for landing page
  const faqs = [
    { q: "How quickly can I set up my store?", a: "Most users have their store ready in under 5 minutes. Just add your products, customize your storefront, and share your link!" },
    { q: "Is WhatsApp integration really free?", a: "Yes! WhatsApp integration is completely free. We simply provide direct links to start conversations with your customers." },
    { q: "Do I need technical skills?", a: "Not at all! Our platform is designed for everyone. If you can send a text message, you can create a store." }
  ];

  // Demo stores data
  const demoStores = [
    {
      name: "Bella's Boutique",
      description: "Handmade jewelry & accessories",
      emoji: "💎",
      products: [
        { name: 'Gold Necklace', price: '$89', emoji: '💎' },
        { name: 'Silver Ring', price: '$45', emoji: '💍' },
        { name: 'Pearl Earrings', price: '$67', emoji: '✨' },
        { name: 'Crystal Bracelet', price: '$32', emoji: '🔮' }
      ]
    },
    {
      name: "Urban Threads",
      description: "Trendy streetwear collection",
      emoji: "👕",
      products: [
        { name: 'Hoodie', price: '$55', emoji: '👕' },
        { name: 'Sneakers', price: '$120', emoji: '👟' },
        { name: 'Cap', price: '$25', emoji: '🧢' },
        { name: 'Backpack', price: '$45', emoji: '🎒' }
      ]
    },
    {
      name: "Taste Makers",
      description: "Gourmet food & snacks",
      emoji: "🍯",
      products: [
        { name: 'Honey Jar', price: '$18', emoji: '🍯' },
        { name: 'Artisan Bread', price: '$8', emoji: '🍞' },
        { name: 'Olive Oil', price: '$22', emoji: '🫒' },
        { name: 'Cheese Box', price: '$35', emoji: '🧀' }
      ]
    },
    {
      name: "Plant Paradise",
      description: "Indoor plants & care supplies",
      emoji: "🌱",
      products: [
        { name: 'Monstera Plant', price: '$28', emoji: '🌱' },
        { name: 'Plant Pot', price: '$15', emoji: '🪴' },
        { name: 'Fertilizer', price: '$12', emoji: '🌿' },
        { name: 'Watering Can', price: '$20', emoji: '💧' }
      ]
    }
  ];



  // Rotate testimonials automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const canonicalUrl = MARKETING_URL;
  const ogImageUrl = `${MARKETING_URL}/og-cover.png`;

  // Update page title
  useEffect(() => {
    document.title = 'ShopLynk - Build Your Online Store | WhatsApp E-commerce';
  }, []);

  // Feature Card Component
  const FeatureCard = ({ icon, title, body }: { icon: string; title: string; body: string }) => (
    <div className="glass card" style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h4>
      <p style={{ opacity: 0.8, lineHeight: 1.5, margin: 0 }}>{body}</p>
    </div>
  );

  // Window dot helper for PreviewDevice
  const winDot = (color: string) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: color
  });

  // PreviewDevice component with demo products
  function PreviewDevice() {
    return (
      <div className="glass heroGlass" style={{ padding: 16, boxShadow: 'var(--shadow-strong)' }}>
        <div style={{ height: 18, display: 'flex', gap: 6, marginBottom: 12 }}>
          <div style={winDot('#ff5f57')} />
          <div style={winDot('#ffbd2e')} />
          <div style={winDot('#28c840')} />
        </div>
        <div className="glass card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>Demo Store</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>whatsapp orders • no code</div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {[
            ['Sunset Earrings', 'GHS 120'],
            ['Handwoven Basket', 'GHS 240'],
            ['Shea Body Butter', 'GHS 85'],
            ['Tie-Dye Tee', 'GHS 150'],
          ].map(([name, price], i) => (
            <div
              key={i}
              className="glass card"
              style={{
                padding: 10,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: 200,
              }}
            >
              <div
                style={{
                  height: 92,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg,#e7ecff,#f6f9ff)',
                }}
              />
              <div style={{ fontWeight: 700, marginTop: 8, letterSpacing: '-0.01em', fontSize: 14 }}>
                {name}
              </div>
              <div style={{ opacity: 0.75, fontSize: 13 }}>{price}</div>
              <button
                className="btn btnPrimary"
                style={{
                  width: '100%',
                  marginTop: 8,
                  borderRadius: 16,
                  height: 36,
                  fontSize: 14,
                  fontWeight: 700,
                }}
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

        :root{
          --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          --ink: #0b1220;
          --surface: rgba(255,255,255,.68);
          --surface-strong: rgba(255,255,255,.78);
          --border: rgba(255,255,255,.35);
          --shadow: 0 10px 30px rgba(15, 23, 42, .08);
          --shadow-strong: 0 30px 80px rgba(15,23,42,.18);
          --grad: linear-gradient(135deg,#5a6bff 0%, #67d1ff 100%);
          --radius-card: 16px;
          --radius-hero: 24px;
        }

        html, body, #root { height: 100%; }
        * { box-sizing: border-box; }
        body { margin: 0; color: var(--ink); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; background: #f6f8ff; }

        a { color: inherit; text-decoration: none; }
        button { font-family: var(--font-sans); }

        :where(button,a,input):focus-visible { outline: 2px solid #5a6bff; outline-offset: 2px; }

        @keyframes fadeUp { from { opacity:0; transform: translateY(12px) } to { opacity:1; transform: translateY(0) } }
        .reveal-on-scroll { opacity: 0; transform: translateY(12px); transition: transform .6s cubic-bezier(.2,.7,.2,1), opacity .6s ease; }
        .reveal-on-scroll.is-visible { opacity: 1; transform: translateY(0); }

        @media (prefers-reduced-motion: reduce) {
          .reveal-on-scroll { opacity: 1; transform: none; }
          * { animation: none !important; transition: none !important; }
        }

        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        @media (max-width: 768px) {
          .container { padding: 0 16px; }
          .glass { padding: 20px !important; }
          .heroGlass { padding: 20px !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .hero-text { order: 1; text-align: center; }
          .hero-demo { order: 2; max-width: 400px; margin: 0 auto; }
          .mobile-hidden { display: none !important; }
          .nav-mobile { flex-direction: column; gap: 12px; }
        }

        .glass {
          background: var(--surface);
          border: 1px solid var(--border);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
          box-shadow: var(--shadow);
        }
        .card { border-radius: var(--radius-card); }
        .heroGlass { border-radius: var(--radius-hero); }

        .btn { border: none; cursor: pointer; font-weight: 800; transition: transform .15s ease, box-shadow .15s ease, background-position .2s ease; will-change: transform; }
        .btn:active { transform: translateY(1px); }

        /* >>> Unified NAV button dimensions (identical height/shape) */
        .btnNav {
          height: 52px;                 /* exact height instead of min-height */
          padding: 0 24px;              /* side padding only */
          font-size: 16px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;          /* same rounding for both buttons */
          box-sizing: border-box;       /* include border in height calculation */
        }

        .btnPrimary { color: #fff; background: var(--grad); background-size: 180% 100%; background-position: 0% 50%; box-shadow: 0 12px 30px rgba(90,107,255,.28); vertical-align: top; }
        .btnPrimary:hover { background-position: 100% 50%; box-shadow: 0 16px 40px rgba(90,107,255,.35); }

        .btnSecondary { background: transparent; border: 1.5px solid rgba(0,0,0,.12); vertical-align: top; margin-top: 15px; }

        .badge { display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius: 999px; background: rgba(0,0,0,.05); font-weight: 600; font-size: 13px; }
        .logoDot { width: 36px; height: 36px; border-radius: 50%; background: #e8ecff; border: 1px solid #dee3ff; }
        
        .faq-item { cursor: pointer; transition: all 0.2s ease; }
        .faq-item:hover { background: rgba(90,107,255,.05); }
        .testimonial-card { transition: transform 0.3s ease, opacity 0.3s ease; }
        .testimonial-card.active { transform: scale(1.05); }
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
      `}</style>

      {/* Background accents */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh',
        background: 'linear-gradient(180deg, rgba(99,102,241,0.04) 0%, rgba(67,209,255,0.02) 100%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header */}
      <header className="container reveal-on-scroll" style={{ position: 'relative', zIndex: 10, paddingTop: 24, paddingBottom: 12 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo - responsive sizing */}
          <Link href="/" aria-label="ShopLynk Homepage">
            <img 
              src={logoUrl} 
              alt="ShopLynk" 
              style={{ 
                height: 'clamp(32px, 4vw, 40px)',
                width: 'auto',
                filter: 'drop-shadow(0 2px 8px rgba(90,107,255,0.2))'
              }} 
            />
          </Link>

          {/* Nav buttons */}
          <div className="nav-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={goLogin} className="btn btnNav btnSecondary" disabled={isLoading}>
              {isLoading ? <div className="loading-spinner"></div> : 'Sign In'}
            </button>
            <button onClick={goCreate} className="btn btnNav btnPrimary" disabled={isLoading}>
              {isLoading ? <div className="loading-spinner"></div> : 'Create Store'}
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container" style={{ position: 'relative', zIndex: 2, marginTop: 20 }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40, alignItems: 'center' }}>
          <div className="hero-text reveal-on-scroll">
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Launch a WhatsApp-ready storefront in minutes
            </h1>
            <p style={{ fontSize: 18, opacity: 0.8, lineHeight: 1.6, marginBottom: 28, maxWidth: 520 }}>
              Add products, share a single link, and start getting orders via WhatsApp. <strong>Free during beta.</strong>
            </p>
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <button onClick={goCreate} className="btn btnPrimary cta-pulse" style={{ padding: '16px 24px', fontSize: 18, borderRadius: 16 }} disabled={isLoading}>
                {isLoading ? <div className="loading-spinner"></div> : 'Create your free store'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, opacity: 0.7 }}>
                <span className="badge">🔥 Limited Beta Access</span>
                <span className="badge" style={{ color: '#e11d48' }}>200+ spots remaining</span>
              </div>
            </div>
            
            <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.4 }}>
              <div>Already have a store? <button onClick={goLogin} style={{ color: '#5a6bff', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Sign in</button></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                <span>⭐ Trusted by 200+ sellers</span>
                <span>🌍 8 countries</span> 
                <span>💰 $50K+ in sales this month</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                <span>⭐ 4.8/5 from early sellers</span>
                <span>🚫 No code required</span>
                <span>⚡ Backed by Firebase</span>
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
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, opacity: 0.8 }}>Trusted by sellers worldwide</h3>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="logoDot" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 12, 
                fontWeight: 700, 
                color: '#5a6bff'
              }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16, fontSize: 13, opacity: 0.7 }}>
            <div><strong>95%</strong> satisfaction</div>
            <div><strong>$2M+</strong> in sales</div>
            <div><strong>24/7</strong> support</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <main className="container" style={{ position:'relative', zIndex:2 }}>
        <section className="reveal-on-scroll" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:24, marginTop: 28 }}>
          {[
            ['⚡', 'WhatsApp-ready', 'One-tap contact from every product'],
            ['🧰', 'No code', 'Add products and share your link'],
            ['📈', 'Simple analytics', 'Views, contacts, orders at a glance'],
            ['🌐', 'Custom domain', 'Upgrade when you\'re ready'],
          ].map(([emoji, title, body]) => (<FeatureCard key={title} icon={emoji} title={title} body={body} />))}
        </section>

        {/* Enhanced Testimonials Carousel */}
        <section className="reveal-on-scroll" style={{ marginTop: 32 }}>
          <h3 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.01em' }}>What our sellers say</h3>
          <div className="glass card testimonial-card" style={{ 
            padding: 22, 
            display:'flex', 
            alignItems:'center', 
            gap:16, 
            flexWrap:'wrap',
            minHeight: 120
          }}>
            <div style={{ width:46, height:46, borderRadius:999, background:'#e8f1ff', display:'grid', placeItems:'center', fontWeight:800 }}>
              {testimonials[activeTestimonial].name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', marginBottom: 4 }}>
                {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                  <span key={i} style={{ color: '#ffd700', fontSize: 16 }}>⭐</span>
                ))}
              </div>
              <div style={{ fontWeight:700, marginBottom:4 }}>"{testimonials[activeTestimonial].quote}"</div>
              <div style={{ opacity:.7, fontSize:14 }}>{testimonials[activeTestimonial].name} - {testimonials[activeTestimonial].business}</div>
            </div>
            <button onClick={goCreate} className="btn btnPrimary" style={{ padding: '12px 18px', borderRadius: 16 }} disabled={isLoading}>
              {isLoading ? <div className="loading-spinner"></div> : 'Start free'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: 'none',
                  background: i === activeTestimonial ? '#5a6bff' : 'rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                aria-label={`View testimonial ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="reveal-on-scroll" style={{ marginTop: 40 }}>
          <h3 style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.01em' }}>Simple, transparent pricing</h3>
          <p style={{ textAlign: 'center', opacity: 0.7, marginBottom: 32 }}>Start free, upgrade when you're ready</p>
          
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { name: 'Free Beta', price: '$0', period: 'forever', features: ['Up to 50 products', 'WhatsApp integration', 'Basic analytics', 'Community support'], highlight: false, badge: 'Current' },
              { name: 'Pro', price: '$19', period: '/month', features: ['Unlimited products', 'Custom branding', 'Advanced analytics', 'Priority support', 'Custom domain'], highlight: true, badge: 'Coming Soon' },
              { name: 'Enterprise', price: 'Custom', period: '', features: ['White-label solution', 'API access', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], highlight: false, badge: 'Contact Us' }
            ].map((plan) => (
              <div key={plan.name} className={`glass card ${plan.highlight ? 'cta-pulse' : ''}`} style={{ 
                padding: 28, 
                textAlign: 'center', 
                border: plan.highlight ? '2px solid #5a6bff' : undefined,
                position: 'relative'
              }}>
                {plan.badge && (
                  <div style={{ 
                    position: 'absolute', 
                    top: -12, 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    background: plan.highlight ? '#5a6bff' : '#22c55e', 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: 999, 
                    fontSize: 12, 
                    fontWeight: 700 
                  }}>
                    {plan.badge}
                  </div>
                )}
                <h4 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{plan.name}</h4>
                <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 4, color: plan.highlight ? '#5a6bff' : 'inherit' }}>
                  {plan.price}<span style={{ fontSize: 16, fontWeight: 600, opacity: 0.7 }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', textAlign: 'left' }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#22c55e' }}>✓</span> {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={goCreate} 
                  className={`btn ${plan.highlight ? 'btnPrimary' : 'btnSecondary'}`} 
                  style={{ width: '100%', padding: '14px 20px', borderRadius: 16, marginTop: 12 }}
                  disabled={isLoading}
                >
                  {isLoading ? <div className="loading-spinner"></div> : plan.badge === 'Contact Us' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="reveal-on-scroll" style={{ marginTop: 40 }}>
          <h3 style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, marginBottom: 32, letterSpacing: '-0.01em' }}>Frequently asked questions</h3>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {faqs.map((faq, i) => (
              <div key={i} className="glass card faq-item" style={{ 
                padding: 20, 
                marginBottom: 16, 
                cursor: 'pointer' 
              }} onClick={() => setShowFAQ(showFAQ === i ? -1 : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 16 }}>
                  {faq.q}
                  <span style={{ fontSize: 18, transform: showFAQ === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>+</span>
                </div>
                {showFAQ === i && (
                  <div style={{ marginTop: 12, opacity: 0.8, lineHeight: 1.6, animation: 'fadeUp 0.3s ease' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="signup" className="reveal-on-scroll" style={{ marginTop: 48, marginBottom: 48 }}>
          <div className="glass card" style={{ padding: 40, textAlign: 'center', background: 'linear-gradient(135deg, rgba(90,107,255,0.1) 0%, rgba(67,209,255,0.05) 100%)' }}>
            <h3 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.01em' }}>Ready to launch your store?</h3>
            <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
              Join hundreds of sellers who've already started their journey with ShopLynk
            </p>
            <button onClick={goCreate} className="btn btnPrimary cta-pulse" style={{ padding: '18px 32px', fontSize: 18, borderRadius: 16 }} disabled={isLoading}>
              {isLoading ? <div className="loading-spinner"></div> : 'Create your free store now'}
            </button>
            <div style={{ marginTop: 16, fontSize: 14, opacity: 0.7 }}>
              No credit card required • Setup in under 5 minutes
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container" style={{ padding: '24px 20px', borderTop: '1px solid rgba(0,0,0,0.1)', marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={logoUrl} alt="ShopLynk" style={{ height: 24, opacity: 0.7 }} />
            <span style={{ fontSize: 14, opacity: 0.7 }}>© 2024 ShopLynk. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 14 }}>
            <a href="mailto:brock1kai@gmail.com" style={{ opacity: 0.7, textDecoration: 'none' }}>Contact</a>
            <a href="#" style={{ opacity: 0.7, textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ opacity: 0.7, textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}