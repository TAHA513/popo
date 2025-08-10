// أدوات معالجة الوسائط وحل مشكلة CORS
export class MediaUtils {
  
  // إنشاء رابط proxy للوسائط الخارجية
  static createProxyUrl(originalUrl: string): string {
    if (!originalUrl) return '';
    
    // إذا كان الرابط محلي، أعده كما هو
    if (originalUrl.startsWith('/') || originalUrl.startsWith('./')) {
      return originalUrl;
    }

    // إذا كان الرابط خارجي، استخدم الوكيل
    try {
      const url = new URL(originalUrl);
      // استخدم الوكيل فقط للروابط الخارجية
      if (url.hostname !== window.location.hostname) {
        const encodedUrl = encodeURIComponent(originalUrl);
        return `/api/media/proxy?url=${encodedUrl}`;
      }
      return originalUrl;
    } catch {
      return originalUrl;
    }
  }

  // معالج أخطاء تحميل الوسائط المحسن
  static handleMediaError(element: HTMLVideoElement | HTMLImageElement, fallbackUrl?: string): void {
    console.warn('فشل تحميل الوسائط:', element.src);
    
    // محاولة إصلاح المسار أولاً
    const originalSrc = element.src;
    const fixedSrc = this.fixLegacyMediaUrl(originalSrc);
    
    if (fixedSrc !== originalSrc && !element.classList.contains('fix-attempted')) {
      console.log('محاولة إصلاح المسار:', fixedSrc);
      element.classList.add('fix-attempted');
      element.src = fixedSrc;
      return;
    }
    
    // إذا فشل الإصلاح، استخدم الرابط الاحتياطي
    if (fallbackUrl && element.src !== fallbackUrl && !element.classList.contains('fallback-attempted')) {
      console.log('محاولة استخدام الرابط الاحتياطي:', fallbackUrl);
      element.classList.add('fallback-attempted');
      element.src = fallbackUrl;
      return;
    }
    
    // إذا فشلت كل المحاولات، إخفاء العنصر
    element.style.display = 'none';
    element.classList.add('media-error');
    
    // إضافة رسالة خطأ للمطورين
    console.error('فشل نهائي في تحميل الوسائط:', {
      original: originalSrc,
      fixed: fixedSrc,
      fallback: fallbackUrl
    });
  }

  // التحقق من نوع الوسائط
  static getMediaType(url: string): 'video' | 'image' | 'unknown' {
    if (!url) return 'unknown';
    
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    const lowerUrl = url.toLowerCase();
    
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
      return 'video';
    }
    
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
      return 'image';
    }
    
    return 'unknown';
  }

  // تحسين جودة الفيديو للعرض السريع
  static optimizeVideoForDisplay(video: HTMLVideoElement): void {
    // إعدادات أساسية للفيديو
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    // إعدادات متصفحات مختلفة
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('x5-video-player-type', 'h5');
    
    // معالج أخطاء تحسينة
    video.addEventListener('error', (e) => {
      this.handleMediaError(video);
    }, { once: true });
  }

  // إصلاح مسارات legacy-uploads المعطلة
  static fixLegacyMediaUrl(url: string): string {
    if (!url) return url;
    
    // إصلاح المسارات القديمة
    if (url.includes('/api/media/legacy-uploads/')) {
      return url; // المسار محدث بالفعل
    }
    
    // إصلاح الروابط المكسورة من legacy
    if (url.includes('legacy-uploads/') && !url.includes('/api/media/')) {
      return `/api/media/legacy-uploads/${url.split('legacy-uploads/').pop()}`;
    }
    
    return url;
  }

  // فك تشفير أسماء الملفات العربية
  static decodeArabicFilename(filename: string): string {
    try {
      // فك تشفير URL encoding للأسماء العربية
      return decodeURIComponent(filename);
    } catch (error) {
      console.warn('فشل في فك تشفير اسم الملف:', filename);
      return filename;
    }
  }

  // تشغيل الفيديو مع معالجة الأخطاء
  static async playVideoSafely(video: HTMLVideoElement): Promise<boolean> {
    try {
      // إصلاح مسار الفيديو إن كان معطلاً
      if (video.src && video.src.includes('legacy-uploads')) {
        video.src = this.fixLegacyMediaUrl(video.src);
      }
      
      await video.play();
      return true;
    } catch (error) {
      console.log('تعذر التشغيل التلقائي:', error);
      // إظهار عناصر التحكم للمستخدم
      video.controls = true;
      return false;
    }
  }

  // معالج تحميل الصور مع احتياطي
  static handleImageLoad(img: HTMLImageElement, fallbackUrl?: string): void {
    img.addEventListener('error', () => {
      this.handleMediaError(img, fallbackUrl);
    }, { once: true });
  }

  // إنشاء عنصر فيديو محسن
  static createOptimizedVideo(src: string, options: {
    className?: string;
    poster?: string;
    muted?: boolean;
    loop?: boolean;
    autoplay?: boolean;
  } = {}): HTMLVideoElement {
    const video = document.createElement('video');
    
    // تطبيق الإعدادات
    video.src = this.createProxyUrl(src);
    video.className = options.className || '';
    video.muted = options.muted !== false;
    video.loop = options.loop !== false;
    video.playsInline = true;
    video.preload = 'metadata';
    
    if (options.poster) {
      video.poster = this.createProxyUrl(options.poster);
    }
    
    // تطبيق التحسينات
    this.optimizeVideoForDisplay(video);
    
    // محاولة التشغيل التلقائي إذا كان مطلوب
    if (options.autoplay) {
      video.addEventListener('loadeddata', () => {
        this.playVideoSafely(video);
      });
    }
    
    return video;
  }

  // إنشاء عنصر صورة محسن
  static createOptimizedImage(src: string, options: {
    className?: string;
    alt?: string;
    fallbackUrl?: string;
  } = {}): HTMLImageElement {
    const img = document.createElement('img');
    
    // تطبيق الإعدادات
    img.src = this.createProxyUrl(src);
    img.className = options.className || '';
    img.alt = options.alt || 'صورة من LaaBoBo';
    
    // إضافة معالج الأخطاء
    this.handleImageLoad(img, options.fallbackUrl);
    
    return img;
  }
}