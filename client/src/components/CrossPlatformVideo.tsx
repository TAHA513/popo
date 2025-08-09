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
  const [videoSrc, setVideoSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = () => {
    if (!hasError && videoSrc === src) {
      // Try proxy URL if original fails
      const filename = src.split('/').pop();
      const proxyUrl = `/proxy/file/${filename}`;
      setVideoSrc(proxyUrl);
      setHasError(true);
      console.log(`تجربة تحميل الفيديو من منصة أخرى: ${filename}`);
    } else {
      console.log(`فشل في العثور على الفيديو في كلا المنصتين: ${src}`);
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
        src={videoSrc}
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