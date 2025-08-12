// نظام إدارة إصدارات الكاش للصور والملفات الثابتة
// Image and Static Files Cache Version Management System

export const CACHE_VERSIONS = {
  // إصدار عام للصور - غير هذا الرقم عند تحديث الصور
  images: 'v2024_08_12_v2',
  
  // إصدار خاص بأيقونات المستخدمين
  avatars: 'v2024_08_12_v2',
  
  // إصدار خاص بصور الغلاف
  covers: 'v2024_08_12_v2',
  
  // إصدار عام للأصوات والفيديوهات
  media: 'v2024_08_12_v2',
  
  // إصدار خاص بالملفات الثابتة (CSS, JS)
  static: 'v2024_08_12_v2'
} as const;

// دالة لإضافة الإصدار للرابط
export function addCacheVersion(url: string, type: keyof typeof CACHE_VERSIONS = 'images'): string {
  if (!url || url.includes('?v=') || url.includes('&v=')) {
    return url; // الرابط يحتوي بالفعل على إصدار أو فارغ
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${CACHE_VERSIONS[type]}`;
}

// دالة للتحقق من صحة الإصدار
export function isValidCacheVersion(url: string, type: keyof typeof CACHE_VERSIONS = 'images'): boolean {
  const currentVersion = CACHE_VERSIONS[type];
  return url.includes(`v=${currentVersion}`);
}

// دالة لتحديث إصدار موجود
export function updateCacheVersion(url: string, type: keyof typeof CACHE_VERSIONS = 'images'): string {
  // إزالة الإصدار القديم
  const cleanUrl = url.replace(/[?&]v=[^&]+/g, '');
  // إضافة الإصدار الجديد
  return addCacheVersion(cleanUrl, type);
}