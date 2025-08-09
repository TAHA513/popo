// محسن الفيديوهات لتسريع التحميل والتشغيل
export class VideoOptimizer {
  private static preloadedVideos = new Map<string, HTMLVideoElement>();
  private static maxCacheSize = 10; // عدد الفيديوهات المخزنة مؤقتاً

  // تحسين إعدادات الفيديو
  static optimizeVideoElement(video: HTMLVideoElement): void {
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    video.crossOrigin = 'anonymous';
    
    // إعدادات تسريع التحميل
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-video-player-type', 'h5');
    video.setAttribute('x5-video-orientation', 'portraint');
  }

  // تخزين الفيديو مؤقتاً
  static preloadVideo(src: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      if (this.preloadedVideos.has(src)) {
        resolve(this.preloadedVideos.get(src)!);
        return;
      }

      const video = document.createElement('video');
      this.optimizeVideoElement(video);
      
      video.oncanplaythrough = () => {
        // إضافة للذاكرة المؤقتة
        if (this.preloadedVideos.size >= this.maxCacheSize) {
          // إزالة أقدم فيديو
          const firstKey = this.preloadedVideos.keys().next().value;
          this.preloadedVideos.delete(firstKey);
        }
        
        this.preloadedVideos.set(src, video);
        resolve(video);
      };
      
      video.onerror = () => reject(new Error('فشل تحميل الفيديو'));
      video.src = src;
      video.load();
    });
  }

  // تشغيل سريع للفيديو
  static async playVideoFast(video: HTMLVideoElement): Promise<void> {
    try {
      // محاولة تشغيل مع معالجة المتصفحات المختلفة
      video.currentTime = 0;
      await video.play();
    } catch (error) {
      console.log('تعذر التشغيل التلقائي:', error);
      // إظهار زر التشغيل للمستخدم
      video.controls = true;
    }
  }

  // تنظيف الذاكرة المؤقتة
  static clearCache(): void {
    this.preloadedVideos.clear();
  }

  // التحقق من مدة الفيديو
  static validateVideoDuration(file: File, maxDuration: number = 90): Promise<boolean> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration <= maxDuration);
      };
      
      video.onerror = () => resolve(false);
      video.src = URL.createObjectURL(file);
    });
  }

  // ضغط الفيديو (تقليل الجودة للسرعة)
  static async compressVideo(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('فشل في إنشاء canvas'));
        return;
      }

      video.onloadedmetadata = () => {
        canvas.width = Math.min(video.videoWidth, 720); // حد أقصى 720p
        canvas.height = (canvas.width / video.videoWidth) * video.videoHeight;
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('فشل في ضغط الفيديو'));
          }
        }, 'video/mp4', 0.8); // جودة 80%
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
}

// إعدادات التحسين العامة
export const VIDEO_OPTIMIZATION_CONFIG = {
  maxDuration: 90, // ثانية
  maxFileSize: 50 * 1024 * 1024, // 50MB
  preferredFormats: ['video/mp4', 'video/webm'],
  compressionQuality: 0.8,
  maxResolution: 720,
  preloadStrategy: 'metadata',
  enableAutoplay: true,
  enableMute: true,
  enableLoop: true
};