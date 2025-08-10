// حل مشكلة مسارات URL بين البيئات - Dynamic Media URL Handler
export function getMediaUrl(filename: string): string {
  // إزالة /uploads/ إذا كانت موجودة في المسار
  const cleanFilename = filename.replace(/^\/uploads\//, '');
  
  // في بيئة التطوير
  if (process.env.NODE_ENV === 'development') {
    return `/api/media/${cleanFilename}`;
  }
  
  // في بيئة الإنتاج - استخدم current domain
  const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.REPLIT_DOMAIN || '';
  
  if (baseUrl) {
    return `${baseUrl}/api/media/${cleanFilename}`;
  }
  
  // fallback للمسار النسبي
  return `/api/media/${cleanFilename}`;
}

export function saveMediaUrl(filename: string): string {
  // احفظ فقط اسم الملف في قاعدة البيانات (بدون مسار كامل)
  return filename.replace(/^\/uploads\//, '');
}

export function buildFullMediaUrl(storedPath: string): string {
  // بناء URL كامل من المسار المحفوظ
  return getMediaUrl(storedPath);
}