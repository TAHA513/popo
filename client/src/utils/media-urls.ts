// حل مشكلة مسارات URL بين البيئات - Frontend Media URL Handler

export function getMediaUrl(storedPath: string): string {
  if (!storedPath) return '';
  
  // إذا كان المسار يحتوي على domain كامل، استخدمه كما هو
  if (storedPath.startsWith('http')) {
    return storedPath;
  }
  
  // إزالة /uploads/ إذا كانت موجودة
  const cleanPath = storedPath.replace(/^\/uploads\//, '');
  
  // دائماً استخدم المسار النسبي للتطوير المحلي
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