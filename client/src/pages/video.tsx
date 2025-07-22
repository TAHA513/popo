import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import SimpleNavigation from "@/components/simple-navigation";
import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  Gift,
  Eye,
  User,
  Calendar,
  MapPin,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sparkles,
  Crown,
  Star,
  ChevronUp,
  ChevronDown,
  Plus
} from "lucide-react";

interface VideoData {
  id: number;
  authorId: string;
  type: string;
  title?: string;
  caption?: string;
  mediaUrls: string[];
  thumbnailUrl?: string;
  memoryType: 'fleeting' | 'precious' | 'legendary';
  viewCount: number;
  likeCount: number;
  shareCount: number;
  giftCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    profileImageUrl?: string;
    firstName?: string;
    lastName?: string;
    points?: number;
    isStreamer?: boolean;
  };
}

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all public videos for TikTok-style browsing
  const { data: allVideos = [], isLoading: videosLoading } = useQuery<VideoData[]>({
    queryKey: ['/api/memories/public'],
    queryFn: async () => {
      const response = await fetch('/api/memories/public', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل في تحميل الفيديوهات');
      const data = await response.json();
      // Filter only videos
      return data.filter((item: any) => item.type === 'video');
    }
  });

  // Find current video index
  useEffect(() => {
    if (videoId && allVideos.length > 0) {
      const index = allVideos.findIndex(v => v.id === parseInt(videoId));
      if (index !== -1) {
        setCurrentVideoIndex(index);
      }
    }
  }, [videoId, allVideos]);

  const currentVideo = allVideos[currentVideoIndex];

  const handleVideoToggle = () => {
    const videoElement = document.querySelector(`#video-${currentVideo?.id}`) as HTMLVideoElement;
    if (!videoElement) return;

    if (isVideoPlaying) {
      videoElement.pause();
      setIsVideoPlaying(false);
    } else {
      videoElement.play();
      setIsVideoPlaying(true);
    }
  };

  const handleVolumeToggle = () => {
    const videoElement = document.querySelector(`#video-${currentVideo?.id}`) as HTMLVideoElement;
    if (!videoElement) return;

    if (isMuted) {
      videoElement.muted = false;
      setIsMuted(false);
    } else {
      videoElement.muted = true;
      setIsMuted(true);
    }
  };

  const handleLike = () => {
    if (!currentVideo) return;
    
    const videoKey = `video-${currentVideo.id}`;
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoKey)) {
        newSet.delete(videoKey);
        toast({
          title: "تم إلغاء الإعجاب",
          description: "تم إلغاء إعجابك بالفيديو"
        });
      } else {
        newSet.add(videoKey);
        toast({
          title: "أعجبك هذا!",
          description: "تم إضافة إعجابك للفيديو"
        });
      }
      return newSet;
    });
  };

  const goToNextVideo = () => {
    if (currentVideoIndex < allVideos.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      window.history.pushState(null, '', `/video/${allVideos[nextIndex].id}`);
    }
  };

  const goToPrevVideo = () => {
    if (currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      window.history.pushState(null, '', `/video/${allVideos[prevIndex].id}`);
    }
  };

  // Handle swipe gestures
  useEffect(() => {
    let startY = 0;
    let startX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const deltaY = startY - endY;
      const deltaX = Math.abs(startX - endX);
      
      // Only handle vertical swipes (ignore horizontal)
      if (deltaX < 50 && Math.abs(deltaY) > 50) {
        if (deltaY > 50) {
          // Swipe up - next video
          goToNextVideo();
        } else if (deltaY < -50) {
          // Swipe down - previous video
          goToPrevVideo();
        }
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentVideoIndex, allVideos]);

  const handleInteraction = (action: string) => {
    toast({
      title: `${action}`,
      description: `تم تنفيذ ${action} بنجاح`,
    });
  };

  const getMemoryTypeColor = (type: string) => {
    switch(type) {
      case 'fleeting': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'precious': return 'bg-gradient-to-r from-purple-500 to-pink-500';  
      case 'legendary': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getMemoryTypeIcon = (type: string) => {
    switch(type) {
      case 'fleeting': return <Eye className="w-3 h-3 mr-1" />;
      case 'precious': return <Heart className="w-3 h-3 mr-1" />;
      case 'legendary': return <Crown className="w-3 h-3 mr-1" />;
      default: return <Star className="w-3 h-3 mr-1" />;
    }
  };

  if (videosLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-white">جاري تحميل الفيديوهات...</p>
        </div>
      </div>
    );
  }

  if (!currentVideo || allVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">لا توجد فيديوهات</h2>
          <Button onClick={() => window.history.back()} className="bg-purple-600 text-white">العودة</Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black relative overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 z-20 text-white bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 p-0"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      {/* Navigation Arrows - Desktop */}
      <div className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex-col space-y-4">
        {currentVideoIndex > 0 && (
          <Button
            variant="ghost"
            onClick={goToPrevVideo}
            className="w-12 h-12 rounded-full text-white bg-black/50 hover:bg-black/70"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
        )}
        {currentVideoIndex < allVideos.length - 1 && (
          <Button
            variant="ghost"
            onClick={goToNextVideo}
            className="w-12 h-12 rounded-full text-white bg-black/50 hover:bg-black/70"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Video Container */}
      <div className="relative w-full h-screen flex items-center justify-center group">
        <video
          id={`video-${currentVideo.id}`}
          src={currentVideo.mediaUrls[0]}
          className="w-full h-full object-cover"
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          poster={currentVideo.thumbnailUrl}
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
        />

        {/* Video Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Play/Pause Button - Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleVideoToggle}
              className={`w-20 h-20 rounded-full text-white bg-black/40 hover:bg-black/60 transition-all duration-300 ${isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-90 hover:opacity-100'}`}
            >
              {isVideoPlaying ? (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-2 h-6 bg-white rounded mr-1"></div>
                  <div className="w-2 h-6 bg-white rounded"></div>
                </div>
              ) : (
                <Play className="w-8 h-8 ml-1" fill="white" />
              )}
            </Button>
          </div>

          {/* Volume Control - Top Right */}
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeToggle}
              className={`w-12 h-12 rounded-full border-2 border-white/40 hover:border-white/70 transition-all duration-300 ${isMuted ? 'text-red-500' : 'text-green-500'} bg-black/50 hover:bg-black/70`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>

          {/* Memory Type Badge - Top Left */}
          <Badge className={`absolute top-4 left-20 ${getMemoryTypeColor(currentVideo.memoryType)} text-white`}>
            <div className="flex items-center">
              {getMemoryTypeIcon(currentVideo.memoryType)}
              <span className="text-xs mr-1">{currentVideo.memoryType}</span>
            </div>
          </Badge>
        </div>

        {/* Video Info & Actions - TikTok Style Right Sidebar */}
        <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 z-10">
          {/* Author Profile */}
          <div className="flex flex-col items-center">
            {currentVideo.author?.profileImageUrl ? (
              <img
                src={currentVideo.author.profileImageUrl}
                alt="صورة المنشور"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/50 mb-2"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white/50 mb-2">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
            
            {currentVideo.author?.id !== user?.id && (
              <Button 
                size="sm"
                className="w-8 h-8 p-0 rounded-full bg-red-600 text-white border-2 border-white hover:bg-red-700"
                onClick={() => handleInteraction('المتابعة')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center space-y-6">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLike}
              className={`flex flex-col items-center ${likedVideos.has(`video-${currentVideo.id}`) ? 'text-red-500' : 'text-white'} hover:text-red-400 bg-transparent`}
            >
              <Heart className={`w-8 h-8 ${likedVideos.has(`video-${currentVideo.id}`) ? 'fill-current' : ''}`} />
              <span className="text-sm mt-1">{currentVideo.likeCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleInteraction('التعليق')}
              className="flex flex-col items-center text-white hover:text-blue-400 bg-transparent"
            >
              <MessageCircle className="w-8 h-8" />
              <span className="text-sm mt-1">تعليق</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleInteraction('المشاركة')}
              className="flex flex-col items-center text-white hover:text-green-400 bg-transparent"
            >
              <Share2 className="w-8 h-8" />
              <span className="text-sm mt-1">مشاركة</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleInteraction('إرسال هدية')}
              className="flex flex-col items-center text-white hover:text-yellow-400 bg-transparent"
            >
              <Gift className="w-8 h-8" />
              <span className="text-sm mt-1">هدية</span>
            </Button>
          </div>
        </div>

        {/* Video Info - Bottom Left */}
        <div className="absolute bottom-0 left-0 right-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
          {/* Author Info */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <h4 className="font-bold text-white text-lg">
              @{currentVideo.author?.username || 'مستخدم'}
            </h4>
            {currentVideo.author?.points && (
              <div className="flex items-center">
                <Sparkles className="w-4 h-4 text-yellow-500 ml-1" />
                <span className="text-sm text-white/80">{currentVideo.author.points}</span>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="mb-4">
            {currentVideo.title && (
              <h3 className="text-white font-bold text-lg mb-2 text-right">
                {currentVideo.title}
              </h3>
            )}
            <p className="text-white/90 text-right leading-relaxed text-sm">
              {currentVideo.caption || "فيديو رائع"}
            </p>
          </div>

          {/* Video Stats */}
          <div className="flex items-center space-x-6 rtl:space-x-reverse text-white/70">
            <div className="flex items-center">
              <Eye className="w-4 h-4 ml-1" />
              <span className="text-sm">{currentVideo.viewCount}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 ml-1" />
              <span className="text-sm">{new Date(currentVideo.createdAt).toLocaleDateString('ar')}</span>
            </div>
          </div>
        </div>

        {/* Video Progress Indicator */}
        <div className="absolute top-1/2 left-2 transform -translate-y-1/2 flex flex-col items-center space-y-1 z-10">
          {allVideos.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-8 rounded-full transition-all duration-300 ${
                index === currentVideoIndex 
                  ? 'bg-white' 
                  : index < currentVideoIndex 
                    ? 'bg-white/60' 
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Swipe Instruction - Show on first load */}
        {currentVideoIndex === 0 && (
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white/70 animate-pulse">
            <ChevronUp className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">اسحب للأعلى للفيديو التالي</p>
          </div>
        )}
      </div>
    </div>
  );
}