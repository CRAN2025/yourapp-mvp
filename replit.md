# Overview

ShopLynk is a comprehensive e-commerce platform that enables users to create online storefronts with WhatsApp integration for direct customer communication. The application is built as a React-based frontend with Firebase as the backend service, featuring user authentication, product management, analytics, and public storefront capabilities. The system is designed for small to medium businesses looking to establish an online presence with seamless customer interaction through WhatsApp.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 27, 2025)

## Landing Page Freeze Contract - ACTIVE
- **Date**: August 27, 2025
- **Status**: 🔒 FROZEN - No visual changes permitted
- **Scope**: Marketing home page (/) - All visuals, layout, typography, and copy are locked
- **Restrictions**:
  - **Header**: Text wordmark alignment, typography (700 weight, clamp sizing), and gradient (#3A49FF to #1873FF) frozen
  - **Hero Section**: All text, punctuation, capitalization, line breaks, and container grid locked
  - **CTA Button**: Visual styling, placement, size, gradient, radius, and shadow must remain identical
  - **Footer**: Text wordmark only, alignment and spacing locked
  - **Responsiveness**: Breakpoint behavior at 1440/1024/768/390px must render identically
  - **Performance**: CLS ≤ 0.05, no new network requests, pixel-perfect alignment (≤1px variance)
- **Permitted Changes**: Only backend routing/authentication logic - zero visual modifications
- **Quality Gates**: Pixel-diff testing, wordmark single-line validation, CTA visual snapshots required

## Text Wordmark Implementation - FINAL SHIP READY
- **Date**: August 27, 2025  
- **Status**: ✅ Complete and production-ready
- **Description**: Finalized ShopLynk text wordmark with pixel-perfect alignment, AA contrast compliance, and enhanced font weight
- **Key Enhancements**:
  - **Text-Based Branding**: Pure CSS gradient text wordmark replacing image logo for crisp rendering
  - **Pixel-Perfect Alignment**: Header brand left edge aligns exactly with hero text within ±1px using container synchronization
  - **AA Contrast Compliance**: Gradient (#3E4CFF to #1A7BFF) meets WCAG AA standards for accessibility
  - **Enhanced Typography**: Inter font at fontWeight 750, clamp(24px, 2.1vw, 30px) with nowrap guarantee
  - **Interactive States**: Hover brightness effect and focus-visible outline for accessibility
  - **Contrast Mode Support**: High contrast and forced colors mode fallbacks implemented
  - **Clean JSX Structure**: No runtime DOM manipulation, pure declarative header layout
  - **Footer Consistency**: Matching wordmark at clamp(20px, 1.9vw, 26px) for brand unity
  - **Visual Balance**: CTA shadow softened to '0 8px 18px' to complement wordmark prominence
- **Technical Quality**: Zero TypeScript errors, cross-browser compatible, accessibility preserved
- **User Preference**: Text wordmark strongly preferred over image logos or phone mockups
- **Test Coverage**: Comprehensive Playwright tests ensure alignment, accessibility, and visual integrity across all viewports
- **FREEZE CONTRACT**: Landing page visuals, layout, and copy are now locked - only backend routing/auth logic may change

## Enhanced Logo Brand Visibility Implementation
- **Date**: August 27, 2025  
- **Status**: ✅ Complete and evolved to pixel-perfect alignment
- **Description**: Initial logo prominence enhancement that evolved into pixel-perfect alignment system
- **Key Enhancements**:
  - **Header Logo**: clamp(220px, 20vw, 280px) with drop-shadow(0 1px 1px rgba(0,0,0,0.15))
  - **Footer Logo**: clamp(180px, 14vw, 220px) with drop-shadow(0 1px 1px rgba(0,0,0,0.18))
  - Enhanced accessibility with aria-label="ShopLynk home" and alt="ShopLynk"
  - Added crisp-edges rendering for high-DPI displays with subtle drop shadows
  - Performance optimized with translateZ(0) for smooth animations
- **Evolution**: Enhanced further with pixel-perfect alignment system for professional-grade visual consistency

## Marketing Page Deployment Implementation
- **Date**: August 26, 2025  
- **Status**: ✅ Complete and ready for deployment
- **Description**: Implemented marketing page as root route with full SEO optimization and anonymous tracking
- **Key Components**:
  - Marketing page (`MarketLanding.tsx`) wired as root route (/)
  - Complete SEO meta tags with React Helmet
  - Open Graph and Twitter Card social media assets
  - Anonymous Firebase events tracking for marketing analytics
  - Firebase hosting configuration with caching headers
  - Generated OG cover image and SEO assets
- **SEO Assets**: robots.txt, sitemap.xml, og-cover.png, enhanced meta tags
- **Deployment**: Ready for `firebase deploy --only hosting`
- **Status**: Production-ready with all deployment requirements met

## Authentication Isolation System Implementation
- **Date**: August 26, 2025  
- **Status**: ✅ Complete and tested
- **Description**: Implemented dual Firebase app architecture to allow sellers to stay logged in while viewing public storefront
- **Key Components**:
  - Secondary Firebase app for events tracking (`firebaseEvents.ts`)
  - Data mirroring system (`dataMirror.ts`)  
  - Public storefront reads from `publicStores/*` only
  - Analytics isolated to events app with anonymous auth
  - "Publish Now" button for bulk data synchronization
- **Testing**: All critical paths verified, build successful, no LSP errors
- **User Validation**: ✅ Complete

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: Custom design system built on Radix UI components with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Form Handling**: React Hook Form with Zod for validation and type safety
- **Component Structure**: Organized into pages, components, hooks, and utility libraries with clear separation of concerns

## Backend Architecture
- **Express Server**: Node.js server with Express framework for API endpoints
- **Database**: Designed to work with both in-memory storage (development) and PostgreSQL (production) via Drizzle ORM
- **Real-time Data**: Firebase Realtime Database for live updates and real-time features
- **File Storage**: Firebase Storage for handling image uploads and static assets
- **Authentication**: Firebase Authentication with support for email/password and phone number verification

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for structured data (users, products, orders)
- **Real-time Database**: Firebase Realtime Database for live features like analytics events and user interactions
- **File Storage**: Firebase Storage for product images, store logos, and cover images
- **Session Management**: Express sessions with PostgreSQL session store

## Authentication and Authorization
- **Authentication Provider**: Firebase Auth with multi-method support (email/password, phone)
- **Authorization Pattern**: Role-based access control with seller/admin distinctions
- **Security Rules**: Firebase security rules for data access control at the database level
- **Session Management**: Server-side sessions for API authentication and user state persistence

## Design Patterns
- **Component Composition**: Reusable UI components following atomic design principles
- **Hook Pattern**: Custom hooks for business logic separation (useAuth, useMobile)
- **Provider Pattern**: Context providers for global state management (AuthContext)
- **Repository Pattern**: Storage abstraction layer for database operations
- **Guard Pattern**: Route protection with AuthGuard component for access control

# External Dependencies

## Firebase Services
- **Firebase Authentication**: Multi-method user authentication (email, phone)
- **Firebase Realtime Database**: Real-time data synchronization for analytics and user interactions
- **Firebase Storage**: Cloud storage for images and media files
- **Firebase Security Rules**: Database-level access control and data validation

## Database and ORM
- **PostgreSQL**: Primary relational database for structured data storage
- **Neon Database**: Serverless PostgreSQL provider (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL operations
- **Connect PG Simple**: PostgreSQL session store for Express sessions

## UI and Styling
- **Radix UI**: Headless UI component library for accessible components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants

## Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and enhanced developer experience
- **ESBuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## Communication Integration
- **WhatsApp Integration**: Direct WhatsApp messaging for customer communication
- **Phone Number Validation**: International phone number formatting and validation
- **E164 Normalization**: Standardized phone number formatting for global compatibility