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
    id: string;
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
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [stickyMode, setStickyMode] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean[]>([]);
  const [videoDuration, setVideoDuration] = useState<number[]>([]);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number[]>([]);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isButtonClicked = useRef(false);
  const playButtonTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Get current video safely
  const currentVideo = videoMemories[currentVideoIndex];

  // Load follow status for current user only
  useEffect(() => {
    const loadCurrentUserFollowStatus = async () => {
      if (!user || !currentVideo?.author?.id) return;
      
      try {
        const response = await fetch(`/api/users/${currentVideo.author.id}/follow-status`);
        if (response.ok) {
          const { isFollowing } = await response.json();
          setFollowingUsers(prev => {
            const newSet = new Set(prev);
            if (isFollowing && currentVideo.author) {
              newSet.add(currentVideo.author.id);
            } else if (currentVideo.author) {
              newSet.delete(currentVideo.author.id);
            }
            return newSet;
          });
        }
      } catch (error) {
        console.log('Failed to load follow status');
      }
    };

    loadCurrentUserFollowStatus();
  }, [user, currentVideo?.author?.id]);

  // Touch/Swipe handlers - Enhanced protection against auto-navigation
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const target = e.target as Element;
    
    // Block all interaction with control areas
    if (target.closest('.pointer-events-auto') || 
        target.closest('button') || 
        target.closest('[role="button"]') ||
        target.closest('.video-controls') ||
        target.tagName === 'BUTTON') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
    
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const target = e.target as Element;
    
    // Block all interaction with control areas
    if (target.closest('.pointer-events-auto') || 
        target.closest('button') || 
        target.closest('[role="button"]') ||
        target.closest('.video-controls') ||
        target.tagName === 'BUTTON' ||
        isButtonClicked.current) {
      e.preventDefault();
      e.stopPropagation(); 
      e.stopImmediatePropagation();
      return false;
    }
    
    if (!startY.current) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = startY.current - currentY;
    
    // Require larger movement for drag detection
    if (Math.abs(diffY) > 20) {
      isDragging.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const target = e.target as Element;
    
    // Block all interaction with control areas
    if (target.closest('.pointer-events-auto') || 
        target.closest('button') || 
        target.closest('[role="button"]') ||
        target.closest('.video-controls') ||
        target.tagName === 'BUTTON') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      isDragging.current = false;
      isButtonClicked.current = false;
      return false;
    }

    // Always reset button click flag after any touch
    if (isButtonClicked.current) {
      isButtonClicked.current = false;
      isDragging.current = false;
      return;
    }

    // Only navigate if we have a proper drag gesture
    if (!isDragging.current || !startY.current) {
      isDragging.current = false;
      return;
    }

    const currentY = e.changedTouches[0].clientY;
    const diffY = startY.current - currentY;

    // Handle upward swipe for sticky mode vs navigation
    if (diffY < -80) {
      // Upward swipe - toggle sticky mode or go to previous video
      if (stickyMode) {
        // If in sticky mode, disable it and go to previous video
        setStickyMode(false);
        if (currentVideoIndex > 0) {
          setCurrentVideoIndex(prev => prev - 1);
        }
      } else {
        // Enable sticky mode on upward swipe
        setStickyMode(true);
      }
    } else if (diffY > 80 && currentVideoIndex < videoMemories.length - 1) {
      // Downward swipe - always go to next video and disable sticky mode
      setStickyMode(false);
      setCurrentVideoIndex(prev => prev + 1);
    }

    // Always reset
    isDragging.current = false;
    startY.current = null;
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
    } else if (e.key === 's' || e.key === 'S') {
      // Toggle sticky mode with 'S' key
      setStickyMode(prev => !prev);
    }
  }, [currentVideoIndex, videoMemories.length]);

  // Initialize video states
  useEffect(() => {
    if (videoMemories.length > 0) {
      setIsVideoPlaying(new Array(videoMemories.length).fill(false));
      setVideoDuration(new Array(videoMemories.length).fill(0));
      setVideoCurrentTime(new Array(videoMemories.length).fill(0));
    }
  }, [videoMemories.length]);

  // Setup video event listeners for tracking progress
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      const updateTime = () => {
        setVideoCurrentTime(prev => {
          const newTimes = [...prev];
          newTimes[index] = video.currentTime;
          return newTimes;
        });
      };

      const updateDuration = () => {
        if (video.duration) {
          setVideoDuration(prev => {
            const newDurations = [...prev];
            newDurations[index] = video.duration;
            return newDurations;
          });
        }
      };

      const updatePlayState = () => {
        setIsVideoPlaying(prev => {
          const newStates = [...prev];
          newStates[index] = !video.paused;
          return newStates;
        });
      };

      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', updateDuration);
      video.addEventListener('play', updatePlayState);
      video.addEventListener('pause', updatePlayState);
      video.addEventListener('ended', updatePlayState);

      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', updateDuration);
        video.removeEventListener('play', updatePlayState);
        video.removeEventListener('pause', updatePlayState);
        video.removeEventListener('ended', updatePlayState);
      };
    });
  }, [videoMemories]);

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
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
          video.currentTime = 0; // Reset time for other videos
        }
        video.muted = isMuted;
      }
    });

    // Hide play button when switching videos
    setShowPlayButton(false);
    if (playButtonTimeoutRef.current) {
      clearTimeout(playButtonTimeoutRef.current);
    }
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

  const handleFollow = async (userId: string | undefined) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state silently (no notification)
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          if (result.action === 'follow') {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في العملية",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
      });
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

  // Don't show "no videos" message - just show loading instead
  if (videoMemories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={containerRef}
        className={`fixed inset-0 bg-black pb-12 ${stickyMode ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{ userSelect: 'none', touchAction: stickyMode ? 'none' : 'pan-y' }}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement;
          // Block navigation if touching any control elements
          if (target.closest('.pointer-events-auto') || 
              target.closest('button') || 
              target.closest('.video-controls') ||
              target.tagName === 'BUTTON') {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            isButtonClicked.current = true;
            return false;
          }
        }}
        onTouchMove={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.pointer-events-auto') || 
              target.closest('button') || 
              target.closest('.video-controls') ||
              target.tagName === 'BUTTON' ||
              isButtonClicked.current) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
          }
        }}
        onTouchEnd={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.pointer-events-auto') || 
              target.closest('button') || 
              target.closest('.video-controls') ||
              target.tagName === 'BUTTON') {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            setTimeout(() => { isButtonClicked.current = false; }, 100);
            return false;
          }
        }}
      >
        {/* Video Container */}
        <div className="relative w-full h-full">
          {videoMemories.map((memory, index) => (
            <div
              key={memory.id}
              className={`absolute inset-0 transition-transform duration-300 ${
                stickyMode && index === currentVideoIndex ? 
                  'translate-y-0 !fixed !top-0 !left-0 !right-0 !bottom-0 z-40' :
                  index === currentVideoIndex ? 'translate-y-0' : 
                  index < currentVideoIndex ? '-translate-y-full' : 'translate-y-full'
              }`}
              style={{
                position: stickyMode && index === currentVideoIndex ? 'fixed' : 'absolute',
                top: stickyMode && index === currentVideoIndex ? 0 : undefined,
                left: stickyMode && index === currentVideoIndex ? 0 : undefined,
                right: stickyMode && index === currentVideoIndex ? 0 : undefined,
                bottom: stickyMode && index === currentVideoIndex ? 0 : undefined,
                zIndex: stickyMode && index === currentVideoIndex ? 50 : undefined,
                transform: stickyMode && index === currentVideoIndex ? 'none' : undefined
              }}
            >
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={memory.mediaUrls[0]}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={isMuted}
                preload="metadata"
                onClick={(e) => {
                  // Only handle click if not clicking on controls
                  const target = e.target as HTMLElement;
                  if (target.closest('.pointer-events-auto')) {
                    return;
                  }
                  
                  const video = videoRefs.current[index];
                  if (video) {
                    if (video.paused) {
                      video.play();
                    } else {
                      video.pause();
                    }
                    
                    // Show play button temporarily
                    setShowPlayButton(true);
                    
                    // Clear any existing timeout
                    if (playButtonTimeoutRef.current) {
                      clearTimeout(playButtonTimeoutRef.current);
                    }
                    
                    // Hide play button after 1 second
                    playButtonTimeoutRef.current = setTimeout(() => {
                      setShowPlayButton(false);
                    }, 1000);
                  }
                }}
              />

              {/* Play/Pause Icon Overlay - TikTok style */}
              {index === currentVideoIndex && showPlayButton && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="bg-black/60 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center animate-pulse shadow-lg">
                    {isVideoPlaying[index] ? (
                      <div className="flex space-x-1.5">
                        <div className="w-1.5 h-8 bg-white rounded-sm"></div>
                        <div className="w-1.5 h-8 bg-white rounded-sm"></div>
                      </div>
                    ) : (
                      <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent ml-2"></div>
                    )}
                  </div>
                </div>
              )}

              {/* Video Playing Indicator - Small play icon like TikTok */}
              {index === currentVideoIndex && !showPlayButton && !isVideoPlaying[index] && (
                <div className="absolute center-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                  <div className="bg-black/40 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                  </div>
                </div>
              )}

              {/* Video Progress Bar - TikTok style */}
              {index === currentVideoIndex && videoDuration[index] > 0 && (
                <div className="absolute bottom-0 left-0 right-0 z-20">
                  <div className="h-1 bg-white/20 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-200 ease-linear shadow-sm"
                      style={{
                        width: `${(videoCurrentTime[index] / videoDuration[index]) * 100}%`,
                        boxShadow: '0 0 8px rgba(255,255,255,0.6)'
                      }}
                    />
                  </div>
                  {/* Optional: Time indicator */}
                  <div className="absolute -top-6 right-2 text-white/80 text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {Math.floor(videoCurrentTime[index] || 0)}s / {Math.floor(videoDuration[index] || 0)}s
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User Info and Controls Overlay */}
        <div 
          className={`absolute inset-0 pointer-events-none ${
            stickyMode ? 'fixed top-0 left-0 right-0 bottom-0 z-50' : ''
          }`}
          style={{
            position: stickyMode ? 'fixed' : 'absolute',
            zIndex: stickyMode ? 60 : undefined
          }}
        >
          {/* Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
          
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Right side controls */}
          <div 
            className="absolute right-4 bottom-20 flex flex-col items-center space-y-4 pointer-events-auto z-50 video-controls"
            style={{ touchAction: 'none' }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              e.stopImmediatePropagation();
              isButtonClicked.current = true;
              return false;
            }}
            onTouchMove={(e) => {
              e.stopPropagation(); 
              e.preventDefault();
              e.stopImmediatePropagation();
              return false;
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              e.stopImmediatePropagation();
              return false;
            }}
          >
            {/* Follow Button - Only show if not following */}
            {currentVideo.author?.id && user?.id !== currentVideo.author.id && !followingUsers.has(currentVideo.author.id) && (
              <button
                className="bg-red-500 text-white border-white hover:bg-red-600 min-w-[60px] h-8 rounded-full px-3 py-1.5 font-bold text-xs border-2 z-50 relative transition-all duration-200 backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Follow button clicked for user:', currentVideo.author?.username);
                  handleFollow(currentVideo.author?.id);
                }}
              >
                متابعة
              </button>
            )}
            
            {/* Profile */}
            <button 
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full overflow-hidden border-2 border-white z-50 relative"
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true; // Prevent video navigation
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
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true; // Prevent video navigation
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
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true; // Prevent video navigation
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
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true; // Prevent video navigation
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
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true;
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isButtonClicked.current = true; // Prevent video navigation
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

          {/* Sticky Mode Indicator */}
          {stickyMode && (
            <div className="absolute top-6 left-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
              📌 الفيديو مثبت
            </div>
          )}



          {/* Navigation hints */}
          {!stickyMode ? (
            <>
              {currentVideoIndex < videoMemories.length - 1 && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-60 pointer-events-none animate-bounce">
                  ↓ اسحب لأسفل للفيديو التالي
                </div>
              )}
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-60 pointer-events-none animate-pulse">
                ↑ اسحب لأعلى لتثبيت الفيديو
              </div>
            </>
          ) : (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-60 pointer-events-none animate-pulse">
              ↑ اسحب لأعلى مرة أخرى للإلغاء
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