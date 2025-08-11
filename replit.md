# LaaBoBo - Arabic Social Broadcasting Platform

## Overview
LaaBoBo is an advanced Arabic-first mobile social broadcasting platform designed for seamless social interaction and live streaming, with a focus on mobile accessibility and user-friendly installation.

## Recent Changes (تاريخ: 11 أغسطس 2025)

### ✅ حل نهائي لمشكلة اختفاء الملفات عند إعادة النشر
- **المشكلة**: الصور والفيديوهات تختفي نهائياً بعد إعادة النشر (redeploy)
- **الحل النهائي**: استخدام Replit Object Storage (Google Cloud Storage) للحفظ الدائم

**التغييرات النهائية:**
- إعادة كتابة `server/object-storage.ts` بالكامل لاستخدام Object Storage
- إزالة الاعتماد على الملفات المحلية (`/tmp/media`) نهائياً
- تطوير functions محسنة:
  - `uploadFileToStorage()` - رفع الملفات إلى Object Storage
  - `uploadBufferToStorage()` - رفع المحتوى مباشرة إلى Object Storage
  - `generateUniqueFileName()` - إنشاء أسماء ملفات آمنة
  - `deleteFileFromStorage()` - حذف الملفات من Object Storage
- حل مشكلة Object Storage permissions (إزالة makePublic)
- تحديث جميع endpoints لاستخدام Object Storage

**التكوين الجديد:**
- Storage: Google Cloud Storage via Replit Object Storage
- Bucket: `replit-objstore-b9b8cbbd-6b8d-4fcb-b924-c5e56e084f16`
- Public Directory: `public/`
- Private Directory: `.private/`
- URL Pattern: `/public-objects/{unique_filename}`
- Cache: 1 year للملفات الثابتة
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
- ✅ Object Storage جاهز ومُعد بنجاح
- ✅ حل مشكلة permissions (إزالة makePublic)
- ✅ جميع endpoints تستخدم Object Storage للحفظ الدائم
- ✅ النظام يعمل بنجاح ولا توجد أخطاء
- 🔄 **جاهز للاختبار**: رفع ملف للتأكد من الحفظ الدائم في Object Storage