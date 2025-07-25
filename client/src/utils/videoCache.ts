// نظام تخزين مؤقت متقدم للفيديوهات لضمان السرعة الفائقة

class VideoCache {
  private cache = new Map<string, HTMLVideoElement>();
  private preloadQueue = new Set<string>();
  
  // تحميل مسبق للفيديو
  preloadVideo(url: string): Promise<HTMLVideoElement> {
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url)!);
    }
    
    if (this.preloadQueue.has(url)) {
      return this.waitForPreload(url);
    }
    
    this.preloadQueue.add(url);
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.crossOrigin = 'anonymous';
      video.autoplay = true;
      video.loop = true;
      
      // إخفاء الفيديو أثناء التحميل
      video.style.display = 'none';
      video.style.position = 'absolute';
      video.style.top = '-9999px';
      document.body.appendChild(video);
      
      const onLoaded = () => {
        this.cache.set(url, video);
        this.preloadQueue.delete(url);
        document.body.removeChild(video);
        video.style.display = '';
        video.style.position = '';
        video.style.top = '';
        resolve(video);
      };
      
      const onError = () => {
        this.preloadQueue.delete(url);
        document.body.removeChild(video);
        reject(new Error('Failed to preload video'));
      };
      
      video.addEventListener('canplaythrough', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
      
      // تحميل البيانات الأساسية على الأقل
      video.addEventListener('loadedmetadata', () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          onLoaded();
        }
      }, { once: true });
    });
  }
  
  private waitForPreload(url: string): Promise<HTMLVideoElement> {
    return new Promise((resolve) => {
      const checkCache = () => {
        if (this.cache.has(url)) {
          resolve(this.cache.get(url)!);
        } else if (this.preloadQueue.has(url)) {
          setTimeout(checkCache, 50);
        }
      };
      checkCache();
    });
  }
  
  // الحصول على فيديو محمّل مسبقاً
  getCachedVideo(url: string): HTMLVideoElement | null {
    return this.cache.get(url) || null;
  }
  
  // تنظيف الذاكرة المؤقتة
  clear() {
    this.cache.clear();
    this.preloadQueue.clear();
  }
}

export const videoCache = new VideoCache();