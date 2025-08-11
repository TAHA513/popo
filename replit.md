# LaaBoBo - Arabic Social Broadcasting Platform

## Overview
LaaBoBo is an advanced Arabic-first mobile social broadcasting platform designed for seamless social interaction and live streaming, with a focus on mobile accessibility and user-friendly installation.

## Recent Changes (تاريخ: 11 أغسطس 2025)

### ✅ حل نهائي لمشكلة اختفاء الملفات عند إعادة النشر
- **المشكلة**: الصور والفيديوهات تختفي نهائياً بعد إعادة النشر (redeploy)
- **الحل الهجين**: Object Storage في Replit + Local Storage في Render/Production

**التغييرات النهائية:**
- نظام ذكي يكتشف البيئة تلقائياً (Replit vs Production)
- في Replit: استخدام Object Storage (Google Cloud Storage)  
- في Render/Production: استخدام `/tmp/persistent-media` كـ fallback
- Auto-fallback عند فشل Object Storage
- Functions محسنة تدعم النظامين:
  - `uploadFileToStorage()` - رفع مع fallback تلقائي
  - `uploadBufferToStorage()` - رفع Buffer مع fallback تلقائي
  - `generateUniqueFileName()` - أسماء ملفات آمنة موحدة
  - `deleteFileFromStorage()` - حذف من النظامين

**التكوين المختلط:**
- **Replit**: Object Storage (Google Cloud) `/public-objects/{filename}`
- **Production**: Local Storage `/media/{filename}` 
- Cache: 1 year للملفات الثابتة في كلا النظامين
- Auto-detection: `process.env.REPLIT_DEPLOYMENT` || `process.env.REPLIT_DEV_DOMAIN`
- File Size Limit: 50MB
- Types: Images (JPEG, PNG, GIF, WebP), Videos (MP4, WebM, MOV)

## Architecture

### Core Technologies
- React Native for cross-platform mobile development
- TypeScript for type-safe implementation
- Progressive Web App (PWA) with advanced installation support
- Responsive mobile-first design optimized for Arabic users
- Enhanced offline capabilities and service worker integration

### Storage Architecture
- **Database**: PostgreSQL via Drizzle ORM
- **Media Files**: Replit Object Storage (Google Cloud Storage)
- **Session Management**: In-memory storage with express-session

### File Upload System
- **Memory Storage**: Multer configured for memory storage
- **Object Storage**: Google Cloud Storage integration via @google-cloud/storage
- **File Types Supported**: Images (JPEG, PNG, GIF, WebP), Videos (MP4, WebM, QuickTime)
- **File Size Limit**: 50MB per file
- **URL Generation**: Public URLs for all uploaded media

## User Preferences
*لم يتم تحديد تفضيلات خاصة بعد*

## Development Guidelines
- Follow fullstack_js blueprint guidelines
- Use Object Storage for all file uploads
- Maintain Arabic-first UI/UX design
- Ensure mobile-responsive design
- Use Drizzle ORM for database operations

## Status Update
- ✅ النظام الهجين جاهز ويعمل في جميع البيئات
- ✅ Object Storage يعمل بنجاح في Replit
- ✅ Local Storage fallback يعمل في Render/Production  
- ✅ Auto-detection للبيئة يعمل تلقائياً
- ✅ حل مشكلة Render deployment errors نهائياً
- 🚀 **جاهز للإنتاج**: النظام يعمل في كلا البيئتين بدون أخطاء