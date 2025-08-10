import { useState } from 'react';

interface CloudImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function CloudImage({ src, alt, className = "", fallbackSrc }: CloudImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback if provided
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(false);
      return;
    }

    // If original src starts with /uploads/, try the media proxy
    if (src.startsWith('/uploads/')) {
      const filename = src.replace('/uploads/', '');
      const proxyUrl = `/api/media/proxy?url=${encodeURIComponent(window.location.origin + src)}`;
      if (imageSrc !== proxyUrl) {
        setImageSrc(proxyUrl);
        setIsLoading(true);
        setHasError(false);
        return;
      }
    }
  };

  // Normalize image URLs for cross-platform compatibility
  const getNormalizedSrc = (url: string) => {
    // If it's already a full URL (cloud storage), use as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a relative path starting with /uploads, it might be from local storage
    if (url.startsWith('/uploads/')) {
      return url; // Let the browser handle it, with fallback in handleError
    }
    
    // If it's a relative path, make it absolute
    if (url.startsWith('/')) {
      return url;
    }
    
    return url;
  };

  if (hasError && !fallbackSrc) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">صورة غير متاحة</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={getNormalizedSrc(imageSrc)}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}