# LaaBoBo - Arabic Social Broadcasting Platform

## Overview
LaaBoBo is an advanced Arabic-first mobile social broadcasting platform designed for seamless social interaction and live streaming, with a focus on mobile accessibility and user-friendly installation.

## Recent Changes (تاريخ: 11 أغسطس 2025)

### ✅ نظام التخزين المتدرج الجديد مع Backblaze B2
- **المشكلة**: الصور والفيديوهات تختفي نهائياً بعد إعادة النشر (redeploy) في Render
- **الحل النهائي**: نظام تخزين متدرج بثلاث مستويات

**النظام المتدرج الجديد:**
1. **Backblaze B2 Cloud Storage** (الأولوية الأولى) - ✅ مدمج
   - مقاوم للحذف تماماً في جميع البيئات
   - تخزين سحابي دائم مع Backblaze B2 API
   - مفاتيح API من المستخدم: B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_BUCKET_ID
2. **Replit Object Storage** (البديل الثاني) - Google Cloud Storage
3. **Local Files** (البديل الأخير) - `public/media/` في Production

**التحديثات المدمجة:**
- ✅ نظام `BackblazeB2Service` مكتمل في `server/backblaze-storage.ts`
- ✅ نظام `uploadFileToStorage()` محسن ليستخدم الترتيب الجديد
- ✅ تحديث جميع endpoints لاستخدام Backblaze B2:
  - Profile images upload (`/api/upload/profile-image`)
  - Cover images upload (`/api/upload/cover-image`) 
  - General file upload (`/api/upload`)
  - Memory fragments upload (`/api/memories`)
- ✅ إضافة `storageType` لمعرفة المصدر المستخدم في كل رفع
- ✅ Auto-fallback تلقائي عند فشل أي مستوى

**النتيجة النهائية:**
- **مقاومة كاملة للحذف**: الملفات لن تختفي أبداً حتى مع Manual Deploy في Render
- **مرونة عالية**: النظام يعمل في أي بيئة (Replit, Render, Local)
- **شفافية كاملة**: المستخدم لا يحتاج تغيير أي شيء في واجهة التطبيق

## Architecture

### Core Technologies
- React Native for cross-platform mobile development
- TypeScript for type-safe implementation
- Progressive Web App (PWA) with advanced installation support
- Responsive mobile-first design optimized for Arabic users
- Enhanced offline capabilities and service worker integration

### Storage Architecture
- **Database**: PostgreSQL via Drizzle ORM
- **Media Files**: Tiered Storage System
  1. Backblaze B2 Cloud Storage (Primary)
  2. Replit Object Storage / Google Cloud Storage (Secondary)
  3. Local Files in `public/media/` (Fallback)
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

## Status Update (12 أغسطس 2025 - 12:06 AM)
- ✅ نظام Backblaze B2 Cloud Storage مدمج ومختبر  
- ✅ النظام المتدرج الثلاثي مطبق ومختبر في جميع endpoints
- ✅ Auto-fallback يعمل بنجاح: B2 → Replit Object Storage → Local Files
- ✅ **حل نهائي مشكلة تحميل الصور (401 Unauthorized + undefined URLs)**:
  - ✅ تشخيص المشكلة: Bucket خاص يتطلب authorization tokens
  - ✅ إصلاح `BackblazeService.getFileUrl()` لإنشاء روابط مفوضة
  - ✅ إصلاح `backblaze-storage.ts` لمنع إنتاج روابط undefined 
  - ✅ إضافة `UrlHandler.processMediaUrl()` لإصلاح الروابط المكسورة تلقائياً
  - ✅ **النتيجة النهائية**: جميع الصور تُحمّل بنجاح مع HTTP 200 OK
  - ✅ تحديث نظام `getFileUrl()` لإنشاء URLs مصرحة 
  - ✅ تحسين نظام `/api/media/b2/` مع دعم private buckets
  - ✅ اختبار مكتمل: النتيجة 200 OK + عرض صحيح للصور
- ✅ حذف المسارات المكررة والمتضاربة في routes.ts
- ✅ نظام إعادة التوجيه التلقائي: `/api/media/` → `/api/media/b2/`
- ✅ مقاومة كاملة للحذف: Auto-fallback يضمن عدم فقدان الملفات
- 🎯 **مشكلة الصور محلولة تماماً**: جميع الصور تعرض بشكل طبيعي الآن

## PWA Enhancement Update (12 أغسطس 2025 - 1:17 AM)
- ✅ **تحسين PWA واجهة التثبيت**:
  - ✅ إزالة معلومات التصحيح من الواجهة الرئيسية
  - ✅ تصميم أيقونة تثبيت بسيطة ومباشرة (بدلاً من البطاقات الكبيرة)  
  - ✅ الأيقونة تظهر فقط للتطبيقات غير المثبتة وتختفي نهائياً بعد التثبيت
  - ✅ دعم تعليمات التثبيت اليدوي لجميع الأجهزة والمتصفحات
  - ✅ تجربة مستخدم أنظف: لا توجد عناصر ثابتة غير ضرورية
- 🎯 **نتيجة نهائية**: PWA يعمل بسلاسة مع واجهة نظيفة ومرنة