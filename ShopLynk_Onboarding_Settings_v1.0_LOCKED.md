# ShopLynk Onboarding & Settings Baseline v1.0 LOCKED
## Created: August 28, 2025
## Status: LOCKED - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL

## CRITICAL NOTICE
**This is the locked baseline version of ShopLynk's onboarding and settings flows.**
**Any modifications require explicit approval from Senait.**
**If anything breaks, immediately revert to this baseline.**

---

## Protected Components Overview

### 1. Landing → Onboarding → Seller Console Routing

#### Core Routing Files:
- `auth-onboarding-review/router-config.tsx` - Main router configuration
- `auth-onboarding-review/RequireAuth.tsx` - Authentication guard
- `client/src/components/AppGuard.tsx` - Application route protection
- `client/src/components/OnboardingGuard.tsx` - Onboarding-specific protection

#### Key Routes (LOCKED):
```
/ → MarketLanding (public)
/auth → Authentication page
/onboarding/step-1 → Protected onboarding step 1
/onboarding/step-2 → Protected onboarding step 2  
/onboarding/step-3 → Protected onboarding step 3
/dashboard → Protected seller console
/products → Protected product management
/settings → Protected settings management
```

### 2. Onboarding Process Flow (LOCKED)

#### Step Components:
- `auth-onboarding-review/OnboardingLayout.tsx` - Main onboarding container
- `auth-onboarding-review/Step1.tsx` - Business details form
- `auth-onboarding-review/Step2.tsx` - Contact information form
- `auth-onboarding-review/Step3.tsx` - Store setup form
- `client/src/pages/Onboarding.tsx` - Alternative onboarding implementation

#### Step 1 - Business Information (LOCKED SCHEMA):
```typescript
const step1Schema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100),
  businessDescription: z.string().min(10, 'Please provide at least 10 characters').max(500),
  businessType: z.enum(['product', 'service', 'both']),
  targetAudience: z.string().min(5, 'Please describe your target audience').max(200)
});
```

#### Step 2 - Contact Information (LOCKED SCHEMA):
```typescript
const step2Schema = z.object({
  contactEmail: z.string().email('Please enter a valid email address'),
  phone: z.string().refine((phone) => isValidPhoneNumber(phone)),
  whatsappNumber: z.string().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp'])
});
```

#### Step 3 - Store Setup (LOCKED SCHEMA):
```typescript
const step3Schema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100),
  storeSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  storeDescription: z.string().max(300).optional(),
  category: z.string().min(1, 'Please select a category'),
  currency: z.string().min(1, 'Please select a currency')
});
```

### 3. Settings Management (LOCKED)

#### Main Settings File:
- `client/src/pages/Settings.tsx` - Complete settings interface

#### Settings Tabs (LOCKED STRUCTURE):
1. **Store Profile** - Brand management and store information
2. **Contact & Visibility** - Contact details and social media
3. **Payments & Delivery** - Payment methods and delivery options  
4. **Account & Security** - Account management and security

#### Settings Schema (LOCKED):
```typescript
const storeProfileSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storeDescription: z.string().optional(),
  category: z.enum(categories),
  tags: z.string().optional(),
  returnPolicy: z.string().optional(),
  operatingHours: z.string().optional(),
  logoFile: z.instanceof(File).optional(),
  bannerFile: z.instanceof(File).optional(),
});

const contactVisibilitySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  whatsappNumber: z.string().refine((phone) => isValidPhoneNumber(phone)),
  email: z.string().email('Please enter a valid email address'),
  country: z.string().optional(),
  socialMedia: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    facebook: z.string().optional(),
  }).optional(),
  preferredLanguage: z.string().optional(),
});
```

### 4. Firebase Integration (LOCKED)

#### Core Firebase Files:
- `client/src/lib/firebase.ts` - Firebase initialization and config
- `client/src/hooks/use-auth.ts` - Authentication hook and state management
- `client/src/lib/onboarding.ts` - Onboarding progress management
- `client/src/hooks/useOnboardingProgress.ts` - Onboarding state hook
- `client/src/lib/ensureBootstrap.ts` - User/store initialization

#### Firebase Collections (LOCKED STRUCTURE):
- `profiles/{uid}` - User profile documents
- `onboarding/{uid}` - Onboarding progress tracking
- `stores/{storeId}` - Store information
- `sellers/{uid}` - Seller profile data

#### Critical Firebase Operations (LOCKED):
- User authentication state management
- Onboarding progress persistence
- Store data synchronization
- Settings data persistence
- Bootstrap user initialization

### 5. Authentication Flow (LOCKED)

#### Authentication Components:
- `auth-onboarding-review/MarketLanding-CTAs.tsx` - Landing page CTAs
- `client/src/context/AuthContext.tsx` - Authentication context
- Firebase Auth integration with email/password

#### Authentication Guards (LOCKED LOGIC):
```typescript
// RequireAuth - Protects onboarding routes
// AppGuard - Protects main application routes
// OnboardingGuard - Manages onboarding flow progression
```

### 6. Route Protection Logic (LOCKED)

#### Guard Behavior:
1. Unauthenticated users → Redirect to `/auth`
2. Authenticated users with incomplete onboarding → Redirect to next step
3. Authenticated users with complete onboarding → Access to dashboard/settings
4. Anonymous users → Blocked completely

---

## Data Flow Architecture (LOCKED)

### Onboarding Data Flow:
1. User authenticates → `ensureBootstrap()` called
2. Profile/store/onboarding documents created
3. Step completion updates `onboarding/{uid}` document
4. Progress tracked via `useOnboardingProgress()` hook
5. Completion redirects to dashboard

### Settings Data Flow:
1. Settings page loads seller data from Firebase
2. Form modifications update local state
3. Save actions persist to Firebase `sellers/{uid}`
4. Real-time updates via Firebase snapshots

---

## File Dependencies (LOCKED)

### Core Dependencies:
- React Hook Form + Zod validation
- Firebase SDK (auth, firestore, storage)
- Wouter routing
- TanStack React Query
- Tailwind CSS + Radix UI

### Critical Imports (DO NOT MODIFY):
```typescript
// Firebase core
import { auth, db, storage } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

// Forms and validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// UI Components
import { Button, Input, Select, Tabs } from '@/components/ui/*';
import { Form, FormField, FormItem } from '@/components/ui/form';
```

---

## Validation Rules (LOCKED)

### Phone Number Validation:
- Uses `isValidPhoneNumber()` from `@/lib/utils/phone`
- WhatsApp number normalization to E164 format
- Country-specific validation context

### Email Validation:
- Standard email regex via Zod
- Business email optional in onboarding
- Contact email required

### Text Field Limits:
- Business name: 1-100 characters
- Store name: 3-80 characters  
- Descriptions: 10-500 characters
- Store URL: 3-50 characters, lowercase + hyphens only

---

## Current Implementation Status

✅ **WORKING AND LOCKED:**
- Complete onboarding flow (Steps 1-3)
- Settings management (4 tabs)
- Firebase data persistence
- Authentication guards and routing
- Form validation and error handling
- Phone number validation with international support
- Real-time data synchronization

✅ **TESTED AND VERIFIED:**
- User can complete full onboarding process
- Settings save and persist correctly
- Authentication flow works end-to-end
- Route guards prevent unauthorized access
- Form validation catches errors appropriately

---

## GOVERNANCE RULES

### ❌ PROHIBITED ACTIONS WITHOUT APPROVAL:
1. Modifying onboarding step schemas or validation
2. Changing settings form structure or tabs
3. Altering Firebase collection structure or security rules
4. Modifying authentication flow or route guards
5. Changing form validation rules or error messages
6. Updating component file structure or imports
7. Modifying any Firebase read/write operations

### ✅ PERMITTED ACTIONS:
1. Minor styling/CSS adjustments that don't affect layout
2. Adding console.log statements for debugging
3. Updating comments and documentation
4. Adding new routes OUTSIDE onboarding/settings scope

### 🔒 LOCKED BASELINE COMMITMENT:
This baseline represents the stable, working implementation of onboarding and settings.
Any request to modify these flows must include explicit approval from Senait.
In case of any issues or regressions, immediately revert to this baseline version.

---

**Baseline Created:** August 28, 2025  
**Last Verified:** August 28, 2025  
**Status:** PRODUCTION-READY AND LOCKED  
**Next Review:** Upon request with explicit unlock approval