
import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder,
  onLoad,
  onError 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);

  // Media URL utility function
  const getMediaUrl = (storedPath: string): string => {
    if (!storedPath) return '';
    
    if (storedPath.startsWith('http')) {
      return storedPath;
    }
    
    // تنظيف المسار من أي prefixes موجودة
    const cleanPath = storedPath.replace(/^.*\/uploads\//, '').replace(/^.*\/api\/media\//, '');
    
    // استخدم المسار النسبي مباشرة
    return `/api/media/${cleanPath}`;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && src && !isLoaded && !hasError) {
            setImageSrc(getMediaUrl(src));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, isLoaded, hasError]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    // استخدام صورة بديلة عند الخطأ
    setImageSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEMxNi42ODYzIDI4IDEzLjkzNzMgMjUuMjUxIDEzLjkzNzMgMjEuOTM3M0MxMy45MzczIDE4LjYyMzUgMTYuNjg2MyAxNS44NzQ2IDIwIDE1Ljg3NDZDMjMuMzEzNyAxNS44NzQ2IDI2LjA2MjcgMTguNjIzNSAyNi4wNjI3IDIxLjkzNzNDMjYuMDYyNyAyNS4yNTEgMjMuMzEzNyAyOCAyMCAyOFoiIGZpbGw9IiM5Q0E0QUIiLz4KPHN2Zz4K');
    if (onError) onError();
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded && !hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
}
