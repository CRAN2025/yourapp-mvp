// src/MarketLanding.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MarketLanding() {
  const navigate = useNavigate();
  const { hash, search } = useLocation();

  // Smooth-scroll when arriving with /#signup
  useEffect(() => {
    if (hash === '#signup') {
      const el = document.getElementById('signup');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hash]);

  const goCreate = () => {
    // Preserve attribution (utm_*, seller, etc.) when sending to /login
    const qp = new URLSearchParams(search);
    qp.set('from', 'landing');
    try { window.gtag?.('event', 'begin_signup', { source: 'marketing_landing' }); } catch {}
    navigate(`/login?${qp.toString()}`);
  };

  const seeDemo = () => {
    try { window.gtag?.('event', 'view_demo', { source: 'marketing_landing' }); } catch {}
    navigate('/store/demo-seller-id');
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#eef2ff 0%,#e0f2fe 50%,#e6fffb 100%)' }}>
      {/* Decorative background blobs */}
      <div style={blobA} />
      <div style={blobB} />
      <style>{`
        @keyframes float { 0%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } 100%{ transform: translateY(0) } }
        @keyframes fadeInUp { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }
      `}</style>

      {/* Nav */}
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '20px', position:'relative', zIndex:2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize: 20 }}>🛍️</div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>ShopLink</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/pricing')} style={btnGhost}>Pricing</button>
            <button onClick={() => navigate('/examples')} style={btnGhost}>Examples</button>
            <button onClick={goCreate} style={btnPrimary}>Create your free store</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1100, margin: '40px auto', padding: '0 20px', position:'relative', zIndex:2 }}>
        {/* Hero = #signup anchor */}
        <section id="signup" style={hero}>
          <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: '0 0 12px', fontWeight: 900 }}>
            Launch a WhatsApp-ready storefront in minutes
          </h1>
          <p style={{ opacity: .8, fontSize: 18, margin: '0 0 18px' }}>
            Add products, share a single link, and start getting orders via WhatsApp. <strong>Free during beta.</strong>
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <button onClick={goCreate} style={btnPrimaryXL}>Create your free store</button>
            <button onClick={seeDemo} style={btnSecondaryXL}>See a live demo</button>
          </div>

          {/* Trust badges */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:6 }}>
            <Badge>⭐ 4.8/5 from early sellers</Badge>
            <Badge>🧰 No code required</Badge>
            <Badge>🔒 Backed by Firebase</Badge>
            <Badge>⏱️ Set up in ~5 minutes</Badge>
          </div>
        </section>

        {/* Feature cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 28 }}>
          {[
            ['⚡', 'WhatsApp-native', 'One-tap contact from every product'],
            ['🧰', 'No code', 'Just add products and share your link'],
            ['📈', 'Simple analytics', 'Views, contacts, orders at a glance'],
            ['🌐', 'Custom domain', 'Upgrade when you’re ready'],
          ].map(([emoji, title, body]) => (
            <Card key={title} icon={emoji} title={title} body={body} />
          ))}
        </section>

        {/* How it works */}
        <section style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px' }}>How it works</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 }}>
            <Step n="1" title="Create your account" body="Log in and finish a short onboarding." />
            <Step n="2" title="Add a few products" body="Name, price, image, and your delivery/payment options." />
            <Step n="3" title="Share your store link" body="Customers message you on WhatsApp to order." />
          </div>
        </section>

        {/* Bottom CTA band */}
        <section style={ctaBand}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Ready to get your first order today?</div>
            <div style={{ opacity: .8 }}>Create your WhatsApp-ready storefront now. Free during beta.</div>
          </div>
          <button onClick={goCreate} style={btnPrimaryXL}>Create your free store</button>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ maxWidth: 1100, margin: '40px auto', padding: '20px', textAlign: 'center', opacity: .6, position:'relative', zIndex:2 }}>
        © {new Date().getFullYear()} ShopLink • <a href="/terms">Terms</a> • <a href="/privacy">Privacy</a>
      </footer>
    </div>
  );
}

/* ——— tiny presentational helpers ——— */
function Badge({ children }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      background:'rgba(0,0,0,.06)', padding:'8px 12px', borderRadius:999,
      fontWeight:700, fontSize:13, animation:'float 6s ease-in-out infinite'
    }}>{children}</span>
  );
}

function Card({ icon, title, body }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontWeight: 800, marginTop: 8 }}>{title}</div>
      <div style={{ opacity: .8, marginTop: 6 }}>{body}</div>
    </div>
  );
}

function Step({ n, title, body }) {
  return (
    <div style={card}>
      <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:999, background:'#eef1ff', fontWeight:900 }}>{n}</div>
      <div style={{ fontWeight: 800, marginTop: 8 }}>{title}</div>
      <div style={{ opacity: .8, marginTop: 6 }}>{body}</div>
    </div>
  );
}

/* ——— styles ——— */
const hero = {
  background: 'rgba(255,255,255,.92)',
  borderRadius: 20,
  padding: 32,
  boxShadow: '0 10px 30px rgba(0,0,0,.06)',
  animation: 'fadeInUp .5s ease-out'
};
const card = {
  background: 'rgba(255,255,255,.9)',
  borderRadius: 16,
  padding: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,.05)',
  animation: 'fadeInUp .5s ease-out'
};
const ctaBand = {
  marginTop: 28,
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'rgba(255,255,255,.9)',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 8px 24px rgba(0,0,0,.05)',
  flexWrap: 'wrap'
};
const btnBase = { border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 800 };
const btnGhost = { ...btnBase, background: 'transparent', padding: '10px 14px' };
const btnPrimary = { ...btnBase, background: 'linear-gradient(135deg,#5a6bff,#67d1ff)', color: '#fff', padding: '10px 14px', boxShadow:'0 6px 20px rgba(90,107,255,.25)' };
const btnPrimaryXL = { ...btnPrimary, padding: '14px 24px', fontSize: 16 };
const btnSecondaryXL = { ...btnBase, background: 'rgba(0,0,0,.06)', padding: '14px 24px' };

const blobA = {
  position:'absolute', top:-120, left:-120, width:360, height:360, borderRadius:'50%',
  background:'radial-gradient(closest-side, rgba(90,107,255,.25), transparent)', filter:'blur(6px)', zIndex:1
};
const blobB = {
  position:'absolute', bottom:-140, right:-140, width:420, height:420, borderRadius:'50%',
  background:'radial-gradient(closest-side, rgba(103,209,255,.25), transparent)', filter:'blur(8px)', zIndex:1
};
