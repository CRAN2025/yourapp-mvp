// StoreHeader.tsx
type Socials = { instagram?: string; tiktok?: string; facebook?: string };
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
  socials = {},
}: Props) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hasAnySocial = Boolean(
    socials.instagram || socials.tiktok || socials.facebook
  );

  return (
    <section className="sl-store-header" aria-label="Store header">
      <style>{`
        .sl-store-header {
          background: linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%);
          border-bottom: 1px solid #E5E7EB;
          padding: 40px 0;
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        
        .sl-store-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(29, 78, 216, 0.1) 50%, transparent 100%);
        }
        
        .sl-store-header__inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 48px;
          position: relative;
        }
        
        .sl-store-header__left {
          display: flex;
          align-items: center;
          gap: 32px;
          flex: 1;
          min-width: 0;
        }
        
        .sl-store-header__logo {
          flex-shrink: 0;
          position: relative;
        }
        
        .sl-store-header__logo::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(29, 78, 216, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
          z-index: -1;
        }
        
        .sl-store-header__logo img {
          width: 88px;
          height: 88px;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid #FFFFFF;
          box-shadow: 
            0 0 0 1px rgba(15, 23, 42, 0.08),
            0 4px 16px rgba(15, 23, 42, 0.08),
            0 8px 32px rgba(15, 23, 42, 0.04);
          background: #fff;
          object-fit: cover;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sl-store-header__logo img:hover {
          transform: scale(1.02);
          box-shadow: 
            0 0 0 1px rgba(15, 23, 42, 0.12),
            0 8px 24px rgba(15, 23, 42, 0.12),
            0 16px 48px rgba(15, 23, 42, 0.08);
        }
        
        .sl-store-header__avatar {
          width: 88px;
          height: 88px;
          border-radius: 16px;
          border: 2px solid #FFFFFF;
          box-shadow: 
            0 0 0 1px rgba(15, 23, 42, 0.08),
            0 4px 16px rgba(15, 23, 42, 0.08),
            0 8px 32px rgba(15, 23, 42, 0.04);
          background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%);
          display: grid;
          place-items: center;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
          color: #1D4ED8;
          letter-spacing: -0.02em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .sl-store-header__avatar::before {
          content: attr(data-initials);
        }
        
        .sl-store-header__avatar:hover {
          transform: scale(1.02);
          box-shadow: 
            0 0 0 1px rgba(15, 23, 42, 0.12),
            0 8px 24px rgba(15, 23, 42, 0.12),
            0 16px 48px rgba(15, 23, 42, 0.08);
        }
        
        .sl-store-header__meta {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }
        
        .sl-store-header__title {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 36px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0;
          color: #0F172A;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .sl-store-header__powered {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          opacity: 0.8;
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
          font-size: 17px;
          color: #475569;
          line-height: 1.6;
          margin: 0;
          max-width: 65ch;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-weight: 400;
          letter-spacing: -0.01em;
        }
        
        .sl-store-header__socials {
          display: inline-flex;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        
        .sl-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          color: #1D4ED8;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.8);
          backdrop-filter: blur(8px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }
        
        .sl-social::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(29, 78, 216, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        
        .sl-social:hover::before {
          opacity: 1;
        }
        
        .sl-social:hover {
          color: #FFFFFF;
          background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
          border-color: #1D4ED8;
          transform: translateY(-2px) scale(1.05);
          box-shadow: 
            0 8px 25px rgba(29, 78, 216, 0.25),
            0 4px 12px rgba(29, 78, 216, 0.15);
        }
        
        .sl-social:focus-visible {
          box-shadow: 
            0 0 0 3px rgba(29, 78, 216, 0.3),
            0 8px 25px rgba(29, 78, 216, 0.15);
        }
        
        .sl-store-header__right {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .sl-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          backdrop-filter: blur(8px);
          letter-spacing: -0.01em;
        }
        
        .sl-chip:hover {
          background: rgba(248, 250, 252, 0.95);
          border-color: rgba(203, 213, 225, 0.9);
          color: #1E293B;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
        }
        
        .sl-chip__icon {
          flex-shrink: 0;
          color: #64748B;
          transition: color 0.2s ease;
        }
        
        .sl-chip:hover .sl-chip__icon {
          color: #475569;
        }
        
        .sl-cta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 28px;
          height: 52px;
          background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 0 0 1px rgba(29, 78, 216, 0.2),
            0 4px 16px rgba(29, 78, 216, 0.15),
            0 8px 32px rgba(29, 78, 216, 0.08);
          letter-spacing: -0.01em;
          position: relative;
          overflow: hidden;
        }
        
        .sl-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        
        .sl-cta:hover::before {
          opacity: 1;
        }
        
        .sl-cta:hover {
          background: linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 0 0 1px rgba(29, 78, 216, 0.3),
            0 8px 25px rgba(29, 78, 216, 0.25),
            0 16px 48px rgba(29, 78, 216, 0.15);
        }
        
        .sl-cta__icon {
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }
        
        .sl-cta:hover .sl-cta__icon {
          transform: translateX(-2px);
        }
        
        /* Enhanced Responsive Design */
        @media (max-width: 1440px) {
          .sl-store-header__inner {
            max-width: 1200px;
            padding: 0 24px;
          }
        }
        
        @media (max-width: 1024px) {
          .sl-store-header {
            padding: 32px 0;
          }
          
          .sl-store-header__inner {
            padding: 0 20px;
            gap: 32px;
          }
          
          .sl-store-header__title {
            font-size: 32px;
          }
          
          .sl-store-header__logo img,
          .sl-store-header__avatar {
            width: 80px;
            height: 80px;
          }
          
          .sl-store-header__avatar {
            font-size: 24px;
          }
        }
        
        @media (max-width: 768px) {
          .sl-store-header {
            padding: 28px 0;
          }
          
          .sl-store-header__inner {
            flex-direction: column;
            align-items: stretch;
            gap: 28px;
            padding: 0 20px;
          }
          
          .sl-store-header__left {
            justify-content: center;
            text-align: center;
            gap: 24px;
          }
          
          .sl-store-header__title {
            font-size: 28px;
          }
          
          .sl-store-header__right {
            justify-content: center;
            flex-direction: column;
            gap: 16px;
          }
          
          .sl-store-header__desc {
            -webkit-line-clamp: 3;
            font-size: 16px;
            max-width: 50ch;
          }
          
          .sl-social {
            width: 40px;
            height: 40px;
          }
          
          .sl-cta {
            width: 100%;
            justify-content: center;
            max-width: 280px;
            margin: 0 auto;
          }
        }
        
        @media (max-width: 480px) {
          .sl-store-header__inner {
            padding: 0 16px;
            gap: 20px;
          }
          
          .sl-store-header__left {
            flex-direction: column;
            gap: 16px;
          }
          
          .sl-store-header__title {
            font-size: 24px;
          }
          
          .sl-store-header__logo img,
          .sl-store-header__avatar {
            width: 72px;
            height: 72px;
          }
          
          .sl-store-header__avatar {
            font-size: 20px;
          }
          
          .sl-store-header__desc {
            font-size: 15px;
          }
        }
      `}</style>
      
      <div className="sl-store-header__inner">
        <div className="sl-store-header__left">
          <div className="sl-store-header__logo" aria-hidden="true">
            {logoUrl ? (
              <img src={logoUrl} alt="" />
            ) : (
              <div className="sl-store-header__avatar" data-initials={initials} />
            )}
          </div>

          <div className="sl-store-header__meta">
            <h1 className="sl-store-header__title">{name}</h1>
            <div className="sl-store-header__powered">Powered by ShopLynk</div>

            {description ? (
              <p className="sl-store-header__desc">{description}</p>
            ) : null}

            {hasAnySocial && (
              <nav className="sl-store-header__socials" aria-label="Store social links">
                {socials.instagram && (
                  <a
                    className="sl-social sl-social--ig"
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    title="Instagram"
                  >
                    {IG_ICON}
                  </a>
                )}
                {socials.tiktok && (
                  <a
                    className="sl-social sl-social--tt"
                    href={socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    title="TikTok"
                  >
                    {TT_ICON}
                  </a>
                )}
                {socials.facebook && (
                  <a
                    className="sl-social sl-social--fb"
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    title="Facebook"
                  >
                    {FB_ICON}
                  </a>
                )}
              </nav>
            )}
          </div>
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

/** --- tiny inline SVGs (monochrome; inherit currentColor) --- */
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