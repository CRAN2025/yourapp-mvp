import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import logoUrl from '@/assets/logo.png';

export default function MarketLanding() {
  const [location, navigate] = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState(-1);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Extract hash and search from current location
  const [path, search] = location.split('?');
  const hash = path.includes('#') ? '#' + path.split('#')[1] : '';

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

  const goCreate = () => {
    setIsLoading(true);
    const qp = new URLSearchParams(search || '');
    qp.set('from', 'landing_signup');
    try { (window as any).gtag?.('event', 'begin_signup', { source: 'marketing_landing' }); } catch {}
    // Navigate to /auth instead of /login to match the app routing
    navigate(`/auth?${qp.toString()}`);
  };

  const goLogin = () => {
    setIsLoading(true);
    try { (window as any).gtag?.('event', 'login_click', { source: 'marketing_landing' }); } catch {}
    navigate('/auth');
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

  // Rotate testimonials automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

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
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        
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
      <div style={blobA} />
      <div style={blobB} />

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img 
              src={logoUrl} 
              alt="ShoplYnk" 
              style={{ width: 32, height: 32 }}
            />
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.01em' }}>ShoplYnk</div>
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
              <h1 style={{ fontSize: 'clamp(40px, 7vw, 64px)', lineHeight: 1.06, margin: '0 0 14px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                Launch a WhatsApp-ready storefront in minutes
              </h1>
              <p style={{ opacity: .85, fontSize: 18, lineHeight: 1.65, margin: '0 0 18px', fontWeight: 500 }}>
                Add products, share a single link, and start getting orders via WhatsApp.<strong> Free during beta.</strong>
              </p>

              {/* Primary CTA only (demo button removed) */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom: 6 }}>
                <button 
                  onClick={goCreate} 
                  className="btn btnPrimary cta-pulse" 
                  style={{ padding: '16px 28px', fontSize: 16, borderRadius: 16 }} 
                  data-testid="hero-create-store"
                  disabled={isLoading}
                  aria-label="Create your free store - Start your free trial"
                >
                  {isLoading ? <div className="loading-spinner"></div> : 'Create your free store'}
                </button>
              </div>
              
              {/* Urgency messaging */}
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'linear-gradient(90deg, #ff6b6b22, #4ecdc422)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                🔥 Limited Beta Access • <span style={{ color: '#ff6b6b' }}>200+ spots remaining</span>
              </div>

              {/* Sign-in hint for scrollers */}
              <div style={{ marginTop: 6, fontSize: 14, opacity: .75 }}>
                Already have a store?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); goLogin(); }} style={{ color: '#5a6bff', fontWeight: 600 }}>
                  Sign in
                </a>
              </div>

              {/* Enhanced Social proof */}
              <div style={{ marginTop: 10, fontSize: 14, opacity: .7 }}>
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

            {/* Right: live preview mock */}
            <div className="reveal-on-scroll hero-demo">
              <PreviewDevice />
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Social Proof Section */}
      <section className="container reveal-on-scroll" style={{ marginTop: 24 }}>
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
              { name: 'Enterprise', price: '$99', period: '/month', features: ['Everything in Pro', 'Multi-store management', 'API access', 'Dedicated support', 'Custom integrations'], highlight: false, badge: 'Coming Soon' }
            ].map((plan, i) => (
              <div key={plan.name} className="glass card" style={{ 
                padding: 24, 
                position: 'relative',
                border: plan.highlight ? '2px solid #5a6bff' : '1px solid var(--border)',
                transform: plan.highlight ? 'scale(1.05)' : 'scale(1)'
              }}>
                {plan.badge && (
                  <div style={{ 
                    position: 'absolute', 
                    top: -12, 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    background: plan.highlight ? '#5a6bff' : '#666', 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: 12, 
                    fontSize: 12, 
                    fontWeight: 600 
                  }}>
                    {plan.badge}
                  </div>
                )}
                <h4 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{plan.name}</h4>
                <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
                  {plan.price}<span style={{ fontSize: 16, opacity: 0.7 }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                  {plan.features.map((feature, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ color: '#4ade80', marginRight: 8 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={i === 0 ? goCreate : () => {}} 
                  className="btn btnPrimary" 
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: 12, 
                    opacity: i === 0 ? 1 : 0.6,
                    cursor: i === 0 ? 'pointer' : 'not-allowed'
                  }}
                  disabled={i !== 0 || isLoading}
                >
                  {i === 0 ? (isLoading ? <div className="loading-spinner"></div> : 'Start Free') : 'Coming Soon'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced Mid-page CTA */}
        <section className="reveal-on-scroll" style={ctaBand}>
          <div className="mobile-optimized" style={{ width: '100%' }}>
            <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 6, letterSpacing: '-0.015em' }}>
              🚀 Ready to get your first order today?
            </div>
            <div style={{ opacity: .8, marginBottom: 16 }}>Join 200+ sellers already making money with WhatsApp integration</div>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', justifyContent: 'center' }}>
              <button 
                onClick={goCreate} 
                className="btn btnPrimary cta-pulse" 
                style={{ padding: '16px 28px', fontSize: 16, borderRadius: 16 }}
                disabled={isLoading}
              >
                {isLoading ? <div className="loading-spinner"></div> : '🎯 Start Selling Now'}
              </button>
              <button 
                onClick={goLogin} 
                className="btn btnSecondary" 
                style={{ padding: '16px 28px', fontSize: 16, borderRadius: 16 }}
                disabled={isLoading}
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FAQ Section */}
      <section id="faq" className="container reveal-on-scroll" style={{ marginTop: 48 }}>
        <h3 style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, marginBottom: 32, letterSpacing: '-0.01em' }}>
          Frequently Asked Questions
        </h3>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {faqs.map((faq, i) => (
            <div key={i} className="glass card faq-item" style={{ marginBottom: 16, overflow: 'hidden' }}>
              <div
                style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setShowFAQ(showFAQ === i ? -1 : i)}
                role="button"
                tabIndex={0}
                aria-expanded={showFAQ === i}
              >
                <span style={{ fontWeight: 700, fontSize: 16 }}>{faq.q}</span>
                <ChevronDown 
                  size={20} 
                  style={{ 
                    transform: showFAQ === i ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.2s ease',
                    opacity: 0.6
                  }} 
                />
              </div>
              {showFAQ === i && (
                <div style={{ padding: '0 24px 20px', opacity: 0.8, lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container reveal-on-scroll" style={{ marginTop: 48, marginBottom: 48 }}>
        <div className="glass card" style={{ padding: 40, textAlign: 'center' }}>
          <h3 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.015em' }}>
            Ready to start your online business?
          </h3>
          <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 24, maxWidth: 520, margin: '0 auto 24px' }}>
            Join thousands of sellers who are already making money with WhatsApp-integrated storefronts.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button 
              onClick={goCreate} 
              className="btn btnPrimary cta-pulse" 
              style={{ 
                padding: '18px 32px', 
                fontSize: 18, 
                borderRadius: 16,
                marginRight: 'auto',
                marginLeft: 'auto'
              }}
              data-testid="final-cta-create"
              disabled={isLoading}
            >
              {isLoading ? <div className="loading-spinner"></div> : '🎯 Create Your Store Now'}
            </button>
          </div>
          <div style={{ marginTop: 16, fontSize: 14, opacity: 0.6 }}>
            ✨ Free during beta • No credit card required • Set up in 5 minutes
          </div>
        </div>
      </section>

      {/* Enhanced footer with ShoplYnk promotion */}
      <footer className="container" style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="glass card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <img src={logoUrl} alt="ShoplYnk" style={{ width: 24, height: 24 }} />
            <span style={{ fontWeight: 800, fontSize: 18 }}>ShoplYnk</span>
          </div>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>
            Empowering sellers worldwide with simple, WhatsApp-ready storefronts
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 14 }}>
            <a href="#" style={{ opacity: 0.7, fontWeight: 500 }}>Privacy Policy</a>
            <a href="#" style={{ opacity: 0.7, fontWeight: 500 }}>Terms of Service</a>
            <a href="#" style={{ opacity: 0.7, fontWeight: 500 }}>Support</a>
          </div>
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(90,107,255,0.05)', borderRadius: 8, fontSize: 13 }}>
            🌟 Proudly built for entrepreneurs, by entrepreneurs
          </div>
        </div>
      </footer>
    </div>
  );
}

// Background blob styles
const blobA: React.CSSProperties = {
  position: 'absolute',
  top: '10%',
  left: '5%',
  width: '400px',
  height: '400px',
  background: 'linear-gradient(135deg, rgba(90,107,255,0.1) 0%, rgba(103,209,255,0.05) 100%)',
  borderRadius: '50%',
  filter: 'blur(80px)',
  zIndex: 0,
};

const blobB: React.CSSProperties = {
  position: 'absolute',
  top: '60%',
  right: '5%',
  width: '300px',
  height: '300px',
  background: 'linear-gradient(135deg, rgba(103,209,255,0.08) 0%, rgba(90,107,255,0.03) 100%)',
  borderRadius: '50%',
  filter: 'blur(60px)',
  zIndex: 0,
};

const ctaBand: React.CSSProperties = {
  marginTop: 48,
  padding: 32,
  textAlign: 'center',
  background: 'linear-gradient(135deg, rgba(90,107,255,0.05) 0%, rgba(103,209,255,0.03) 100%)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid rgba(90,107,255,0.1)',
};

// Feature Card Component
const FeatureCard = ({ icon, title, body }: { icon: string; title: string; body: string }) => (
  <div className="glass card" style={{ padding: 24 }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
    <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h4>
    <p style={{ opacity: 0.8, lineHeight: 1.5, margin: 0 }}>{body}</p>
  </div>
);

// Preview Device Component (placeholder)
const PreviewDevice = () => (
  <div style={{ 
    background: '#1a1a1a', 
    borderRadius: 24, 
    padding: 8, 
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    transform: 'rotate(-2deg)'
  }}>
    <div style={{ 
      background: '#f8f9fa', 
      borderRadius: 16, 
      padding: 20,
      aspectRatio: '9/16',
      width: 240,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{ background: '#e9ecef', borderRadius: 8, height: 40 }}></div>
      <div style={{ background: '#e9ecef', borderRadius: 8, height: 120 }}></div>
      <div style={{ background: '#e9ecef', borderRadius: 8, height: 80 }}></div>
      <div style={{ background: '#e9ecef', borderRadius: 8, height: 60 }}></div>
    </div>
  </div>
);

// ChevronDown Icon Component
const ChevronDown = ({ size = 24, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="6,9 12,15 18,9"></polyline>
  </svg>
);