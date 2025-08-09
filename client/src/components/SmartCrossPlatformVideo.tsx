import React, { useState, useRef, useEffect } from 'react';

interface SmartCrossPlatformVideoProps {
  src: string;
  className?: string;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: string;
  onMouseEnter?: (e: React.MouseEvent<HTMLVideoElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLVideoElement>) => void;
  onCanPlay?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
}

export function SmartCrossPlatformVideo({ 
  src, 
  className, 
  muted = true, 
  loop = true, 
  playsInline = true, 
  preload = "auto",
  onMouseEnter,
  onMouseLeave,
  onCanPlay
}: SmartCrossPlatformVideoProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-detect and try proxy if file is from uploads
  useEffect(() => {
    if (src.includes('/uploads/')) {
      // Always try proxy first for uploads files
      const filename = src.split('/').pop();
      const proxyUrl = `/proxy/file/${filename}`;
      setCurrentSrc(proxyUrl);
    }
  }, [src]);

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

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setIsLoading(false);
    onCanPlay?.(e);
  };

  return (
    <div className={`relative ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
          <div className="text-gray-400 text-sm">جاري تحميل الفيديو...</div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500 text-sm text-center">
            <div>الفيديو غير متوفر</div>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        src={currentSrc}
        className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ display: hasError ? 'none' : 'block' }}
      />
    </div>
  );
}