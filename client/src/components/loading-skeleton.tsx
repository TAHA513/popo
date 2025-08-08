import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingSkeletonProps {
  className?: string;
  type?: 'image' | 'video' | 'text';
  aspectRatio?: string;
}

export default function LoadingSkeleton({ 
  className = '', 
  type = 'image', 
  aspectRatio = '16/9' 
}: LoadingSkeletonProps) {
  const { isRTL } = useLanguage();
  const baseClasses = "loading-skeleton rounded-lg";
  
  if (type === 'video' || type === 'image') {
    return (
      <div 
        className={`${baseClasses} ${className}`} 
        style={{ aspectRatio }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center space-y-2">
            {type === 'video' ? (
              <div className="w-12 h-12 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded animate-pulse"></div>
            )}
            <span className="text-sm text-gray-500">
{type === 'video' ? (isRTL ? 'جاري تحميل الفيديو...' : 'Loading video...') : (isRTL ? 'جاري تحميل الصورة...' : 'Loading image...')}
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${baseClasses} h-4 ${className}`}></div>
  );
}