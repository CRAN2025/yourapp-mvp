# ShopLynk Global Header Tokens - LOCKED v2.0

**Implementation Date**: August 29, 2025  
**Status**: FINAL GLOBAL TOKEN SYSTEM LOCKED AND ENFORCED  
**Scope**: Universal header tokens for seller and buyer storefronts

## Overview

This document establishes the FINAL global header token system for all ShopLynk storefronts, ensuring perfect visual consistency, baseline alignment, and token inheritance across seller and buyer interfaces.

## Global Header Token Architecture

### Core Layout Tokens
```css
--header-layout: 24px; /* Vertical padding + baseline alignment */
--header-bg-gradient: linear-gradient(135deg, rgba(240, 247, 255, 0.95) 0%, rgba(248, 251, 255, 0.92) 40%, rgba(255, 255, 255, 0.9) 100%);
--header-spacing-logo-badges: 16px; /* Gap between logo block and badges */
--header-spacing-badges-cta: 20px; /* Gap between badges and CTA */
```

### Store Title Font Tokens - Global
```css
--store-title-font: 22px;
--store-title-weight: 700;
--store-title-color: #111827;
--store-subtitle-font: 13px;
--store-subtitle-color: #6B7280;
--store-powered-by-font: 14px;
--store-powered-by-color: #3B82F6;
--store-description-font: 14px;
--store-description-color: #6B7280;
```

### Badge Card Style Tokens - Global
```css
--badge-card-style-bg: #FFFFFF;
--badge-card-style-radius: 12px;
--badge-card-style-shadow: 0px 2px 8px rgba(0, 0, 0, 0.05);
--badge-card-style-icon-size: 18px;
--badge-card-style-font-size: 14px;
--badge-card-style-hover-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
```

### CTA Primary Style Tokens - Global
```css
--cta-primary-style: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
--cta-primary-font-size: 15px;
--cta-primary-font-weight: 600;
--cta-primary-padding: 10px 24px;
--cta-primary-radius: 12px;
--cta-primary-hover-shadow: 0px 6px 18px rgba(80, 155, 255, 0.35);
```

## Global Header Layout Rules

### 1. Three-Zone Baseline Alignment
- **LEFT ZONE**: Logo + Store Name + Subtitle (12px internal gap)
- **MIDDLE ZONE**: Payment/Delivery badges (12px spacing between badges)
- **RIGHT ZONE**: Single CTA button (flex-shrink: 0)

### 2. Horizontal Spacing Requirements
- Gap between logo block → badges: `var(--header-spacing-logo-badges)` (16px)
- Gap between badges → CTA: `var(--header-spacing-badges-cta)` (20px)
- Header container padding: `var(--header-layout)` (24px top/bottom)

### 3. Typography Hierarchy - Locked
| Element | Font Size | Weight | Color | Line Height |
|---------|-----------|--------|-------|-------------|
| Store Name | 22px | 700 | #111827 | 28px |
| "Powered by ShopLynk" | 14px | 500 | #3B82F6 | 20px |
| Store Description | 14px | 400 | #6B7280 | 1.5 |
| Subtitle ("Online Store") | 13px | 400 | #6B7280 | 20px |

### 4. Badge Card Requirements
- Background: `var(--badge-card-style-bg)` (#FFFFFF)
- Border radius: `var(--badge-card-style-radius)` (12px)
- Box shadow: `var(--badge-card-style-shadow)` (0px 2px 8px rgba(0, 0, 0, 0.05))
- Icon size: `var(--badge-card-style-icon-size)` (18px)
- Font size: `var(--badge-card-style-font-size)` (14px)
- Hover state: `var(--badge-card-style-hover-shadow)` (0px 4px 12px rgba(0, 0, 0, 0.08))

### 5. CTA Styling Requirements
- Gradient: `var(--cta-primary-style)` (linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%))
- Font size: `var(--cta-primary-font-size)` (15px)
- Font weight: `var(--cta-primary-font-weight)` (600)
- Padding: `var(--cta-primary-padding)` (10px 24px)
- Border radius: `var(--cta-primary-radius)` (12px)
- Hover shadow: `var(--cta-primary-hover-shadow)` (0px 6px 18px rgba(80, 155, 255, 0.35))

## Locked CSS Classes

### Global Header Layout
```css
.header-container-locked {
  background: var(--header-bg-gradient);
  border-radius: 16px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.header-row-locked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--header-layout);
  gap: var(--header-spacing-badges-cta);
}

.store-info-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.badges-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-left: var(--header-spacing-logo-badges);
}

.cta-block {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
```

### Global Typography Classes
```css
.store-title-locked {
  font-size: var(--store-title-font);
  font-weight: var(--store-title-weight);
  color: var(--store-title-color);
  line-height: 28px;
  margin-bottom: 4px;
}

.powered-by-locked {
  font-size: var(--store-powered-by-font);
  font-weight: 500;
  color: var(--store-powered-by-color);
  line-height: 20px;
  margin-bottom: 2px;
  letter-spacing: -0.2px;
}

.store-subtitle-locked {
  font-size: var(--store-subtitle-font);
  font-weight: 400;
  color: var(--store-subtitle-color);
  line-height: 20px;
}

.store-description-locked {
  font-size: var(--store-description-font);
  font-weight: 400;
  color: var(--store-description-color);
  line-height: 1.5;
  margin-top: 4px;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@media (max-width: 767px) {
  .store-description-locked {
    -webkit-line-clamp: 1;
    max-width: 100%;
  }
}
```

### Global Badge Classes
```css
.payment-delivery-badge {
  background: var(--badge-card-style-bg);
  border-radius: var(--badge-card-style-radius);
  box-shadow: var(--badge-card-style-shadow);
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: var(--badge-card-style-font-size);
  color: #6B7280;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.payment-delivery-badge:hover {
  box-shadow: var(--badge-card-style-hover-shadow);
  transform: translateY(-1px);
}

.payment-delivery-badge svg {
  width: var(--badge-card-style-icon-size);
  height: var(--badge-card-style-icon-size);
}
```

## Implementation Guidelines

### For Seller Storefronts
1. Use `.header-container-locked` for header wrapper
2. Apply `.header-row-locked` for three-zone layout
3. Use `.store-title-locked`, `.powered-by-locked`, `.store-subtitle-locked` classes
4. Conditionally render `.store-description-locked` only when `seller.storeDescription` exists
5. Apply `.payment-delivery-badge` for all badges
6. Style CTAs with `var(--cta-primary-style)` token

### For Buyer Storefronts
1. Inherit all global tokens exactly as defined
2. Use same `.header-container-locked` structure
3. Apply identical typography classes including conditional description
4. Maintain same badge styling with `.payment-delivery-badge`
5. Use same CTA token system for consistency

### Dynamic Description Requirements
- **Data Source**: Pull from `seller.storeDescription` field directly
- **Conditional Rendering**: Only display when description exists (no empty gaps)
- **Reactivity**: Updates automatically when seller modifies description
- **No Fallbacks**: Never display placeholder or hardcoded content

### Responsive Behavior
```css
/* Tablet (768-1279px) */
@media (max-width: 1279px) {
  .store-title-locked {
    font-size: var(--store-title-font-tablet, 20px);
  }
}

/* Mobile (≤767px) */
@media (max-width: 767px) {
  .header-row-locked {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  
  .store-info-block {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .badges-block {
    justify-content: center;
    margin-left: 0;
  }
  
  .cta-block {
    width: 100%;
    justify-content: center;
  }
}
```

## Governance Rules

### Locked Elements - DO NOT MODIFY
1. **Token Values**: All CSS custom property values are locked
2. **Class Names**: All `.header-*-locked` classes are immutable
3. **Typography Hierarchy**: Font sizes, weights, and colors are fixed
4. **Spacing System**: All gap and padding values are standardized
5. **Badge Styling**: All badge appearance rules are consistent
6. **CTA Gradients**: Primary gradient and hover states are locked

### Approved Usage
1. **Seller Storefronts**: Apply all tokens as defined
2. **Buyer Storefronts**: Inherit tokens without modification
3. **Category Pills**: Can reference badge tokens for consistency
4. **Global CTAs**: Must use `var(--cta-primary-style)` token

### Forbidden Actions
1. **No hardcoded values** in place of tokens
2. **No token value overrides** without governance approval
3. **No layout structure changes** to three-zone system
4. **No typography deviations** from locked hierarchy
5. **No badge styling modifications** outside of token system

## Implementation Status

### ✅ Completed - LOCKED
- Global token architecture established
- Three-zone baseline alignment perfected
- Typography hierarchy locked across all elements
- Badge card styling standardized
- CTA primary style tokens defined
- Responsive behavior specifications locked
- Complete CSS class library documented

### 🔒 Governance Active
- All header modifications require explicit approval
- Token inheritance system ready for buyer storefronts
- Complete visual consistency across platform ensured
- Future-proof architecture for scalable design system

**FINAL STATUS**: Global header token system LOCKED and ready for universal implementation across all ShopLynk storefronts.