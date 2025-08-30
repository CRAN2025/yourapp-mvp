# ShopLynk Header/Banner v1.1 - LOCKED & COMPLETE

**Status**: LOCKED - Production Ready  
**Date**: August 29, 2025  
**Version**: v1.1 (Dynamic Description)

## Data Contract (Read-Only)

```typescript
StoreHeaderData {
  name: string                // required
  description?: string | null // optional, conditional render
  logoUrl: string             // required (fallback to brand mark)
  paymentsCount: number       // required
  deliveriesCount: number     // required
  location?: string           // optional meta
}
```

## Layout & Hierarchy (Left → Right)

**LEFT ZONE:** Logo → Store Name → "Powered by ShopLynk" → Description (optional) → Location Meta  
**MIDDLE ZONE:** Payment Methods Pills + Delivery Options Pills  
**RIGHT ZONE:** CTA (Back to Dashboard for sellers, Follow/Share for buyers)

## Global Token System v1.1

### Layout Tokens
```css
--bg-surface-scrim: linear-gradient(135deg, rgba(240, 247, 255, 0.95) 0%, rgba(248, 251, 255, 0.92) 40%, rgba(255, 255, 255, 0.9) 100%);
--space-8: 32px;
--space-10: 40px;
--space-6: 24px;
--space-2: 8px;
--radius-16: 16px;
--shadow-xl-soft: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--size-96: 96px;
--size-80: 80px;
```

### Typography Tokens
```css
--font-display-xl: 24px;
--font-body-sm: 14px;
--text-primary: #111827;
--text-secondary: #6B7280;
--text-tertiary: #9CA3AF;
--brand-500: #3B82F6;
```

## Component Classes - LOCKED

### Header Container
```css
.header-container-locked {
  background: var(--bg-surface-scrim);
  border-radius: var(--radius-16);
  box-shadow: var(--shadow-xl-soft);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: var(--space-8) var(--space-10);
}
```

### Typography Classes
```css
.store-title-locked {
  font-size: var(--font-display-xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.powered-by-locked {
  font-size: var(--font-body-sm);
  font-weight: 600;
  color: var(--brand-500);
  margin-bottom: var(--space-2);
}

.store-description-locked {
  font-size: var(--font-body-sm);
  font-weight: 400;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-top: var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.store-subtitle-locked {
  font-size: var(--font-body-sm);
  font-weight: 400;
  color: var(--text-tertiary);
}
```

### Logo Classes
```css
.shoplynk-avatar {
  width: var(--size-96);
  height: var(--size-96);
  border-radius: var(--radius-16);
  background: #FFFFFF;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}
```

## Dynamic Description Behavior

### Conditional Rendering
- **Show Only When**: `seller.storeDescription && seller.storeDescription.trim()`
- **Hide When**: Description is undefined, null, or empty string
- **No Placeholder**: Never shows placeholder text or reserves space

### Responsive Truncation
- **Desktop**: 2 lines maximum with ellipsis
- **Mobile**: 1 line maximum with ellipsis
- **Line Clamp**: Uses `-webkit-line-clamp` for clean truncation

## Three-Zone Layout System

### LEFT ZONE: Store Identity
```jsx
<div className="store-info-block">
  {/* Logo with performance optimization */}
  <img 
    src={logoUrl} 
    alt={storeName}
    decoding="async"
    width="96" 
    height="96" 
  />
  
  {/* Identity hierarchy */}
  <div>
    <h1 className="store-title-locked">{storeName}</h1>
    <div className="powered-by-locked">
      <Link href={marketingUrl}>Powered by ShopLynk</Link>
    </div>
    {description && (
      <div className="store-description-locked">{description}</div>
    )}
    <div className="store-subtitle-locked">{location}</div>
  </div>
</div>
```

### MIDDLE ZONE: Service Pills
```jsx
<div className="badges-block">
  <button className="payment-delivery-badge">
    {paymentsCount} Payment Methods
  </button>
  <button className="payment-delivery-badge">
    {deliveriesCount} Delivery Options
  </button>
</div>
```

### RIGHT ZONE: Primary CTA
```jsx
<div className="cta-block">
  <button className="cta-primary">Back to Dashboard</button>
</div>
```

## Responsive Behavior

### Mobile (≤768px)
- Stack zones vertically
- Center-align all content
- Reduce logo size to `var(--size-80)`
- Single-line description truncation
- Reduce padding to `var(--space-6)`

### Desktop (>768px)
- Horizontal three-zone layout
- Logo size `var(--size-96)`
- Two-line description truncation
- Full padding `var(--space-8) var(--space-10)`

## Accessibility Compliance

### Semantic Structure
- `role="banner"` on header container
- `<h1>` for store name (primary heading)
- Proper focus order: Logo → Identity → Pills → CTA

### Performance Optimization
- `decoding="async"` on logo images
- Explicit width/height to prevent CLS
- Lazy loading with proper fallbacks

## Reusability Contract

### For Seller Views
```jsx
<StoreHeaderV1_1 
  storeName={seller.storeName}
  description={seller.storeDescription}
  logoUrl={seller.logoUrl}
  paymentsCount={seller.paymentMethods.length}
  deliveriesCount={seller.deliveryOptions.length}
  location={seller.location}
  ctaText="Back to Dashboard"
  ctaHref="/dashboard"
/>
```

### For Buyer Views
```jsx
<StoreHeaderV1_1 
  storeName={seller.storeName}
  description={seller.storeDescription}
  logoUrl={seller.logoUrl}
  paymentsCount={seller.paymentMethods.length}
  deliveriesCount={seller.deliveryOptions.length}
  location={seller.location}
  ctaText="Follow Store"
  ctaHref="#follow"
/>
```

## Governance

### Change Control
- **LOCKED**: All token values, class names, and layout structure
- **NO CHANGES**: Without explicit approval and version increment
- **INHERITANCE**: All buyer storefronts inherit identical styling

### Acceptance Criteria ✅
- [x] Description appears only when provided; hides cleanly when absent
- [x] Visual parity with v1.1 specification requirements
- [x] No overlaps or drift across all breakpoints
- [x] Reusable component architecture for Seller + Buyer views
- [x] Performance optimization with async decoding and dimensions
- [x] Full accessibility compliance with semantic structure
- [x] Global token system implemented and locked

**Implementation Complete**: August 29, 2025  
**Next Version**: v1.2 (requires explicit unlock and approval)