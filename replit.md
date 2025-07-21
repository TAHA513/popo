# LaaBoBo Live - Live Streaming and Gift Platform

## Overview

LaaBoBo Live is a full-stack live streaming application with a focus on interactive gift-giving and social features. The platform allows users to broadcast live streams, watch content from other creators, send virtual gifts, and engage through real-time chat. The application features a unique collection of animated gift characters with custom effects.

## User Preferences

Preferred communication style: Simple, everyday language.

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