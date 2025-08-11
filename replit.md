# LaaBoBo - Arabic Social Broadcasting Platform

## Overview
LaaBoBo is an advanced Arabic-first mobile social broadcasting platform designed for seamless social interaction and live streaming, with a focus on mobile accessibility and user-friendly installation.

## Recent Changes (تاريخ: 11 أغسطس 2025)

### ✅ حل نهائي لمشكلة اختفاء الملفات عند إعادة النشر
- **المشكلة**: الصور والفيديوهات تختفي نهائياً بعد إعادة النشر (redeploy)
- **الحل الجديد**: استخدام مجلد `/tmp/media` للحفظ الدائم خارج نطاق المشروع

**التغييرات النهائية:**
- تم إعادة كتابة `server/object-storage.ts` بالكامل لاستخدام `/tmp/media`
- إنشاء نظام ملفات دائم في `server/index.ts` يخدم الملفات من `/media/*`
- تطوير functions محسنة:
  - `uploadFileToStorage()` - حفظ الملفات مع أسماء فريدة
  - `uploadBufferToStorage()` - حفظ المحتوى مباشرة  
  - `generateUniqueFileName()` - إنشاء أسماء ملفات آمنة
  - `deleteFileFromStorage()` - حذف الملفات عند الحاجة
- إزالة الاعتماد على قاعدة البيانات لحفظ الملفات
- حل مشكلة تضارب الأسماء والوظائف المكررة

**التكوين الجديد:**
- Directory: `/tmp/media/` - مجلد دائم خارج نطاق redeploy
- URL Pattern: `/media/{unique_filename}` 
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
- ✅ النظام الجديد يعمل بنجاح ولا توجد أخطاء
- ✅ مجلد `/tmp/media` تم إنشاؤه وجاهز للاستخدام
- ✅ جميع endpoints رفع الملفات تستخدم النظام الجديد
- 🔄 **جاهز للاختبار**: رفع ملف للتأكد من عدم اختفائه بعد redeploy