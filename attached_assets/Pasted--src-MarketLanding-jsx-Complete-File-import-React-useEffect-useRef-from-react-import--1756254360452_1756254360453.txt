// src/MarketLanding.jsx - Complete File
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MarketLanding() {
  const navigate = useNavigate();
  const { hash, search } = useLocation();
  const rootRef = useRef(null);

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
    const els = root.querySelectorAll('.reveal-on-scroll');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible')),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const goCreate = () => {
    const qp = new URLSearchParams(search);
    qp.set('from', 'landing_signup');
    try { window.gtag?.('event', 'begin_signup', { source: 'marketing_landing' }); } catch {}
    // keep the "from" context when navigating to login
    navigate(`/login?${qp.toString()}`);
  };

  const goLogin = () => {
    try { window.gtag?.('event', 'login_click', { source: 'marketing_landing' }); } catch {}
    navigate('/login');
  };

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
      `}</style>

      {/* Background accents */}
      <div style={blobA} />
      <div style={blobB} />

      {/* Nav */}
      <header className="container" style={{ padding: '20px 20px', position:'relative', zIndex:2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize: 20 }}>🛍️</div>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.01em' }}>ShopLink</div>
          </div>
          <nav style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button onClick={goCreate} className="btn btnNav btnPrimary">Create your free store</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="signup" className="container reveal-on-scroll is-visible" style={{ marginTop: 28 }}>
        <div className="glass heroGlass" style={{ padding: 28 }}>
          <div style={{ display:'grid', gridTemplateColumns: '1.05fr .95fr', gap: 28, alignItems:'center' }}>
            {/* Left copy */}
            <div>
              <h1 style={{ fontSize: 'clamp(40px, 7vw, 64px)', lineHeight: 1.06, margin: '0 0 14px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                Launch a WhatsApp-ready storefront in minutes
              </h1>
              <p style={{ opacity: .85, fontSize: 18, lineHeight: 1.65, margin: '0 0 18px', fontWeight: 500 }}>
                Add products, share a single link, and start getting orders via WhatsApp.<strong> Free during beta.</strong>
              </p>

              {/* Primary CTA only (demo button removed) */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom: 6 }}>
                <button onClick={goCreate} className="btn btnPrimary" style={{ padding: '16px 28px', fontSize: 16, borderRadius: 16 }}>
                  Create your free store
                </button>
              </div>

              {/* Sign-in hint for scrollers */}
              <div style={{ marginTop: 6, fontSize: 14, opacity: .75 }}>
                Already have a store?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); goLogin(); }} style={{ color: '#5a6bff', fontWeight: 600 }}>
                  Sign in
                </a>
              </div>

              {/* Social proof */}
              <div style={{ marginTop: 10, fontSize: 14, opacity: .7 }}>
                Trusted by 200+ sellers across 8 countries
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
            <div className="reveal-on-scroll">
              <PreviewDevice />
            </div>
          </div>
        </div>
      </section>

      {/* Logo strip */}
      <section className="container reveal-on-scroll" style={{ marginTop: 24 }}>
        <div className="glass card" style={{ padding: 14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            {Array.from({ length: 7 }).map((_, i) => (<div key={i} className="logoDot" />))}
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

        {/* Testimonial / proof */}
        <section className="reveal-on-scroll" style={{ marginTop: 32 }}>
          <div className="glass card" style={{ padding: 22, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ width:46, height:46, borderRadius:999, background:'#e8f1ff', display:'grid', placeItems:'center', fontWeight:800 }}>RA</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight:700, marginBottom:4 }}>"We listed 8 products and got our first 3 WhatsApp orders the same day."</div>
              <div style={{ opacity:.7, fontSize:14 }}>Boutique Owner</div>
            </div>
            <button onClick={goCreate} className="btn btnPrimary" style={{ padding: '12px 18px', borderRadius: 16 }}>Start free</button>
          </div>
        </section>

        {/* Mid-page CTA */}
        <section className="reveal-on-scroll" style={ctaBand}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 6, letterSpacing: '-0.015em' }}>
              Ready to get your first order today?
            </div>
            <div style={{ opacity: .8 }}>Create your WhatsApp-ready storefront now. Free during beta.</div>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={goCreate} className="btn btnPrimary" style={{ padding: '16px 28px', fontSize: 16, borderRadius: 16 }}>
              Create your free store
            </button>
            <button onClick={goLogin} className="btn btnSecondary" style={{ padding: '16px 28px', fontSize: 16, borderRadius: 16 }}>
              Sign in
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container" style={{ margin: '40px auto', padding: '20px', textAlign: 'center', opacity: .65, position:'relative', zIndex:2 }}>
        © {new Date().getFullYear()} ShopLink • <a href="/terms">Terms</a> • <a href="/privacy">Privacy</a>
      </footer>
    </div>
  );
}

/* ——— Subcomponents ——— */
function FeatureCard({ icon, title, body }) {
  return (
    <div
      className="glass card reveal-on-scroll"
      style={{ padding: 20, transition: 'transform .15s ease, box-shadow .2s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-strong)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontWeight: 800, marginTop: 8, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ opacity: .8, marginTop: 6 }}>{body}</div>
    </div>
  );
}

function PreviewDevice() {
  return (
    <div className="glass heroGlass" style={{ padding: 16, boxShadow: 'var(--shadow-strong)' }}>
      <div style={{ height: 18, display:'flex', gap:6, marginBottom: 12 }}>
        <div style={winDot('#ff5f57')} />
        <div style={winDot('#ffbd2e')} />
        <div style={winDot('#28c840')} />
      </div>
      <div className="glass card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, letterSpacing:'-0.01em' }}>Demo Store</div>
        <div style={{ fontSize: 12, opacity:.7 }}>whatsapp orders • no code</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[
          ['Sunset Earrings', 'GHS 120'],
          ['Handwoven Basket', 'GHS 240'],
          ['Shea Body Butter', 'GHS 85'],
          ['Tie-Dye Tee', 'GHS 150'],
        ].map(([name, price], i) => (
          <div key={i} className="glass card" style={{ padding: 10 }}>
            <div style={{ height: 92, borderRadius: 12, background: 'linear-gradient(135deg,#e7ecff,#f6f9ff)' }} />
            <div style={{ fontWeight: 700, marginTop: 8, letterSpacing:'-0.01em' }}>{name}</div>
            <div style={{ opacity:.75, fontSize: 13 }}>{price}</div>
            <button className="btn btnPrimary" style={{ width:'100%', marginTop: 8, borderRadius: 16 }}>Contact on WhatsApp</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ——— styles (JS objects) ——— */
const ctaBand = {
  marginTop: 36,
  display: 'flex',
  gap: 20,
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'var(--surface-strong)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-card)',
  padding: 24,
  boxShadow: 'var(--shadow)',
  flexWrap: 'wrap',
  backdropFilter: 'saturate(160%) blur(10px)',
  WebkitBackdropFilter: 'saturate(160%) blur(10px)',
};

const winDot = (bg) => ({ width: 12, height: 12, borderRadius: 12, background: bg, border: '1px solid rgba(0,0,0,.08)' });

const blobA = {
  position:'absolute', top:-160, left:-140, width:420, height:420, borderRadius:'50%',
  background:'radial-gradient(closest-side, rgba(90,107,255,.22), transparent)',
  filter:'blur(6px)', zIndex:1
};
const blobB = {
  position:'absolute', bottom:-200, right:-160, width:520, height:520, borderRadius:'50%',
  background:'radial-gradient(closest-side, rgba(103,209,255,.22), transparent)',
  filter:'blur(10px)', zIndex:1
};