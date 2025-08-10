// حل مشكلة مسارات URL بين البيئات - Frontend Media URL Handler

export function getMediaUrl(storedPath: string): string {
  if (!storedPath) return '';
  
  // إذا كان المسار يحتوي على domain كامل، استخدمه كما هو
  if (storedPath.startsWith('http')) {
    return storedPath;
  }
  
  // إزالة /uploads/ إذا كانت موجودة
  const cleanPath = storedPath.replace(/^\/uploads\//, '');
  
  // في بيئة التطوير، استخدم localhost دائماً
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return `/api/media/${cleanPath}`;
  }
  
  // في الإنتاج، استخدم API base URL إذا كان متوفر
  const API_BASE = import.meta.env.VITE_API_URL || '';
  if (API_BASE) {
    return `${API_BASE}/api/media/${cleanPath}`;
  }
  
  // fallback للمسار النسبي
  return `/api/media/${cleanPath}`;
}

export function buildImageProps(storedPath: string) {
  const mediaUrl = getMediaUrl(storedPath);
  
  return {
    src: mediaUrl,
    loading: 'lazy' as const,
    onError: (e: any) => {
      console.warn('Image failed to load:', mediaUrl);
      // يمكن إضافة placeholder image هنا
      e.target.style.display = 'none';
    }
  };
}