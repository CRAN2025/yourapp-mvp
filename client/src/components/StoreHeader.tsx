type Socials = {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
};

type Props = {
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  paymentCount?: number;
  deliveryCount?: number;
  onBack: () => void;
  socials?: Socials;
};

export default function StoreHeader({
  name,
  logoUrl,
  description,
  paymentCount = 0,
  deliveryCount = 0,
  onBack,
  socials = {}
}: Props) {
  const hasAnySocial = Boolean(
    socials.instagram || socials.tiktok || socials.facebook
  );

  // Generate initials from store name
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="sl-store-header" aria-label="Store header">
      <style>{`
        .sl-store-header {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04);
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          padding: 0;
        }
        
        .sl-store-header__inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 48px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 48px;
          position: relative;
        }
        
        .sl-store-header__brand {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }
        
        .sl-store-header__logo {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 24px;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.15);
        }
        
        .sl-store-header__logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }
        
        .sl-store-header__left {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }
        
        .sl-store-header__title {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 32px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0;
          color: #0F172A;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #0F172A 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .sl-store-header__powered {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .sl-store-header__powered::before {
          content: '';
          width: 4px;
          height: 4px;
          background: #94A3B8;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .sl-store-header__powered a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s ease;
          font-weight: 600;
        }
        
        .sl-store-header__powered a:hover {
          color: #1D4ED8;
        }
        
        .sl-store-header__desc {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 17px;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 20px 0;
          max-width: 65ch;
          font-weight: 400;
          letter-spacing: -0.01em;
        }
        
        .sl-store-header__socials {
          display: inline-flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .sl-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          color: #64748B;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          text-decoration: none;
          backdrop-filter: blur(8px);
        }
        
        .sl-social:hover {
          color: #1D4ED8;
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(29, 78, 216, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        }
        
        .sl-social:focus-visible {
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.2);
          transform: translateY(-2px);
        }
        
        .sl-store-header__right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
          flex-shrink: 0;
        }
        
        .sl-store-header__trust {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        
        .sl-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.7);
          border-radius: 12px;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          backdrop-filter: blur(12px);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        
        .sl-chip:hover {
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(29, 78, 216, 0.15);
          color: #1F2937;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
        }
        
        .sl-chip__icon {
          flex-shrink: 0;
          color: #1D4ED8;
          transition: transform 0.2s ease;
        }
        
        .sl-chip:hover .sl-chip__icon {
          transform: scale(1.05);
        }
        
        .sl-chip__text {
          white-space: nowrap;
        }
        
        .sl-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 24px;
          height: 48px;
          background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(29, 78, 216, 0.2), 0 1px 3px rgba(29, 78, 216, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .sl-cta::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
          transition: left 0.6s ease;
        }
        
        .sl-cta:hover::before {
          left: 100%;
        }
        
        .sl-cta:hover {
          background: linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(29, 78, 216, 0.3), 0 2px 8px rgba(29, 78, 216, 0.15);
        }
        
        .sl-cta__icon {
          flex-shrink: 0;
          transition: transform 0.2s ease;
          z-index: 1;
          position: relative;
        }
        
        .sl-cta:hover .sl-cta__icon {
          transform: translateX(-3px);
        }
        
        .sl-cta span:last-child {
          z-index: 1;
          position: relative;
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
          .sl-store-header__inner {
            padding: 36px 40px;
            gap: 40px;
          }
          
          .sl-store-header__title {
            font-size: 28px;
          }
        }
        
        @media (max-width: 1024px) {
          .sl-store-header__inner {
            padding: 32px 32px;
            gap: 32px;
          }
          
          .sl-store-header__title {
            font-size: 26px;
          }
          
          .sl-store-header__desc {
            font-size: 16px;
          }
        }
        
        @media (max-width: 768px) {
          .sl-store-header {
            padding: 0;
          }
          
          .sl-store-header__inner {
            flex-direction: column;
            align-items: stretch;
            gap: 28px;
            padding: 28px 24px;
          }
          
          .sl-store-header__left {
            text-align: center;
            gap: 16px;
          }
          
          .sl-store-header__brand {
            justify-content: center;
          }
          
          .sl-store-header__title {
            font-size: 24px;
          }
          
          .sl-store-header__desc {
            font-size: 15px;
            max-width: 55ch;
            margin: 0 auto 20px auto;
          }
          
          .sl-store-header__right {
            align-items: center;
            flex-direction: column;
            gap: 16px;
          }
          
          .sl-store-header__trust {
            justify-content: center;
            gap: 8px;
          }
          
          .sl-chip {
            padding: 12px 16px;
            font-size: 13px;
          }
          
          .sl-social {
            width: 36px;
            height: 36px;
            border-radius: 8px;
          }
          
          .sl-cta {
            width: 100%;
            justify-content: center;
            max-width: 280px;
            padding: 16px 24px;
            height: 52px;
            font-size: 15px;
          }
          
          .sl-store-header__socials {
            justify-content: center;
          }
        }
        
        @media (max-width: 480px) {
          .sl-store-header__inner {
            padding: 24px 20px;
            gap: 24px;
          }
          
          .sl-store-header__logo {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }
          
          .sl-store-header__title {
            font-size: 22px;
          }
          
          .sl-store-header__desc {
            font-size: 14px;
            max-width: 50ch;
          }
          
          .sl-store-header__trust {
            flex-direction: column;
            width: 100%;
            gap: 8px;
          }
          
          .sl-chip {
            width: 100%;
            justify-content: center;
            padding: 14px 16px;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .sl-store-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            border-bottom-color: rgba(51, 65, 85, 0.6);
          }
          
          .sl-store-header__title {
            color: #F8FAFC;
            background: linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .sl-store-header__desc {
            color: #94A3B8;
          }
          
          .sl-store-header__powered {
            color: #64748B;
          }
          
          .sl-chip {
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(51, 65, 85, 0.6);
            color: #E2E8F0;
          }
          
          .sl-chip:hover {
            background: rgba(30, 41, 59, 0.95);
            border-color: rgba(29, 78, 216, 0.3);
          }
          
          .sl-social {
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(51, 65, 85, 0.6);
            color: #94A3B8;
          }
          
          .sl-social:hover {
            background: rgba(30, 41, 59, 0.95);
            color: #60A5FA;
            border-color: rgba(96, 165, 250, 0.2);
          }
        }
      `}</style>
      
      <div className="sl-store-header__inner">
        <div className="sl-store-header__left">
          <div className="sl-store-header__brand">
            <div className="sl-store-header__logo">
              {logoUrl ? (
                <img src={logoUrl} alt={name} />
              ) : (
                initials
              )}
            </div>
            <h1 className="sl-store-header__title">{name}</h1>
          </div>
          
          <div className="sl-store-header__powered">
            <a href="/" aria-label="Visit ShopLynk homepage">
              Powered by ShopLynk
            </a>
          </div>
          
          {description && (
            <p className="sl-store-header__desc">{description}</p>
          )}
          
          {hasAnySocial && (
            <nav className="sl-store-header__socials" aria-label="Store social links">
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sl-social"
                  aria-label="Visit Instagram profile"
                  title="Instagram"
                >
                  {IG_ICON}
                </a>
              )}
              {socials.tiktok && (
                <a
                  href={socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sl-social"
                  aria-label="Visit TikTok profile"
                  title="TikTok"
                >
                  {TT_ICON}
                </a>
              )}
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sl-social"
                  aria-label="Visit Facebook profile"
                  title="Facebook"
                >
                  {FB_ICON}
                </a>
              )}
            </nav>
          )}
        </div>

        <div className="sl-store-header__right">
          <div className="sl-store-header__trust">
            {paymentCount > 0 && (
              <div className="sl-chip" role="button" aria-label="Payment methods">
                <span className="sl-chip__icon">{CARD_ICON}</span>
                <span className="sl-chip__text">{paymentCount} Payment Methods</span>
              </div>
            )}

            {deliveryCount > 0 && (
              <div className="sl-chip" role="button" aria-label="Delivery options">
                <span className="sl-chip__icon">{TRUCK_ICON}</span>
                <span className="sl-chip__text">{deliveryCount} Delivery Options</span>
              </div>
            )}
          </div>

          <button type="button" className="sl-cta" onClick={onBack}>
            <span className="sl-cta__icon">{BACK_ICON}</span>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// SVG Icons
const IG_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
  </svg>
);

const TT_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M15 4v4a5 5 0 0 0 5 5v3a8 8 0 1 1-8-8h1V4h2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FB_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v3H8v3h3v6h3v-6h3l1-3h-4V9z" fill="currentColor"/>
  </svg>
);

const CARD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
    <rect x="3.8" y="9" width="16.4" height="1.6" rx=".8" fill="currentColor"/>
  </svg>
);

const TRUCK_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 7h11v8H3z" stroke="currentColor" strokeWidth="2"/>
    <path d="M14 10h4l3 3v2h-7" stroke="currentColor" strokeWidth="2"/>
    <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const BACK_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M10 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);