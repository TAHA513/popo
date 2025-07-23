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
  VolumeX,
  TrendingUp,
  Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Stream } from "@/types";
import { Link, useLocation } from "wouter";
import CommentsModal from "@/components/comments-modal";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [commentsModal, setCommentsModal] = useState<{
    isOpen: boolean;
    postId: string;
    postType: 'memory' | 'stream';
  }>({
    isOpen: false,
    postId: '',
    postType: 'memory'
  });
  
  // Smart content sections for better user experience
  const [activeSection, setActiveSection] = useState<'trending' | 'videos' | 'images' | 'all'>('trending');
  
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

  // Filter content based on active section
  const filteredMemories = typedMemories.filter(memory => {
    switch (activeSection) {
      case 'trending':
        return memory.likeCount > 0 || memory.giftCount > 0 || memory.shareCount > 0;
      case 'videos':
        return memory.type === 'video';
      case 'images':
        return memory.type === 'image';
      case 'all':
      default:
        return true;
    }
  });

  const handleJoinStream = (streamId: number) => {
    setLocation(`/stream/${streamId}`);
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

  const handleInteraction = (action: string, itemId?: string) => {
    if (action === 'comment') {
      // Open comments modal
      const postType = itemId?.includes('stream') ? 'stream' : 'memory';
      const postId = itemId?.replace('memory-', '').replace('stream-', '') || '';
      
      setCommentsModal({
        isOpen: true,
        postId,
        postType
      });
      return;
    }
    
    toast({
      title: `تم ${action}`,
      description: `تم تنفيذ ${action} بنجاح`,
    });
  };

  const closeCommentsModal = () => {
    setCommentsModal({
      isOpen: false,
      postId: '',
      postType: 'memory'
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
                  onClick={() => setLocation('/start-stream')}
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

          {/* Smart Content Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide p-4 space-x-2 rtl:space-x-reverse">
              <Button
                variant={activeSection === 'trending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('trending')}
                className={`flex items-center space-x-2 rtl:space-x-reverse whitespace-nowrap ${
                  activeSection === 'trending' 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>🔥 الأكثر تفاعلاً</span>
              </Button>
              
              <Button
                variant={activeSection === 'videos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('videos')}
                className={`flex items-center space-x-2 rtl:space-x-reverse whitespace-nowrap ${
                  activeSection === 'videos' 
                    ? 'bg-pink-600 text-white hover:bg-pink-700' 
                    : 'border-pink-200 text-pink-600 hover:bg-pink-50'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>🎥 الفيديوهات فقط</span>
              </Button>
              
              <Button
                variant={activeSection === 'images' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('images')}
                className={`flex items-center space-x-2 rtl:space-x-reverse whitespace-nowrap ${
                  activeSection === 'images' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>🖼️ الصور فقط</span>
              </Button>
              
              <Button
                variant={activeSection === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('all')}
                className={`flex items-center space-x-2 rtl:space-x-reverse whitespace-nowrap ${
                  activeSection === 'all' 
                    ? 'bg-gray-800 text-white hover:bg-gray-900' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>⭐ جميع المنشورات</span>
              </Button>
            </div>
          </div>

          {/* Posts/Memories Section */}
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {activeSection === 'trending' && '🔥 الأكثر تفاعلاً'}
                    {activeSection === 'videos' && '🎥 الفيديوهات'}  
                    {activeSection === 'images' && '🖼️ الصور'}
                    {activeSection === 'all' && '⭐ جميع المنشورات'}
                  </h2>
                  <p className="text-gray-600 text-sm">{filteredMemories.length} منشور</p>
                </div>
              </div>
              <div className="flex items-center bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                <Sparkles className="w-3 h-3 mr-2" />
                {activeSection === 'trending' && 'متفاعل'}
                {activeSection === 'videos' && 'فيديو'}  
                {activeSection === 'images' && 'صورة'}
                {activeSection === 'all' && 'مميز'}
              </div>
            </div>
            
            {filteredMemories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {filteredMemories.map((memory) => {
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
                            // فتح الفيديوهات فقط - تجاهل الصور
                            if (memory.type === 'video') {
                              setLocation(`/video/${memory.id}`);
                            } else {
                              // إظهار رسالة للصور
                              toast({
                                title: "عرض الصور",
                                description: "الصور تُعرض في البطاقة مباشرة",
                              });
                            }
                            break;
                          case 'view':
                            // عرض الفيديوهات فقط
                            if (memory.type === 'video') {
                              setLocation(`/video/${memory.id}`);
                            }
                            break;
                          case 'comment':
                            handleInteraction('comment', `memory-${memory.id}`);
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

          {/* App Advertisement */}
          {(typedStreams.length > 0 || typedMemories.length > 0) && (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 rounded-xl p-8 mx-4 border border-purple-200 shadow-lg">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">اكتشف عالم LaaBoBo Live</h3>
                <p className="text-gray-600 text-sm mb-4">منصة البث المباشر والتواصل الاجتماعي الأولى عربياً</p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    <span>بث مباشر</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>تفاعل حقيقي</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gift className="w-4 h-4" />
                    <span>هدايا رقمية</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State for No Content */}
          {typedStreams.length === 0 && typedMemories.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                لا يوجد محتوى متاح حالياً
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                كن أول من ينشر ذكرى جميلة!
              </p>
              <Button 
                onClick={() => setLocation('/create-memory')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-full"
              >
                إنشاء منشور جديد
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Comments Modal */}
      <CommentsModal
        postId={commentsModal.postId}
        postType={commentsModal.postType}
        isOpen={commentsModal.isOpen}
        onClose={closeCommentsModal}
      />
    </div>
  );
}