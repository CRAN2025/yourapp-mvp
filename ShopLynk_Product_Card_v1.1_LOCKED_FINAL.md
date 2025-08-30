# ShopLynk Product Card v1.1 - LOCKED FINAL ✅

**Status**: LOCKED - NO CHANGES PERMITTED  
**Date**: August 29, 2025  
**Implementation**: Complete Token-Driven System

## GOVERNANCE PROTOCOL ACTIVE

Product Card v1.1 is under strict change control following the ShopLynk Governance Protocol. All visual hierarchy, token values, and component behavior are **LOCKED** and cannot be modified without explicit approval.

## DESIGN TOKEN SYSTEM - LOCKED

### Product Card Tokens
```css
/* PRODUCT CARD v1.1 - LOCKED TOKEN SYSTEM */
--sl-surface-elevated: #ffffff;
--sl-radius-2xl: 16px;
--sl-radius-xl: 12px;
--sl-radius-lg: 8px;
--sl-radius-md: 6px;
--sl-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--sl-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--sl-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--sl-space-4: 16px;
--sl-space-3: 12px;
--sl-space-2: 8px;
--sl-skeleton: #f3f4f6;
```

### Typography Tokens
```css
/* PRODUCT CARD TYPOGRAPHY - LOCKED v1.1 */
--sl-font-md-semibold: 16px;
--sl-font-sm-medium: 14px;
--sl-font-xs-medium: 12px;
--sl-text-success: #059669;
--sl-text-muted: #6B7280;
--sl-icon-muted: #9CA3AF;
--sl-status-favorite: #EF4444;
```

### Badge Tokens
```css
/* BADGE TOKENS - LOCKED v1.1 */
--sl-badge-info-bg: #DBEAFE;
--sl-badge-info-fg: #1E40AF;
--sl-badge-warn-bg: #FEF3C7;
--sl-badge-warn-fg: #92400E;
```

### CTA Tokens
```css
/* CTA TOKENS - LOCKED v1.1 */
--sl-accent-green-bg: #DCFCE7;
--sl-accent-green-fg: #166534;
--sl-control-bg: #F9FAFB;
--sl-control-fg: #374151;
--sl-control-border: #E5E7EB;
```

### Tag Tokens
```css
/* TAG TOKENS - LOCKED v1.1 */
--sl-tag-bg: #F3F4F6;
--sl-tag-fg: #6B7280;
```

## COMPONENT LAYOUT - LOCKED

### Visual Hierarchy (Top to Bottom)
1. **Product Image** (1:1 aspect ratio, object-fit: cover)
2. **Optional Badges** (New, Limited Stock, Featured - top-left overlay)
3. **Favorite Icon** (top-right corner - hidden for owners)
4. **Product Title** (16px semibold, 2-line clamp)
5. **Brand Name** (14px medium, muted, uppercase)
6. **Price Row** (Success green, optional compare-at price)
7. **Category Pills** (Navy background, reusing global tokens)
8. **Primary CTA** (Contact Seller - neutral green)
9. **Secondary CTA** (View Details - neutral button)
10. **Attributes Row** (Soft tags for features/tags)

## LOCKED CSS CLASSES

### Main Container
```css
.product-card-v11 {
  background: var(--sl-surface-elevated);
  border-radius: var(--sl-radius-2xl);
  box-shadow: var(--sl-shadow-lg);
  transition: all 0.3s ease;
  overflow: hidden;
}

.product-card-v11:hover {
  transform: translateY(-3px);
  box-shadow: var(--sl-shadow-xl);
}
```

### Image Section
```css
.product-image-wrapper {
  aspect-ratio: 1;
  position: relative;
  background: var(--sl-skeleton);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--sl-radius-xl) var(--sl-radius-xl) 0 0;
}
```

### Badge System
```css
.product-badge-new {
  background: var(--sl-badge-info-bg);
  color: var(--sl-badge-info-fg);
  font-size: var(--sl-font-xs-medium);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--sl-radius-lg);
}

.product-badge-limited {
  background: var(--sl-badge-warn-bg);
  color: var(--sl-badge-warn-fg);
  font-size: var(--sl-font-xs-medium);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--sl-radius-lg);
}
```

### Typography Classes
```css
.product-title {
  font-size: var(--sl-font-md-semibold);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-brand {
  font-size: var(--sl-font-sm-medium);
  font-weight: 500;
  color: var(--sl-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--sl-text-success);
}
```

### CTA System
```css
.product-cta-primary {
  width: 100%;
  background: var(--sl-accent-green-bg);
  color: var(--sl-accent-green-fg);
  border: none;
  border-radius: var(--sl-radius-lg);
  font-size: var(--sl-font-md-semibold);
  font-weight: 600;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sl-space-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-cta-secondary {
  width: 100%;
  background: var(--sl-control-bg);
  color: var(--sl-control-fg);
  border: 1px solid var(--sl-control-border);
  border-radius: var(--sl-radius-lg);
  font-size: var(--sl-font-md-semibold);
  font-weight: 600;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sl-space-2);
  cursor: pointer;
  transition: all 0.2s ease;
}
```

## VISUAL BALANCE IMPROVEMENTS

### Badge Consistency
- **Before**: Mixed sizing, different weights, poor alignment
- **After**: Unified token system, consistent 2px-8px padding, locked font weights

### CTA Harmony
- **Before**: Contact Seller too visually heavy vs View Details
- **After**: Balanced styling with neutral green primary, neutral secondary

### Category Pills
- **Before**: Off-tone vs global design system
- **After**: Reuses locked global pill tokens (#2C3E50 background)

### Spacing Consistency
- **Before**: Uneven gaps, mixed padding values
- **After**: Token-driven spacing (--sl-space-4/3/2)

### Shadow & Hover
- **Before**: Inconsistent elevation effects
- **After**: Unified hover system with translateY(-3px) and token shadows

## ACCESSIBILITY & PERFORMANCE

### Semantic Structure
- Images with proper alt text and decoding="async"
- Buttons with aria-label for screen readers
- Favorite button uses aria-pressed state
- Focus management with keyboard navigation

### Performance Optimization
- Lazy loading with loading="lazy"
- Skeleton states for missing images
- Efficient CSS transitions and transforms
- Image optimization with object-fit: cover

## REUSABILITY CONTRACT

### For Seller View
```jsx
<ProductCardV11
  product={product}
  isOwner={true}
  onContact={handleContactProduct}
  onView={handleProductView}
  onFavorite={toggleFavorite}
  ctaPrimary="Contact Seller"
  ctaSecondary="View Details"
/>
```

### For Buyer View
```jsx
<ProductCardV11
  product={product}
  isOwner={false}
  onContact={handleContactProduct}
  onView={handleProductView}
  onFavorite={toggleFavorite}
  ctaPrimary="Add to Cart"
  ctaSecondary="View Details"
/>
```

## KEY VISUAL CHANGES vs SCREENSHOT

| Area | Current State | New v1.1 Approach |
|------|--------------|-------------------|
| Badge consistency | Mixed sizing & colors | Unified token families |
| CTA styling | Contact Seller too strong | Harmonized button sizing |
| Category pills | Off-tone vs global tokens | Reuse locked global system |
| Attributes | Inconsistent tags | Token-driven soft tags |
| Shadows & hover | Not consistent | Unified hover + elevation |
| Typography | Mixed font weights | Locked hierarchy system |
| Spacing | Fixed px values | Semantic token spacing |

## GOVERNANCE RULES

### LOCKED ELEMENTS ✅
- All color values and gradients
- Typography sizes, weights, and line-heights
- Spacing, padding, and margin tokens
- Shadow and border-radius values
- Hover and transition effects
- Badge and CTA styling system
- Image aspect ratios and object-fit

### FORBIDDEN CHANGES ❌
- Hardcoded color overrides
- Custom spacing values outside token system
- Typography modifications without token updates
- CTA button styling changes
- Badge system alterations
- Hover effect modifications

### TOKEN INHERITANCE
- All buyer storefronts inherit identical styling
- Global category pill tokens maintained
- Cross-component consistency enforced
- No local style overrides permitted

## IMPLEMENTATION STATUS

**COMPLETE**: August 29, 2025  
**TESTED**: All product card states and interactions  
**DOCUMENTED**: Full token system and usage patterns  
**LOCKED**: Production-ready, governance enforced

---

**Next Version**: v1.2 (requires explicit unlock approval and governance protocol)