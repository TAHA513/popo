// نظام إدارة الروابط العالمي للصور والفيديوهات
// يدعم جميع النطاقات ويضمن عرض الصور بشكل صحيح
import { Request } from 'express';

export class UrlHandler {
  // النطاقات المدعومة
  private static readonly SUPPORTED_DOMAINS = [
    '617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev',
    'localhost:5000',
    'localhost',
    // يمكن إضافة المزيد من النطاقات هنا
  ];

  // الحصول على النطاق الحالي من الطلب
  static getCurrentDomain(req: Request): string {
    const host = req.get('host') || req.get('x-forwarded-host') || 'localhost:5000';
    const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    return `${protocol}://${host}`;
  }

  // تحويل الرابط النسبي إلى رابط مطلق
  static makeAbsoluteUrl(relativeUrl: string, req: Request): string {
    if (!relativeUrl) return '';
    
    // إذا كان الرابط مطلق بالفعل، أرجعه كما هو
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    
    // إذا كان الرابط نسبي، اجعله مطلق
    if (relativeUrl.startsWith('/')) {
      const currentDomain = this.getCurrentDomain(req);
      return `${currentDomain}${relativeUrl}`;
    }
    
    // إذا كان الرابط لا يبدأ بـ /، أضف المسار
    const currentDomain = this.getCurrentDomain(req);
    return `${currentDomain}/${relativeUrl}`;
  }

  // تحويل رابط الصورة أو الفيديو إلى رابط عالمي
  static processMediaUrl(mediaUrl: string, req: Request): string {
    if (!mediaUrl) return '';
    
    // إذا كان رابط مطلق، تحقق من صحته
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }
    
    // إذا كان رابط نسبي، اجعله مطلق
    return this.makeAbsoluteUrl(mediaUrl, req);
  }

  // معالجة مصفوفة من الروابط
  static processMediaUrls(mediaUrls: string[], req: Request): string[] {
    return mediaUrls.map(url => this.processMediaUrl(url, req));
  }

  // إنشاء رابط API للوسائط
  static createApiMediaUrl(filename: string, req: Request): string {
    const currentDomain = this.getCurrentDomain(req);
    return `${currentDomain}/api/media/${filename}`;
  }

  // تحويل الرابط القديم إلى رابط API
  static convertToApiUrl(oldUrl: string, req: Request): string {
    if (!oldUrl) return '';
    
    // إذا كان رابط API بالفعل، أرجعه
    if (oldUrl.includes('/api/media/')) {
      return this.makeAbsoluteUrl(oldUrl, req);
    }
    
    // إذا كان رابط uploads، حوله إلى API
    if (oldUrl.includes('/uploads/')) {
      const filename = oldUrl.split('/uploads/').pop();
      return this.createApiMediaUrl(filename || '', req);
    }
    
    // إذا كان اسم ملف فقط
    if (oldUrl && !oldUrl.includes('/')) {
      return this.createApiMediaUrl(oldUrl, req);
    }
    
    return this.makeAbsoluteUrl(oldUrl, req);
  }

  // إنشاء رابط بديل للطوارئ
  static createFallbackUrl(mediaUrl: string): string {
    // استخدام النطاق الأساسي كاحتياطي
    const baseDomain = 'https://617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev';
    
    if (mediaUrl.startsWith('/')) {
      return `${baseDomain}${mediaUrl}`;
    }
    
    if (mediaUrl && !mediaUrl.includes('/')) {
      return `${baseDomain}/api/media/${mediaUrl}`;
    }
    
    return mediaUrl;
  }

  // فحص صحة الرابط
  static isValidMediaUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}