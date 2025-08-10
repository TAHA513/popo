// حل مشكلة مسارات URL بين البيئات - Frontend Media URL Handler

export function getMediaUrl(storedPath: string): string {
  if (!storedPath) {
    console.warn('⚠️ Empty media path provided');
    return '';
  }
  
  console.log('🔍 Input path:', storedPath);
  
  // إذا كان المسار يحتوي على domain كامل، استخدمه كما هو
  if (storedPath.startsWith('http')) {
    console.log('🌐 Using external URL:', storedPath);
    return storedPath;
  }
  
  // إزالة أي prefixes غير مرغوب فيها
  let cleanPath = storedPath;
  
  // إزالة /uploads/ إذا كانت موجودة
  if (cleanPath.includes('/uploads/')) {
    cleanPath = cleanPath.replace(/^.*\/uploads\//, '');
  }
  
  // إزالة /api/media/ إذا كانت موجودة 
  if (cleanPath.includes('/api/media/')) {
    cleanPath = cleanPath.replace(/^.*\/api\/media\//, '');
  }
  
  // بناء المسار النهائي
  const finalUrl = `/api/media/${cleanPath}`;
  console.log('✅ Generated URL:', finalUrl);
  
  return finalUrl;
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