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