# Overview

ShopLynk is an e-commerce platform designed to empower small to medium businesses by providing online storefronts with integrated WhatsApp communication. Its primary purpose is to simplify online sales and customer interaction, offering features like user authentication, product management, analytics, and public storefront capabilities, all built on a React frontend with Firebase as the core backend. The vision is to enable businesses to easily establish a robust online presence and foster direct customer engagement.

# User Preferences

Preferred communication style: Simple, everyday language.

## Running List of Protected Components (DO NOT CHANGE)
1. **Landing Page**: Marketing home page (/) - All visuals, layout, and copy frozen
2. **Onboarding Flow for New Users**: Complete onboarding process when user is new - All functionality locked, field specifications implemented
3. **CTA Routing Logic**: Landing page CTA behavior and authentication flow - Logic is working correctly, do not modify
4. **Field Specification Implementation**: Step 1 (mandatory: Full Name, Store Name, WhatsApp, Email, Country, Category, Subscription), Step 2 (optional: Store Description, Social Media, Language, Hours, Tags), Step 3 (display-only: Payment/Delivery options) - Locked as backup state
5. **Authentication Connection Structure**: Complete seller ID authentication flow with RTDB mirroring - CRITICAL: All onboarding steps mirror to both Firestore AND Firebase Realtime Database, sessionStorage persistence, anonymous user blocking, force refresh mechanism, and AppGuard protection - WORKING and LOCKED as final backup
6. **Complete Onboarding-Settings Field Synchronization**: Every fillable field from all 3 onboarding steps now saves to Firebase and displays/edits in Settings - All 15 fields mapped: Step 1 (6 fields), Step 2 (7 fields), Step 3 (2 fields) with proper validation, form handling, and data persistence - COMPREHENSIVE FIELD AUDIT COMPLETED and LOCKED
7. **🔒 GOVERNANCE PROTOCOL ACTIVE**: ShopLynk Onboarding & Settings flows under strict change control - Version-stamped baseline (v1.0) created, Master Change Log implemented, ALL modifications require explicit approval from Senait - Protocol enforced effective August 28, 2025
8. **🔒 PRODUCT CARD UI/UX DESIGN**: v1.2_UI_UX_FINAL locked as golden reference - Navy category badges (#2C3E50), eco-friendly text (#1E7D3D), attribute text (#333333), enhanced View Details buttons with elevation and hover effects - Fortune 100 quality achieved, NO further UI refinements permitted without explicit unlock
9. **🔒 PER-CARD WHATSAPP CTA SYSTEM**: v1.3.1_UI_UX_WHATSAPP_PER_CARD locked as golden reference - Comprehensive per-card WhatsApp "Contact Seller" buttons with official green (#25D366), floating FAB removed, full accessibility compliance, analytics tracking, intelligent visibility logic - NO modifications to button position, sizing, color, or behavior permitted without explicit unlock
10. **🔒 HEADER/BANNER TOKEN SYSTEM**: ShopLynk Header/Banner Locked v1.0 - Complete token-driven header system with perfect vertical alignment (header-row-locked), store logo container with 1:1 aspect ratio, enhanced elevation shadows, payment/delivery badges inheriting category pill tokens, locked typography hierarchy, and comprehensive responsive behavior - Ready for inheritance by buyer storefronts - NO modifications without explicit unlock (August 29, 2025)
11. **🔒 STOREHEADER COMPONENT LOCKED**: StoreHeader v2.0 - Enterprise-grade Fortune 100 UI/UX implementation with classic ShopLynk blue color scheme (#1d4ed8, #2563eb, #3b82f6), 72×72px logo with shimmer animations, floating particles, multi-layer radial gradients, glassmorphism effects, comprehensive responsive design (5 breakpoints), WCAG 2.2 AA accessibility compliance, hardware-accelerated animations, dark mode support - PRODUCTION LOCKED for governance (August 31, 2025)

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite for building.
- **UI/UX**: Custom design system built on Radix UI components with Tailwind CSS for styling. Header and footer feature a pixel-perfect, WCAG AA compliant text-based wordmark.
- **Routing**: Wouter for client-side navigation.
- **State Management**: React Query for server state and caching.
- **Form Handling**: React Hook Form with Zod for validation.
- **Component Structure**: Organized into pages, components, hooks, and utilities.

## Backend Architecture
- **Server**: Node.js with Express for API endpoints.
- **Database**: PostgreSQL (production) via Drizzle ORM; in-memory storage for development.
- **Real-time Data**: Firebase Realtime Database for live updates.
- **File Storage**: Firebase Storage for assets.
- **Authentication**: Firebase Authentication (email/password, phone number).
- **Bootstrap System**: Transaction-safe bootstrap for user initialization, creating profile, store, and onboarding documents, ensuring idempotent operations.
- **Auth Redirect Utility**: Type-safe user detection and automatic signup mode routing, protecting routes and validating redirect paths.
- **Onboarding Flow**: Authoritative state-driven progression (Terms → User → Seller → Dashboard) with route guards and integration with the bootstrap system.
- **Authentication Connection System**: Complete seller ID authentication with dual database persistence (Firestore + RTDB), sessionStorage fallback, anonymous user blocking, force refresh events, and comprehensive route protection via AppGuard - ensures seller profiles are properly connected across onboarding completion and dashboard access.

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for structured data.
- **Real-time Database**: Firebase Realtime Database for live features and analytics events.
- **File Storage**: Firebase Storage for images.
- **Session Management**: Express sessions with PostgreSQL session store.

## Authentication and Authorization
- **Provider**: Firebase Auth with multi-method support.
- **Authorization**: Role-based access control (seller/admin).
- **Security Rules**: Firebase security rules for data access.
- **Session Management**: Server-side sessions for API and state persistence.
- **Authentication Isolation**: Dual Firebase app architecture to allow sellers to view public storefronts while logged in, isolating analytics.

## Design Patterns
- **Component Composition**: Reusable UI components following atomic design.
- **Hook Pattern**: Custom hooks for business logic.
- **Provider Pattern**: Context providers for global state.
- **Repository Pattern**: Storage abstraction for database operations.
- **Guard Pattern**: Route protection with AuthGuard.

# External Dependencies

## Firebase Services
- **Firebase Authentication**: User authentication.
- **Firebase Realtime Database**: Real-time data synchronization.
- **Firebase Storage**: Cloud storage for media files.
- **Firebase Security Rules**: Database access control.

## Database and ORM
- **PostgreSQL**: Primary relational database.
- **Neon Database**: Serverless PostgreSQL provider.
- **Drizzle ORM**: Type-safe database toolkit.
- **Connect PG Simple**: PostgreSQL session store.

## UI and Styling
- **Radix UI**: Headless UI component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Class Variance Authority**: Component variant management.

## Development and Build Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Type safety.
- **ESBuild**: JavaScript bundler.
- **PostCSS**: CSS processing.

## Communication Integration
- **WhatsApp Integration**: Direct customer communication.
- **Phone Number Validation**: International phone number formatting and E164 normalization.

# Governance Protocol

## ShopLynk Onboarding & Settings Change Control
**Effective Date**: August 28, 2025  
**Status**: ACTIVE AND ENFORCED

### Protocol Overview
All onboarding and settings flows are under strict version control and change management. This includes:
- Landing → Onboarding → Seller Console routing
- All onboarding steps, form validation, and temporary saves
- Settings page functionality (categories, store preferences, currencies, languages)
- All Firebase reads/writes and authentication dependencies

### Change Control Rules
1. **No modifications** to onboarding/settings without explicit approval from Senait
2. **Pause and remind** protocol when unauthorized changes are requested
3. **Version-stamped baseline** (v1.0) serves as rollback point
4. **Master Change Log** tracks all requests and approvals

### Protected Baseline Files
- Baseline Document: `ShopLynk_Onboarding_Settings_v1.0_LOCKED.md`
- Change Tracking: `ShopLynk_Onboarding_Settings_ChangeLog.md`
- Status: Production-ready and locked

### Emergency Procedures
If any regression occurs in onboarding or settings:
1. Immediately revert to v1.0 baseline
2. Document rollback reason in change log
3. Test critical flows before proceeding

### Developer Action Required
When requests involve onboarding/settings:
- ⏸️ Pause implementation
- 📢 Remind that flows are locked  
- 📝 Log request in change log
- ⌛ Wait for explicit unlock approval from Senait