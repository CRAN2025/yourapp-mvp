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
  description,
  paymentCount = 0,
  deliveryCount = 0,
  onBack,
  socials = {}
}: Props) {
  const hasAnySocial = Boolean(
    socials.instagram || socials.tiktok || socials.facebook
  );

  return (
    <section className="sl-store-header" aria-label="Store header">
      <style>{`
        .sl-store-header {
          background: linear-gradient(135deg, #f7faff 0%, #eaf4ff 100%);
          padding: 32px 0;
          width: 100%;
          position: relative;
        }
        
        .sl-store-header__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 40px;
        }
        
        .sl-store-header__left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        
        .sl-store-header__title {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
          margin: 0;
          color: #0F172A;
          letter-spacing: -0.02em;
        }
        
        .sl-store-header__powered {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 14px;
          color: #64748B;
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .sl-store-header__powered a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .sl-store-header__powered a:hover {
          color: #1D4ED8;
        }
        
        .sl-store-header__desc {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 16px;
          color: #475569;
          line-height: 1.5;
          margin: 0 0 8px 0;
          max-width: 60ch;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-weight: 400;
        }
        
        .sl-store-header__socials {
          display: inline-flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .sl-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          color: #1D4ED8;
          background: transparent;
          transition: all 0.2s ease;
          outline: none;
          text-decoration: none;
        }
        
        .sl-social:hover {
          color: #1E40AF;
          background: rgba(29, 78, 216, 0.1);
          transform: translateY(-1px);
        }
        
        .sl-social:focus-visible {
          box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.3);
        }
        
        .sl-store-header__right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .sl-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 8px;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          backdrop-filter: blur(4px);
        }
        
        .sl-chip:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(203, 213, 225, 0.8);
          color: #1F2937;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
        }
        
        .sl-chip__icon {
          flex-shrink: 0;
          color: #6B7280;
          transition: color 0.2s ease;
        }
        
        .sl-chip:hover .sl-chip__icon {
          color: #4B5563;
        }
        
        .sl-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          height: 44px;
          background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(29, 78, 216, 0.2);
        }
        
        .sl-cta:hover {
          background: linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.3);
        }
        
        .sl-cta__icon {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        
        .sl-cta:hover .sl-cta__icon {
          transform: translateX(-2px);
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          .sl-store-header__inner {
            padding: 0 32px;
            gap: 32px;
          }
        }
        
        @media (max-width: 768px) {
          .sl-store-header {
            padding: 24px 0;
          }
          
          .sl-store-header__inner {
            flex-direction: column;
            align-items: stretch;
            gap: 24px;
            padding: 0 24px;
          }
          
          .sl-store-header__left {
            text-align: center;
            gap: 12px;
          }
          
          .sl-store-header__title {
            font-size: 22px;
          }
          
          .sl-store-header__right {
            justify-content: center;
            flex-direction: column;
            gap: 12px;
          }
          
          .sl-store-header__desc {
            -webkit-line-clamp: 3;
            font-size: 15px;
            max-width: 50ch;
          }
          
          .sl-social {
            width: 28px;
            height: 28px;
          }
          
          .sl-cta {
            width: 100%;
            justify-content: center;
            max-width: 250px;
            margin: 0 auto;
          }
          
          .sl-store-header__socials {
            justify-content: center;
          }
        }
        
        @media (max-width: 480px) {
          .sl-store-header__inner {
            padding: 0 20px;
            gap: 20px;
          }
          
          .sl-store-header__title {
            font-size: 20px;
          }
          
          .sl-store-header__desc {
            font-size: 14px;
          }
        }
      `}</style>
      
      <div className="sl-store-header__inner">
        <div className="sl-store-header__left">
          <h1 className="sl-store-header__title">{name}</h1>
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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
  </svg>
);

const TT_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 4v4a5 5 0 0 0 5 5v3a8 8 0 1 1-8-8h1V4h2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FB_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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