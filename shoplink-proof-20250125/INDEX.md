# ShopLink Evidence Package - File Index

## Realtime Database rules & simulator
- **database.rules.json** - Deployed Firebase RTDB rules with hardened events validation
- **rules-simulator/unauth-public-allow.png** - Public storefront access proof (no auth required)
- **rules-simulator/auth-self-allow.png** - Seller accessing own private data (allowed)
- **rules-simulator/auth-other-deny.png** - Cross-seller access prevention (denied)

## Source (post-fix, as deployed)
- **src/StorefrontPublicView.tsx** - Public component reading only from publicStores/* paths
- **src/lib/utils/dataMirror.ts** - Auto-mirroring: active products only, preserves createdAt, idempotent
- **src/lib/utils/whatsapp.ts** - Device detection and WhatsApp URL generation
- **tools/migration-script.js** - Data migration utility for legacy to publicStores format

## Data snapshots (JSON)
- **data-publicStores.json** - Sample public store data for TEST_SELLER_ID
- **data-events.json** - Recent analytics events (store_view, product_view, wa_click)

## Build & commit proof
- **build-log.txt** - Clean npm ci && npm run build output
- **commit.txt** - Git commit hash after all fixes applied
- **firebase-use.txt** - Active Firebase project configuration

## Playwright
- **playwright-report.zip** - Test report: storefront loads clean, WA clicks work correctly

## Lighthouse (mobile)
- **lighthouse-mobile.json** - Performance metrics (LCP ≤ 2.0s, CLS < 0.1 targets)

## Console & network health
- **console-logs/console-chrome.json** - DevTools export showing no errors/warnings
- **network/trace.har** - Network trace confirming no unintended 404s

## Design parity screenshots
- **screens/hero-fullbleed-1440.png** - Edge-to-edge hero design at 1440px width
- **screens/no-sticky-header.png** - Proof of non-sticky header on public storefront
- **screens/gutters-alignment.png** - Consistent padding alignment across sections
- **screens/card-desktop-hover.png** - Desktop hover actions on product cards
- **screens/card-mobile-actions.png** - Always-visible actions on mobile cards
- **screens/localStorage-favorites.png** - Per-store favorites scoping evidence

## WhatsApp behavior videos
- **videos/wa-desktop.mp4** - Desktop flow: new tab to WhatsApp Web
- **videos/wa-iphone.mov** - Mobile flow: WhatsApp app opening via wa.me

## Optional verification
- **route-scan.txt** - Code search proving public component only reads publicStores/*