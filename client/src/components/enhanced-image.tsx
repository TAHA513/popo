import { useState, useRef, useEffect } from 'react';
import { MediaUtils } from '../utils/media-utils';

interface EnhancedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}

export default function EnhancedImage({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (src) {
      // إصلاح المسار إذا كان legacy
      const fixedSrc = MediaUtils.fixLegacyMediaUrl(src);
      setCurrentSrc(fixedSrc);
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = (event: any) => {
    console.warn('خطأ في تحميل الصورة:', currentSrc);
    setHasError(true);
    setIsLoading(false);
    
    if (imgRef.current) {
      MediaUtils.handleMediaError(imgRef.current, src);
    }
    
    if (onError) onError(event);
  };

  if (hasError) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="text-gray-500 dark:text-gray-400 mb-2">📷</div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            فشل في تحميل الصورة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && currentSrc && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 w-full h-full"></div>
        </div>
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}