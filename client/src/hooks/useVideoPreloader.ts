import { useEffect, useRef } from 'react';

// هوك لتسريع تحميل الفيديوهات
export function useVideoPreloader(videoUrls: string[]) {
  const preloadedVideos = useRef<Set<string>>(new Set());

  useEffect(() => {
    // تحميل مسبق فائق السرعة للفيديوهات
    videoUrls.forEach(url => {
      if (!preloadedVideos.current.has(url) && url && !url.includes('placeholder')) {
        // إنشاء رابط تحميل مسبق
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = url;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);

        // إنشاء فيديو مخفي للتحميل الفوري
        const video = document.createElement('video');
        video.src = url;
        video.preload = 'auto'; // تحميل كامل للفيديو
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.loop = true;
        
        // إخفاء الفيديو تماماً
        video.style.position = 'fixed';
        video.style.top = '-9999px';
        video.style.left = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        document.body.appendChild(video);
        
        // تشغيل مخفي للتحميل في الذاكرة
        video.play().catch(() => {});
        
        // تنظيف آمن بعد التحميل
        video.addEventListener('canplaythrough', () => {
          setTimeout(() => {
            try {
              if (video.parentNode) {
                document.body.removeChild(video);
              }
              if (link.parentNode) {
                document.head.removeChild(link);
              }
            } catch (e) {
              // تجاهل أخطاء التنظيف
            }
          }, 2000);
        });
        
        preloadedVideos.current.add(url);
      }
    });
  }, [videoUrls]);

  return preloadedVideos.current;
}