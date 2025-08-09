import React, { useState } from 'react';

interface CrossPlatformImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function CrossPlatformImage({ src, alt, className, onClick }: CrossPlatformImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    if (currentSrc === src && src.includes('/uploads/')) {
      // Try proxy URL if original fails
      const filename = src.split('/').pop();
      const proxyUrl = `/proxy/file/${filename}`;
      setCurrentSrc(proxyUrl);
      console.log(`🖼️ جاري جلب الصورة من منصة أخرى: ${filename}`);
    } else {
      setIsLoading(false);
      setHasError(true);
      console.log(`❌ فشل في العثور على الصورة في كلا المنصتين: ${src}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
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
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        style={{ display: hasError ? 'none' : 'block' }}
      />
    </div>
  );
}