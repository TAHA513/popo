import { useState } from 'react';

interface CloudVideoProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
}

export function CloudVideo({ 
  src, 
  className = "", 
  controls = true, 
  autoPlay = false, 
  muted = true, 
  loop = false,
  poster 
}: CloudVideoProps) {
  const [videoSrc, setVideoSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadedData = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);

    // If original src starts with /uploads/, try the media proxy
    if (src.startsWith('/uploads/')) {
      const proxyUrl = `/api/media/proxy?url=${encodeURIComponent(window.location.origin + src)}`;
      if (videoSrc !== proxyUrl) {
        setVideoSrc(proxyUrl);
        setIsLoading(true);
        setHasError(false);
        return;
      }
    }
  };

  // Normalize video URLs for cross-platform compatibility
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

  if (hasError) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-2xl mb-2">📹</div>
          <span className="text-gray-400 text-sm">فيديو غير متاح</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <video
        src={getNormalizedSrc(videoSrc)}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        poster={poster}
        onLoadedData={handleLoadedData}
        onError={handleError}
      />
    </div>
  );
}