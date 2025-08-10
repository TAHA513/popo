# LaaBoBo Live - Live Streaming and Gift Platform

## Overview
LaaBoBo Garden (حديقة LaaBoBo) is an innovative social platform that revolutionizes social media interaction through memory sharing and community engagement. The platform focuses on content creation, social interactions, and community features, integrating real-time chat and live streaming capabilities. The business vision is to create authentic social connections and content sharing experiences, with a focus on a comprehensive gift economy, premium content, and a professional administration system.

## User Preferences
Preferred communication style: Simple, everyday language (Arabic).
UI Design Preference: Clean, organized grid layout with professional appearance (NOT TikTok-style).
Content Display: Direct content visibility with minimal layout complexity.
Navigation: Creation buttons should be in profile/navigation, not prominently on main page.
Brand Elements: Minimal branding approach, focus on content over branding elements.
Live Streaming: Use native WebRTC only, NO external SDKs like ZegoCloud.
Gift System: Fully activated across all platform components with real working transactions, point deduction/earning, and 3D animations.

## System Architecture
The application follows a modern full-stack JavaScript/TypeScript architecture.

### Full-Stack Architecture
- **Frontend**: React with TypeScript, styled using Tailwind CSS and shadcn/ui components.
- **Backend**: Express.js server with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Real-time Communication**: WebSocket for chat and WebRTC for live streaming.
- **Authentication**: Replit-based authentication system.
- **Build System**: Vite for frontend, esbuild for server bundling.

### Key Components
- **Frontend**: Single-page application using wouter for routing, shadcn/ui with Radix UI, Tailwind CSS for styling, TanStack Query for server state, custom WebSocket hooks for real-time. Supports English and Arabic (RTL). Features enhanced MemoryCard component with 3D-style gifts.
- **Backend**: RESTful API with Express, Passport.js for Replit authentication, PostgreSQL-backed sessions, and a WebSocket server for real-time interactions including chat and gifts.
- **Database Schema**: Includes Users, Streams (historical), Gift Characters, Gifts, Chat Messages, Point Transactions, and Followers. The schema is expanded to support game rooms, player rankings, gardens, and premium features.
- **Data Flow**: Authentication via Replit OpenID Connect, sessions in PostgreSQL. Streaming and gift systems involve client-side animations, real-time notifications, and point transactions.
- **UI/UX Decisions**: Clean grid layouts, professional appearance, minimal branding, intuitive navigation. Color scheme uses LaaBoBo brand colors (pink, purple, blue). Incorporates Instagram/TikTok-inspired elements for specific features while prioritizing a clean grid. Features enhanced 3D-style Memory Cards.
- **Feature Specifications**:
    - **Memory System**: Core content creation and sharing system for images, videos, and posts.
    - **Social Features**: User profiles, following/follower system, likes, and comments.
    - **Live Streaming**: Real-time video streaming capabilities.
    - **Chat System**: Real-time text chat, including private 1-on-1 and group messaging.
    - **Gift System**: Integrated across live streams and messages with 3D animations and real-time transactions.
    - **Premium Content**: Paid album system and premium messages.
    - **Verification System**: Badges on profiles and memory cards.
    - **Admin Panel**: Secure, comprehensive TikTok-style admin control system with user management, content control, financial oversight, moderation, analytics, and system controls.
    - **Monetization**: Point-based payment system with Stripe integration for virtual currency and memberships.
    - **Bilingual Support**: Comprehensive English/Arabic language switching with RTL/LTR handling.

## External Dependencies
- **Database**: Neon PostgreSQL.
- **ORMs**: Drizzle ORM.
- **Authentication**: Replit Auth (OpenID Connect), Passport.js.
- **UI and Styling**: Tailwind CSS, Radix UI, Lucide Icons, Google Fonts (Poppins, Inter, Cairo).
- **Real-time Features**: Native WebSocket API (client and server).
- **Payment Processing**: Stripe.
- **File Storage**: Cloudinary (with fallback to local storage).
  
## Recent Changes
- ✅ **UNIFIED STABLE STORAGE SYSTEM (Aug 10, 2025)**: Implemented asaad111-style stable file naming across all uploads (profile/cover images, memory posts, general files) - eliminates file disappearing issues and ensures consistent media availability across all environments
- ✅ **DYNAMIC URL RESOLUTION (Aug 10, 2025)**: Created environment-aware media URL system that automatically handles path differences between development (localhost) and production environments - stores only filenames in database while generating appropriate URLs dynamically based on current environment
- ✅ **DATABASE MIGRATION COMPLETED (Aug 10, 2025)**: Successfully migrated all existing media URLs in database from legacy "/uploads/" paths to clean filenames only - fixed "صورة غير متوفرة" issue for all existing posts and user profiles
- ✅ **CROSS-ENVIRONMENT COMPATIBILITY (Aug 10, 2025)**: All media files now work seamlessly across development and production environments with automatic URL generation based on current context