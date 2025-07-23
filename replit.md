# LaaBoBo Live - Live Streaming and Gift Platform

## Overview

LaaBoBo Live is a full-stack live streaming application with a focus on interactive gift-giving and social features. The platform allows users to broadcast live streams, watch content from other creators, send virtual gifts, and engage through real-time chat. The application features a unique collection of animated gift characters with custom effects.

## User Preferences

Preferred communication style: Simple, everyday language.
UI Design Preference: Clean, organized grid layout with professional appearance (NOT TikTok-style).
Content Display: Direct content visibility with minimal layout complexity.
Navigation: Creation buttons should be in profile/navigation, not prominently on main page.
Brand Elements: Minimal branding approach, focus on content over branding elements.

## System Architecture

### Full-Stack Architecture
The application follows a modern full-stack JavaScript/TypeScript architecture with clear separation between client and server code:

- **Frontend**: React with TypeScript, styled using Tailwind CSS and shadcn/ui components
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket for live streaming features
- **Authentication**: Replit-based authentication system
- **Build System**: Vite for frontend, esbuild for server bundling

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend
├── shared/          # Shared TypeScript types and schemas
└── attached_assets/ # Project documentation and assets
```

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application using wouter for routing
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom LaaBoBo brand colors (pink, purple, blue)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Real-time**: Custom WebSocket hook for live streaming features
- **Internationalization**: Support for English and Arabic with RTL layout
- **Enhanced Memory System**: MemoryCard component with 3D-style gifts and privacy controls
- **Privacy Features**: Comprehensive privacy settings with visibility levels and content controls

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **Authentication**: Passport.js with OpenID Connect for Replit authentication
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Real-time**: WebSocket server for streaming, chat, and gift interactions
- **Database**: Drizzle ORM with type-safe queries and migrations

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: User profiles with points, earnings, streamer status
- **Streams**: Live streaming sessions with metadata and viewer counts  
- **Gift Characters**: Predefined animated gift types with point costs
- **Gifts**: Transaction records for gift sending between users
- **Chat Messages**: Real-time chat for streams
- **Point Transactions**: Financial tracking for virtual currency
- **Followers**: Social following relationships

## Data Flow

### Authentication Flow
1. Users authenticate via Replit's OpenID Connect system
2. Sessions are stored in PostgreSQL for persistence
3. User profiles are automatically created/updated on first login

### Streaming Flow
1. Streamers create live sessions through the REST API
2. WebSocket connections handle real-time viewer joining/leaving
3. Chat messages and gifts are broadcast to all stream participants
4. Viewer counts and gift totals are updated in real-time

### Gift System Flow
1. Users purchase virtual gifts using points
2. Gift animations trigger client-side effects
3. Points are transferred between users and recorded in transactions
4. Real-time notifications sent to all stream viewers

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connection Pooling**: @neondatabase/serverless for serverless compatibility

### Authentication
- **Replit Auth**: OpenID Connect integration for user authentication
- **Passport.js**: Authentication middleware
- **Session Storage**: PostgreSQL-backed session persistence

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library
- **Google Fonts**: Poppins, Inter, and Cairo fonts

### Real-time Features
- **WebSocket (ws)**: Server-side WebSocket implementation
- **Browser WebSocket API**: Client-side real-time communication

## Deployment Strategy

### Development
- **Local Development**: tsx for TypeScript execution
- **Hot Reloading**: Vite dev server with HMR
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite build process generating static assets
- **Backend**: esbuild bundling for Node.js deployment
- **Database**: Automatic migrations via Drizzle Kit
- **Environment**: NODE_ENV-based configuration

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: Authentication provider URL
- `ADMIN_SECRET_CODE`: Secret access code for super admin panel
- `ADMIN_PROMO_CODE`: Temporary code to promote users to super_admin

## Security Features
- **Secure Admin Panel**: Located at `/panel-9bd2f2-control` (hidden from regular users)
- **Role-based Access**: Users can have roles: 'user', 'admin', or 'super_admin'
- **Multi-layer Security**: Requires both super_admin role AND secret access code header
- **Temporary Promotion Route**: `/make-admin` for initial super_admin setup

The application is designed for deployment on Replit's platform but can be adapted for other hosting environments with minimal configuration changes.

## Recent Changes

### July 22, 2025 - TikTok-Inspired Authentication UI Redesign
- ✓ Redesigned login page with TikTok-inspired modern interface
- ✓ Redesigned register page with matching dark theme design
- ✓ Added rabbit emoji (🐰) as prominent brand logo in authentication pages
- ✓ Implemented dark background with animated gradient effects
- ✓ Added glassmorphism design with backdrop blur effects
- ✓ Enhanced form inputs with improved styling and user experience
- ✓ Added hover and focus animations for better interactivity
- ✓ Improved mobile-first responsive design for authentication flows

### July 22, 2025 - Homepage Grid Layout with Dynamic Features
- ✓ Implemented clean grid-based homepage layout (non-TikTok style)
- ✓ Separate sections for live streams and posts with clear organization
- ✓ Added innovative "Trending Now" banner with fire emoji and live content updates
- ✓ Removed redundant creation buttons (available in profile navigation)
- ✓ Clean white background with organized card-based content display
- ✓ Real-time data integration showing actual streams and posts from database
- ✓ Interactive elements with hover effects and engagement buttons
- ✓ Responsive grid layout supporting 1-4 columns based on screen size
- ✓ Arabic RTL support with proper text alignment and spacing
- ✓ Streamlined user experience focusing on content discovery

### July 22, 2025 - Video Controls and Navigation Enhancement
- ✓ Added professional video controls with play/pause button in center
- ✓ Implemented independent audio controls with mute/unmute for each video
- ✓ Enhanced video size to 3x3 grid space for maximum visibility
- ✓ Added "LaaBoBo" app name next to rabbit logo in navigation
- ✓ Repositioned volume control to top-right corner for better accessibility
- ✓ Removed "HD LIVE" badge from videos for cleaner appearance
- ✓ Added visual feedback with color-coded audio states (green/red)
- ✓ Improved button styling with glassmorphism and hover effects

### July 22, 2025 - Instagram-Style Video Profile Page
- ✓ Created dedicated video viewing page with full-screen video player
- ✓ Implemented Instagram-style layout with main video area and sidebar
- ✓ Added dark theme background for immersive video watching experience
- ✓ Displayed author profile information overlay on video
- ✓ Created sidebar showing other videos from the same author
- ✓ Added video interaction buttons (like, comment, share, gift)
- ✓ Implemented proper navigation between videos
- ✓ Enhanced video controls with better positioning and styling

### July 22, 2025 - TikTok-Style Video Browsing Experience
- ✓ Redesigned video page to match TikTok's vertical scrolling interface
- ✓ Implemented swipe gestures for mobile navigation (up/down)
- ✓ Added desktop arrow buttons for video navigation
- ✓ Created TikTok-style action buttons on right side (like, comment, share, gift)
- ✓ Added video progress indicator on left side showing current position
- ✓ Implemented full-screen video display with proper touch controls
- ✓ Added author profile circle with follow button overlay
- ✓ Enhanced mobile-first design with touch-optimized interactions

### July 22, 2025 - Audio Management and Error Handling Improvements
- ✓ Fixed video audio persistence by stopping previous videos when navigating
- ✓ Enhanced video player controls with proper cleanup functionality  
- ✓ Improved follow functionality with better authentication error handling
- ✓ Added automatic redirect to login page when authentication is required
- ✓ Enhanced error messages to provide clear feedback to users
- ✓ Implemented proper video preloading for smoother navigation experience
- ✓ Added comprehensive interaction tracking for likes, comments, shares, gifts

### July 22, 2025 - Clickable Profile Links Enhancement
- ✓ Fixed issue where profile images and usernames were not clickable
- ✓ Added clickable links to user profile pages from memory cards
- ✓ Enhanced explore page with clickable user suggestions
- ✓ Made chat usernames and avatars clickable in streaming interface
- ✓ Implemented hover effects and visual feedback for profile links
- ✓ Added `/user/:userId` route to support direct user profile navigation
- ✓ Ensured all profile images and usernames redirect to correct user profiles

### July 22, 2025 - User Profile Loading Fix
- ✓ Fixed React hooks error that was preventing the app from loading properly
- ✓ Resolved infinite loading issue when accessing other users' profiles
- ✓ Standardized all profile links to use `/user/:userId` routing consistently
- ✓ Enhanced server-side logging for better profile request diagnostics
- ✓ Added comprehensive error handling with Arabic language messages
- ✓ Implemented request timeout and retry functionality to prevent hanging
- ✓ Added detailed debug information for troubleshooting profile access issues
- ✓ Fixed authentication flow for viewing other users' profiles

### July 22, 2025 - TikTok-Style Profile Action Buttons
- ✓ Redesigned profile action buttons to match TikTok's circular icon layout
- ✓ Arranged message, follow, and gift buttons vertically on the right side
- ✓ Added circular button design with shadow effects and hover animations
- ✓ Implemented color-coded buttons: follow (purple), message (white), gift (yellow)
- ✓ Added small text labels below each button for better user experience
- ✓ Enhanced visual hierarchy with proper spacing and scaling effects
- ✓ Fixed React hooks error by adding missing TooltipProvider to App component
- ✓ Added safety checks for array operations in profile data rendering

### July 22, 2025 - Logout Functionality Implementation
- ✓ Added logout button to top navigation bar with LogOut icon
- ✓ Added logout button to bottom navigation for mobile users
- ✓ Implemented proper logout functionality with API calls to /api/logout
- ✓ Fixed TypeScript errors related to logout function integration
- ✓ Added visual feedback with red hover states for logout buttons
- ✓ Ensured proper session cleanup and redirect to login page after logout
- ✓ Tested logout functionality - working correctly with "تم تسجيل الخروج بنجاح" confirmation

### July 23, 2025 - Performance Optimization and Bug Fixes
- ✓ Fixed critical React hooks error causing application crashes
- ✓ Resolved WebSocket connection issues with proper configuration
- ✓ Optimized video scrolling performance with requestAnimationFrame
- ✓ Enhanced touch gesture responsiveness (80px threshold)
- ✓ Implemented debouncing for keyboard navigation (100ms)
- ✓ Added preloading for next videos to improve navigation speed
- ✓ Reduced API request frequency for better performance
- ✓ Added performance-focused CSS with will-change and transform3d
- ✓ Fixed TypeScript errors in navigation components
- ✓ Enhanced 404 page with LaaBoBo brand styling and Arabic support