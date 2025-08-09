import React, { useState } from 'react';

interface CrossPlatformImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function CrossPlatformImage({ src, alt, className, onClick }: CrossPlatformImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    if (!hasError && imageSrc === src) {
      // Try proxy URL if original fails
      const filename = src.split('/').pop();
      const proxyUrl = `/proxy/file/${filename}`;
      setImageSrc(proxyUrl);
      setHasError(true);
      console.log(`تجربة تحميل الملف من منصة أخرى: ${filename}`);
    } else {
      console.log(`فشل في العثور على الملف في كلا المنصتين: ${src}`);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">جاري التحميل...</div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
      />
    </div>
  );
}