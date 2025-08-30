# ShopLynk Header/Banner - LOCKED FINAL SYSTEM ✅

**Status**: LOCKED - NO CHANGES PERMITTED  
**Date**: August 29, 2025  
**Implementation**: Complete and Production Ready

## LOCKED GLOBAL TOKEN SYSTEM

### Typography Tokens - LOCKED
```css
/* TYPOGRAPHY TOKENS - LOCKED GLOBAL SYSTEM */
--store-name-size: 24px;           /* Bold, primary store name */
--store-name-weight: 700;
--powered-by-size: 16px;           /* Medium, link-blue branding */
--powered-by-weight: 500;
--description-size: 15px;          /* Regular, muted grey description */
--description-weight: 400;
--meta-size: 14px;                 /* Small meta information */
--meta-weight: 400;
```

### Color Tokens - LOCKED
```css
/* COLOR TOKENS - LOCKED GLOBAL PALETTE */
--text-primary: #111827;           /* Store name color */
--text-secondary: #6B7280;         /* Description color */
--text-tertiary: #9CA3AF;          /* Meta/location color */
--brand-link: #3B82F6;             /* "Powered by ShopLynk" link */
--brand-gradient: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
```

### Layout Tokens - LOCKED
```css
/* LAYOUT TOKENS - LOCKED */
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

## STRUCTURE & HIERARCHY - LOCKED

### Left-Aligned Identity Block
1. **Store Logo** (96px desktop, 80px mobile)
2. **Store Name** (24px, bold, primary color)
3. **"Powered by ShopLynk"** (16px, medium, link-blue with hover)
4. **Store Description** (15px, regular, muted grey - DYNAMIC from store data)
5. **"Online Store" fallback** (14px, only when no description)
6. **Location Meta** (14px, tertiary color, when available)

### Right-Aligned Action Block
1. **Payment Methods Badge** (neutral background, blue icon)
2. **Delivery Options Badge** (neutral background, blue icon)
3. **Currency Badge** (when available)
4. **Back to Dashboard CTA** (gradient, locked styling)

## DYNAMIC DESCRIPTION SYSTEM - LOCKED

### Conditional Logic
```jsx
{seller.storeDescription && seller.storeDescription.trim() ? (
  <div className="store-description-locked">
    {seller.storeDescription}
  </div>
) : (
  <div className="store-subtitle-locked">
    Online Store
  </div>
)}
```

### Rules
- **Pull from**: `seller.storeDescription` (authentic data only)
- **Show when**: Description exists AND is not empty/whitespace
- **Hide when**: Description is undefined, null, or empty
- **Fallback**: "Online Store" label only when no description
- **No placeholders**: Never show hardcoded placeholder text

## LOCKED CSS CLASSES

### Typography Classes
```css
.store-title-locked {
  font-size: var(--store-name-size);
  font-weight: var(--store-name-weight);
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 4px;
}

.powered-by-locked {
  font-size: var(--powered-by-size);
  font-weight: var(--powered-by-weight);
  color: var(--brand-link);
  line-height: 20px;
  margin-bottom: var(--space-2);
  letter-spacing: -0.2px;
}

.store-description-locked {
  font-size: var(--description-size);
  font-weight: var(--description-weight);
  color: var(--text-secondary);
  line-height: 1.4;
  margin-top: var(--space-2);
  margin-bottom: var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.store-subtitle-locked {
  font-size: var(--meta-size);
  font-weight: var(--meta-weight);
  color: var(--text-tertiary);
  line-height: 18px;
}
```

### Badge Classes
```css
.payment-delivery-badge {
  background: var(--badge-card-style-bg);
  border-radius: var(--badge-card-style-radius);
  box-shadow: var(--badge-card-style-shadow);
  padding: 10px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: var(--badge-card-style-font-size);
  color: var(--text-secondary);
  border: 1px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.payment-delivery-badge svg {
  color: var(--brand-link);
  flex-shrink: 0;
}
```

## VISUAL BALANCE - LOCKED

### Fixed Spacing
- **Identity to Badges**: 20px gap (maintained by flexbox)
- **Badges to CTA**: 20px gap (maintained by flexbox)
- **Internal Badge Gap**: 12px between payment/delivery badges
- **Logo to Text**: 16px gap in identity block

### Vertical Alignment
- All elements baseline-aligned using flexbox `align-items: center`
- Icons vertically centered within badges
- Typography line-heights optimized for visual balance

## RESPONSIVE BEHAVIOR - LOCKED

### Desktop (>768px)
- Horizontal three-zone layout
- Logo: 96px (var(--size-96))
- Description: 2 lines maximum
- Full padding: 32px top/bottom, 40px sides

### Mobile (≤768px)
- Vertical stack layout
- Logo: 80px (var(--size-80))
- Description: 1 line maximum, 14px font
- Reduced padding: 24px all sides
- Center-aligned content

## CTA BUTTON SYSTEM - LOCKED

### Back to Dashboard (Seller View)
```jsx
<Link
  to="/products"
  style={{
    background: 'var(--brand-gradient)',
    color: 'white',
    padding: 'var(--cta-primary-padding)',
    borderRadius: 'var(--cta-primary-radius)',
    fontSize: 'var(--cta-primary-font-size)',
    fontWeight: 'var(--cta-primary-font-weight)',
    boxShadow: '0 4px 12px rgba(79, 168, 255, 0.3)'
  }}
>
  Back to Dashboard
</Link>
```

### Buyer View CTAs
- Follow Store: Neutral background, blue border
- Share Store: Neutral background, blue border
- Both use consistent hover effects and transitions

## GOVERNANCE & LOCK STATUS

### LOCKED ELEMENTS
- ✅ All typography sizes, weights, and colors
- ✅ All spacing, padding, and margin values
- ✅ All background gradients and shadow effects
- ✅ Dynamic description conditional logic
- ✅ Badge styling and icon colors
- ✅ CTA button gradient and hover states
- ✅ Responsive breakpoints and behavior

### FORBIDDEN CHANGES
- ❌ Typography size modifications
- ❌ Color value overrides
- ❌ Spacing/padding adjustments
- ❌ Description placeholder additions
- ❌ Badge styling modifications
- ❌ Layout structure changes

### TOKEN INHERITANCE
- All buyer storefronts inherit identical styling
- Global token system ensures cross-component consistency
- No local overrides permitted

## IMPLEMENTATION STATUS

**COMPLETE**: August 29, 2025  
**TESTED**: All breakpoints and description states  
**DOCUMENTED**: Full token system and usage guide  
**LOCKED**: Production-ready, no further modifications

---

**Next Version**: v1.2 (requires explicit unlock approval and version increment)