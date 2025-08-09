import React, { useState, useRef } from 'react';

interface CrossPlatformVideoProps {
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

export function CrossPlatformVideo({ 
  src, 
  className, 
  muted = true, 
  loop = true, 
  playsInline = true, 
  preload = "auto",
  onMouseEnter,
  onMouseLeave,
  onCanPlay
}: CrossPlatformVideoProps) {

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = () => {
    if (currentSrc === src && src.includes('/uploads/')) {
      // Try proxy URL if original fails
      const filename = src.split('/').pop();
      const proxyUrl = `/proxy/file/${filename}`;
      setCurrentSrc(proxyUrl);
      console.log(`🎥 جاري جلب الفيديو من منصة أخرى: ${filename}`);
    } else {
      setIsLoading(false);
      setHasError(true);
      console.log(`❌ فشل في العثور على الفيديو في كلا المنصتين: ${src}`);
    }
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setIsLoading(false);
    onCanPlay?.(e);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
          <div className="text-gray-400 text-sm">جاري تحميل الفيديو...</div>
        </div>
      )}
      <video
        ref={videoRef}
        src={currentSrc}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
}