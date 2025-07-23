// تحسينات الأداء للتطبيق

// ضغط الصور تلقائياً
export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // احسب الأبعاد الجديدة
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// تحسين الذاكرة التخزين المؤقت
class PerformanceCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();
  
  set(key: string, data: any, ttl = 300000) { // 5 دقائق افتراضي
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // تنظيف الذاكرة من البيانات المنتهية الصلاحية
    this.cleanup();
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  clear() {
    this.cache.clear();
  }
}

export const cache = new PerformanceCache();

// تحسين تحميل البيانات
export function optimizeQuery(queryKey: string, data: any) {
  // تخزين البيانات في الكاش
  cache.set(queryKey, data);
  
  // ضغط البيانات للذاكرة
  if (data && typeof data === 'object') {
    return JSON.parse(JSON.stringify(data));
  }
  
  return data;
}

// تحسين الصور
export function optimizeImageUrl(url: string, width = 400): string {
  if (!url) return '';
  
  // للصور من Unsplash
  if (url.includes('unsplash.com')) {
    return `${url}&w=${width}&q=80&fm=jpg&fit=crop`;
  }
  
  // للصور العادية، أضف معاملات التحسين إذا أمكن
  return url;
}

// تحسين الرسوم المتحركة
export function optimizeAnimations() {
  // تقليل الرسوم المتحركة للأجهزة الضعيفة
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
  }
}

// تهيئة تحسينات الأداء
export function initPerformanceOptimizations() {
  // تحسين الرسوم المتحركة
  optimizeAnimations();
  
  // تنظيف الذاكرة كل 10 دقائق
  setInterval(() => {
    cache.clear();
  }, 600000);
  
  // تحسين التمرير
  if ('scrollBehavior' in document.documentElement.style) {
    document.documentElement.style.scrollBehavior = 'smooth';
  }
  
  // تحسين تحميل الصور
  const images = document.querySelectorAll('img[loading]');
  images.forEach(img => {
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
  
  // تحسين الخطوط
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      console.log('تم تحميل جميع الخطوط بنجاح');
    });
  }
}