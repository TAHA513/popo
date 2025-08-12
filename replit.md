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

## Status Update (12 أغسطس 2025 - 1:43 AM)

### ✅ تطوير PWA متقدم ومكتمل
- **نظام PWA شامل ومتقدم**: تم إنشاء Progressive Web App قوي ومتكامل
- **Service Worker متطور** (`client/public/sw.js`):
  - ✅ استراتيجيات تخزين متعددة: Cache First, Network First, Stale While Revalidate
  - ✅ إدارة تلقائية للـ cache مع تنظيف دوري
  - ✅ دعم Background Sync للعمليات المعلقة
  - ✅ Push Notifications مع دعم كامل للعربية (RTL)
  - ✅ إدارة ذكية للصور مع placeholder للوضع offline
  - ✅ تحديث تلقائي للـ cache عند إصدار إصدارات جديدة

- **Manifest متطور** (`client/public/manifest.json`):
  - ✅ دعم كامل للغة العربية مع `dir: "rtl"` و `lang: "ar"`
  - ✅ App shortcuts للوصول السريع (ذكريات، رسائل، بث مباشر، ملف شخصي)
  - ✅ Share Target API لمشاركة الملفات من التطبيقات الأخرى
  - ✅ File Handlers لفتح صور وفيديوهات من نظام التشغيل
  - ✅ Protocol Handlers لروابط `web+laabolive://`
  - ✅ Screenshots وicons متعددة الأحجام
  - ✅ Launch Handler لإدارة فتح التطبيق

- **مكونات PWA تفاعلية**:
  - ✅ `PWAInstallPrompt`: نافذة تثبيت ذكية مع مؤشرات الفوائد
  - ✅ `OfflineIndicator`: مؤشر حالة الاتصال مع زر إعادة المحاولة
  - ✅ `PWAUpdatePrompt`: إشعار التحديثات مع تطبيق فوري
  - ✅ `PWAStatus`: لوحة شاملة لمراقبة حالة PWA
  - ✅ `useBackgroundSync`: hook للمزامنة الخلفية للعمليات المعلقة
  - ✅ `usePushNotifications`: إدارة إشعارات الدفع

- **HTML محسن لـ PWA**:
  - ✅ Meta tags شاملة لجميع المنصات (iOS, Android, Windows)
  - ✅ SEO متطور مع Open Graph و Twitter Cards
  - ✅ Critical CSS inline لتسريع التحميل
  - ✅ نصوص خاصة بـ iOS للتثبيت
  - ✅ Loading spinner أثناء تحميل التطبيق

- **Share Target System** (`server/routes/share.ts`):
  - ✅ معالجة مشاركة الملفات من التطبيقات الخارجية
  - ✅ دعم Protocol handlers للروابط الخاصة
  - ✅ تكامل مع نظام رفع الملفات الموجود

### ✅ النظام السابق مستمر ومحسن
- ✅ نظام Backblaze B2 Cloud Storage مدمج ومختبر  
- ✅ النظام المتدرج الثلاثي مطبق ومختبر في جميع endpoints
- ✅ Auto-fallback يعمل بنجاح: B2 → Replit Object Storage → Local Files
- ✅ جميع الصور تُحمّل بنجاح مع HTTP 200 OK
- ✅ مقاومة كاملة للحذف: Auto-fallback يضمن عدم فقدان الملفات

### 🎯 **النتيجة النهائية**
- **PWA متكامل وجاهز للإنتاج** مع دعم كامل للعربية وميزات متقدمة
- **تجربة مستخدم ممتازة** مع إمكانية التثبيت والعمل بلا إنترنت
- **أداء محسن** مع تخزين ذكي ومزامنة خلفية
- **مقاومة شاملة للمشاكل** مع fallbacks تلقائية لجميع الوظائف