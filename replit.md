# LaaBoBo Live - Live Streaming and Gift Platform

## Overview
LaaBoBo Garden (حديقة LaaBoBo) is an innovative social platform that revolutionizes social media interaction through memory sharing and community engagement. The platform focuses on content creation, social interactions, and community features. Users create and share memories, engage with others through likes and comments, and participate in live streaming. The project integrates real-time chat and live streaming capabilities, focusing on authentic social connections and content sharing.

## User Preferences
Preferred communication style: Simple, everyday language (Arabic).
UI Design Preference: Clean, organized grid layout with professional appearance (NOT TikTok-style).
Content Display: Direct content visibility with minimal layout complexity.
Navigation: Creation buttons should be in profile/navigation, not prominently on main page.
Brand Elements: Minimal branding approach, focus on content over branding elements.
Live Streaming: Use native WebRTC only, NO external SDKs like ZegoCloud.
Gift System: Fully activated across all platform components with real working transactions, point deduction/earning, and 3D animations.

## Recent Changes (August 2025)
- ✅ **RENDER DATABASE MIGRATION COMPLETED**: Successfully migrated from Neon to Render PostgreSQL database
- ✅ **EXTERNAL DEPLOYMENT READY**: Made REPLIT_DOMAINS optional for external deployments (Render)
- ✅ **SSL CONFIGURATION**: Added proper SSL support for external database connections
- ✅ **PRODUCTION BUILD FIX**: Resolved production deployment issues with environment variables
- ✅ **LEGACY MEDIA FILES SUPPORT**: Fixed 404 errors for legacy uploads with proper static middleware
- ✅ **ACCESSIBILITY IMPROVEMENTS**: Added DialogTitle and DialogDescription to gift modal for screen readers
- ✅ **CLOUDINARY INTEGRATION**: Added centralized file storage with automatic fallback to local storage
- ✅ **CORS OPTIMIZATION**: Enhanced cross-origin support for multi-platform deployment (Replit + Render)
- ✅ **API BASE URL CONFIGURATION**: Added VITE_API_URL support for external API endpoints
- ✅ **MIGRATION SCRIPTS**: Created automated Cloudinary migration tools for existing media files
- ✅ **COMPREHENSIVE DEPLOYMENT GUIDE**: Added complete external deployment documentation
- ✅ **REPLIT UI FIX COMPLETED (Aug 10, 2025)**: Fixed broken post display in Replit environment - resolved media URL handling in flip-card and feed components, restored full functionality to match external deployment
- ✅ **CROSS-PLATFORM MEDIA SYNC SYSTEM (Aug 10, 2025)**: Implemented comprehensive multi-source media API that searches multiple external sources for missing files, validates content types, prevents HTML error responses, and enables seamless media sharing between environments with intelligent fallback mechanisms
- ✅ **DOMAIN INTEGRATION (Aug 10, 2025)**: Added laabobo.com as primary external media source for cross-platform file synchronization
- ✅ Activated complete gift system with 13 default gift items ranging from 10-2000 points
- ✅ Integrated gift icons and functionality across live streams, messages, and chat pages
- ✅ Added 3D animated gift effects with framer-motion
- ✅ Created GiftShop component with real-time transactions
- ✅ Set up gift database with Arabic and English gift names
- ✅ Implemented premium album system with paid content access
- ✅ Created premium messages system for sharing paid albums
- ✅ Added comprehensive UI for album management with Arabic interface
- ✅ Integrated gift-based payment system for album unlocking
- ✅ Set up complete backend infrastructure for paid content
- ✅ Added live stream indicator that persists across pages to prevent accidental stream abandonment
- ✅ Fixed settings page route (/account) and added settings button to profile page
- ✅ EXPANDED GIFT GALLERY: Added 30+ diverse gifts including castle, airplane, rocket, yacht, diamond, etc.
- ✅ Enhanced gift modal with purple gradient design and Arabic support
- ✅ Organized gifts into categories (romantic, luxury, nature, tech, royal) with price-based color coding
- ✅ Added special indicators for gifts with sound effects (🔊) and special effects (✨)
- ✅ Fixed duplicate API endpoint that was causing gift sending errors
- ✅ Improved gift display with scroll functionality and organized layout
- ✅ Added "كرة دائيمية" (permanent) memory type that never expires
- ✅ Updated memory expiration logic to exclude permanent memories from deletion
- ✅ Made usernames and profile pictures clickable in comments to navigate to user profiles
- ✅ Fixed follow button functionality by correcting apiRequest parameter order
- ✅ Added comprehensive privacy policy page with TikTok-style organization covering platform features, monetization, and policies
- ✅ Added privacy policy access button in profile page stats section with prominent Shield icon
- ✅ Added clear text labels "السياسات" and "الإعدادات" next to icons for better accessibility
- ✅ Removed contact information (email and phone) from privacy policy page per user request
- ✅ Removed all financial transaction references and monetization sections from privacy policy
- ✅ Updated minimum age requirement from 13 to 18 years old
- ✅ Cleaned privacy policy to focus only on platform features and usage policies
- ✅ Clarified live streaming feature as chat-only (not video) in privacy policy
- ✅ Removed third-party data sharing reference from privacy policy per user request
- ✅ Added comprehensive verification system with database schema updates
- ✅ Implemented verification badges in profile pages and memory cards
- ✅ Created admin API endpoints for managing user verification status
- ✅ Verified user account (fnnm945@gmail.com) with LaaBoBo badge
- ✅ FIXED DUPLICATE VIEW COUNTING: Added unique constraint to prevent same user from counting multiple views on same memory
- ✅ CORRECTED MEMORY EXPIRATION PERIODS: Fixed time periods to match UI display (flash: 3h, trending: 12h, star: 24h, legend: 1 week, permanent: never expires)
- ✅ PAYMENT UNAVAILABLE NOTICES: Added clear warnings on payment pages that purchases are temporarily unavailable in user's country
- ✅ ZERO POINTS FOR NEW USERS: Fixed all user creation methods to start with 0 points (paid system only), updated existing test accounts
- ✅ OWNER ACCOUNT PROTECTION: Added comprehensive security system to hide owner account (fnnm945@gmail.com) from all public user lists, search results, suggestions, and memory feeds
- ✅ Created TikTok-style secure admin panel with multi-layer protection
- ✅ Added hidden access URL and secret code verification system
- ✅ Implemented attempt-based blocking and security logging
- ✅ Protected admin dashboard with encrypted path and dual authentication
- ✅ Removed all existing admin accounts and access for security
- ✅ Hidden admin interface completely from all users
- ✅ Prepared clean system for single owner account creation
- ✅ Implemented maximum security with zero admin access until new owner setup
- ✅ COMPLETE DATABASE CLEANUP: Removed all test accounts, posts, free points, and trial data
- ✅ PAID MODEL TRANSITION: Changed default points from 100 to 0, all features now monetized
- ✅ PRODUCTION READY: Clean database with paid-only system, no free content or points
- ✅ COMPREHENSIVE ADMIN DASHBOARD: Created TikTok-style complete admin control system with 7 main sections
- ✅ ADVANCED ADMIN FEATURES: Added user management, content control, financial oversight, moderation tools, analytics, and system controls
- ✅ SECURITY ENHANCEMENT: Implemented master access code system with owner-only verification (LaaBoBo2025Owner)
- ✅ FULL PLATFORM CONTROL: Added comprehensive buttons and tools for complete platform management like TikTok
- ✅ UPDATED POINT PRICING SYSTEM: Implemented new pricing structure at 100 points = $1.30 USD
- ✅ NEW POINT PACKAGES: Created 6 packages from $5 to $200 with bonus points and better value
- ✅ COMPLETE STRIPE INTEGRATION: Built full payment gateway with checkout, webhooks, and transaction tracking
- ✅ WALLET INTEGRATION: Points automatically added to user wallet after successful payment
- ✅ PAYMENT HISTORY: Added comprehensive payment history tracking and display
- ✅ AUTHENTICATION SYSTEM COMPLETE: Full password reset with Arabic messages, logout button restored
- ✅ UI STABILITY FIX: Fixed draggable header bars in profile page, prevented horizontal scrolling
- ✅ COMPREHENSIVE TRANSLATION SYSTEM: Implemented complete English/Arabic language switching with 100+ translation keys covering all authentication flows, navigation, account management, streaming, and core functionality
- ✅ SEAMLESS BILINGUAL EXPERIENCE: Users can switch between Arabic and English with proper RTL/LTR direction handling and complete translation coverage across all pages
- ✅ **CRITICAL ERROR FIXES (Aug 10, 2025)**: Resolved WebSocket localhost:undefined connection failures, enhanced media serving with URL decoding and multi-source fallbacks, fixed accessibility warnings in gift modal, and added comprehensive error handling for missing media files
- ✅ **ROBUST MEDIA HANDLING**: Enhanced media serving system with automatic URL decoding, multiple encoding format support, external source fallbacks, and proper 404 handling for images and videos
- ✅ **WEBSOCKET STABILITY**: Implemented centralized WebSocket URL construction helpers to prevent undefined port errors and connection failures across all environments
- ✅ **SYSTEM ARCHITECTURE PRESERVED**: Maintained original design with separate development/production environments sharing same database, preventing cross-environment interference while ensuring data synchronization
- ✅ **CACHE OPTIMIZATION COMPLETED (Aug 10, 2025)**: Implemented intelligent caching system to prevent posts from disappearing during updates - optimized staleTime, gcTime, refetch intervals, and eliminated unnecessary cache invalidations for stable user experience
- Ready for deployment with fully functional gift economy, premium content, permanent memories, comprehensive gift collection, complete platform documentation, professional admin management system, monetized point-based payment system, full bilingual support, and robust error handling systems

## Deployment Readiness Status
Platform is **100% ready for production deployment** with complete authentication, payment processing, content management, security systems, comprehensive bilingual support, external database migration to Render PostgreSQL, centralized file storage with Cloudinary integration, and cross-platform CORS configuration completed successfully.

**Multi-Platform Support:**
- ✅ Replit hosting (development and staging)
- ✅ Render.com hosting (production API)
- ✅ Vercel/Netlify hosting (frontend deployment)
- ✅ Custom domain support with SSL

## System Architecture
The application follows a modern full-stack JavaScript/TypeScript architecture with clear separation between client and server code.

### Full-Stack Architecture
- **Frontend**: React with TypeScript, styled using Tailwind CSS and shadcn/ui components
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket for chat and WebRTC for local streaming (though streaming is de-emphasized)
- **Authentication**: Replit-based authentication system
- **Build System**: Vite for frontend, esbuild for server bundling

### Key Components
- **Frontend**: Single-page application using wouter for routing, shadcn/ui with Radix UI, Tailwind CSS for styling, TanStack Query for server state, custom WebSocket hooks for real-time. Supports English and Arabic (RTL). Features enhanced MemoryCard component with 3D-style gifts and comprehensive privacy settings.
- **Backend**: RESTful API with Express, Passport.js for Replit authentication, PostgreSQL-backed sessions, and a WebSocket server for real-time interactions including chat and gifts.
- **Database Schema**: Includes Users, Streams (historical), Gift Characters, Gifts, Chat Messages, Point Transactions, and Followers. Expanded schema supports game rooms, player rankings, gardens, and premium features.
- **Data Flow**: Authentication via Replit OpenID Connect, sessions in PostgreSQL. Streaming (when active) handled via REST API and WebSockets. Gift system involves point purchases, client-side animations, and real-time notifications.
- **UI/UX Decisions**: Clean grid layouts, professional appearance, minimal branding, intuitive navigation. Color scheme uses LaaBoBo brand colors (pink, purple, blue). Incorporates Instagram/TikTok-inspired elements where appropriate for specific features like video browsing or profile pages, but prioritizes a clean grid. Features enhanced 3D-style Memory Cards.
- **Feature Specifications**:
    - **Memory System**: Core content creation and sharing system where users can upload images, videos, and create posts with rich media support.
    - **Social Features**: User profiles, following/follower system, likes, comments, and social interactions around shared content.
    - **Live Streaming**: Real-time video streaming capabilities allowing users to broadcast live content to their followers.
    - **Chat System**: Real-time text chat, including private 1-on-1 conversations and group messaging capabilities.

## External Dependencies
- **Database**: Neon PostgreSQL (serverless), Drizzle ORM, @neondatabase/serverless for connection pooling.
- **Authentication**: Replit Auth (OpenID Connect), Passport.js, connect-pg-simple for session persistence.
- **UI and Styling**: Tailwind CSS, Radix UI, Lucide Icons, Google Fonts (Poppins, Inter, Cairo).
- **Real-time Features**: Native WebSocket (client-side `Browser WebSocket API`, server-side `ws`).
- **3D Graphics/Physics (for advanced games)**: Three.js, Cannon.js.
- **Payment Processing (for premium features)**: Stripe (integrated for virtual currency and memberships).