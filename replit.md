# Overview

ShopLynk is a comprehensive e-commerce platform that enables users to create online storefronts with WhatsApp integration for direct customer communication. The application is built as a React-based frontend with Firebase as the backend service, featuring user authentication, product management, analytics, and public storefront capabilities. The system is designed for small to medium businesses looking to establish an online presence with seamless customer interaction through WhatsApp.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 26, 2025)

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