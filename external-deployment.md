# External Deployment Guide - LaaBoBo Live

## الحل الجذري للنشر الخارجي (Render.com/Vercel/Railway)

هذا الدليل يطبق الحل الجذري المذكور في المرفق لجعل التطبيق يعمل على أي منصة سحابية.

### 1. قاعدة البيانات الموحّدة والدائمة

```bash
# في جميع البيئات استخدم:
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB?sslmode=require
```

**Render PostgreSQL:**
- Database Internal URL: `postgresql://username:password@hostname:5432/database_name`
- يتضمن تلقائياً `?sslmode=require`

### 2. تخزين الملفات المركزي

#### خيار أ: Cloudinary (موصى به)
```bash
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

**الحصول على Cloudinary:**
1. سجّل في https://cloudinary.com
2. انسخ الـ Environment variable من Dashboard
3. أضفه في متغيرات البيئة

#### خيار ب: التخزين المحلي مع روابط مطلقة
```bash
# في Render فقط - خدمة الملفات من API
STORAGE_BASE_URL=https://your-api-domain.onrender.com/files
```

### 3. ضبط الواجهة للـ API الثابت

```bash
# في جميع البيئات (Render/Replit):
VITE_API_URL=https://your-api-domain.onrender.com
```

### 4. إعدادات CORS للدومينات المختلفة

الكود في `server/index.ts` يدعم:
- ✅ دومينات Replit (.replit.dev)
- ✅ دومينات Render (.onrender.com) 
- ✅ دومينات مخصصة
- ✅ البيئة المحلية

### 5. خطوات النشر على Render

#### أ. إعداد الخدمة
1. **Web Service:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

#### ب. متغيرات البيئة المطلوبة
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...  # من Render PostgreSQL
SESSION_SECRET=your_session_secret_here
CLOUDINARY_URL=cloudinary://...  # اختياري لكن موصى به
```

#### ج. متغيرات اختيارية (للمميزات المتقدمة)
```bash
STRIPE_SECRET_KEY=sk_live_...
ADMIN_SECRET_CODE=your_admin_code
ADMIN_PROMO_CODE=your_promo_code
```

### 6. خطوات النشر على Vercel

#### أ. إعداد المشروع
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

#### ب. متغيرات البيئة
نفس متغيرات Render + إضافة:
```bash
VERCEL_URL=your-project.vercel.app
```

### 7. حل مشكلة الملفات القديمة

#### إذا اخترت Cloudinary:
```bash
# شغّل سكربت الترحيل مرة واحدة
npm run migrate-cloudinary
```

#### إذا اخترت التخزين المحلي:
```sql
-- حوّل المسارات النسبية إلى مطلقة
UPDATE memory_fragments 
SET media_urls = REPLACE(media_urls, '/api/media/', 'https://your-api-domain.onrender.com/files/')
WHERE media_urls LIKE '%/api/media/%';

UPDATE memory_fragments 
SET thumbnail_url = REPLACE(thumbnail_url, '/api/media/', 'https://your-api-domain.onrender.com/files/')
WHERE thumbnail_url LIKE '%/api/media/%';
```

### 8. فحص النشر

#### أ. فحص API:
```bash
curl https://your-api-domain.onrender.com/api/auth/user
```

#### ب. فحص الملفات:
- افتح أي صورة في الواجهة
- تأكد أن الـ URL يبدأ بـ:
  - `https://res.cloudinary.com/...` (Cloudinary)
  - `https://your-api-domain.onrender.com/files/...` (محلي)

#### ج. فحص CORS:
- سجّل دخول من Replit
- تأكد أن العمليات تعمل (إنشاء منشور، إرسال رسالة)

### 9. نصائح للأداء

#### أ. تحسين قاعدة البيانات:
```sql
-- إنشاء فهارس للاستعلامات السريعة
CREATE INDEX idx_memories_active ON memory_fragments(is_active);
CREATE INDEX idx_memories_author ON memory_fragments(author_id);
```

#### ب. تحسين الصور:
```javascript
// في Cloudinary - ضغط تلقائي
const optimizedUrl = cloudinary.url("sample", {
  fetch_format: "auto",
  quality: "auto"
});
```

### 10. مراقبة الأخطاء

```bash
# في Render - عرض السجلات
render logs --service your-service-name --tail

# في Vercel - عرض السجلات  
vercel logs your-deployment-url
```

---

## نتيجة التطبيق

بعد تطبيق هذا الحل:

✅ **قاعدة بيانات واحدة** - تعمل من أي منصة  
✅ **ملفات مركزية** - لا تختفي بعد التحديث  
✅ **روابط مطلقة** - تعمل من أي دومين  
✅ **CORS مضبوط** - يدعم الدومينات المختلفة  
✅ **API ثابت** - الواجهة تضرب نقطة واحدة  

**النتيجة:** يمكن نشر الواجهة على Replit والـ API على Render، وكل شيء يعمل بسلاسة!