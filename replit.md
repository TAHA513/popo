# LaaBoBo Live - Live Streaming and Gift Platform

## Overview
LaaBoBo Garden (حديقة LaaBoBo) is an innovative social virtual pet platform that revolutionizes social media interaction through virtual pet care and community engagement. The platform focuses on virtual pet ownership, social gardens, gift economies, and interactive community features. Each user owns a virtual pet, creating an emotional connection and encouraging daily engagement through care activities, social visits, and gift exchanges. The project also integrates real-time chat and previously experimented with live streaming, now focusing on a robust social gaming and gifting ecosystem with potential for advanced 3D game integration.

## User Preferences
Preferred communication style: Simple, everyday language (Arabic).
UI Design Preference: Clean, organized grid layout with professional appearance (NOT TikTok-style).
Content Display: Direct content visibility with minimal layout complexity.
Navigation: Creation buttons should be in profile/navigation, not prominently on main page.
Brand Elements: Minimal branding approach, focus on content over branding elements.
Live Streaming: Use native WebRTC only, NO external SDKs like ZegoCloud.

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
    - **Virtual Pet Garden**: Core system with pet care, interactive buttons, gift shop, and social garden visits. Integrates a comprehensive character system with VIP features and tiered rarity.
    - **Gaming System**: Supports a multi-game system (e.g., memory match, puzzle quest) with real-time multiplayer, point betting, player rankings (bronze, silver, gold, etc.), and achievements. Includes a premium point system and garden support economy. Potential for advanced 3D games (e.g., "Reclaim The City" strategy game, 3D war game with physics engine).
    - **Gift Economy**: Comprehensive gift sending system for characters, upgrades, and points. Features a monetized chat system requiring gift selection and follower-only access for private conversations.
    - **Chat System**: Real-time text chat, including private 1-on-1 conversations and voice messaging capabilities.

## External Dependencies
- **Database**: Neon PostgreSQL (serverless), Drizzle ORM, @neondatabase/serverless for connection pooling.
- **Authentication**: Replit Auth (OpenID Connect), Passport.js, connect-pg-simple for session persistence.
- **UI and Styling**: Tailwind CSS, Radix UI, Lucide Icons, Google Fonts (Poppins, Inter, Cairo).
- **Real-time Features**: Native WebSocket (client-side `Browser WebSocket API`, server-side `ws`).
- **3D Graphics/Physics (for advanced games)**: Three.js, Cannon.js.
- **Payment Processing (for premium features)**: Stripe (integrated for virtual currency and memberships).