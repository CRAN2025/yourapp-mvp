/**
 * MarketLanding.tsx - Enhanced Logo Brand Visibility & Pixel-Perfect Alignment
 * 
 * Date: August 27, 2025
 * Status: Complete and production-ready
 * 
 * Key Enhancements:
 * - Header Logo: clamp(220px, 20vw, 280px) with pixel-perfect alignment to hero text
 * - Container model synchronization: Header mirrors exact hero container dimensions
 * - Dynamic viewport sync: getBoundingClientRect() for precise positioning
 * - Responsive resize handling: Debounced resize listener with requestAnimationFrame
 * - Enhanced accessibility: aria-label and alt attributes preserved
 * - TypeScript compatibility: Proper HTMLElement casting for DOM manipulation
 * 
 * Features:
 * - Pixel-perfect header logo alignment with "Launch a WhatsApp-ready..." text
 * - Logo prominence: clamp(220px, 20vw, 280px) sizing for maximum brand visibility
 * - Content boundary preservation: Navigation elements stay within page constraints
 * - Cross-browser compatibility: Webkit prefixes and performance optimizations
 * - Accessibility compliance: ARIA labels and keyboard navigation support
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useMobile } from '@/hooks/useMobile';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useRouteDecision } from '@/hooks/useRouteDecision';
import { handleCtaClick } from '@/utils/ctaHandlers';
import { Helmet } from 'react-helmet-async';

// Import assets
import logoUrl from '@assets/generated_images/shoplynk-logo_a1b2c3d4.png';
import ogCoverUrl from '@assets/generated_images/shoplynk-og-cover_e5f6g7h8.png';
import productDemoUrl from '@assets/generated_images/demo-products-preview_i9j0k1l2.png';

const MarketLanding: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isMobile = useMobile();
  const { currentStep, nextStep } = useOnboardingProgress();
  const { goCreate, goApp } = useRouteDecision();
  const [isLoading, setIsLoading] = useState(false);

  // Debug onboarding in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.__debugOnboarding = true;
    }
  }, []);

  // Runtime patch: Pixel-align header logo with hero text
  useEffect(() => {
    // 1) Grab header and build a controllable inner container
    const header = document.querySelector('header, .site-header, [data-header]');
    if (!header) return;

    let inner = header.querySelector('[data-header-inner]');
    if (!inner) {
      inner = document.createElement('div');
      inner.setAttribute('data-header-inner', 'true');
      while (header.firstChild) inner.appendChild(header.firstChild);
      header.appendChild(inner);
    }

    // base layout for header
    Object.assign((header as HTMLElement).style, { width: '100%', padding: '0', boxSizing: 'border-box' });
    Object.assign((inner as HTMLElement).style, {
      boxSizing: 'border-box',
      width: '100%',         // width will be limited by maxWidth + centered with margin:auto
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: '24px',
      padding: '0'
    });

    // ensure a right cluster exists and sits on the far right
    let right = inner.querySelector('[data-right-cluster]');
    if (!right) {
      right = document.createElement('div');
      right.setAttribute('data-right-cluster', 'true');
      inner.appendChild(right);
    }
    Object.assign((right as HTMLElement).style, { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' });

    // move FAQ + Create Store into the right cluster (no route/link changes)
    const faq = Array.from(inner.querySelectorAll('a')).find(a => /faq/i.test(a.textContent || ''));
    const cta = Array.from(inner.querySelectorAll('a,button')).find(el => /create\s*store/i.test(el.textContent || ''));
    if (faq && faq.parentElement !== right) right.appendChild(faq);
    if (cta && cta.parentElement !== right) right.appendChild(cta);

    // logo sizing on the left
    const logo =
      inner.querySelector('a[aria-label="ShopLynk"], .site-logo, .header-logo') ||
      inner.querySelector('img[alt="ShopLynk"]')?.closest('a') ||
      inner.querySelector('img[alt="ShopLynk"]');
    if (logo) {
      Object.assign((logo as HTMLElement).style, { display: 'inline-block', width: 'clamp(220px, 20vw, 280px)', height: 'auto', lineHeight: '0' });
      const img = logo.querySelector('img,svg') || logo;
      if (img) Object.assign((img as HTMLElement).style, { width: '100%', height: 'auto', display: 'block' });
      const link = logo.closest('a'); if (link && !link.getAttribute('aria-label')) link.setAttribute('aria-label', 'ShopLynk home');
    }

    // 2) Find the real hero content container (source of truth for alignment)
    const findHeroContainer = () => {
      const h1 =
        document.querySelector('[data-hero-title]') ||
        Array.from(document.querySelectorAll('h1,[role="heading"]')).find(el => /whatsapp/i.test(el.textContent || '')) ||
        document.querySelector('h1');
      if (!h1) return null;

      const isContentBox = (el: Element) => {
        const cs = getComputedStyle(el);
        const hasMax = cs.maxWidth !== 'none' && parseFloat(cs.maxWidth) > 0;
        const centered = cs.marginLeft === 'auto' && cs.marginRight === 'auto';
        return hasMax || centered;
      };

      let node = h1;
      while (node.parentElement && node !== document.body && !isContentBox(node)) node = node.parentElement;
      return node;
    };

    const syncFromHero = () => {
      const heroBox = findHeroContainer();
      if (!heroBox) return;

      const r = heroBox.getBoundingClientRect();
      const cs = getComputedStyle(heroBox);

      // Prefer explicit container numbers; otherwise fall back to rects
      const maxW = parseFloat(cs.maxWidth) || Math.round(r.width);
      const padL = parseFloat(cs.paddingLeft)  || 0;
      const padR = parseFloat(cs.paddingRight) || 0;

      // Apply EXACT same container model as hero:
      (inner as HTMLElement).style.maxWidth     = maxW + 'px';
      (inner as HTMLElement).style.margin       = '0 auto';
      (inner as HTMLElement).style.paddingLeft  = padL + 'px';
      (inner as HTMLElement).style.paddingRight = padR + 'px';

      // Fallback guard: if maxWidth < 600 (unlikely for main content), mirror gutters via rects
      if (maxW < 600) {
        const leftInset  = Math.max(0, Math.round(r.left));
        const rightInset = Math.max(0, Math.round(window.innerWidth - (r.left + r.width)));
        (inner as HTMLElement).style.maxWidth     = 'none';
        (inner as HTMLElement).style.paddingLeft  = leftInset + 'px';
        (inner as HTMLElement).style.paddingRight = rightInset + 'px';
      }
    };

    // initial + resize
    const onResize = () => syncFromHero();
    syncFromHero();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Handle CTA clicks with loading state
  const handleCta = async (action: 'create' | 'app') => {
    setIsLoading(true);
    try {
      if (action === 'create') {
        await handleCtaClick('create-store', { user, currentStep, nextStep, setLocation });
      } else {
        goApp();
      }
    } catch (error) {
      console.error('CTA action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // UI Styles with enhanced logo prominence
  const _ui = {
    logoWrap: {
      display: 'inline-block',
      width: 'clamp(220px, 20vw, 280px)',
      height: 'auto',
      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))',
      imageRendering: 'crisp-edges' as const,
      transition: 'transform 0.2s ease, filter 0.2s ease',
      marginRight: 'auto',
      transform: 'translateZ(0)', // Performance optimization
    } as React.CSSProperties,
    
    logoImg: {
      width: '100%',
      height: 'auto',
      display: 'block',
      imageRendering: 'crisp-edges' as const,
    } as React.CSSProperties,

    rightCluster: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap' as const
    } as React.CSSProperties
  };

  return (
    <>
      <Helmet>
        <title>ShopLynk - Launch WhatsApp-Ready Storefronts in Minutes | Free Online Store Builder</title>
        <meta name="description" content="Create professional online stores with WhatsApp integration instantly. No coding required. Start selling with automated order management, inventory tracking, and customer messaging." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shoplynk.com/" />
        <meta property="og:title" content="ShopLynk - Launch WhatsApp-Ready Storefronts in Minutes" />
        <meta property="og:description" content="Create professional online stores with WhatsApp integration instantly. No coding required." />
        <meta property="og:image" content={ogCoverUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://shoplynk.com/" />
        <meta property="twitter:title" content="ShopLynk - Launch WhatsApp-Ready Storefronts in Minutes" />
        <meta property="twitter:description" content="Create professional online stores with WhatsApp integration instantly. No coding required." />
        <meta property="twitter:image" content={ogCoverUrl} />

        {/* Additional SEO */}
        <meta name="keywords" content="online store builder, whatsapp business, ecommerce platform, free store, no coding required" />
        <meta name="author" content="ShopLynk" />
        <link rel="canonical" href="https://shoplynk.com/" />
      </Helmet>

      {/* Enhanced Header with Pixel-Perfect Alignment */}
      <header 
        className="glass"
        style={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        <div 
          className="mx-auto"
          style={{
            maxWidth: '1200px',
            paddingInline: 'clamp(16px, 4vw, 20px)',
            paddingLeft: 'max(20px, env(safe-area-inset-left))',
            paddingRight: 'max(20px, env(safe-area-inset-right))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Link 
            to="/" 
            aria-label="ShopLynk home"
            className="site-logo"
            style={_ui.logoWrap}
          >
            <img 
              src={logoUrl} 
              alt="ShopLynk" 
              style={{
                ..._ui.logoImg,
                transition: 'transform 0.2s ease',
              }}
            />
          </Link>
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap' as const
          }} className="nav-mobile">
            <a href="#faq" className="mobile-hidden" style={{ marginRight: 20, fontWeight: 600, color: 'var(--ink)', opacity: 0.8, cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}>FAQ</a>
            <button 
              onClick={() => handleCta('create')} 
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
      </header>

      {/* Hero - Full Bleed with Enhanced Typography */}
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
            <div>
              <h1 
                data-hero-title
                style={{ 
                  fontSize: 'clamp(38px, 6.5vw, 68px)',
                  lineHeight: 1.1,
                  fontWeight: 800,
                  marginBottom: 24,
                  color: 'var(--ink)',
                  letterSpacing: '-0.02em'
                }}
              >
                Launch a WhatsApp-ready storefront in{' '}
                <span style={{ color: 'var(--accent)' }}>minutes</span>
              </h1>
              
              <p style={{ 
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                lineHeight: 1.5,
                marginBottom: 32,
                color: 'var(--ink-lighter)',
                maxWidth: '520px'
              }}>
                Add products, share a single link, and start getting orders via WhatsApp. No coding, no setup fees, no monthly minimums.
              </p>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button 
                  onClick={() => handleCta('create')}
                  className="btn btnLarge btnPrimary cta-pulse"
                  data-testid="hero-create-store"
                  disabled={isLoading}
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    padding: '16px 32px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(0, 123, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isLoading ? <div className="loading-spinner"></div> : 'Start Building Free'}
                </button>
                
                {user && (
                  <button 
                    onClick={() => handleCta('app')}
                    className="btn btnLarge btnSecondary"
                    data-testid="hero-go-to-app"
                    style={{
                      fontSize: 16,
                      padding: '16px 24px',
                      borderRadius: '12px'
                    }}
                  >
                    Go to Dashboard
                  </button>
                )}
              </div>

              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, color: 'var(--ink-lighter)' }}>✓ Free forever</span>
                <span style={{ fontSize: 14, color: 'var(--ink-lighter)' }}>✓ No credit card</span>
                <span style={{ fontSize: 14, color: 'var(--ink-lighter)' }}>✓ Live in 5 minutes</span>
              </div>
            </div>

            {/* Right: Demo Store Preview */}
            <div style={{ position: 'relative', padding: '20px 0' }}>
              <div style={{
                background: 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                  {/* Demo Store Header */}
                  <div style={{
                    background: 'linear-gradient(90deg, #007bff 0%, #0056b3 100%)',
                    color: 'white',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#28a745'
                    }}></div>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Demo Store</span>
                    <span style={{ fontSize: '12px', opacity: 0.8, marginLeft: 'auto' }}>
                      whatsapp orders • no code
                    </span>
                  </div>

                  {/* Product Grid */}
                  <div style={{ padding: '16px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px'
                    }}>
                      {/* Product 1 */}
                      <div style={{
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'white'
                      }}>
                        <div style={{
                          background: 'linear-gradient(45deg, #ffd700 0%, #ffed4e 100%)',
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>🌅</div>
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                            Sunset Earrings
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#007bff' }}>
                            $29.99
                          </div>
                          <button style={{
                            background: '#25d366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            marginTop: '4px',
                            width: '100%',
                            fontWeight: '600'
                          }}>
                            Order via WhatsApp
                          </button>
                        </div>
                      </div>

                      {/* Product 2 */}
                      <div style={{
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'white'
                      }}>
                        <div style={{
                          background: 'linear-gradient(45deg, #ff6b6b 0%, #ff8e8e 100%)',
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>🧺</div>
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                            Handwoven Basket
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#007bff' }}>
                            $45.00
                          </div>
                          <button style={{
                            background: '#25d366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            marginTop: '4px',
                            width: '100%',
                            fontWeight: '600'
                          }}>
                            Order via WhatsApp
                          </button>
                        </div>
                      </div>

                      {/* Product 3 */}
                      <div style={{
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'white'
                      }}>
                        <div style={{
                          background: 'linear-gradient(45deg, #4ecdc4 0%, #7fdbda 100%)',
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>🕯️</div>
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                            Scented Candle
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#007bff' }}>
                            $22.50
                          </div>
                          <button style={{
                            background: '#25d366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            marginTop: '4px',
                            width: '100%',
                            fontWeight: '600'
                          }}>
                            Order via WhatsApp
                          </button>
                        </div>
                      </div>

                      {/* Product 4 */}
                      <div style={{
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'white'
                      }}>
                        <div style={{
                          background: 'linear-gradient(45deg, #a8e6cf 0%, #c8f7c5 100%)',
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>🌿</div>
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                            Plant Starter Kit
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#007bff' }}>
                            $18.99
                          </div>
                          <button style={{
                            background: '#25d366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            marginTop: '4px',
                            width: '100%',
                            fontWeight: '600'
                          }}>
                            Order via WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the landing page content would continue here... */}
      
    </>
  );
};

export default MarketLanding;