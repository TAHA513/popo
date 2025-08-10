import { useState, useRef, useEffect } from 'react';
import { MediaUtils } from '../utils/media-utils';

interface EnhancedVideoPlayerProps {
  src: string;
  className?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: Event) => void;
}

export default function EnhancedVideoPlayer({
  src,
  className = '',
  poster,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  onLoadStart,
  onCanPlay,
  onError
}: EnhancedVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (src) {
      // إصلاح المسار إذا كان legacy
      const fixedSrc = MediaUtils.fixLegacyMediaUrl(src);
      setCurrentSrc(fixedSrc);
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  const handleLoadStart = () => {
    setIsLoading(true);
    if (onLoadStart) onLoadStart();
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    if (onCanPlay) onCanPlay();
  };

  const handleError = (event: any) => {
    console.warn('خطأ في تحميل الفيديو:', currentSrc);
    setHasError(true);
    setIsLoading(false);
    
    if (videoRef.current) {
      MediaUtils.handleMediaError(videoRef.current, src);
    }
    
    if (onError) onError(event);
  };

  const handlePlay = () => {
    if (videoRef.current) {
      MediaUtils.playVideoSafely(videoRef.current);
    }
  };

  if (hasError) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="text-gray-500 dark:text-gray-400 mb-2">⚠️</div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            فشل في تحميل الفيديو
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={currentSrc}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onPlay={handlePlay}
        preload="metadata"
        style={{
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
}