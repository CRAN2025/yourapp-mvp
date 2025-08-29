/**
 * ShopLynk Enterprise Design System - Centralized Theme Configuration
 * Unified color tokens for perfect landing page alignment
 * 
 * GLOBAL CTA BUTTON STANDARD v2.1 (LOCKED)
 * - Gradient: #4FA8FF to #5271FF
 * - Shadow: 0 6px 18px rgba(80, 155, 255, 0.45)
 * - Typography: 16px, 600 weight, 0.3px letter-spacing
 * - Padding: 14px 28px, Border-radius: 14px
 * - Hover: scale(1.03), enhanced shadow and brighter gradient
 */

export const colors = {
  // Primary brand colors (landing page matched)
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  
  // Background system (icy blueprint)
  icyBackgroundStart: '#F9FBFF',
  icyBackgroundEnd: '#F3F7FF',
  backgroundIcy: '#F9FBFF',
  backgroundSecondary: '#F3F7FF',
  
  // Neutral palette (landing page neutrals)
  neutralLight: '#F9FAFB',
  neutralBorder: '#E5EAF5',
  neutralText: '#6B7280',
  neutralDark: '#111827',
  
  // Accent colors
  accentRed: '#F43F5E',
  accentRedLight: '#FEF2F2',
  accentRedBorder: '#FECACA',
  
  // Interactive states
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
};

export const shadows = {
  // Micro-elevations
  micro: '0 2px 6px rgba(0, 0, 0, 0.04)',
  
  // Component shadows (pixel-perfect landing page match)
  card: '0 4px 12px rgba(0, 0, 0, 0.06)',
  button: '0 8px 24px rgba(59, 130, 246, 0.3)',
  buttonHover: '0 12px 28px rgba(59, 130, 246, 0.4)',
  
  // GLOBAL CTA BUTTON SHADOWS (LOCKED v2.1)
  ctaStandard: '0 6px 18px rgba(80, 155, 255, 0.45)',
  ctaHover: '0 8px 24px rgba(80, 155, 255, 0.55)',
  
  // Avatar and logo
  avatar: '0 8px 24px rgba(59, 130, 246, 0.12)',
  
  // Pills and chips
  pill: '0 4px 12px rgba(59, 130, 246, 0.25)',
  pillHover: '0 4px 10px rgba(59, 130, 246, 0.12)',
  
  // Favorites badge (unified treatment)
  favoritesBadge: '0 2px 6px rgba(244, 63, 94, 0.4)'
};

export const gradients = {
  // Primary gradients (landing page matched)
  primary: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
  primaryHover: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
  
  // GLOBAL CTA BUTTON STANDARD (LOCKED v2.1)
  ctaStandard: 'linear-gradient(135deg, #4FA8FF 0%, #5271FF 100%)',
  ctaHover: 'linear-gradient(135deg, #5ABFFF 0%, #5F7AFF 100%)',
  
  // Background gradients
  backgroundMain: 'linear-gradient(135deg, #F9FBFF 0%, #F3F7FF 100%)',
  searchCard: 'linear-gradient(135deg, #F9FBFF 0%, rgba(255, 255, 255, 0.95) 100%)'
};

export const spacing = {
  // Typography margins
  titleBottom: '4px',
  poweredByBottom: '4px',
  
  // Component padding
  buttonPrimary: '12px 28px',
  buttonSecondary: '10px 20px',
  
  // GLOBAL CTA BUTTON SPACING (LOCKED v2.1)
  ctaStandard: '14px 28px',
  
  logoContainer: '16px',
  searchInput: '12px 16px'
};

export const typography = {
  // Store title
  storeTitle: {
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '1.2',
    color: colors.neutralDark
  },
  
  // Powered by text
  poweredBy: {
    fontSize: '14px',
    fontWeight: '500',
    color: colors.primary
  },
  
  // Subtitle
  subtitle: {
    fontSize: '13px',
    fontWeight: '400',
    color: colors.neutralText,
    lineHeight: '1.4'
  }
};

export const borderRadius = {
  card: '12px',
  button: '12px',
  
  // GLOBAL CTA BUTTON RADIUS (LOCKED v2.1)
  ctaStandard: '14px',
  
  avatar: '16px',
  pill: '12px'
};

// Export complete theme object
export const theme = {
  colors,
  shadows,
  gradients,
  spacing,
  typography,
  borderRadius
};

export default theme;