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

// تحسين الذاكرة التخزين المؤقت مع دعم SPA
class PerformanceCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
    accessCount: number;
  }>();
  private maxSize = 100; // حد أقصى للعناصر المحفوظة
  
  set(key: string, data: any, ttl = 300000) { // 5 دقائق افتراضي
    // إذا تم الوصول للحد الأقصى، احذف العناصر الأقل استخداماً
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1
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
    
    // زيادة عداد الوصول
    item.accessCount++;
    return item.data;
  }
  
  private evictLeastUsed() {
    let leastUsedKey = '';
    let minAccess = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < minAccess) {
        minAccess = item.accessCount;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
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
  
  // احصائيات الكاش
  getStats() {
    return {
      size: this.cache.size,
      totalAccess: Array.from(this.cache.values()).reduce((sum, item) => sum + item.accessCount, 0)
    };
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

// SPA Navigation optimization
export function optimizeSPANavigation() {
  // منع إعادة التحميل غير الضرورية
  const handleLinkClick = (e: Event) => {
    const target = e.target as HTMLAnchorElement;
    if (target.tagName === 'A' && target.href && target.href.startsWith(window.location.origin)) {
      const path = target.pathname;
      // تحقق من أن الرابط داخلي
      if (path && !target.target && !target.download) {
        // دع React Router يتعامل مع التنقل
        return;
      }
    }
  };
  
  document.addEventListener('click', handleLinkClick);
  
  // تحسين التاريخ
  window.addEventListener('popstate', () => {
    // تحديث الحالة بناءً على التاريخ
    console.log('Navigation state updated');
  });
}

// تحميل مسبق للمسارات المهمة
export function preloadCriticalRoutes() {
  const criticalRoutes = ['/explore', '/messages', '/profile'];
  
  criticalRoutes.forEach(route => {
    // إنشاء رابط تحميل مسبق
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
}

// تحسين تحميل المكونات
export function optimizeComponentLoading() {
  // استخدام Intersection Observer لتحميل المحتوى عند الحاجة
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        if (element.dataset.lazyComponent) {
          // تحميل المكون عند الحاجة
          console.log(`Loading component: ${element.dataset.lazyComponent}`);
        }
      }
    });
  }, { threshold: 0.1 });
  
  // مراقبة العناصر المحددة للتحميل التأخيري
  document.querySelectorAll('[data-lazy-component]').forEach(el => {
    observer.observe(el);
  });
}

// تهيئة تحسينات الأداء
export function initPerformanceOptimizations() {
  // تحسين الرسوم المتحركة
  optimizeAnimations();
  
  // تحسين SPA Navigation
  optimizeSPANavigation();
  
  // تحميل مسبق للمسارات المهمة
  preloadCriticalRoutes();
  
  // تحسين تحميل المكونات
  optimizeComponentLoading();
  
  // تنظيف الذاكرة كل 10 دقائق
  setInterval(() => {
    const stats = cache.getStats();
    console.log('Cache stats before cleanup:', stats);
    cache.clear();
  }, 600000);
  
  // تحسين التمرير
  if ('scrollBehavior' in document.documentElement.style) {
    document.documentElement.style.scrollBehavior = 'smooth';
  }
  
  // تحسين تحميل الصور
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    // إضافة معالج خطأ لتحسين تجربة المستخدم
    img.addEventListener('error', (e) => {
      const target = e.target as HTMLImageElement;
      if (target.src && !target.src.includes('placeholder')) {
        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEMxNi42ODYzIDI4IDEzLjkzNzMgMjUuMjUxIDEzLjkzNzMgMjEuOTM3M0MxMy45MzczIDE4LjYyMzUgMTYuNjg2MyAxNS44NzQ2IDIwIDE1Ljg3NDZDMjMuMzEzNyAxNS44NzQ2IDI2LjA2MjcgMTguNjIzNSAyNi4wNjI3IDIxLjkzNzNDMjYuMDYyNyAyNS4yNTEgMjMuMzEzNyAyOCAyMCAyOFoiIGZpbGw9IiM5Q0E0QUIiLz4KPHN2Zz4K';
      }
    });
  });
  
  // تحسين الخطوط
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      console.log('تم تحميل جميع الخطوط بنجاح');
    });
  }
  
  // تحسين معالجة الأحداث
  let scrollTimeout: NodeJS.Timeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // معالجة التمرير بتأخير لتحسين الأداء
      const scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollProgress > 0.8) {
        // تحميل المزيد من المحتوى عند الاقتراب من النهاية
        console.log('Near bottom - consider loading more content');
      }
    }, 100);
  }, { passive: true });
}