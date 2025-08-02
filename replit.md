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
- Ready for deployment with fully functional gift economy and premium content

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