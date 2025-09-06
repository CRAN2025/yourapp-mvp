/**
 * ShopLynk Global Design System
 * Centralized theme tokens for consistent UI across all components
 */

export const colors = {
  // Brand Colors
  primary: '#3B82F6',     // ShopLynk Blue
  accent: '#9333EA',      // CTAs / highlights
  
  // Surface Colors
  surface: '#FFFFFF',     // cards
  background: '#F8FAFC',  // global background
  
  // Status Colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Neutral Colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
};

export const typography = {
  // Font Family
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
  },
  
  // Dynamic Responsive Headings
  headings: {
    h1: 'clamp(28px, 4vw, 48px)',
    h2: 'clamp(24px, 3vw, 32px)',
    h3: 'clamp(20px, 2.5vw, 28px)',
    h4: 'clamp(18px, 2vw, 24px)',
    h5: 'clamp(16px, 1.5vw, 20px)',
    h6: 'clamp(14px, 1.25vw, 18px)'
  },
  
  // Text Colors
  textColors: {
    light: {
      primary: colors.gray[900],
      secondary: colors.gray[700],
      muted: colors.gray[500]
    },
    dark: {
      primary: colors.gray[100],
      secondary: colors.gray[200],
      muted: colors.gray[400]
    }
  }
};

export const shadows = {
  // Consistent elevation system
  card: '0 2px 10px rgba(0, 0, 0, 0.08)',
  modal: '0 10px 40px rgba(0, 0, 0, 0.15)',
  button: '0 1px 3px rgba(0, 0, 0, 0.1)',
  hover: '0 4px 15px rgba(0, 0, 0, 0.12)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.1)'
};

export const spacing = {
  // Consistent spacing scale
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
};

export const breakpoints = {
  // Mobile-first responsive breakpoints
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  full: '9999px'
};

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  return {
    '--color-primary': colors.primary,
    '--color-accent': colors.accent,
    '--color-surface': colors.surface,
    '--color-background': colors.background,
    '--color-success': colors.success,
    '--color-error': colors.error,
    '--color-warning': colors.warning,
    '--color-info': colors.info,
    '--shadow-card': shadows.card,
    '--shadow-modal': shadows.modal,
    '--shadow-button': shadows.button,
    '--shadow-hover': shadows.hover,
    '--shadow-focus': shadows.focus,
    '--font-family-sans': typography.fontFamily.sans.join(', '),
    '--heading-h1': typography.headings.h1,
    '--heading-h2': typography.headings.h2,
    '--heading-h3': typography.headings.h3,
    '--heading-h4': typography.headings.h4,
    '--heading-h5': typography.headings.h5,
    '--heading-h6': typography.headings.h6
  };
};

export default {
  colors,
  typography,
  shadows,
  spacing,
  breakpoints,
  borderRadius,
  generateCSSVariables
};