# ShopLink Phase 1 - Evidence Package Index

**TEST_SELLER_ID:** `test-seller-2025-01`

## File Verification Guide

- **database.rules.json** — Firebase RTDB rules with events hardening (verify: publicStores read=true, sellers auth-only, events anonymous writes with validation)
- **rules-simulator/unauth-public-allow.png** — Unauthenticated read publicStores/test-seller-2025-01/profile = Allow
- **rules-simulator/auth-self-allow.png** — Authenticated read sellers/test-seller-2025-01/profile as same user = Allow  
- **rules-simulator/auth-other-deny.png** — Authenticated read sellers/other-uid/profile = Deny
- **src/StorefrontPublicView.tsx** — Public component reads only publicStores paths (verify: lines with `publicStores/${sellerId}/profile` and `/products`)
- **src/lib/utils/dataMirror.ts** — Auto-mirroring utility (verify: publishes active qty>0, preserves createdAt, idempotent)
- **src/lib/utils/whatsapp.ts** — WhatsApp integration (verify: device detection, popup with fallback)
- **tools/migration-script.js** — One-time migration script (verify: moves storefronts/* to publicStores/*)
- **data-publicStores.json** — Sample public store data for test-seller-2025-01
- **data-events.json** — Sample events data (store_view, product_view, wa_click) for test-seller-2025-01
- **build-log.txt** — Clean npm ci && npm run build output (verify: no errors)
- **commit.txt** — Git commit hash of built code
- **firebase-use.txt** — Active Firebase project
- **playwright-report.zip** — HTML test report (verify: /store/test-seller-2025-01 loads, WhatsApp opens new tab)
- **lighthouse-mobile.json** — Mobile performance (verify: LCP ≤ 2.0s, CLS < 0.1)
- **console-logs/console-chrome.json** — Console export (verify: no errors/warnings)
- **network/trace.har** — Network trace (verify: no unintended 404s)
- **screens/hero-fullbleed-1440.png** — Edge-to-edge hero with centered white card
- **screens/no-sticky-header.png** — No sticky header on storefront
- **screens/gutters-alignment.png** — Consistent clamp() padding across elements
- **screens/card-desktop-hover.png** — Desktop hover actions
- **screens/card-mobile-actions.png** — Mobile always-visible actions
- **screens/localStorage-favorites.png** — DevTools showing favorites_test-seller-2025-01 key
- **videos/wa-desktop.mp4** — Desktop WhatsApp opens web.whatsapp.com in new tab
- **videos/wa-iphone.mov** — Mobile WhatsApp opens wa.me in app

## Critical Validations Passed
✅ Public reads only from publicStores/* paths
✅ Events hardening with anonymous writes, seller validation, field validation
✅ Mirroring active products only (qty > 0), preserves createdAt
✅ Per-store favorites scoping (favorites_test-seller-2025-01)