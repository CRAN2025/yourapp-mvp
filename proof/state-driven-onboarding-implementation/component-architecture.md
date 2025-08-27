# Component Architecture - State-Driven Onboarding System

## Architecture Overview

### Data Flow Architecture
```
User Action → CTA Navigation → Route Guards → State Management → UI Components
     ↓              ↓              ↓              ↓              ↓
  Marketing → ctaNavigation.ts → Guards → useOnboardingProgress → Onboarding.tsx
```

### Component Hierarchy
```
App.tsx
├── MarketLanding.tsx (uses ctaNavigation.ts)
├── OnboardingGuard.tsx
│   └── Onboarding.tsx (uses useOnboardingProgress.ts)
├── AppGuard.tsx
│   ├── Products.tsx
│   ├── Analytics.tsx
│   ├── Orders.tsx
│   ├── Settings.tsx
│   ├── Storefront.tsx
│   └── Admin.tsx
└── Auth.tsx
```

## Component Details

### 1. `useOnboardingProgress.ts` - State Management Hook

#### Purpose
Central state management for onboarding progress with Firestore persistence.

#### Key Methods
```typescript
const {
  onboardingState,     // Current state object
  saveStep,           // Save individual step data
  completeOnboarding, // Mark onboarding complete
  canAccessStep,      // Validate step access
  getNextStep,        // Get next valid step
  isCompleted,        // Check completion status
  loading             // Loading state
} = useOnboardingProgress();
```

#### State Structure
```typescript
interface OnboardingState {
  status: 'not_started' | 'in_progress' | 'completed';
  lastCompletedStep: number; // 0-4
  steps: {
    1?: { storeName, storeDescription, category, savedAt };
    2?: { businessEmail, country, city, businessType, whatsappNumber, savedAt };
    3?: { deliveryOptions, paymentMethods, savedAt };
    4?: { confirmed, savedAt };
  };
}
```

#### Firebase Integration
- **Document Path**: `/users/{uid}`
- **Update Method**: `setDoc()` with merge
- **Real-time**: Responds to Firestore changes
- **Error Handling**: Graceful fallbacks with console logging

### 2. `OnboardingGuard.tsx` - Onboarding Route Protection

#### Purpose
Protects onboarding routes and enforces step access rules.

#### Protection Logic
```typescript
// Authentication check
if (!user) navigate('/auth');

// Completion check
if (status === 'completed') navigate('/app');

// Step access validation
if (requiredStep && !canAccessStep(requiredStep)) {
  navigate(`/onboarding?step=${getNextStep()}`);
}
```

#### Features
- Loading states during auth/data fetch
- Automatic redirection for invalid access
- Support for specific step requirements
- Non-blocking for valid access

### 3. `AppGuard.tsx` - Application Route Protection

#### Purpose
Protects application routes, ensuring completed onboarding.

#### Protection Logic
```typescript
// Authentication check
if (!user) navigate('/auth');

// Onboarding completion check
if (status !== 'completed') {
  const nextStep = getNextStep() || 1;
  navigate(`/onboarding?step=${nextStep}`);
}
```

#### Features
- Blocks incomplete users from app access
- Smart redirection to proper onboarding step
- Loading states during validation
- Seamless user experience

### 4. `ctaNavigation.ts` - Centralized Navigation Logic

#### Purpose
Unified navigation logic for all CTA interactions.

#### Core Functions

##### `handleCreateStoreCTA()`
```typescript
// Anonymous users
if (!user) navigate('/auth');

// Completed users  
if (status === 'completed') navigate('/app');

// Incomplete users
const nextStep = lastCompletedStep + 1;
navigate(`/onboarding?step=${nextStep}`);
```

##### `handleSignInCTA()`
```typescript
// Direct navigation to auth
navigate('/auth');
```

##### `handleLogoCTA()`
```typescript
// Context-aware logo navigation
if (currentRoute === '/') return; // Stay on marketing
if (currentRoute.startsWith('/onboarding')) navigate('/');
if (currentRoute.startsWith('/app')) {
  return status === 'completed' ? navigate('/app') : navigate('/');
}
navigate('/'); // Default to marketing
```

### 5. `Onboarding.tsx` - State-Driven Onboarding UI

#### Purpose
Multi-step onboarding form with state persistence and validation.

#### Step Structure
```typescript
// Step 1: Store Details
- storeName (3-80 chars)
- storeDescription (20-500 chars)  
- category (enum selection)

// Step 2: Business Information
- businessEmail (optional email)
- country (required selection)
- city (required string)
- businessType (individual/business)
- whatsappNumber (validated phone)

// Step 3: Delivery & Payment
- deliveryOptions (multi-select array)
- paymentMethods (multi-select array)

// Step 4: Confirmation
- confirmed (required boolean)
- Review all previous data
```

#### Features
- Form pre-population from saved state
- Real-time validation with Zod schemas
- Progress tracking with visual indicators
- Error handling with user feedback
- Step-by-step navigation with back/forward
- Responsive design with mobile optimization

### 6. Updated `App.tsx` - Route Configuration

#### Purpose
Central routing with integrated guard protection.

#### Route Protection Matrix
```typescript
// Public routes (no guards)
'/' → MarketLanding
'/auth' → Auth
'/store/:sellerId' → StorefrontPublic
'/terms', '/privacy', etc. → Legal pages

// Onboarding routes (OnboardingGuard)
'/onboarding' → Onboarding

// App routes (AppGuard)  
'/products' → Products
'/analytics' → Analytics
'/orders' → Orders
'/settings' → Settings
'/storefront' → Storefront
'/admin' → Admin

// Special routes
'/app' → AppRouter (redirects to /products)
'/upgrade' → AuthGuard (basic auth only)
```

## State Flow Diagrams

### New User Journey
```
Marketing → "Create Store" → Auth → Sign Up → Onboarding Step 1
     ↓
Step 1 (Store Details) → Step 2 (Business Info) → Step 3 (Delivery/Payment) → Step 4 (Confirm)
     ↓
Complete → Products Dashboard
```

### Returning User Journey
```
Any Route → Guard Check → Authentication Status?
     ↓                           ↓
Not Authenticated      Authenticated
     ↓                           ↓
   /auth              Onboarding Complete?
                             ↓           ↓
                         Yes            No
                         ↓              ↓
                    Allow Access    Next Step
```

### Step Access Validation
```
URL: /onboarding?step=N → canAccessStep(N)?
                              ↓         ↓
                            Yes        No
                             ↓         ↓
                        Show Step   Redirect to getNextStep()
```

## Configuration Management

### `shared/config.ts` - Centralized Constants

```typescript
// Contact information
export const CONTACT_EMAIL = "brock1kai@gmail.com";
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

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
```

## Firebase Integration

### Enhanced `firebase.ts`
```typescript
// Added Firestore support
import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(app);

// Existing services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
```

### Data Structure in Firestore
```
/users/{uid}
├── onboarding: OnboardingState
├── storeId?: string
├── email: string
├── createdAt: timestamp
└── lastLoginAt: timestamp
```

## Error Handling Strategy

### Component Level
- Loading states during async operations
- Error boundaries for component failures
- User-friendly error messages
- Graceful degradation

### Navigation Level
- Fallback routes for invalid states
- Default redirections for edge cases
- URL validation with guard protection
- State consistency checks

### Data Level
- Firestore error handling
- Network failure recovery
- State synchronization
- Conflict resolution

## Performance Considerations

### State Management
- Firestore real-time listeners only when needed
- Local state caching to reduce API calls
- Optimistic updates for better UX
- Debounced form saves

### Component Rendering
- Conditional rendering based on state
- Loading spinners for better perceived performance
- Minimal re-renders with proper dependency arrays
- Code splitting for onboarding components

## Testing Strategy

### Unit Tests
- Hook functionality (`useOnboardingProgress`)
- Navigation logic (`ctaNavigation.ts`)
- Component rendering (guards)
- Form validation (onboarding)

### Integration Tests
- Route protection flows
- State persistence across refreshes
- Multi-tab consistency
- Error scenario handling

### E2E Tests
- Complete user journeys
- CTA functionality
- Cross-browser compatibility
- Mobile responsiveness

## Status: Architecture Complete ✅

All components implemented with proper separation of concerns, state management, and error handling.