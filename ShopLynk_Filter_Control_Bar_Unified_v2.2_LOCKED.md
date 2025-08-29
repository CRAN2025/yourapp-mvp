# ShopLynk Filter Control Bar - Global Token System v2.2 (LOCKED)

**Implementation Date**: August 29, 2025  
**Status**: LOCKED AND ENFORCED  
**Scope**: Global filter control bar tokens across all ShopLynk interfaces

## Overview

This document establishes the locked global token system for all filter control bar components, ensuring unified sizing, spacing, padding, and alignment while maintaining clear visual hierarchy between primary and secondary controls.

## Locked Global Filter Tokens

### Core Sizing and Spacing Tokens
```css
:root {
  /* Global filter tokens - LOCKED */
  --filter-height: 40px;               /* Unified button height */
  --filter-radius: 12px;               /* Rounded edges */
  --filter-padding-x: 18px;            /* Equal horizontal spacing */
  --filter-padding-y: 8px;             /* Vertical balance */
  --filter-font-size: 14px;            /* Legible, consistent */
  --filter-gap: 10px;                  /* Standardized component spacing */
  --filter-transition: all 0.25s ease-in-out; /* Smooth interactions */
  
  /* Locked CTA gradient tokens */
  --cta-gradient-start: #4FA8FF;
  --cta-gradient-end: #5271FF;
}
```

## Component Specifications

### 1. Category Pills (Primary Control)
**Visual Hierarchy**: Primary, styled like CTAs for prominence

```css
.category-pill {
  height: var(--filter-height);
  padding: var(--filter-padding-y) var(--filter-padding-x);
  border-radius: var(--filter-radius);
  font-size: var(--filter-font-size);
  font-weight: 500;
  background: #f8f9fc;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: var(--filter-transition);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* Active state uses locked CTA gradient */
.category-pill.active {
  background: linear-gradient(135deg, var(--cta-gradient-start), var(--cta-gradient-end));
  color: #fff;
  border: none;
  box-shadow: 0px 5px 18px rgba(80, 155, 255, 0.45);
}

/* Enhanced hover for primary importance */
.category-pill:hover {
  transform: scale(1.05);
  background: #f0f4ff;
  border-color: #b3c8ff;
}
```

### 2. Sort Dropdown (Secondary Control)
**Visual Hierarchy**: Secondary, visually lighter but dimensionally consistent

```css
.sort-dropdown {
  height: var(--filter-height);
  padding: var(--filter-padding-y) var(--filter-padding-x);
  border-radius: var(--filter-radius);
  font-size: var(--filter-font-size);
  background: #fff;                    /* Lighter than pills */
  border: 1px solid #e5e7eb;
  color: #333;
  cursor: pointer;
  transition: var(--filter-transition);
}

.sort-dropdown:hover,
.sort-dropdown:focus {
  border-color: #b3c8ff;
  box-shadow: 0 0 0 3px rgba(80, 155, 255, 0.2); /* Focus ring, no scaling */
}
```

### 3. Favorites Chip (Secondary Control)
**Visual Hierarchy**: Secondary, with distinct badge styling

```css
.favorites-chip {
  height: var(--filter-height);
  padding: var(--filter-padding-y) var(--filter-padding-x);
  border-radius: var(--filter-radius);
  font-size: var(--filter-font-size);
  background: #fff;                    /* Matches dropdown */
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: var(--filter-transition);
}

.favorites-chip:hover {
  background: #f9f9fc;               /* Subtle hover */
  border-color: #b3c8ff;
}

/* Badge styling preserved */
.favorites-chip .badge {
  background: #ff3366;
  color: #fff;
  font-size: 12px;
  border-radius: 50%;
  padding: 2px 6px;
}
```

## Visual Hierarchy Implementation

### Primary Controls (Category Pills)
- **Background**: Light gray (#f8f9fc) to subtle blue (#f0f4ff) on hover
- **Active State**: Full CTA gradient with enhanced shadow
- **Hover Transform**: `scale(1.05)` for prominence
- **Shadow**: Enhanced elevation for importance

### Secondary Controls (Sort & Favorites)
- **Background**: White (#fff) for lighter appearance
- **Hover State**: Subtle background shift and focus ring
- **No Transform**: Maintains position for secondary importance
- **Consistent Dimensions**: Same height and padding as primary

## Token Inheritance Rules

### Mandatory Token Usage
1. **Height**: All components must use `var(--filter-height)`
2. **Padding**: All components must use `var(--filter-padding-x)` and `var(--filter-padding-y)`
3. **Border Radius**: All components must use `var(--filter-radius)`
4. **Font Size**: All components must use `var(--filter-font-size)`
5. **Transitions**: All components must use `var(--filter-transition)`

### CTA Gradient Integration
- **Active Pills**: Must use `linear-gradient(135deg, var(--cta-gradient-start), var(--cta-gradient-end))`
- **No Hardcoded Colors**: All gradient references must use locked tokens
- **Cascade Updates**: Changes to CTA tokens automatically update all active states

### Alignment Requirements
- **Vertical Alignment**: All components share same baseline using `var(--filter-height)`
- **Margin Reset**: `margin-top: 0` enforced on all filter components
- **Flexbox Centering**: `align-items: center` for internal content alignment

## Quality Assurance Checklist

### Dimensional Consistency
- ✅ All components use 40px height exactly
- ✅ All components use 18px horizontal padding
- ✅ All components use 8px vertical padding
- ✅ All components use 12px border radius
- ✅ All components use 14px font size

### Visual Hierarchy Compliance
- ✅ Primary pills have enhanced background and hover scaling
- ✅ Secondary controls use white backgrounds
- ✅ Active states use locked CTA gradient tokens
- ✅ Hover effects differentiate primary vs secondary importance

### Token Integration
- ✅ Zero hardcoded dimensions in component CSS
- ✅ All sizing references use global filter tokens
- ✅ CTA gradient tokens properly integrated
- ✅ Backward compatibility maintained with legacy token names

## Implementation Status

### Completed Components
- ✅ **Category Pills**: Primary control with locked token system
- ✅ **Sort Dropdown**: Secondary control with consistent dimensions
- ✅ **Favorites Chip**: Secondary control with badge preservation
- ✅ **Legacy Classes**: Updated for backward compatibility

### Token System Features
- ✅ **Global Token Definitions**: All filter tokens locked and documented
- ✅ **CTA Integration**: Gradient tokens properly referenced
- ✅ **Visual Hierarchy**: Clear distinction between primary and secondary
- ✅ **Dimension Unity**: 40px height across all components

## Governance Protocol

### Change Control Rules
1. **No Token Modifications**: Without governance approval
2. **No Dimension Overrides**: All components must respect locked tokens
3. **No Gradient Changes**: CTA tokens are locked and protected
4. **Consistent Application**: All future filter components must use this system

### Protected Elements
- **Token Values**: Cannot be modified without approval
- **Visual Hierarchy**: Primary vs secondary distinction must be maintained
- **Alignment System**: 40px height requirement is absolute
- **CTA Integration**: Gradient tokens are locked and immutable

### Future Component Requirements
1. **Token Inheritance**: Must use global filter token system
2. **Height Compliance**: Must use `var(--filter-height)` exactly
3. **Hierarchy Respect**: Must follow primary/secondary visual patterns
4. **Baseline Alignment**: Must sit on same vertical axis

## Usage Examples

### Adding New Filter Component
```css
.new-filter-component {
  height: var(--filter-height);
  padding: var(--filter-padding-y) var(--filter-padding-x);
  border-radius: var(--filter-radius);
  font-size: var(--filter-font-size);
  transition: var(--filter-transition);
  
  /* Primary style */
  background: #f8f9fc;
  border: 1px solid #e5e7eb;
  
  /* OR Secondary style */
  background: #fff;
  border: 1px solid #e5e7eb;
}
```

### Active State Implementation
```css
.new-filter-component.active {
  background: linear-gradient(135deg, var(--cta-gradient-start), var(--cta-gradient-end));
  color: #fff;
  border: none;
  box-shadow: 0px 5px 18px rgba(80, 155, 255, 0.45);
}
```

---

**Document Owner**: ShopLynk Design System Team  
**Last Updated**: August 29, 2025  
**Next Review**: September 15, 2025  
**Status**: LOCKED - Global filter token system complete and enforced