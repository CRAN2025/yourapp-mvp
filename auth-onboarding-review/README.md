# Authentication & Onboarding Review Package

This folder contains all the key files for the ShopLynk authentication and onboarding system for your review.

## 📋 File Overview

### Core Authentication
- **AuthPage.tsx** - Main authentication component with URL-controlled mode (signup/signin)
- **RequireAuth.tsx** - Route guard that blocks unauthenticated users from onboarding
- **authRedirect.ts** - Helper utilities for redirecting unauthenticated users to signup

### Router Configuration  
- **router-config.tsx** - Main App.tsx router setup with all routes and guards

### Onboarding System
- **OnboardingLayout.tsx** - Complete onboarding flow with step management
- **Step1.tsx** - Business information collection
- **Step2.tsx** - Contact information setup  
- **Step3.tsx** - Store creation and configuration
- **onboardingSteps.ts** - Step definitions and navigation logic
- **ensureBootstrap.ts** - Firebase document creation and validation

### CTA Integration
- **MarketLanding-CTAs.tsx** - All "Create Store" buttons from landing page
- **goCreate function** - Main CTA handler that routes authenticated/unauthenticated users

### Firebase Integration
- **firebase.ts** - Firebase configuration and services

### Tests & Dependencies
- **auth-tests.spec.ts** - Playwright tests for auth mode behavior
- **package.json** - Project dependencies (wouter, firebase, etc.)

## 🔄 Authentication Flow

1. **Unauthenticated User Clicks CTA** → `/auth?mode=signup&redirect=/onboarding/step-1`
2. **Auth Component** → Shows "Create your account" interface (URL-controlled)
3. **After Signup/Signin** → Redirects to `/onboarding/step-1`
4. **RequireAuth Guard** → Validates authentication before allowing onboarding access
5. **Onboarding Flow** → Step 1 → Step 2 → Step 3 → Dashboard

## 🛡️ Security Features

- **URL Parameter Validation** - Only internal redirects allowed
- **Route Guards** - RequireAuth blocks direct onboarding access
- **Firebase Rules** - Database-level access control
- **State Synchronization** - Auth mode stays in sync with URL changes

## 🧪 Testing

The package includes comprehensive Playwright tests that verify:
- Auth page honors mode=signup parameter
- Proper heading and button text rendering
- URL state management during mode switching

## 📚 Key Implementation Details

- **URL-Controlled Auth** - No local state override, derives mode from window.location.search
- **Wouter Router** - Lightweight routing with query parameter handling
- **Firebase Integration** - Dual app architecture for analytics isolation
- **Progressive Onboarding** - Step-by-step store creation with validation
- **Bootstrap System** - Idempotent profile/store/onboarding document creation