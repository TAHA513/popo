import { useAuth } from "@/hooks/useAuth";
import SimpleNavigation from "@/components/simple-navigation";
import FlipCard from "@/components/flip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RealTimeTimestamp } from "@/components/real-time-timestamp";
import { OnlineStatus } from "@/components/online-status";
import { 
  Video, 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Eye, 
  Crown, 
  Sparkles,
  Zap,
  Timer,
  User,
  Plus,
  Image,
  PlayCircle,
  Radio,
  Maximize2,
  Volume2,
  VolumeX
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Stream } from "@/types";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  
  // Fetch live streams
  const { data: streams = [], isLoading: streamsLoading } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 30000,
  });

  // Fetch public memories/posts
  const { data: publicMemories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories/public'],
    refetchInterval: 30000,
    retry: 1,
    staleTime: 0, // Always refresh when returning to page
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const typedStreams = (streams as Stream[]);
  const typedMemories = (publicMemories as any[]);

  const handleJoinStream = (streamId: number) => {
    window.location.href = `/stream/${streamId}`;
  };

  const handleLike = (itemId: string) => {
    setLikedItems(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(itemId)) {
        newLiked.delete(itemId);
      } else {
        newLiked.add(itemId);
      }
      return newLiked;
    });
    
    toast({
      title: "تم الإعجاب!",
      description: "تم تفعيل الإعجاب",
    });
  };

  const handleInteraction = (action: string) => {
    toast({
      title: `تم ${action}`,
      description: `تم تنفيذ ${action} بنجاح`,
    });
  };

  const handleVideoToggle = (videoId: string, videoElement: HTMLVideoElement) => {
    const isPlaying = playingVideos.has(videoId);
    
    if (isPlaying) {
      videoElement.pause();
      setPlayingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    } else {
      videoElement.play();
      setPlayingVideos(prev => new Set(prev).add(videoId));
    }
  };

  const handleVolumeToggle = (videoId: string, videoElement: HTMLVideoElement) => {
    const isMuted = mutedVideos.has(videoId);
    
    if (isMuted) {
      videoElement.muted = false;
      setMutedVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    } else {
      videoElement.muted = true;
      setMutedVideos(prev => new Set(prev).add(videoId));
    }
  };

  const getMemoryTypeIcon = (type: string) => {
    switch (type) {
      case 'flash':
        return <Zap className="w-3 h-3" />;
      case 'trending':
        return <Sparkles className="w-3 h-3" />;
      case 'star':
        return <Crown className="w-3 h-3" />;
      case 'legend':
      case 'legendary':
        return <Timer className="w-3 h-3" />;
      case 'precious':
        return <Crown className="w-3 h-3" />;
      default:
        return <Sparkles className="w-3 h-3" />;
    }
  };

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case 'flash':
        return 'bg-yellow-500';
      case 'trending':
        return 'bg-pink-500';
      case 'star':
        return 'bg-purple-500';
      case 'legend':
      case 'legendary':
        return 'bg-orange-500';
      case 'precious':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        <div className="text-white text-lg">جاري التحميل...</div>
      </div>
    );
  }

  const isLoading = streamsLoading || memoriesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-600">جاري التحميل المحتوى...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <SimpleNavigation />
      
      {/* Live Activity Banner */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 px-4 py-3 shadow-lg">
        <div className="relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1 right-2 w-6 h-6 border border-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1 left-3 w-4 h-4 border border-white/20 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative z-10 flex items-center justify-center">
              {/* Live Status & Info - Centered */}
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <div className="relative">
                    <Radio className="w-6 h-6 text-white" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"></div>
                  </div>
                </div>
                <div className="text-white text-center">
                  <h2 className="text-xl font-bold mb-1">النشاط المباشر</h2>
                  <div className="flex items-center justify-center space-x-6 rtl:space-x-reverse text-white/90 text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="font-medium">{typedStreams.length} بث نشط</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="font-medium">{typedStreams.reduce((sum, stream) => sum + (stream.viewerCount || 0), 0)} مشاهد</span>
                    </div>
                  </div>
                </div>
                
                {/* Start Stream Button */}
                <Button
                  onClick={() => window.location.href = '/start-stream'}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-6 py-3 rounded-xl font-bold text-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Video className="w-5 h-5" />
                    <span>ابدأ البث</span>
                  </div>
                </Button>
              </div>
            </div>
        </div>
      </div>
      
      <main className="px-2 py-4">
        <div className="w-full max-w-7xl mx-auto">

          {/* Live Streams Section */}
          {typedStreams.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">البث المباشر</h2>
                    <p className="text-gray-600 text-sm">{typedStreams.length} بث نشط الآن</p>
                  </div>
                </div>
                <div className="flex items-center bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-ping"></div>
                  مباشر
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {typedStreams.map((stream) => (
                  <FlipCard
                    key={`stream-${stream.id}`}
                    content={{
                      ...stream,
                      mediaUrls: stream.thumbnailUrl ? [stream.thumbnailUrl] : [],
                      author: {
                        firstName: (stream as any).hostName,
                        username: stream.hostId,
                        profileImageUrl: (stream as any).hostProfileImage
                      },
                      viewCount: stream.viewerCount,
                      currentViewers: stream.viewerCount,
                      type: 'video',
                      isLive: true,
                      caption: stream.description
                    }}
                    type="live"
                    isLiked={likedItems.has(`stream-${stream.id}`)}
                    onLike={(id) => handleLike(id)}
                    onAction={(action) => {
                      switch (action) {
                        case 'join':
                          handleJoinStream(stream.id);
                          break;
                        case 'comment':
                          handleInteraction('التعليق');
                          break;
                        case 'share':
                          handleInteraction('المشاركة');
                          break;
                        case 'gift':
                          handleInteraction('الهدية');
                          break;
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Posts/Memories Section */}
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">المنشورات المميزة</h2>
                  <p className="text-gray-600 text-sm">{typedMemories.length} منشور جديد</p>
                </div>
              </div>
              <div className="flex items-center bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                <Sparkles className="w-3 h-3 mr-2" />
                مميز
              </div>
            </div>
            
            {typedMemories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {typedMemories.map((memory) => {
                  // تحديد نوع البطاقة بناءً على المحتوى
                  const cardType = memory.type === 'video' 
                    ? (memory.isLive ? 'live' : 'video')
                    : memory.memoryType === 'مميز' || memory.memoryType === 'legend'
                    ? 'featured'
                    : 'image';

                  return (
                    <FlipCard
                      key={`memory-${memory.id}`}
                      content={{
                        ...memory,
                        mediaUrls: memory.mediaUrls || [],
                        author: memory.author || {
                          id: memory.authorId,
                          firstName: memory.authorId,
                          username: memory.authorId,
                          profileImageUrl: null
                        }
                      }}
                      type={cardType}
                      isLiked={likedItems.has(`memory-${memory.id}`)}
                      onLike={(id) => handleLike(id)}
                      onAction={(action) => {
                        switch (action) {
                          case 'join':
                            if (memory.streamId) {
                              handleJoinStream(memory.streamId);
                            }
                            break;
                          case 'watch':
                            if (memory.type === 'video') {
                              setLocation(`/video/${memory.id}`);
                            }
                            break;
                          case 'view':
                            // عرض المحتوى كاملاً
                            break;
                          case 'comment':
                            handleInteraction('التعليق');
                            break;
                          case 'share':
                            handleInteraction('المشاركة');
                            break;
                          case 'gift':
                            handleInteraction('الهدية');
                            break;
                        }
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد منشورات حالياً</h3>
                <p className="text-gray-500">تحقق مرة أخرى قريباً للاطلاع على المحتوى الجديد</p>
              </div>
            )}
          </div>

          {/* Empty State for No Content */}
          {typedStreams.length === 0 && typedMemories.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                لا يوجد محتوى متاح حالياً
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                تحقق مرة أخرى قريباً لاستكشاف المحتوى الجديد والمثير
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}