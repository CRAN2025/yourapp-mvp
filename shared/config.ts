// Contact configuration - single source of truth
export const CONTACT_EMAIL = "brock1kai@gmail.com";
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
export const SUPPORT_EMAIL = CONTACT_EMAIL;
export const SUPPORT_MAILTO = CONTACT_MAILTO;

// Application routes
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  ONBOARDING: '/onboarding',
  APP: '/app',
  SIGNOUT: '/signout'
} as const;

// Onboarding configuration
export const ONBOARDING_STEPS = {
  STORE_DETAILS: 1,
  BUSINESS_INFO: 2,
  BRANDING: 3,
  CONFIRM: 4
} as const;

export const ONBOARDING_STEP_NAMES = {
  1: 'Store Details',
  2: 'Business Information', 
  3: 'Branding',
  4: 'Confirmation'
} as const;