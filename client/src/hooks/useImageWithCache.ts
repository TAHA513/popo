import { useState, useEffect } from 'react';
import { addCacheVersion } from '@shared/cache-version';

/**
 * Hook for loading images with intelligent caching
 * يستخدم نظام الكاش الذكي لتحميل الصور بسرعة
 */
export function useImageWithCache(originalUrl?: string, cacheType: 'images' | 'avatars' | 'covers' = 'images') {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!originalUrl) {
      setImageUrl('');
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Add cache version to URL
    const cachedUrl = addCacheVersion(originalUrl, cacheType);
    
    // Preload image to ensure it's cached
    const img = new Image();
    img.onload = () => {
      setImageUrl(cachedUrl);
      setIsLoading(false);
      setHasError(false);
    };
    
    img.onerror = () => {
      setImageUrl(originalUrl); // Fallback to original URL
      setIsLoading(false);
      setHasError(true);
    };

    img.src = cachedUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [originalUrl, cacheType]);

  return {
    imageUrl,
    isLoading,
    hasError,
    originalUrl
  };
}

/**
 * Component for cached image rendering
 */
interface CachedImageProps {
  src?: string;
  alt?: string;
  className?: string;
  cacheType?: 'images' | 'avatars' | 'covers';
  fallback?: JSX.Element | null;
  loader?: JSX.Element | null;
  [key: string]: any;
}

export function CachedImage({ 
  src, 
  alt = '', 
  className = '', 
  cacheType = 'images', 
  fallback = null, 
  loader = null,
  ...props 
}: CachedImageProps): JSX.Element | null {
  const { imageUrl, isLoading, hasError } = useImageWithCache(src, cacheType);

  if (isLoading && loader) {
    return loader;
  }

  if (hasError && fallback) {
    return fallback;
  }

  if (!imageUrl) {
    return fallback;
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      {...props}
    />
  );
}