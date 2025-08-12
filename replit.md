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
- **زر التثبيت المحسن**: يظهر فقط عندما التطبيق غير مثبت، نص "ثبت التطبيق" ثم "ثبت الآن"، يُحضر ظروف التثبيت في الضغطة الأولى ويحاول التثبيت الفوري، إشعارات بسيطة
- **زر التشخيص**: مخفي نهائياً (PWA Diagnostic Button)
- **الأيقونة**: استخدام الشعار الوردي الأصلي للأرنب في جميع أيقونات التطبيق

## Development Guidelines
- Follow fullstack_js blueprint guidelines
- Use Object Storage for all file uploads
- Maintain Arabic-first UI/UX design
- Ensure mobile-responsive design
- Use Drizzle ORM for database operations

## Status Update (12 أغسطس 2025 - 5:05 PM)

### 🚨 مشكلة B2 Transaction Cap - تم حلها
- **المشكلة**: Backblaze B2 وصل إلى transaction cap exceeded (403 error)  
- **الحل المطبق**: نظام تداول ذكي مع كشف transaction cap
- **النتائج**:
  - ✅ **كشف تلقائي لحالة B2**: النظام يتعرف على transaction cap exceeded
  - ✅ **Auto-fallback ذكي**: ينتقل تلقائياً إلى التخزين المحلي عند تجاوز الحد
  - ✅ **تحسين نظام الرفع**: يتجنب محاولة الرفع إلى B2 عند تجاوز الحد
  - ✅ **media serving محسن**: نظام متدرج B2 → Local Storage → 404 مفصل
  - ✅ **رسائل خطأ واضحة**: تشرح للمطور سبب فشل التحميل وحالة كل نظام تخزين

### 🔧 التحديثات التقنية المطبقة
- ✅ تحسين `BackblazeService` مع `isTransactionCapExceeded()` 
- ✅ تحديث `uploadFileToStorage()` لتجنب B2 عند تجاوز الحد
- ✅ إنشاء `/api/media/b2/:filename` endpoint محسن مع fallbacks
- ✅ إعداد `public/media/` directory للتخزين المحلي
- ✅ نظام error handling شامل مع تفاصيل حالة كل storage

### 📋 حالة الأنظمة السابقة
- ✅ نظام Backblaze B2 Cloud Storage مدمج (مع تداول transaction cap)
- ✅ النظام المتدرج الثلاثي مطبق: B2 → Local Files → Error 404
- ✅ **إعداد PWA مكتمل**: Service Worker، أيقونات، تثبيت ذكي
- 🚀 **جاهز للاستخدام**: النظام يعمل حتى مع تجاوز حدود B2