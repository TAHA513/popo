# LaaBoBo - Arabic Social Broadcasting Platform

## Overview
LaaBoBo is an advanced Arabic-first mobile social broadcasting platform designed for seamless social interaction and live streaming, with a focus on mobile accessibility and user-friendly installation.

## Recent Changes (تاريخ: 11 أغسطس 2025)

### ✅ Object Storage Migration - Fixed Media File Persistence
- **المشكلة**: الصور والفيديوهات تتوقف عن العمل بعد إعادة النشر أو التحديث لأنها كانت تُحفظ محلياً
- **الحل**: تم نقل نظام رفع الملفات بالكامل إلى Object Storage

**التغييرات المُنجزة:**
- إنشاء ملف `server/object-storage.ts` لإدارة Object Storage
- تحديث Multer لاستخدام memory storage بدلاً من disk storage
- تحديث جميع endpoints رفع الملفات:
  - `/api/upload` (رفع عام)
  - `/api/upload/profile-image` (الصورة الشخصية)
  - `/api/upload/cover-image` (صورة الغلاف)
  - `/api/memories` (ملفات الذكريات)
- إزالة خدمة الملفات المحلية من `server/index.ts` و `server/routes.ts`

**Object Storage Configuration:**
- Bucket ID: `repl-default-bucket-$REPL_ID`
- Public Directory: `public/` للملفات العامة
- Private Directory: `.private/` للملفات الخاصة
- جميع الصور والفيديوهات تُرفع الآن كملفات عامة في Object Storage

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

## Next Steps
- تطبيق النظام الجديد وتشغيله للتأكد من عمل الصور والفيديوهات
- التحقق من عدم وجود أخطاء في الكود
- اختبار رفع الملفات والتأكد من ظهورها بعد إعادة النشر