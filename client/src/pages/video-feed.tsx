import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
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
  commentCount?: number;
  isLiked?: boolean;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

// Helper function to format time
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to format time ago in Arabic
function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return 'منذ وقت قريب';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'الآن';
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `منذ ${diffInDays} يوم`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `منذ ${diffInMonths} شهر`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `منذ ${diffInYears} سنة`;
}

export default function VideoFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

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

  // Get only video memories - NO AUTO REFRESH to prevent jumping
  const { data: allMemories = [] } = useQuery({
    queryKey: ['/api/memories/videos'],
    // Remove refetchInterval to prevent automatic data refresh that causes jumping
  });

  // Filter only videos - NO RANDOM SHUFFLE to prevent jumping
  const videoMemoriesRef = useRef<VideoMemory[]>([]);
  const videoMemories = useMemo(() => {
    if (!allMemories || !Array.isArray(allMemories) || allMemories.length === 0) return [];
    
    const filteredVideos = (allMemories as VideoMemory[])
      .filter(memory => memory.type === 'video' && memory.mediaUrls?.length > 0);
    
    // Only shuffle once when data first loads, then keep the same order
    if (videoMemoriesRef.current.length === 0 && filteredVideos.length > 0) {
      videoMemoriesRef.current = filteredVideos.sort(() => Math.random() - 0.5);
    }
    
    return videoMemoriesRef.current;
  }, [allMemories]);

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

  // User interaction tracking  
  const userInteracting = useRef(false);
  const isAdvancing = useRef(false);

  // Native touch event handlers for swipe navigation
  const handleTouchStartNative = useCallback((e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMoveNative = useCallback((e: TouchEvent) => {
    // Allow normal touch behavior but prevent default for better control
    e.preventDefault();
  }, []);

  const handleTouchEndNative = useCallback((e: TouchEvent) => {
    const target = e.target as HTMLElement;
    // Don't handle swipe if touching buttons
    if (target.closest('button') || target.closest('.pointer-events-auto')) {
      return;
    }

    const endY = e.changedTouches[0].clientY;
    const diff = startY.current - endY;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && currentVideoIndex < videoMemories.length - 1) {
        // Swipe up - next video
        console.log('🔼 Touch swipe: next video', currentVideoIndex, '->', currentVideoIndex + 1);
        setCurrentVideoIndex(prev => prev + 1);
      } else if (diff < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video  
        console.log('🔽 Touch swipe: previous video', currentVideoIndex, '->', currentVideoIndex - 1);
        setCurrentVideoIndex(prev => prev - 1);
      }
    }
    
    // Reset touch position
    startY.current = 0;
  }, [currentVideoIndex, videoMemories.length]);



  // Keyboard navigation - ONLY manual control
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isAdvancing.current) return; // Prevent rapid navigation
    
    if (e.key === 'ArrowUp' && currentVideoIndex > 0) {
      e.preventDefault();
      isAdvancing.current = true;
      console.log('Manual keyboard up - previous video');
      setCurrentVideoIndex(prev => prev - 1);
      setTimeout(() => (isAdvancing.current = false), 500);
    } else if (e.key === 'ArrowDown' && currentVideoIndex < videoMemories.length - 1) {
      e.preventDefault();
      isAdvancing.current = true;
      console.log('Manual keyboard down - next video');
      setCurrentVideoIndex(prev => prev + 1);
      setTimeout(() => (isAdvancing.current = false), 500);
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

    container.addEventListener('touchstart', handleTouchStartNative, { passive: false });
    container.addEventListener('touchmove', handleTouchMoveNative, { passive: false });
    container.addEventListener('touchend', handleTouchEndNative, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('touchstart', handleTouchStartNative);
      container.removeEventListener('touchmove', handleTouchMoveNative);
      container.removeEventListener('touchend', handleTouchEndNative);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTouchStartNative, handleTouchMoveNative, handleTouchEndNative, handleKeyDown]);

  // Control video playback - Play current, pause others, NO AUTO ADVANCE
  useEffect(() => {
    // Pause all videos first
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentVideoIndex) {
        video.pause();
        video.currentTime = 0; // Reset other videos
      }
    });

    // Current video - Play it but prevent auto advance
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      // Reset and play current video
      currentVideo.currentTime = 0;
      currentVideo.play().catch(() => {
        // If autoplay fails, show play button
        setShowPlayButton(true);
      });
      
      // Update playing state
      setIsVideoPlaying(prev => {
        const newStates = [...prev];
        newStates[currentVideoIndex] = true;
        return newStates;
      });
    }
  }, [currentVideoIndex]);

  // Record video view - ONLY ONCE per video, no repeated calls
  const viewedVideos = useRef(new Set<number>());
  useEffect(() => {
    const videoId = videoMemories[currentVideoIndex]?.id;
    if (videoId && !viewedVideos.current.has(videoId)) {
      viewedVideos.current.add(videoId);
      const timeoutId = setTimeout(() => {
        apiRequest(`/api/memories/${videoId}/view`, 'POST').catch(() => {
          // Remove from viewed set if request fails
          viewedVideos.current.delete(videoId);
        });
      }, 2000); // Only once per video with longer delay
      return () => clearTimeout(timeoutId);
    }
  }, [currentVideoIndex, videoMemories]);

  // State for immediate like feedback
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());

  // Initialize liked videos from server data
  useEffect(() => {
    if (videoMemories.length > 0) {
      const initialLikes = new Set<number>();
      videoMemories.forEach(video => {
        if (video.isLiked) {
          initialLikes.add(video.id);
        }
      });
      setLikedVideos(initialLikes);
    }
  }, [videoMemories]);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (memoryId: number) => {
      return await apiRequest(`/api/memories/${memoryId}/like`, 'POST');
    },
    onSuccess: (data, memoryId) => {
      // Update the like count in the local data
      queryClient.setQueryData(['/api/memories/public'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((video: any) => {
          if (video.id === memoryId) {
            return {
              ...video,
              likeCount: data.liked ? (video.likeCount || 0) + 1 : Math.max((video.likeCount || 0) - 1, 0),
              isLiked: data.liked
            };
          }
          return video;
        });
      });
    },
    onError: (error) => {
      console.error("Like error:", error);
      // Revert the optimistic update on error
      setLikedVideos(prev => {
        const newSet = new Set(prev);
        const memoryId = videoMemories[currentVideoIndex]?.id;
        if (memoryId) {
          newSet.delete(memoryId);
        }
        return newSet;
      });
    }
  });

  // Share functionality
  const interactionMutation = useMutation({
    mutationFn: async ({ memoryId, type }: { memoryId: number; type: string }) => {
      return await apiRequest(`/api/memories/${memoryId}/interact`, 'POST', { type });
    },
    onSuccess: (_, { type }) => {
      const messages = {
        share: "تم نسخ الرابط للمشاركة",
      };
      
      toast({
        title: messages[type as keyof typeof messages] || "تم التفاعل",
        description: "شكراً لتفاعلك مع المحتوى",
      });
    },
  });

  const handleLike = (memoryId: number) => {
    // Immediate UI update
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memoryId)) {
        newSet.delete(memoryId);
      } else {
        newSet.add(memoryId);
      }
      return newSet;
    });
    
    // Send request in background
    likeMutation.mutate(memoryId);
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

  // Navigate to user profile instantly
  const handleUserProfileClick = (userId: string, username?: string) => {
    console.log('🔗 handleUserProfileClick called:', { userId, username, userCurrentId: user?.id });
    if (userId && userId !== user?.id) {
      console.log('🚀 Navigating to:', `/user/${userId}`);
      setLocation(`/user/${userId}`);
    } else if (userId === user?.id) {
      console.log('🚀 Navigating to own profile:', '/profile');
      setLocation('/profile');
    } else {
      console.log('❌ Navigation blocked:', { reason: 'Missing userId', userId, userCurrentId: user?.id });
    }
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
        className="fixed inset-0 bg-black pb-12 overflow-hidden"
        style={{ userSelect: 'none' }}
      >
        {/* Video Container */}
        <div className="relative w-full h-full bg-black video-container">
          {videoMemories.map((memory, index) => (
            <div
              key={memory.id}
              className={`absolute inset-0 transition-transform duration-300 video-container ${
                index === currentVideoIndex ? 'translate-y-0' : 
                index < currentVideoIndex ? '-translate-y-full' : 'translate-y-full'
              }`}
              style={{}}
            >
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={memory.mediaUrls[0]}
                className="w-full h-full object-cover"
                style={{ 
                  objectFit: 'cover',
                  objectPosition: 'center',
                  background: 'transparent'
                }}
                onEnded={() => {
                  // ABSOLUTELY NO AUTO ADVANCE - but restart the same video
                  if (userInteracting.current || isAdvancing.current) {
                    console.log(`Video ${index} ended during user interaction - staying put`);
                    return;
                  }
                  console.log(`Video ${index} ended - restarting same video (NO ADVANCE)`);
                  
                  // Restart the same video from beginning
                  const video = videoRefs.current[index];
                  if (video && index === currentVideoIndex) {
                    video.currentTime = 0;
                    video.play().catch(() => {
                      setShowPlayButton(true);
                    });
                  }
                }}
                loop={true}
                playsInline
                muted={isMuted}
                preload="metadata"
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  const newCurrentTime = video.currentTime;
                  const newDuration = video.duration || 0;
                  
                  // Only update if we have valid duration and this is current video
                  if (index === currentVideoIndex && newDuration > 0 && !isNaN(newCurrentTime)) {
                    setVideoCurrentTime(prev => {
                      const newTimes = [...prev];
                      newTimes[index] = newCurrentTime;
                      return newTimes;
                    });
                    
                    setVideoDuration(prev => {
                      const newDurations = [...prev];
                      newDurations[index] = newDuration;
                      return newDurations;
                    });
                  }
                }}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  const duration = video.duration || 0;
                  if (duration > 0) {
                    setVideoDuration(prev => {
                      const newDurations = [...prev];
                      newDurations[index] = duration;
                      return newDurations;
                    });
                  }
                }}
                onPlay={() => {
                  setShowPlayButton(false);
                  setIsVideoPlaying(prev => {
                    const newPlaying = [...prev];
                    newPlaying[index] = true;
                    return newPlaying;
                  });
                }}
                onPause={() => {
                  setShowPlayButton(true);
                  setIsVideoPlaying(prev => {
                    const newPlaying = [...prev];
                    newPlaying[index] = false;
                    return newPlaying;
                  });
                }}
                onClick={(e) => {
                  // Only handle click if not clicking on controls
                  const target = e.target as HTMLElement;
                  if (target.closest('.pointer-events-auto')) {
                    return;
                  }
                  
                  const video = videoRefs.current[index];
                  if (video && index === currentVideoIndex) {
                    if (video.paused) {
                      video.play().then(() => {
                        setShowPlayButton(false);
                        // Update playing state
                        setIsVideoPlaying(prev => {
                          const newStates = [...prev];
                          newStates[index] = true;
                          return newStates;
                        });
                      }).catch(() => {
                        setShowPlayButton(true);
                      });
                    } else {
                      video.pause();
                      setShowPlayButton(true);
                      // Update playing state
                      setIsVideoPlaying(prev => {
                        const newStates = [...prev];
                        newStates[index] = false;
                        return newStates;
                      });
                    }
                    
                    // Clear any existing timeout
                    if (playButtonTimeoutRef.current) {
                      clearTimeout(playButtonTimeoutRef.current);
                    }
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

              {/* Removed the circular play icon completely */}

              {/* Video Progress Bar - TikTok style - Always show for current video */}
              {index === currentVideoIndex && (
                <div className="absolute bottom-4 left-0 right-0 z-30 progress-bar-mobile">
                  {/* Progress bar background */}
                  <div className="h-1 bg-white/30 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-300 ease-linear"
                      style={{
                        width: videoCurrentTime[index] && videoDuration[index] ? `${(videoCurrentTime[index] / videoDuration[index]) * 100}%` : '0%',
                        background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                      }}
                    />
                  </div>
                  
                  
                </div>
              )}
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
          <div 
            className="absolute right-4 bottom-20 flex flex-col items-center space-y-4 pointer-events-auto z-50 video-controls"
            style={{ touchAction: 'manipulation' }}
          >
            {/* Follow Button - Only show if not following */}
            {currentVideo.author?.id && user?.id !== currentVideo.author.id && !followingUsers.has(currentVideo.author.id) && (
              <button
                className="bg-red-500 text-white border-white hover:bg-red-600 active:bg-red-700 min-w-[60px] h-8 rounded-full px-3 py-1.5 font-bold text-xs border-2 z-50 relative transition-all duration-200 backdrop-blur-sm touch-manipulation"
                style={{ touchAction: 'manipulation' }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Follow button clicked for user:', currentVideo.author?.username);
                  handleFollow(currentVideo.author?.id);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  console.log('Follow button touched for user:', currentVideo.author?.username);
                  handleFollow(currentVideo.author?.id);
                }}
              >
                متابعة
              </button>
            )}
            
            {/* Profile */}
            <button 
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full overflow-hidden border-2 border-white z-50 relative hover:scale-110 active:scale-95 transition-transform touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Profile clicked for user:', currentVideo.author?.username);
                if (currentVideo.author?.username) {
                  window.location.href = `/profile/${currentVideo.author.username}`;
                }
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                console.log('Profile touched for user:', currentVideo.author?.username);
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

            {/* Like - TikTok Style */}
            <button
              className="flex flex-col items-center space-y-1 text-white z-50 relative transform hover:scale-110 active:scale-95 transition-transform"
              onClick={() => handleLike(currentVideo.id)}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-sm border shadow-lg transition-all duration-200 ${
                likedVideos.has(currentVideo.id) 
                  ? 'bg-red-500/80 border-red-400/30' 
                  : 'bg-black/30 border-white/20'
              }`}>
                <Heart className={`w-7 h-7 transition-all duration-200 ${
                  likedVideos.has(currentVideo.id) 
                    ? 'fill-white text-white scale-110' 
                    : 'fill-current text-white'
                }`} />
              </div>
              <span className="text-xs font-bold" style={{ fontFamily: 'var(--tiktok-font-arabic)' }}>
                {(() => {
                  const baseCount = currentVideo.likeCount || 0;
                  const isLiked = likedVideos.has(currentVideo.id);
                  const wasOriginallyLiked = currentVideo.isLiked;
                  
                  if (isLiked && !wasOriginallyLiked) {
                    return baseCount + 1;
                  } else if (!isLiked && wasOriginallyLiked) {
                    return Math.max(baseCount - 1, 0);
                  }
                  return baseCount;
                })()}
              </span>
            </button>

            {/* Comments - TikTok Style */}
            <button
              className="flex flex-col items-center space-y-1 text-white z-50 relative transform hover:scale-110 active:scale-95 transition-transform"
              onClick={() => setShowCommentsModal(true)}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
                <MessageCircle className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold" style={{ fontFamily: 'var(--tiktok-font-arabic)' }}>{currentVideo.commentCount || 0}</span>
            </button>

            {/* Share - TikTok Style */}
            <button
              className="flex flex-col items-center space-y-1 text-white z-50 relative transform hover:scale-110 active:scale-95 transition-transform"
              onClick={() => handleShare(currentVideo.id)}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
                <Share2 className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold" style={{ fontFamily: 'var(--tiktok-font-arabic)' }}>شارك</span>
            </button>

            {/* Gift - TikTok Style */}
            <button
              className="flex flex-col items-center space-y-1 text-white z-50 relative transform hover:scale-110 active:scale-95 transition-transform"
              onClick={() => handleGiftClick(currentVideo)}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-full shadow-lg">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-bold" style={{ fontFamily: 'var(--tiktok-font-arabic)' }}>هدية</span>
            </button>
          </div>

          {/* Left side info - TikTok Style */}
          <div className="absolute left-4 bottom-20 max-w-[65%] pointer-events-auto z-30">
            <div className="text-white space-y-3">
              {/* Username with Follow Button - TikTok Style */}
              <div className="flex items-center gap-3">
                <div 
                  className="relative cursor-pointer transform hover:scale-105 active:scale-95 transition-transform"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Profile image clicked:', { 
                      authorId: currentVideo.authorId, 
                      username: currentVideo.author?.username,
                      event: 'image_click'
                    });
                    handleUserProfileClick(currentVideo.authorId, currentVideo.author?.username);
                  }}
                >
                  <img
                    src={currentVideo.author?.profileImageUrl || '/default-avatar.png'}
                    alt={currentVideo.author?.username || 'User'}
                    className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-lg"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <h3 
                    className="font-bold text-white text-lg tracking-tight cursor-pointer hover:underline active:scale-95 transition-all" 
                    style={{ fontFamily: 'var(--tiktok-font-arabic)' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🖱️ Username clicked:', { 
                        authorId: currentVideo.authorId, 
                        username: currentVideo.author?.username,
                        firstName: currentVideo.author?.firstName,
                        lastName: currentVideo.author?.lastName,
                        event: 'username_click'
                      });
                      handleUserProfileClick(currentVideo.authorId, currentVideo.author?.username);
                    }}
                  >
                    {currentVideo.author?.firstName || currentVideo.author?.lastName 
                      ? `${currentVideo.author.firstName || ''} ${currentVideo.author.lastName || ''}`.trim()
                      : `@${currentVideo.author?.username || `user${currentVideo.authorId?.slice(0, 6)}`}`
                    }
                  </h3>
                  {currentVideo.authorId !== user?.id && !followingUsers.has(currentVideo.authorId) && (
                    <button
                      onClick={() => handleFollow(currentVideo.authorId)}
                      className="bg-[var(--tiktok-red)] hover:bg-red-600 active:bg-red-700 text-white px-5 py-1.5 rounded-md text-sm font-bold transition-all transform active:scale-95 shadow-lg"
                      style={{ fontFamily: 'var(--tiktok-font-arabic)' }}
                    >
                      متابعة
                    </button>
                  )}
                </div>
              </div>
              
              {/* Caption - TikTok Style */}
              {currentVideo.caption && (
                <p className="text-white text-sm leading-relaxed break-words font-medium max-w-full pr-2" 
                   style={{ fontFamily: 'var(--tiktok-font-arabic)' }}>
                  {currentVideo.caption}
                </p>
              )}
              
              {/* Stats - TikTok Style */}
              <div className="flex items-center gap-4 text-xs text-white/80 font-medium" style={{ fontFamily: 'var(--tiktok-font-arabic)' }}>
                <span>{formatTimeAgo(currentVideo.createdAt)}</span>
                <span>{currentVideo.viewCount || 0} مشاهدة</span>
              </div>
            </div>
          </div>

          {/* Volume control */}
          <button
            className="absolute top-6 right-4 text-white pointer-events-auto z-50 hover:scale-110 active:scale-95 transition-transform"
            onClick={() => setIsMuted(prev => !prev)}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          {/* Navigation hints */}
          {currentVideoIndex < videoMemories.length - 1 && (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-60 pointer-events-none animate-bounce">
              ↓ اسحب لأسفل للفيديو التالي
            </div>
          )}
          {currentVideoIndex > 0 && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-60 pointer-events-none animate-pulse">
              ↑ اسحب لأعلى للفيديو السابق
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