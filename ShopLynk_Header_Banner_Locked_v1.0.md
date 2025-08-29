# ShopLynk Header/Banner - Locked Token System v1.0 FINAL

**Implementation Date**: August 29, 2025  
**Status**: FINAL VERSION LOCKED AND ENFORCED  
**Scope**: Seller storefront header with perfect three-zone alignment, ready for buyer inheritance

## Overview

This document establishes the FINAL locked header/banner token system for ShopLynk seller storefronts, featuring perfect three-zone baseline alignment, single CTA placement, enhanced elevation, and complete token inheritance ready for buyer storefront implementation.

## FINAL Locked Header Tokens

### Core Header Architecture
```css
--header-bg-gradient: linear-gradient(135deg, rgba(240, 247, 255, 0.95) 0%, rgba(248, 251, 255, 0.92) 40%, rgba(255, 255, 255, 0.9) 100%);
--header-layout: 24px; /* Vertical padding for banner */
--cta-primary-style: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
```
**Usage**: Unified icy-blue gradient with locked CTA gradient for seller dashboard buttons

### Store Logo Container
```css
--store-logo-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
```
**Features**:
- 1:1 aspect ratio locked for square presentation
- 12px padding (reduced 4px from 16px for tighter design)
- Subtle elevation matching category pill shadow tokens
- Scale and center-align for non-square logos with `object-fit: contain`

### Store Title Typography
```css
--store-title-font: 22px;
--store-title-weight: 700;
--store-title-color: #111827;
--store-title-font-tablet: 20px;
```
**Hierarchy**: Matches locked H3 token for consistent typography scale

### Header Spacing System
```css
--header-spacing-vertical: 4px;   /* Store Name → Powered by text */
--header-spacing-minimal: 2px;    /* Powered by → Subtitle */
--header-spacing: 16px;           /* Uniform header padding and gaps */
--header-elevation: 0px 8px 20px rgba(0, 0, 0, 0.04);
--header-border-radius: 16px;
```
**Implementation**: Decreased vertical gaps for tighter layout, enhanced elevation for premium feel

### Payment & Delivery Badge Cards
```css
--badge-card-style-bg: #ffffff;
--badge-card-style-border: 1px solid #e5e7eb;
--badge-card-style-radius: 12px;
--badge-card-style-padding: 8px 16px;
--badge-card-style-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
```
**Features**:
- Enhanced shadow to match store logo elevation
- Perfect baseline alignment with Back to Dashboard CTA
- Matches category pill styling tokens for consistency
- Solid white background with neutral border treatment

### Responsive Scaling
```css
--logo-scale-tablet: 0.9;   /* 10% reduction for tablet */
--logo-scale-mobile: 0.8;   /* 20% reduction for mobile */
```

## Component Implementation

### FINAL Locked Header Container
```css
.header-container-locked {
  background: var(--header-bg-gradient);
  border-radius: 16px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
```

### Perfect Three-Zone Alignment System
```css
.header-row-locked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  gap: 20px;
}

/* LEFT ZONE: Logo + Store Info */
.store-info-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

/* MIDDLE ZONE: Payment/Delivery Badges */
.badges-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* RIGHT ZONE: Single CTA */
.cta-block {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
```

### Store Logo Container - Locked Class
```css
.store-logo-container {
  width: clamp(64px, 8vw, 128px);
  height: clamp(64px, 8vw, 128px);
  aspect-ratio: 1 / 1; /* Lock 1:1 aspect ratio */
  border-radius: 16px;
  background: #FFFFFF;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px; /* Reduced by 4px from 16px */
  box-shadow: var(--store-logo-shadow);
  transition: var(--token-transition-default);
}

.store-logo-container img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Scale and center for non-square logos */
  object-position: center;
}

.store-logo-container:hover {
  transform: scale(var(--token-hover-scale));
}
```

### FINAL Typography Hierarchy - Locked Classes
```css
.store-title-locked {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 28px;
  margin-bottom: var(--header-spacing-vertical);
}

.powered-by-locked {
  font-size: 14px;
  font-weight: 500;
  color: #3B82F6;
  line-height: 20px;
  margin-bottom: var(--header-spacing-minimal);
  letter-spacing: -0.2px;
}

.store-subtitle-locked {
  font-size: 13px;
  font-weight: 400;
  color: #6B7280;
  line-height: 20px;
}
```

### Payment/Delivery Badges - Locked Class
```css
.payment-delivery-badge {
  background: var(--badge-card-style-bg);
  border: var(--badge-card-style-border);
  border-radius: var(--badge-card-style-radius);
  padding: var(--badge-card-style-padding);
  box-shadow: var(--badge-card-style-shadow);
  transition: var(--token-transition-default);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
  color: #6B7280;
}

.payment-delivery-badge:hover {
  transform: scale(var(--token-hover-scale));
  filter: brightness(var(--token-hover-brightness));
}
```

## Responsive Behavior - Locked System

### Desktop (≥1280px)
- Maintains current proportions and spacing
- Full token values applied without scaling
- Horizontal layout for all badges

### Tablet (768px–1279px)
```css
@media (max-width: 1279px) and (min-width: 768px) {
  .store-title-locked {
    font-size: var(--store-title-font-tablet); /* 20px */
  }
  
  .store-logo-container {
    transform: scale(var(--logo-scale-tablet)); /* 0.9 */
  }
}
```

### Mobile (≤767px)
```css
@media (max-width: 767px) {
  .store-logo-container {
    transform: scale(var(--logo-scale-mobile)); /* 0.8 */
  }
  
  .header-badges-responsive {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
  }
}
```

## Visual Alignment System

### Baseline Matching
- Payment/delivery badges align with Back to Dashboard CTA baseline
- Store title text shares visual center with logo container
- Perfect vertical distribution across header row

### Shadow Hierarchy
1. **Store Logo**: `var(--store-logo-shadow)` - Enhanced elevation for brand prominence
2. **Payment/Delivery**: `var(--badge-card-style-shadow)` - Matches category pill elevation
3. **Consistent Depth**: All shadows use locked token values

### Color Consistency
- Background gradient uses locked `--header-bg-gradient`
- Badge styling inherits category pill color tokens
- Typography colors locked for hierarchy maintenance

## Governance Protocol

### Immutable Rules
1. **No Token Overrides**: Header components cannot override global token values
2. **No Gradient Modifications**: Background gradient locked across all storefronts
3. **No Logo Distortion**: 1:1 aspect ratio enforcement absolute
4. **No Spacing Variations**: Vertical spacing tokens immutable

### Protected Elements
- **Logo Container**: Padding, shadow, and aspect ratio locked
- **Typography Hierarchy**: Font sizes and spacing preserved
- **Badge Styling**: Inherits category pill token system exactly
- **Responsive Scaling**: Breakpoint behaviors and scale factors fixed

### Future Inheritance
All seller and buyer storefront headers must:
1. **Use Header Tokens**: Inherit background, spacing, and shadow tokens
2. **Respect Typography**: Apply locked title and subtitle classes
3. **Maintain Badges**: Use payment-delivery-badge class exclusively
4. **Follow Responsive**: Apply locked responsive scaling behavior

## Implementation Status

### Completed Features - FINAL VERSION
- ✅ **Background Gradient**: Locked icy-blue header gradient token with 16px border radius
- ✅ **Logo Container**: 1:1 aspect ratio with reduced 12px padding and enhanced shadow
- ✅ **Typography System**: Store title, powered-by, and subtitle locked classes
- ✅ **Badge Styling**: Payment/delivery badges inherit category pill tokens with enhanced shadow
- ✅ **Perfect Vertical Alignment**: Three-block system (Store Info + Badges + CTA) with baseline alignment
- ✅ **Responsive Behavior**: Mobile stacking and tablet scaling with locked factors
- ✅ **Header Container**: Unified locked styling with premium elevation and backdrop blur

### Token Integration
- ✅ **CTA Compatibility**: Header tokens align with existing CTA system
- ✅ **Category Pill Inheritance**: Badges use identical styling tokens
- ✅ **Global Consistency**: All spacing and shadow values from locked system
- ✅ **Legacy Support**: Backward compatibility maintained through class mapping

## Quality Assurance

### Header Token Validation
- ✅ Background uses `var(--header-bg-gradient)` exclusively
- ✅ Logo shadows use `var(--store-logo-shadow)` token
- ✅ Typography uses locked font size and weight tokens
- ✅ Badge styling inherits `var(--badge-card-style-*)` tokens
- ✅ Responsive scaling uses locked scale factor tokens

### Visual Hierarchy Compliance
- ✅ Store logo has enhanced elevation prominence
- ✅ Badges match category pill styling exactly
- ✅ Typography maintains clear hierarchy with locked spacing
- ✅ Baseline alignment achieved across all header elements

### Cross-Platform Consistency
- ✅ Seller storefront header locked and documented
- ✅ Token system ready for buyer storefront inheritance
- ✅ Responsive behavior standardized across breakpoints
- ✅ Premium design quality maintained at all screen sizes

## Usage Examples

### Implementing Header in New Storefront
```jsx
<div className="header-container" style={{ background: 'var(--header-bg-gradient)' }}>
  <div className="store-logo-container">
    <img src={logoUrl} alt="Store logo" />
  </div>
  
  <div className="store-info">
    <h1 className="store-title-locked">{storeName}</h1>
    <div className="powered-by-locked">Powered by ShopLynk</div>
    <div className="store-subtitle-locked">Online Store</div>
  </div>
  
  <div className="header-badges">
    <button className="payment-delivery-badge">
      Payment Methods
    </button>
  </div>
</div>
```

### Adding New Badge Type
```css
.new-badge-type {
  background: var(--badge-card-style-bg);
  border: var(--badge-card-style-border);
  border-radius: var(--badge-card-style-radius);
  padding: var(--badge-card-style-padding);
  box-shadow: var(--badge-card-style-shadow);
  transition: var(--token-transition-default);
}
```

---

**Document Owner**: ShopLynk Design System Team  
**Last Updated**: August 29, 2025  
**Next Review**: September 15, 2025  
**Status**: LOCKED - Header/banner token system complete and ready for inheritance across all storefronts