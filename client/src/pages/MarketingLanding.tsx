import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

export default function MarketingLanding() {
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
    navigate(`/app`);
  };

  const goLogin = () => {
    setIsLoading(true);
    try { (window as any).gtag?.('event', 'login_click', { source: 'marketing_landing' }); } catch {}
    navigate('/app');
  };

  // Testimonials data
  const testimonials = [
    { name: "Sarah K.", business: "Boutique Owner", quote: "We listed 8 products and got our first 3 WhatsApp orders the same day.", rating: 5 },
    { name: "Marcus T.", business: "Craft Seller", quote: "Setup was incredibly easy. I was selling within 5 minutes!", rating: 5 },
    { name: "Aisha M.", business: "Food Business", quote: "WhatsApp integration changed everything. Direct customer contact boosted our sales 300%.", rating: 5 }
  ];

  // FAQ data
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

  // Background blobs styling
  const blobA = {
    position: 'absolute' as const, top: -50, right: '10%', width: 300, height: 300,
    background: 'linear-gradient(135deg, rgba(90,107,255,.2), rgba(103,209,255,.1))',
    borderRadius: '50%', filter: 'blur(60px)', zIndex: -1
  };

  const blobB = {
    position: 'absolute' as const, bottom: -100, left: '15%', width: 400, height: 400,
    background: 'linear-gradient(225deg, rgba(103,209,255,.15), rgba(90,107,255,.1))',
    borderRadius: '50%', filter: 'blur(80px)', zIndex: -1
  };

  // Preview Device Component
  const PreviewDevice = () => (
    <div style={{ 
      maxWidth: 280, 
      margin: '0 auto',
      background: '#000',
      borderRadius: 24,
      padding: 4,
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        aspectRatio: '9/16'
      }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          MyStore
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ 
                background: '#f5f5f5', 
                borderRadius: 8, 
                aspectRatio: '1', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 12,
                color: '#666'
              }}>
                Product {i}
              </div>
            ))}
          </div>
          <div style={{ 
            background: '#25D366', 
            color: 'white', 
            padding: 12, 
            borderRadius: 8, 
            textAlign: 'center', 
            fontWeight: 'bold',
            fontSize: 14
          }}>
            💬 Contact via WhatsApp
          </div>
        </div>
      </div>
    </div>
  );

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

        .btnNav {
          height: 52px;
          padding: 0 24px;
          font-size: 16px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          box-sizing: border-box;
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
            <div style={{ 
              width: 32, 
              height: 32, 
              background: 'linear-gradient(135deg, #5a6bff, #67d1ff)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: 16
            }}>
              S
            </div>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.01em' }}>ShopLink</div>
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

              {/* Primary CTA only */}
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

              {/* Sign-in hint */}
              <div style={{ marginTop: 6, fontSize: 14, opacity: .75 }}>
                Already have a store?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); goLogin(); }} style={{ color: '#5a6bff', fontWeight: 600 }}>
                  Sign in
                </a>
              </div>

              {/* Social proof */}
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

      {/* Features */}
      <main className="container" style={{ position:'relative', zIndex:2 }}>
        <section className="reveal-on-scroll" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:24, marginTop: 28 }}>
          {[
            ['⚡', 'WhatsApp-ready', 'One-tap contact from every product page'],
            ['🎨', 'Beautiful storefront', 'Professional design that converts'],
            ['📱', 'Mobile-first', 'Perfect experience on any device'],
            ['📊', 'Sales analytics', 'Track performance in real-time'],
            ['🔒', 'Secure & reliable', 'Your data is safe with us'],
            ['🚀', '5-min setup', 'Go from zero to selling today']
          ].map(([icon, title, desc], i) => (
            <div key={i} className="glass card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{title}</h3>
              <p style={{ fontSize: 14, opacity: .75, margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </section>

        {/* Testimonials */}
        <section className="reveal-on-scroll" style={{ marginTop: 32 }}>
          <div className="glass card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', margin: '0 0 24px' }}>
              Join thousands of successful sellers
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {testimonials.map((testimonial, i) => (
                <div 
                  key={i} 
                  className={`testimonial-card ${i === activeTestimonial ? 'active' : ''}`}
                  style={{ 
                    opacity: i === activeTestimonial ? 1 : 0.5,
                    textAlign: 'center',
                    maxWidth: 600,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <p style={{ fontSize: 18, fontStyle: 'italic', margin: '0 0 12px', lineHeight: 1.6 }}>
                    "{testimonial.quote}"
                  </p>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {testimonial.name} • {testimonial.business}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {'⭐'.repeat(testimonial.rating)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="reveal-on-scroll" style={{ marginTop: 32 }}>
          <div className="glass card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', margin: '0 0 24px' }}>
              Frequently Asked Questions
            </h2>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              {faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className="faq-item"
                  style={{ 
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowFAQ(showFAQ === i ? -1 : i)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{faq.q}</h3>
                    <span style={{ fontSize: 20, fontWeight: 'bold' }}>
                      {showFAQ === i ? '−' : '+'}
                    </span>
                  </div>
                  {showFAQ === i && (
                    <p style={{ 
                      marginTop: 12, 
                      marginBottom: 0, 
                      opacity: 0.8, 
                      lineHeight: 1.6,
                      fontSize: 14
                    }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="reveal-on-scroll" style={{ marginTop: 32, marginBottom: 32 }}>
          <div className="glass card" style={{ padding: 40, textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 16px' }}>
              Ready to start selling?
            </h2>
            <p style={{ fontSize: 18, opacity: .8, margin: '0 0 24px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              Join the ShopLink community today and transform your business with WhatsApp commerce.
            </p>
            <button 
              onClick={goCreate} 
              className="btn btnPrimary cta-pulse" 
              style={{ padding: '18px 36px', fontSize: 18, borderRadius: 16 }} 
              data-testid="final-cta-create-store"
              disabled={isLoading}
            >
              {isLoading ? <div className="loading-spinner"></div> : 'Start your free store'}
            </button>
            <div style={{ marginTop: 12, fontSize: 14, opacity: .6 }}>
              No credit card required • Free during beta
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}