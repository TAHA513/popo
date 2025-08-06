import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Check,
  X
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
  const [, setLocation] = useLocation();
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  // Removed currentVideoIndex - single video only
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  // Removed showInstructions - single video only
  const [videoError, setVideoError] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGiftCategory, setSelectedGiftCategory] = useState('all');
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch only the specific video by ID - no browsing
  const { data: currentVideo, isLoading: videosLoading } = useQuery<VideoData>({
    queryKey: ['/api/memories', videoId],
    queryFn: async () => {
      if (!videoId) throw new Error('Video ID is required');
      
      // First get all public memories, then find the specific one
      const response = await fetch('/api/memories/public', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل في تحميل الفيديو');
      const allMemories = await response.json();
      
      // Find the specific memory by ID
      const memory = allMemories.find((m: any) => m.id === parseInt(videoId));
      if (!memory) {
        throw new Error('لم يتم العثور على الفيديو');
      }
      
      // Ensure it's a video
      if (memory.type !== 'video') {
        throw new Error('هذا المحتوى ليس فيديو');
      }
      return memory;
    },
    enabled: !!videoId,
    refetchOnWindowFocus: false,
  });

  // Initialize video when data is loaded
  useEffect(() => {
    if (currentVideo) {
      // Stop all other videos first
      const allVideoElements = document.querySelectorAll('video');
      allVideoElements.forEach(video => {
        video.pause();
        video.currentTime = 0;
        video.muted = true;
      });
      
      // Setup this video
      setIsVideoPlaying(true);
      setIsMuted(true);
      setIsVideoLoading(true);
      setVideoError(false);
    }
  }, [currentVideo]);

  // Fetch available gift characters
  const { data: giftCharacters } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: async () => {
      const response = await fetch('/api/gifts/characters');
      if (!response.ok) throw new Error('Failed to fetch gift characters');
      return await response.json();
    },
  });

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

  // Check if current user has liked this video
  const { data: likeStatus } = useQuery({
    queryKey: ['/api/memories', currentVideo?.id, 'like-status'],
    queryFn: async () => {
      if (!currentVideo?.id || !user) return { liked: false };
      const response = await fetch(`/api/memories/${currentVideo.id}/like-status`, {
        credentials: 'include'
      });
      if (!response.ok) return { liked: false };
      return response.json();
    },
    enabled: !!currentVideo?.id && !!user
  });

  const isFollowing = followStatus?.isFollowing || false;
  const isLiked = likeStatus?.liked || false;

  // Simple and reliable video setup
  useEffect(() => {
    if (!currentVideo) return;
    
    setIsVideoLoading(true);
    setVideoError(false);
    
    const setupVideo = async () => {
      try {
        // Wait for video element to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const videoElement = document.getElementById(`video-${currentVideo.id}`) as HTMLVideoElement;
        if (!videoElement) {
          throw new Error('Video element not found');
        }

        // Setup video properties
        videoElement.muted = isMuted;
        videoElement.currentTime = 0;
        
        // Wait for video to be ready
        if (videoElement.readyState >= 2) {
          setIsVideoLoading(false);
          if (isVideoPlaying) {
            await videoElement.play();
          }
        } else {
          videoElement.addEventListener('canplay', () => {
            setIsVideoLoading(false);
            if (isVideoPlaying) {
              videoElement.play().catch(console.error);
            }
          }, { once: true });
        }
        
      } catch (error) {
        console.error('Video setup error:', error);
        setIsVideoLoading(false);
        setVideoError(true);
      }
    };
    
    setupVideo();
  }, [currentVideo, isMuted, isVideoPlaying]);

  // Cleanup function to refresh home page cache when leaving
  useEffect(() => {
    return () => {
      // Force refresh home page data when user leaves video page
      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
    };
  }, [queryClient]);

  const handleVideoToggle = async () => {
    if (!currentVideo) return;
    
    const videoElement = document.getElementById(`video-${currentVideo.id}`) as HTMLVideoElement;
    if (!videoElement) return;

    try {
      if (isVideoPlaying) {
        videoElement.pause();
        setIsVideoPlaying(false);
      } else {
        // Ensure video is ready before playing
        if (videoElement.readyState >= 2) {
          await videoElement.play();
          setIsVideoPlaying(true);
        } else {
          setIsVideoLoading(true);
          videoElement.addEventListener('canplay', async () => {
            try {
              await videoElement.play();
              setIsVideoPlaying(true);
              setIsVideoLoading(false);
            } catch (error) {
              console.error('Play failed:', error);
              setIsVideoLoading(false);
            }
          }, { once: true });
        }
      }
    } catch (error) {
      console.error('Video toggle error:', error);
      setIsVideoLoading(false);
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

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ memoryId }: { memoryId: string }) => {
      const response = await apiRequest('POST', `/api/memories/${memoryId}/like`);
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: data.liked ? "تم الإعجاب!" : "تم إلغاء الإعجاب",
        description: data.message,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/memories', variables.memoryId, 'like-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memories', variables.memoryId] });
      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
    },
    onError: (error: any) => {
      console.error("Like error:", error);
      const isAuthError = error.message?.includes("401") || error.message?.includes("يجب تسجيل الدخول");
      toast({
        title: "خطأ في الإعجاب",
        description: isAuthError ? "يجب تسجيل الدخول أولاً" : "حاول مرة أخرى",
        variant: "destructive"
      });
    }
  });

  const handleLike = (id: string) => {
    console.log("🔍 Like button clicked:", { id, user: !!user, isPending: likeMutation.isPending });
    
    if (!user) {
      console.log("❌ No user logged in");
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول لإضافة الإعجاب",
        variant: "destructive"
      });
      return;
    }

    if (likeMutation.isPending) {
      console.log("⏳ Like mutation already pending");
      return;
    }

    console.log("✅ Sending like mutation");
    likeMutation.mutate({ memoryId: id });
  };

  // Removed navigation functions - single video only

  // Handle keyboard controls - play/pause only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        handleVideoToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Removed swipe gestures - single video only

  // Removed preloading - single video only

  // Removed hide instructions - single video only

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await apiRequest('POST', `/api/users/${userId}/follow`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.isFollowing ? "تمت المتابعة!" : "تم إلغاء المتابعة",
        description: data.isFollowing ? "أضيف المستخدم لقائمة الأصدقاء" : "تم إزالة المستخدم من الأصدقاء",
      });
      // Update local state immediately
      if (currentVideo?.author?.id) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isFollowing) {
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

  // Gift sending mutation
  const giftMutation = useMutation({
    mutationFn: async ({ receiverId, characterId, message, memoryId }: { receiverId: string; characterId: number; message?: string; memoryId?: number }) => {
      console.log("🎁 Gift mutation starting with data:", { receiverId, characterId, message, memoryId });
      
      const response = await apiRequest('/api/gifts/send', 'POST', { receiverId, characterId, message, memoryId });
      const result = await response.json();
      
      console.log("🎁 Gift mutation response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎁 Gift sent successfully:", data);
      toast({
        title: "تم إرسال الهدية! 🎁",
        description: "شكراً لدعمك للمحتوى",
      });
      
      // Reset and close the gift modal
      setSelectedGift(null);
      setShowGiftModal(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memories', videoId, 'gifts'] });
    },
    onError: (error: any) => {
      console.error("🎁 Gift error:", error);
      const isAuthError = error.message?.includes("401") || error.message?.includes("يجب تسجيل الدخول");
      toast({
        title: "خطأ في إرسال الهدية",
        description: isAuthError ? "يجب تسجيل الدخول أولاً" : error.message || "حاول مرة أخرى",
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
    // Navigate to comments page instead of just sending interaction
    setLocation(`/comments/${currentVideo.id}`);
  };

  const handleShare = async () => {
    if (!currentVideo) return;
    
    try {
      const shareUrl = `${window.location.origin}/video/${currentVideo.id}`;
      
      // Try to use Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: currentVideo.title || 'فيديو من LaaBoBo',
          text: currentVideo.caption || 'شاهد هذا الفيديو الرائع',
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "تم نسخ الرابط! 🔗",
          description: "تم نسخ رابط الفيديو إلى الحافظة",
        });
      }
      
      // Record share interaction
      interactionMutation.mutate({ videoId: currentVideo.id, type: 'share' });
    } catch (error) {
      console.error('Share failed:', error);
      // Manual fallback
      const shareUrl = `${window.location.origin}/video/${currentVideo.id}`;
      prompt('انسخ هذا الرابط للمشاركة:', shareUrl);
      
      toast({
        title: "رابط المشاركة",
        description: "تم عرض رابط الفيديو للنسخ",
      });
    }
  };

  const handleGift = () => {
    if (!currentVideo) return;
    
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول لإرسال الهدايا",
        variant: "destructive"
      });
      return;
    }
    
    setShowGiftModal(true);
  };

  const handleGiftSelect = (gift: any) => {
    setSelectedGift(gift);
  };

  const handleSendGift = () => {
    if (!currentVideo?.author?.id || !selectedGift) return;
    
    console.log("🎁 Sending gift:", {
      receiverId: currentVideo.author.id,
      characterId: selectedGift.id,
      memoryId: currentVideo.id,
      currentVideo: currentVideo,
      selectedGift: selectedGift
    });
    
    giftMutation.mutate({
      receiverId: currentVideo.author.id,
      characterId: selectedGift.id,
      memoryId: currentVideo.id
    });
  };

  // Gift categories for navigation
  const giftCategories = [
    { id: 'all', name: 'الكل', icon: '🎁' },
    { id: 'animals', name: 'حيوانات', icon: '🐰' },
    { id: 'hearts', name: 'قلوب', icon: '❤️' },
    { id: 'nature', name: 'طبيعة', icon: '🌹' },
    { id: 'luxury', name: 'فخامة', icon: '👑' },
    { id: 'vehicles', name: 'مركبات', icon: '🚗' },
    { id: 'space', name: 'فضاء', icon: '🚀' }
  ];

  // Filter gifts by category
  const getFilteredGifts = (gifts: any[], category: string) => {
    if (category === 'all') return gifts;
    
    const categoryMap: Record<string, string[]> = {
      animals: ['BoBo Love', 'BoFire', 'Nunu Magic', 'Dodo Splash', 'Meemo Wink'],
      hearts: ['Love Heart', 'قلب'],
      nature: ['وردة', 'شمس', 'قمر', 'نجمة'],
      luxury: ['تاج', 'ألماسة', 'يخت', 'قلعة'],
      vehicles: ['سيارة', 'طائرة'],
      space: ['صاروخ', 'نجمة', 'قمر', 'شمس']
    };

    return gifts?.filter(gift => 
      categoryMap[category]?.some(name => 
        gift.name.includes(name)
      )
    ) || [];
  };

  const filteredGifts = getFilteredGifts(giftCharacters || [], selectedGiftCategory);

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

  if (videosLoading || !currentVideo) {
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

  if (!currentVideo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">لم يتم العثور على الفيديو</h2>
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

      {/* Video Info */}
      <div className="absolute top-4 right-1/2 transform translate-x-1/2 z-20 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs">
        فيديو واحد
      </div>

      {/* Video Container */}
      <div className="relative w-full h-screen flex items-center justify-center group">
        <video
          key={`video-${currentVideo.id}`}
          id={`video-${currentVideo.id}`}
          src={currentVideo.mediaUrls[0]}
          className="w-full h-full object-cover"
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          controls={false}
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
          onLoadStart={() => {
            setIsVideoLoading(true);
            setVideoError(false);
          }}
          onCanPlay={() => {
            setIsVideoLoading(false);
          }}
          onError={(e) => {
            console.error('Video error:', e);
            setIsVideoLoading(false);
            setIsVideoPlaying(false);
            setVideoError(true);
          }}
        />

        {/* Minimal Loading Indicator - TikTok style */}
        {isVideoLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error Indicator with Retry */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
            <div className="text-center text-white">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm mb-3">مشكلة في تحميل الفيديو</p>
              <Button
                onClick={() => {
                  setVideoError(false);
                  setIsVideoLoading(true);
                  const videoElement = document.getElementById(`video-${currentVideo.id}`) as HTMLVideoElement;
                  if (videoElement) {
                    videoElement.load();
                  }
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2"
              >
                إعادة المحاولة
              </Button>
            </div>
          </div>
        )}

        {/* Video Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-100 transition-opacity duration-300">
          {/* Play/Pause Button - Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleVideoToggle}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full text-white bg-black/40 hover:bg-black/60 transition-all duration-300 ${isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-90 hover:opacity-100'}`}
              disabled={isVideoLoading}
            >
              {isVideoLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isVideoPlaying ? (
                <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                  <div className="w-1.5 h-5 md:w-2 md:h-6 bg-white rounded mr-1"></div>
                  <div className="w-1.5 h-5 md:w-2 md:h-6 bg-white rounded"></div>
                </div>
              ) : (
                <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" fill="white" />
              )}
            </Button>
          </div>

          {/* Volume Control - Top Right - Always Visible */}
          <div className="absolute top-4 right-4 z-20">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeToggle}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all duration-300 shadow-lg ${
                isMuted 
                  ? 'text-red-500 border-red-400/60 bg-red-900/40 hover:bg-red-800/60' 
                  : 'text-green-500 border-green-400/60 bg-green-900/40 hover:bg-green-800/60'
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
              )}
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
        <div className="absolute right-2 md:right-4 bottom-20 flex flex-col items-center space-y-4 md:space-y-6 z-50">
          {/* Author Profile */}
          <div className="flex flex-col items-center">
            {currentVideo.author?.profileImageUrl ? (
              <img
                src={currentVideo.author.profileImageUrl}
                alt="صورة المنشور"
                className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-white/50 mb-2"
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
              onClick={(e) => {
                e.stopPropagation();
                handleLike(currentVideo.id.toString());
              }}
              disabled={likeMutation.isPending}
              className={`flex flex-col items-center ${isLiked ? 'text-red-500' : 'text-white'} hover:text-red-400 bg-transparent p-2 md:p-3 relative z-60`}
            >
              {likeMutation.isPending ? (
                <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Heart className={`w-6 h-6 md:w-8 md:h-8 ${isLiked ? 'fill-current' : ''}`} />
              )}
              <span className="text-xs md:text-sm mt-1">{currentVideo.likeCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                handleComment();
              }}
              className="flex flex-col items-center text-white hover:text-blue-400 bg-transparent p-2 md:p-3"
            >
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm mt-1">تعليق</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="flex flex-col items-center text-white hover:text-green-400 bg-transparent p-2 md:p-3"
            >
              <Share2 className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm mt-1">مشاركة</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                handleGift();
              }}
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

        {/* Single Video Indicator */}
        <div className="absolute top-1/2 left-2 transform -translate-y-1/2 flex flex-col items-center space-y-1 z-10">
          <div className="w-1 h-8 rounded-full bg-white transition-all duration-300" />
        </div>
      </div>

      {/* Gift Selection Modal */}
      {showGiftModal && (
        <Dialog open={showGiftModal} onOpenChange={setShowGiftModal}>
          <DialogContent className="bg-gray-900 text-white border-purple-500/20 max-w-2xl mx-auto max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold mb-4">
                اختر هدية 🎁
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGiftModal(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>
            
            <div className="flex gap-4 h-96">
              {/* Vertical Navigation Bar */}
              <div className="flex flex-col w-20 bg-gray-800/30 rounded-lg p-2">
                {giftCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedGiftCategory(category.id)}
                    className={`flex flex-col items-center p-3 rounded-lg mb-2 transition-all duration-200 ${
                      selectedGiftCategory === category.id
                        ? 'bg-purple-600/50 text-white border border-purple-500/50'
                        : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-lg mb-1">{category.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Gift Grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2 p-2">
                  {filteredGifts.map((gift: any) => (
                    <button
                      key={gift.id}
                      onClick={() => handleGiftSelect(gift)}
                      disabled={giftMutation.isPending}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 border group disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedGift?.id === gift.id
                          ? 'bg-purple-600/50 border-purple-500 text-white'
                          : 'bg-gray-800/50 border-transparent hover:border-purple-500/50 hover:bg-purple-600/20'
                      }`}
                    >
                      <span className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200">
                        {gift.emoji}
                      </span>
                      <span className="text-xs font-medium text-center text-white/90 mb-1 leading-tight">
                        {gift.name}
                      </span>
                      <div className="flex items-center text-xs text-purple-400">
                        <Sparkles className="w-2 h-2 mr-1" />
                        <span>{gift.pointCost}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {filteredGifts.length === 0 && (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400">لا توجد هدايا في هذه الفئة</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Send Gift Button */}
            <div className="flex items-center justify-between mt-4 p-4 bg-gray-800/30 rounded-lg">
              {selectedGift ? (
                <div className="flex items-center">
                  <span className="text-2xl ml-3">{selectedGift.emoji}</span>
                  <div>
                    <p className="text-white font-medium">{selectedGift.name}</p>
                    <div className="flex items-center text-purple-400 text-sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      <span>{selectedGift.pointCost} نقطة</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">اختر هدية لإرسالها</p>
              )}
              
              <Button
                onClick={handleSendGift}
                disabled={!selectedGift || giftMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {giftMutation.isPending ? "جاري الإرسال..." : "إرسال الهدية 🎁"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}