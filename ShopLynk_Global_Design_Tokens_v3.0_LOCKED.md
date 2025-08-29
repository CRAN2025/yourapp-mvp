# ShopLynk Global Design Tokens v3.0 (LOCKED)

**Implementation Date**: August 29, 2025  
**Status**: LOCKED AND ENFORCED  
**Scope**: Universal design tokens for all ShopLynk components

## Overview

This document establishes the comprehensive global design token system for ShopLynk, ensuring all category pills, filters, favorites, CTAs, and future components inherit consistent hierarchy, spacing, hover states, and gradients across the entire application.

## Global Design Tokens - LOCKED SYSTEM

### Primary Gradient Token
**Usage**: Active category pills and all primary CTAs
```css
--token-gradient-primary: linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%);
```

### Button Heights & Spacing
**Usage**: Category pills, filters, favorites - uniform 36px height with perfect vertical centering
```css
--token-button-height: 36px;
--token-button-padding-x: 16px;
--token-button-padding-y: 8px;
```

### Shadows & Elevation Hierarchy
**Usage**: Differentiated elevation for primary vs secondary components
```css
--token-shadow-primary: 0px 5px 18px rgba(80, 155, 255, 0.45);
--token-shadow-primary-hover: 0px 7px 20px rgba(80, 155, 255, 0.55);
--token-shadow-secondary: 0px 2px 6px rgba(0, 0, 0, 0.06);
```

### Interactivity Tokens
**Usage**: Smooth, consistent animations across all interactive components
```css
--token-transition-default: all 0.25s ease-in-out;
--token-hover-scale: 1.05;
--token-hover-brightness: 1.08;
```

### Component-Specific Tokens
**Usage**: Typography, spacing, and special elements
```css
--token-badge-danger: #FF3B5C;
--token-border-radius: 12px;
--token-font-size: 14px;
--token-font-weight: 500;
--token-gap: 10px;
```

## Component Implementation Rules

### Category Pills (Primary Components)
**Visual Hierarchy**: Primary importance with enhanced styling

```css
.category-pill {
  height: var(--token-button-height);
  padding: var(--token-button-padding-y) var(--token-button-padding-x);
  border-radius: var(--token-border-radius);
  font-size: var(--token-font-size);
  font-weight: var(--token-font-weight);
  transition: var(--token-transition-default);
  box-shadow: var(--token-shadow-secondary);
}

/* Active state uses primary gradient */
.category-pill.active {
  background: var(--token-gradient-primary);
  color: #fff;
  box-shadow: var(--token-shadow-primary);
  font-weight: 600; /* Enhanced weight for active state */
}

/* Hover with scale and brightness */
.category-pill:hover {
  transform: scale(var(--token-hover-scale));
  filter: brightness(var(--token-hover-brightness));
}
```

### Newest First Filter Dropdown (Secondary Component)
**Visual Hierarchy**: Secondary - light border, minimal elevation, consistent hover

```css
.sort-dropdown {
  height: var(--token-button-height);
  padding: var(--token-button-padding-y) var(--token-button-padding-x);
  border-radius: var(--token-border-radius);
  font-size: var(--token-font-size);
  font-weight: var(--token-font-weight);
  background: #fff; /* Always secondary background */
  border: 1px solid #e5e7eb;
  box-shadow: var(--token-shadow-secondary);
  transition: var(--token-transition-default);
}

.sort-dropdown:hover {
  filter: brightness(var(--token-hover-brightness));
  border-color: #b3c8ff;
}
```

### Favorites Button (Secondary Component)
**Visual Hierarchy**: Secondary with preserved badge styling

```css
.favorites-chip {
  height: var(--token-button-height);
  padding: var(--token-button-padding-y) var(--token-button-padding-x);
  border-radius: var(--token-border-radius);
  font-size: var(--token-font-size);
  font-weight: var(--token-font-weight);
  background: #fff; /* Matches dropdown treatment */
  border: 1px solid #e5e7eb;
  box-shadow: var(--token-shadow-secondary);
  transition: var(--token-transition-default);
}

.favorites-chip .badge {
  background: var(--token-badge-danger); /* Global danger token */
  color: #fff;
  /* Badge proportions locked - do not modify */
}
```

## Visual Hierarchy System

### Primary Components (Category Pills)
- **Background**: Neutral fill (#f8f9fc) transitioning to gradient when active
- **Active State**: Full primary gradient with enhanced shadow and font weight
- **Interaction**: Scale transform + brightness filter for prominence
- **Elevation**: Enhanced shadows for primary importance

### Secondary Components (Filters & Favorites)
- **Background**: White (#fff) for lighter, secondary appearance
- **Interaction**: Brightness filter only (no scaling) for subtle feedback
- **Elevation**: Minimal shadows maintaining secondary hierarchy
- **Consistency**: Identical dimensions and typography with primary components

## Token Inheritance Rules

### Mandatory Token Usage
All current and future filter components MUST use:

1. **Height**: `var(--token-button-height)` - no exceptions
2. **Padding**: `var(--token-button-padding-x)` and `var(--token-button-padding-y)`
3. **Border Radius**: `var(--token-border-radius)`
4. **Font Size**: `var(--token-font-size)`
5. **Font Weight**: `var(--token-font-weight)` (inactive) / `600` (active)
6. **Transitions**: `var(--token-transition-default)`
7. **Primary Gradient**: `var(--token-gradient-primary)` for all active states
8. **Shadows**: `var(--token-shadow-secondary)` or `var(--token-shadow-primary)`

### Component Classification
**Primary Components** (use gradient when active):
- Category pills
- Main CTAs
- Primary navigation elements

**Secondary Components** (never use gradient):
- Sort dropdowns
- Filter controls
- Utility buttons

## Governance Protocol

### Immutable Rules
1. **No Token Overrides**: Components cannot override global token values
2. **No Gradient Modifications**: Primary gradient is locked across all CTAs
3. **No Height Variations**: 36px height is absolute for all filter components
4. **No Animation Changes**: Hover behaviors must use global tokens

### Protected Elements
- **Badge Sizing**: Current proportions and alignment locked
- **Icon Alignment**: Current vertical centering preserved
- **Visual Hierarchy**: Primary vs secondary distinction immutable
- **Token Values**: Cannot be modified without governance approval

### Future Component Requirements
All new filter, pill, or segmented controls must:
1. **Inherit Global Tokens**: Use token system exclusively
2. **Respect Hierarchy**: Follow primary/secondary classification
3. **Maintain Dimensions**: Use locked height and padding tokens
4. **Apply Consistent Interactions**: Use global hover and transition tokens

## Legacy Compatibility

### Token Mappings
The system maintains backward compatibility through legacy token mappings:

```css
/* Legacy tokens map to new global tokens */
--filter-height: var(--token-button-height);
--filter-radius: var(--token-border-radius);
--filter-padding-x: var(--token-button-padding-x);
--filter-transition: var(--token-transition-default);
--control-gradient: var(--token-gradient-primary);
```

### Migration Strategy
1. **Existing Components**: Automatically inherit new tokens through mappings
2. **No Breaking Changes**: All current functionality preserved
3. **Gradual Adoption**: New components use global tokens directly
4. **Documentation Updates**: All examples reference global token system

## Quality Assurance

### Token Compliance Checklist
- ✅ All components use 36px height exactly
- ✅ All components use 16px horizontal padding
- ✅ All components use 8px vertical padding
- ✅ All components use 12px border radius
- ✅ All components use 14px font size
- ✅ All active states use primary gradient token
- ✅ All hover states use global interaction tokens
- ✅ All transitions use default timing token

### Visual Hierarchy Validation
- ✅ Primary components have gradient capability
- ✅ Secondary components maintain white backgrounds
- ✅ Active states use enhanced font weight (600)
- ✅ Hover behaviors differentiate primary vs secondary
- ✅ Shadow system reflects component importance

## Implementation Status

### Completed Components
- ✅ **Category Pills**: Full global token integration
- ✅ **Sort Dropdown**: Secondary component styling
- ✅ **Favorites Chip**: Secondary with badge preservation
- ✅ **Legacy Classes**: Backward compatibility maintained

### Token System Features
- ✅ **Global Token Definitions**: Complete system established
- ✅ **Visual Hierarchy**: Primary/secondary distinction enforced
- ✅ **Interaction Consistency**: Unified hover and transition behaviors
- ✅ **CTA Integration**: Primary gradient applied consistently

## Usage Examples

### Creating New Primary Component
```css
.new-primary-control {
  height: var(--token-button-height);
  padding: var(--token-button-padding-y) var(--token-button-padding-x);
  border-radius: var(--token-border-radius);
  font-size: var(--token-font-size);
  font-weight: var(--token-font-weight);
  transition: var(--token-transition-default);
  box-shadow: var(--token-shadow-secondary);
}

.new-primary-control.active {
  background: var(--token-gradient-primary);
  color: #fff;
  box-shadow: var(--token-shadow-primary);
  font-weight: 600;
}

.new-primary-control:hover {
  transform: scale(var(--token-hover-scale));
  filter: brightness(var(--token-hover-brightness));
}
```

### Creating New Secondary Component
```css
.new-secondary-control {
  height: var(--token-button-height);
  padding: var(--token-button-padding-y) var(--token-button-padding-x);
  border-radius: var(--token-border-radius);
  font-size: var(--token-font-size);
  font-weight: var(--token-font-weight);
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: var(--token-shadow-secondary);
  transition: var(--token-transition-default);
}

.new-secondary-control:hover {
  filter: brightness(var(--token-hover-brightness));
  border-color: #b3c8ff;
}
```

---

**Document Owner**: ShopLynk Design System Team  
**Last Updated**: August 29, 2025  
**Next Review**: September 15, 2025  
**Status**: LOCKED - Global design token system complete and enforced across all components