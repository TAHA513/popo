# إعداد مفاتيح الأمان للتحقق بخطوتين

## خطوات إضافة المفاتيح في Replit:

### 1. الوصول إلى Secrets:
- اضغط على أيقونة 🔒 في الشريط الجانبي الأيسر
- أو اذهب إلى Tools → Secrets

### 2. أضف المفاتيح التالية:

#### إذا كنت تستخدم Auth0:
```
Key: AUTH0_DOMAIN
Value: your-domain.auth0.com

Key: AUTH0_CLIENT_ID  
Value: your_client_id_here

Key: AUTH0_CLIENT_SECRET
Value: your_client_secret_here

Key: AUTH0_AUDIENCE
Value: your_api_identifier

Key: BASE_URL
Value: https://617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev
```

#### أو للنظام المدمج (أبسط):
```
Key: MFA_ENCRYPTION_SECRET
Value: laabobosecure2025mfa

Key: TOTP_SERVICE_NAME
Value: LaaBoBo

Key: TOTP_ISSUER
Value: LaaBoBo Platform
```

## البديل الأسرع:
يمكنني تفعيل النظام المدمج الآن بدون Auth0 - فقط أضف المفاتيح الثلاثة الأخيرة وسيعمل فوراً!