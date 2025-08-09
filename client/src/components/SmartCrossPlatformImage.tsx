import React, { useState, useEffect } from 'react';

interface SmartCrossPlatformImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function SmartCrossPlatformImage({ src, alt, className, onClick }: SmartCrossPlatformImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Auto-detect and try proxy if file is from uploads
  useEffect(() => {
    if (src.includes('/uploads/')) {
      // Always try proxy first for uploads files
      const filename = src.split('/').pop();
      const proxyUrl = `/proxy/file/${filename}`;
      setCurrentSrc(proxyUrl);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    if (currentSrc.includes('/proxy/file/')) {
      // If proxy fails, try direct URL
      setCurrentSrc(src);
    } else {
      // If direct URL also fails, show error
      setIsLoading(false);
      setHasError(true);
    }
  };

  return (
    <div className={`relative ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
          <div className="text-gray-400 text-sm">جاري التحميل...</div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500 text-sm text-center">
            <div>الصورة غير متوفرة</div>
          </div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        style={{ display: hasError ? 'none' : 'block' }}
      />
    </div>
  );
}