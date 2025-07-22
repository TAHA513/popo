import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Plus,
  Check
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
  const queryClient = useQueryClient();
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
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
    },
    refetchInterval: 1000, // كل ثانية واحدة - سرعة الصاروخ! 🚀
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Find current video index and stop previous video
  useEffect(() => {
    if (videoId && allVideos.length > 0) {
      // Stop all videos first
      const allVideoElements = document.querySelectorAll('video');
      allVideoElements.forEach(video => {
        video.pause();
        video.currentTime = 0;
        video.muted = true;
      });
      
      const index = allVideos.findIndex(v => v.id === parseInt(videoId));
      if (index !== -1) {
        setCurrentVideoIndex(index);
        setIsVideoPlaying(true);
        setIsMuted(true);
      }
    }
  }, [videoId, allVideos]);

  const currentVideo = allVideos[currentVideoIndex];

  // Check if current user is following the video author
  const { data: followStatus } = useQuery({
    queryKey: ['/api/users', currentVideo?.author?.id, 'is-following'],
    queryFn: async () => {
      if (!currentVideo?.author?.id || !user) return { isFollowing: false };
      const response = await fetch(`/api/users/${currentVideo.author.id}/is-following`, {
        credentials: 'include'
      });
      if (!response.ok) return { isFollowing: false };
      return response.json();
    },
    enabled: !!currentVideo?.author?.id && !!user
  });

  const isFollowing = followStatus?.isFollowing || false;

  // Auto-play and handle video changes
  useEffect(() => {
    if (currentVideo && isVideoPlaying) {
      setTimeout(() => {
        const videoElement = document.querySelector(`#video-${currentVideo.id}`) as HTMLVideoElement;
        if (videoElement) {
          videoElement.muted = isMuted;
          videoElement.play().catch(() => {
            // Auto-play failed, user needs to interact first
          });
        }
      }, 100);
    }
  }, [currentVideo, isVideoPlaying, isMuted]);

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
      } else {
        newSet.add(videoKey);
      }
      return newSet;
    });
    
    // Call API for like interaction
    interactionMutation.mutate({ videoId: currentVideo.id, type: 'like' });
  };

  const stopCurrentVideo = () => {
    if (currentVideo) {
      const videoElement = document.querySelector(`#video-${currentVideo.id}`) as HTMLVideoElement;
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    }
  };

  const goToNextVideo = () => {
    if (currentVideoIndex < allVideos.length - 1) {
      // Stop current video first
      stopCurrentVideo();
      
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      setIsVideoPlaying(true); // Start new video
      // Update URL without page reload
      window.history.replaceState(null, '', `/video/${allVideos[nextIndex].id}`);
    }
  };

  const goToPrevVideo = () => {
    if (currentVideoIndex > 0) {
      // Stop current video first
      stopCurrentVideo();
      
      const prevIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      setIsVideoPlaying(true); // Start new video
      // Update URL without page reload
      window.history.replaceState(null, '', `/video/${allVideos[prevIndex].id}`);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevVideo();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextVideo();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleVideoToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, allVideos]);

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

  // Preload next and previous videos for faster navigation
  useEffect(() => {
    if (allVideos.length > 1) {
      const nextIndex = currentVideoIndex + 1;
      const prevIndex = currentVideoIndex - 1;
      
      // Preload next video
      if (nextIndex < allVideos.length) {
        const nextVideo = allVideos[nextIndex];
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = nextVideo.mediaUrls[0];
      }
      
      // Preload previous video
      if (prevIndex >= 0) {
        const prevVideo = allVideos[prevIndex];
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = prevVideo.mediaUrls[0];
      }
    }
  }, [currentVideoIndex, allVideos]);

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      return await apiRequest(`/api/users/${userId}/follow`, 'POST');
    },
    onSuccess: (data) => {
      toast({
        title: data.following ? "تمت المتابعة!" : "تم إلغاء المتابعة",
        description: data.following ? "أضيف المستخدم لقائمة الأصدقاء" : "تم إزالة المستخدم من الأصدقاء",
      });
      // Update local state immediately
      if (currentVideo?.author?.id) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          if (data.following) {
            newSet.add(currentVideo.author.id);
          } else {
            newSet.delete(currentVideo.author.id);
          }
          return newSet;
        });
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentVideo?.author?.id, 'is-following'] });
    },
    onError: (error: any) => {
      console.error("Follow error:", error);
      const isAuthError = error.message?.includes("401") || error.message?.includes("يجب تسجيل الدخول");
      toast({
        title: "خطأ في المتابعة",
        description: isAuthError ? "يجب تسجيل الدخول أولاً" : "حاول مرة أخرى",
        variant: "destructive",
      });
      
      // If authentication error, redirect to login
      if (isAuthError) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
  });

  // Video interaction mutation
  const interactionMutation = useMutation({
    mutationFn: async ({ videoId, type }: { videoId: number; type: string }) => {
      return await apiRequest(`/api/memories/${videoId}/interact`, 'POST', { type });
    },
    onSuccess: (_, { type }) => {
      const messages = {
        like: "تم الإعجاب! ❤️",
        comment: "تم فتح التعليقات",
        share: "تم نسخ الرابط للمشاركة",
        gift: "تم إرسال الهدية! 🎁"
      };
      
      toast({
        title: messages[type as keyof typeof messages] || "تم التفاعل",
        description: "شكراً لتفاعلك مع المحتوى",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
    },
    onError: (error: any) => {
      console.error("Interaction error:", error);
      const isAuthError = error.message?.includes("401") || error.message?.includes("يجب تسجيل الدخول");
      toast({
        title: "خطأ في التفاعل",
        description: isAuthError ? "يجب تسجيل الدخول أولاً" : "حاول مرة أخرى",
        variant: "destructive",
      });
      
      // If authentication error, redirect to login
      if (isAuthError) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
  });

  const handleFollow = () => {
    if (!currentVideo || !currentVideo.author) return;
    followMutation.mutate({ userId: currentVideo.author.id });
  };

  const handleComment = () => {
    if (!currentVideo) return;
    interactionMutation.mutate({ videoId: currentVideo.id, type: 'comment' });
  };

  const handleShare = () => {
    if (!currentVideo) return;
    navigator.clipboard?.writeText(`${window.location.origin}/video/${currentVideo.id}`);
    interactionMutation.mutate({ videoId: currentVideo.id, type: 'share' });
  };

  const handleGift = () => {
    if (!currentVideo) return;
    interactionMutation.mutate({ videoId: currentVideo.id, type: 'gift' });
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
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="mt-6 text-white/90 text-lg font-medium">جاري تحضير الفيديوهات...</p>
          <p className="mt-2 text-white/60 text-sm">التحميل السريع جارٍ</p>
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
          key={currentVideo.id}
          id={`video-${currentVideo.id}`}
          src={currentVideo.mediaUrls[0]}
          className="w-full h-full object-contain bg-gray-100"
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          poster={currentVideo.thumbnailUrl}
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
          onLoadStart={() => setIsVideoPlaying(false)}
          onCanPlay={() => setIsVideoPlaying(true)}
          onWaiting={() => setIsVideoPlaying(false)}
          onLoadedData={() => setIsVideoPlaying(true)}
        />

        {/* Video Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Play/Pause Button - Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleVideoToggle}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full text-white bg-black/40 hover:bg-black/60 transition-all duration-300 ${isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-90 hover:opacity-100'}`}
            >
              {isVideoPlaying ? (
                <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                  <div className="w-1.5 h-5 md:w-2 md:h-6 bg-white rounded mr-1"></div>
                  <div className="w-1.5 h-5 md:w-2 md:h-6 bg-white rounded"></div>
                </div>
              ) : (
                <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" fill="white" />
              )}
            </Button>
          </div>

          {/* Volume Control - Top Right */}
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeToggle}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/40 hover:border-white/70 transition-all duration-300 ${isMuted ? 'text-red-500' : 'text-green-500'} bg-black/50 hover:bg-black/70`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
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
        <div className="absolute right-2 md:right-4 bottom-20 flex flex-col items-center space-y-4 md:space-y-6 z-10">
          {/* Author Profile */}
          <div className="flex flex-col items-center">
            {currentVideo.author?.profileImageUrl ? (
              <img
                src={currentVideo.author.profileImageUrl}
                alt="صورة المنشور"
                className="w-12 h-12 md:w-16 md:h-16 rounded-full object-contain bg-gray-100 border-2 border-white/50 mb-2"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white/50 mb-2">
                <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            )}
            
            {currentVideo.author?.id !== user?.id && (
              <Button 
                size="sm"
                className={`w-6 h-6 md:w-8 md:h-8 p-0 rounded-full border-2 border-white transition-colors ${
                  isFollowing 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                onClick={handleFollow}
                disabled={followMutation.isPending}
              >
                {followMutation.isPending ? (
                  <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isFollowing ? (
                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                ) : (
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                )}
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center space-y-4 md:space-y-6">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLike}
              className={`flex flex-col items-center ${likedVideos.has(`video-${currentVideo.id}`) ? 'text-red-500' : 'text-white'} hover:text-red-400 bg-transparent p-2 md:p-3`}
            >
              <Heart className={`w-6 h-6 md:w-8 md:h-8 ${likedVideos.has(`video-${currentVideo.id}`) ? 'fill-current' : ''}`} />
              <span className="text-xs md:text-sm mt-1">{currentVideo.likeCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={handleComment}
              className="flex flex-col items-center text-white hover:text-blue-400 bg-transparent p-2 md:p-3"
            >
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm mt-1">تعليق</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={handleShare}
              className="flex flex-col items-center text-white hover:text-green-400 bg-transparent p-2 md:p-3"
            >
              <Share2 className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm mt-1">مشاركة</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={handleGift}
              className="flex flex-col items-center text-white hover:text-yellow-400 bg-transparent p-2 md:p-3"
            >
              <Gift className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm mt-1">هدية</span>
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