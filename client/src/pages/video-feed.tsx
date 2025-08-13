import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Gift, User, Volume2, VolumeX, Play } from "lucide-react";
import { EnhancedGiftModal } from "@/components/enhanced-gift-modal";
import VideoCommentsModal from "@/components/video-comments-modal";

import BottomNavigation from "@/components/bottom-navigation";

interface VideoMemory {
  id: number;
  authorId: string;
  caption?: string;
  mediaUrls: string[];
  type: string;
  likeCount?: number;
  viewCount?: number;
  shareCount?: number;
  createdAt: string;
  author?: {
    username: string;
    profileImageUrl?: string;
  };
}

export default function VideoFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  // Get URL params to check if starting from specific video
  const urlParams = new URLSearchParams(window.location.search);
  const startVideoId = urlParams.get('start');

  // Get only video memories
  const { data: allMemories = [] } = useQuery({
    queryKey: ['/api/memories/public'],
    refetchInterval: 30000,
  });

  // Filter only videos and shuffle randomly
  const videoMemories = (allMemories as VideoMemory[])
    .filter(memory => memory.type === 'video' && memory.mediaUrls?.length > 0)
    .sort(() => Math.random() - 0.5); // Random shuffle

  // Set initial video index based on URL param
  useEffect(() => {
    if (startVideoId && videoMemories.length > 0) {
      const startIndex = videoMemories.findIndex(video => video.id.toString() === startVideoId);
      if (startIndex !== -1) {
        setCurrentVideoIndex(startIndex);
      }
      // Clean up URL without reloading
      window.history.replaceState({}, '', '/videos');
    }
  }, [startVideoId, videoMemories]);

  // Touch/Swipe handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diffY = startY.current - currentY;
    
    if (Math.abs(diffY) > 10) {
      isDragging.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;

    const currentY = e.changedTouches[0].clientY;
    const diffY = startY.current - currentY;

    // Swipe up (next video)
    if (diffY > 50 && currentVideoIndex < videoMemories.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    }
    // Swipe down (previous video)  
    else if (diffY < -50 && currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    }

    isDragging.current = false;
  }, [currentVideoIndex, videoMemories.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' && currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    } else if (e.key === 'ArrowDown' && currentVideoIndex < videoMemories.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    } else if (e.key === ' ') {
      e.preventDefault();
      const currentVideo = videoRefs.current[currentVideoIndex];
      if (currentVideo) {
        if (currentVideo.paused) {
          currentVideo.play();
        } else {
          currentVideo.pause();
        }
      }
    } else if (e.key === 'm' || e.key === 'M') {
      setIsMuted(prev => !prev);
    }
  }, [currentVideoIndex, videoMemories.length]);

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown]);

  // Auto-play current video and pause others
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideoIndex) {
          video.currentTime = 0;
          video.play().catch(() => {
            // Handle autoplay restrictions
            console.log('تعذر التشغيل التلقائي');
          });
        } else {
          video.pause();
        }
        video.muted = isMuted;
      }
    });
  }, [currentVideoIndex, isMuted]);

  // Record video view
  useEffect(() => {
    if (videoMemories[currentVideoIndex]?.id) {
      const timeoutId = setTimeout(() => {
        apiRequest(`/api/memories/${videoMemories[currentVideoIndex].id}/view`, 'POST');
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [currentVideoIndex, videoMemories]);

  // Interaction mutations
  const interactionMutation = useMutation({
    mutationFn: async ({ memoryId, type }: { memoryId: number; type: string }) => {
      return await apiRequest('POST', `/api/memories/${memoryId}/interact`, { type });
    },
    onSuccess: (_, { type }) => {
      const messages = {
        like: "تم الإعجاب! ❤️",
        share: "تم نسخ الرابط للمشاركة",
      };
      
      toast({
        title: messages[type as keyof typeof messages] || "تم التفاعل",
        description: "شكراً لتفاعلك مع المحتوى",
      });
    },
  });

  const handleLike = (memoryId: number) => {
    interactionMutation.mutate({ memoryId, type: 'like' });
  };

  const handleShare = (memoryId: number) => {
    const memory = videoMemories[currentVideoIndex];
    if (navigator.share) {
      navigator.share({
        title: `فيديو من ${memory.author?.username || 'LaaBoBo'}`,
        text: memory.caption || 'شاهد هذا الفيديو الرائع!',
        url: `${window.location.origin}/memory/${memoryId}`
      }).then(() => {
        interactionMutation.mutate({ memoryId, type: 'share' });
      }).catch(() => {
        navigator.clipboard?.writeText(`${window.location.origin}/memory/${memoryId}`);
        toast({ title: "تم نسخ الرابط للحافظة!" });
        interactionMutation.mutate({ memoryId, type: 'share' });
      });
    } else {
      navigator.clipboard?.writeText(`${window.location.origin}/memory/${memoryId}`);
      toast({ title: "تم نسخ الرابط للحافظة!" });
      interactionMutation.mutate({ memoryId, type: 'share' });
    }
  };

  const handleGiftClick = (memory: VideoMemory) => {
    setSelectedRecipient({
      id: memory.authorId,
      username: memory.author?.username,
      profileImageUrl: memory.author?.profileImageUrl
    });
    setShowGiftPanel(true);
  };

  if (videoMemories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Play className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">لا توجد فيديوهات</h2>
          <p>لا توجد فيديوهات متاحة حالياً</p>
        </div>
      </div>
    );
  }

  const currentVideo = videoMemories[currentVideoIndex];

  return (
    <>
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-black overflow-hidden touch-none pb-12"
        style={{ userSelect: 'none' }}
      >
        {/* Video Container */}
        <div className="relative w-full h-full">
          {videoMemories.map((memory, index) => (
            <div
              key={memory.id}
              className={`absolute inset-0 transition-transform duration-300 ${
                index === currentVideoIndex ? 'translate-y-0' : 
                index < currentVideoIndex ? '-translate-y-full' : 'translate-y-full'
              }`}
            >
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={memory.mediaUrls[0]}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={isMuted}
                preload="metadata"
                onClick={() => {
                  const video = videoRefs.current[index];
                  if (video) {
                    if (video.paused) {
                      video.play();
                    } else {
                      video.pause();
                    }
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info and Controls Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
          
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Right side controls */}
          <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4 pointer-events-auto z-50">
            {/* Add Button */}
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white w-4 h-4 rounded-full p-0 font-bold text-xs border border-white z-50 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add button clicked - navigating to /home');
                window.location.href = '/home';
              }}
            >
              +
            </Button>
            
            {/* Profile */}
            <button 
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full overflow-hidden border-2 border-white z-50 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Profile clicked for user:', currentVideo.author?.username);
                if (currentVideo.author?.username) {
                  window.location.href = `/profile/${currentVideo.author.username}`;
                }
              }}
            >
              {currentVideo.author?.profileImageUrl ? (
                <img 
                  src={currentVideo.author.profileImageUrl} 
                  alt={currentVideo.author.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white m-3" />
              )}
            </button>

            {/* Like */}
            <button
              className="flex flex-col items-center space-y-1 text-white z-50 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Like clicked for video:', currentVideo.id);
                handleLike(currentVideo.id);
              }}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-xs">{currentVideo.likeCount || 0}</span>
            </button>

            {/* Comments */}
            <button
              className="flex flex-col items-center space-y-1 text-white z-50 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Comments clicked for video:', currentVideo.id);
                setShowCommentsModal(true);
              }}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-xs">تعليق</span>
            </button>

            {/* Share */}
            <button
              className="flex flex-col items-center space-y-1 text-white z-50 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Share clicked for video:', currentVideo.id);
                handleShare(currentVideo.id);
              }}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="text-xs">شارك</span>
            </button>

            {/* Gift */}
            <button
              className="flex flex-col items-center space-y-1 text-white z-50 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Gift clicked for video:', currentVideo.id);
                handleGiftClick(currentVideo);
              }}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <span className="text-xs">هدية</span>
            </button>
          </div>

          {/* Left side info */}
          <div className="absolute left-4 bottom-20 max-w-[60%] pointer-events-auto">
            <div className="text-white space-y-2">
              <h3 className="font-bold flex items-center gap-2">
                @{currentVideo.author?.username || `user${currentVideo.authorId?.slice(0, 6)}`}
                <span className="text-blue-400">✓</span>
              </h3>
              {currentVideo.caption && (
                <p className="text-sm leading-relaxed">
                  {currentVideo.caption}
                </p>
              )}
              <div className="flex items-center space-x-4 text-xs opacity-80">
                <span>منذ {Math.floor(Math.random() * 24) + 1} ساعة</span>
                <span>{currentVideo.viewCount || Math.floor(Math.random() * 1000) + 100} مشاهدة</span>
              </div>
            </div>
          </div>

          {/* Volume control */}
          <button
            className="absolute top-6 right-4 text-white pointer-events-auto"
            onClick={() => setIsMuted(prev => !prev)}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          {/* Progress indicator */}
          <div className="absolute top-6 left-4 text-white text-sm pointer-events-none">
            {currentVideoIndex + 1} / {videoMemories.length}
          </div>

          {/* Navigation hints */}
          {currentVideoIndex < videoMemories.length - 1 && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-60 pointer-events-none animate-bounce">
              ← اسحب لأعلى للفيديو التالي
            </div>
          )}
        </div>
      </div>
      {/* Gift Modal */}
      {showGiftPanel && selectedRecipient && (
        <EnhancedGiftModal
          isOpen={showGiftPanel}
          onClose={() => {
            setShowGiftPanel(false);
            setSelectedRecipient(null);
          }}
          receiverId={selectedRecipient.id}
          receiverName={selectedRecipient.username}
          streamId={null}
          memoryId={null}
        />
      )}

      {/* Comments Modal */}
      <VideoCommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        memoryId={currentVideo?.id || 0}
        memoryAuthor={currentVideo?.author}
      />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation />
      </div>
    </>
  );
}