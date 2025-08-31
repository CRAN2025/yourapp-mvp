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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px 0;
        }
        
        .sl-store-header__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }
        
        .sl-store-header__left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }
        
        .sl-store-header__logo {
          flex-shrink: 0;
        }
        
        .sl-store-header__logo img {
          width: 96px;
          height: 96px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 14px rgba(16, 24, 40, 0.08);
          background: #fff;
          object-fit: cover;
        }
        
        .sl-store-header__avatar {
          width: 96px;
          height: 96px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 14px rgba(16, 24, 40, 0.08);
          background: linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,0.8)),
                      #f8fafc;
          display: grid;
          place-items: center;
          font: 700 28px/1 system-ui, -apple-system, "Segoe UI";
          color: #2563eb;
        }
        
        .sl-store-header__avatar::before {
          content: attr(data-initials);
        }
        
        .sl-store-header__meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        
        .sl-store-header__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
          margin: 0;
          color: white;
        }
        
        .sl-store-header__powered {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .sl-store-header__desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
          margin: 0;
          max-width: 62ch;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
          width: 32px;
          height: 32px;
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.7);
          background: transparent;
          transition: color .15s ease, background-color .15s ease, box-shadow .15s ease;
          outline: none;
          text-decoration: none;
        }
        
        .sl-social:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .sl-social:focus-visible {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
        }
        
        .sl-store-header__right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .sl-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .sl-chip:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        .sl-chip__icon {
          flex-shrink: 0;
        }
        
        .sl-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          height: 40px;
          background: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .sl-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 168, 255, 0.3);
        }
        
        .sl-cta__icon {
          flex-shrink: 0;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .sl-store-header__inner {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          
          .sl-store-header__left {
            justify-content: center;
            text-align: center;
          }
          
          .sl-store-header__right {
            justify-content: center;
            flex-direction: column;
            gap: 12px;
          }
          
          .sl-store-header__desc {
            -webkit-line-clamp: 3;
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
    <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/>
    <rect x="3.8" y="9" width="16.4" height="1.6" rx=".8" fill="currentColor"/>
  </svg>
);

const TRUCK_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 7h11v8H3z" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M14 10h4l3 3v2h-7" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

const BACK_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M10 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IG_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
  </svg>
);

const TT_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M15 4v4a5 5 0 0 0 5 5v3a8 8 0 1 1-8-8h1V4h2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FB_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v3H8v3h3v6h3v-6h3l1-3h-4V9z" fill="currentColor"/>
  </svg>
);