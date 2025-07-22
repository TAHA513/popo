import { useAuth } from "@/hooks/useAuth";
import SimpleNavigation from "@/components/simple-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
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
    staleTime: 5000,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <SimpleNavigation />
      
      {/* Live Activity Banner - Sticky under navigation */}
      <div className="sticky top-16 z-40 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 px-3 py-2 shadow-lg relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1 right-2 w-6 h-6 border border-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1 left-3 w-4 h-4 border border-white/20 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              {/* Live Status & Info */}
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <div className="relative">
                    <Radio className="w-5 h-5 text-white" />
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
                <div className="text-white">
                  <h2 className="text-lg font-bold mb-0.5">النشاط المباشر</h2>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse text-white/90 text-xs">
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                      <span>{typedStreams.length} بث</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-3 h-3 mr-1.5" />
                      <span>{typedStreams.reduce((sum, stream) => sum + (stream.viewerCount || 0), 0)} مشاهد</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Stream Button */}
              <Button
                onClick={() => window.location.href = '/start-stream'}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-md"
              >
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <Video className="w-4 h-4" />
                  <span>ابدأ البث</span>
                </div>
              </Button>
            </div>
        </div>
      </div>
      
      <main className="pb-0 pt-0">
        <div className="w-full">

          {/* Live Streams Section */}
          {typedStreams.length > 0 && (
            <div className="mb-0">
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                    <Video className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">البث المباشر</h2>
                    <p className="text-gray-600 text-xs">{typedStreams.length} بث نشط الآن</p>
                  </div>
                </div>
                <div className="flex items-center bg-red-100 text-red-600 px-1 py-0.5 rounded-full text-xs font-medium">
                  <div className="w-1 h-1 bg-red-500 rounded-full mr-1 animate-ping"></div>
                  مباشر
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-0.5">
                {typedStreams.map((stream) => (
                  <Card key={`stream-${stream.id}`} className="overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer bg-white/70 backdrop-blur-sm border-2 border-transparent hover:border-red-300 group">
                    <div 
                      className="relative h-48 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 overflow-hidden"
                      onClick={() => handleJoinStream(stream.id)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-white opacity-90" />
                      </div>
                      
                      {/* Live Badge */}
                      <Badge className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                        مباشر
                      </Badge>
                      
                      {/* Viewers */}
                      <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-sm flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {stream.viewerCount || 0}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">
                        {stream.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {stream.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {(stream as any).hostProfileImage ? (
                            <img
                              src={(stream as any).hostProfileImage}
                              alt="صورة المضيف"
                              className="w-8 h-8 rounded-full object-cover border-2 border-purple-300"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <span className="mr-2 text-sm font-medium text-gray-700">{(stream as any).hostName || stream.hostId}</span>
                        </div>
                      </div>

                      {/* Stream Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(`stream-${stream.id}`)}
                            className={`p-1 ${likedItems.has(`stream-${stream.id}`) ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                          >
                            <Heart className={`w-4 h-4 ${likedItems.has(`stream-${stream.id}`) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('التعليق')}
                            className="p-1 text-gray-500 hover:text-blue-500"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('المشاركة')}
                            className="p-1 text-gray-500 hover:text-green-500"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('الهدية')}
                            className="p-1 text-gray-500 hover:text-purple-500"
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleJoinStream(stream.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4"
                        >
                          انضم
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Posts/Memories Section */}
          <div>
            <div className="flex items-center justify-between mb-1 px-1">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">المنشورات المميزة</h2>
                  <p className="text-gray-600 text-xs">{typedMemories.length} منشور جديد</p>
                </div>
              </div>
              <div className="flex items-center bg-purple-100 text-purple-600 px-1 py-0.5 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                مميز
              </div>
            </div>
            
            {typedMemories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-0.5">
                {typedMemories.map((memory) => (
                  <Card key={`memory-${memory.id}`} className={`overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 bg-white/70 backdrop-blur-sm border-2 border-transparent hover:border-purple-300 group ${memory.type === 'video' ? 'col-span-3 row-span-3' : ''}`}>
                    {/* Media Display */}
                    <div className={`relative ${memory.type === 'video' ? 'h-[32rem]' : 'h-48'} bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 overflow-hidden`}>
                      {memory.mediaUrls && memory.mediaUrls.length > 0 ? (
                        memory.type === 'video' ? (
                          <div className="premium-video relative w-full h-full bg-black rounded-lg overflow-hidden group">
                            <video
                              src={memory.mediaUrls[0]}
                              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="auto"
                              poster={memory.thumbnailUrl}
                              onMouseEnter={(e) => {
                                const video = e.currentTarget;
                                if (!mutedVideos.has(`video-${memory.id}`)) {
                                  video.muted = false;
                                }
                                video.play();
                              }}
                              onMouseLeave={(e) => {
                                const video = e.currentTarget;
                                if (!mutedVideos.has(`video-${memory.id}`)) {
                                  video.muted = true;
                                }
                              }}
                              onPlay={() => {
                                setPlayingVideos(prev => new Set(prev).add(`video-${memory.id}`));
                              }}
                              onPause={() => {
                                setPlayingVideos(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(`video-${memory.id}`);
                                  return newSet;
                                });
                              }}
                              onVolumeChange={(e) => {
                                const video = e.currentTarget;
                                if (video.muted) {
                                  setMutedVideos(prev => new Set(prev).add(`video-${memory.id}`));
                                } else {
                                  setMutedVideos(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(`video-${memory.id}`);
                                    return newSet;
                                  });
                                }
                              }}
                            />
                            
                            {/* Center Play/Pause Button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const video = e.currentTarget.parentElement?.parentElement?.querySelector('video') as HTMLVideoElement;
                                  if (video) {
                                    handleVideoToggle(`video-${memory.id}`, video);
                                  }
                                }}
                                className={`
                                  video-play-button w-16 h-16 rounded-full text-white
                                  hover:scale-110 transition-all duration-300
                                  ${playingVideos.has(`video-${memory.id}`) ? 'opacity-0 group-hover:opacity-100' : 'opacity-80 hover:opacity-100'}
                                `}
                              >
                                {playingVideos.has(`video-${memory.id}`) ? (
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    <div className="w-1.5 h-4 bg-white rounded mr-1"></div>
                                    <div className="w-1.5 h-4 bg-white rounded"></div>
                                  </div>
                                ) : (
                                  <Play className="w-6 h-6 ml-1" fill="white" />
                                )}
                              </Button>
                            </div>
                            
                            {/* Volume Control Button */}
                            <div className="absolute top-3 right-3 z-20">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const video = e.currentTarget.parentElement?.parentElement?.querySelector('video') as HTMLVideoElement;
                                  if (video) {
                                    handleVolumeToggle(`video-${memory.id}`, video);
                                  }
                                }}
                                className={`volume-control w-12 h-12 rounded-full border-2 border-white/40 hover:border-white/70 transition-all duration-300 shadow-lg hover:scale-105 ${mutedVideos.has(`video-${memory.id}`) ? 'volume-muted' : 'volume-on'}`}
                              >
                                {mutedVideos.has(`video-${memory.id}`) ? (
                                  <VolumeX className="w-5 h-5" />
                                ) : (
                                  <Volume2 className="w-5 h-5" />
                                )}
                              </Button>
                            </div>
                            
                            {/* Video Overlay with Interaction */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-2 left-2 right-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(`memory-${memory.id}`);
                                      }}
                                      className={`p-1 ${likedItems.has(`memory-${memory.id}`) ? 'text-red-500' : 'text-white'} hover:text-red-400`}
                                    >
                                      <Heart className={`w-4 h-4 ${likedItems.has(`memory-${memory.id}`) ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInteraction('التعليق');
                                      }}
                                      className="p-1 text-white hover:text-blue-400"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInteraction('المشاركة');
                                      }}
                                      className="p-1 text-white hover:text-green-400"
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInteraction('الهدية');
                                      }}
                                      className="p-1 text-white hover:text-purple-400"
                                    >
                                      <Gift className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center space-x-3 rtl:space-x-reverse text-xs text-white">
                                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                      <Eye className="w-3 h-3" />
                                      <span>{memory.viewCount || 0}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Open fullscreen video viewer
                                        const video = e.currentTarget.closest('.premium-video')?.querySelector('video') as HTMLVideoElement;
                                        if (video && video.requestFullscreen) {
                                          video.requestFullscreen();
                                        }
                                      }}
                                      className="p-1 text-white hover:text-yellow-400"
                                      title="مشاهدة كاملة"
                                    >
                                      <Maximize2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={memory.mediaUrls[0]}
                            alt="منشور"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.jpg';
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <Image className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Memory Type Badge */}
                      <Badge className={`absolute top-3 left-3 ${getMemoryTypeColor(memory.memoryType)} text-white`}>
                        <div className="flex items-center">
                          {getMemoryTypeIcon(memory.memoryType)}
                          <span className="mr-1 text-xs">{memory.memoryType}</span>
                        </div>
                      </Badge>

                      {/* Premium Video Indicator */}
                      {memory.type === 'video' && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg">
                          <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                          HD LIVE
                        </div>
                      )}
                    </div>

                    <CardContent className={`${memory.type === 'video' ? 'p-6' : 'p-4'}`}>
                      {/* Title */}
                      {memory.title && (
                        <h3 className={`font-bold text-gray-900 mb-2 line-clamp-1 ${memory.type === 'video' ? 'text-lg' : ''}`}>
                          {memory.title}
                        </h3>
                      )}
                      
                      {/* Caption */}
                      <p className={`text-gray-700 mb-3 line-clamp-2 text-right leading-relaxed ${memory.type === 'video' ? 'text-base' : 'text-sm'}`}>
                        {memory.caption || "منشور جديد"}
                      </p>

                      {/* Author Info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {memory.author?.profileImageUrl ? (
                            <img
                              src={memory.author.profileImageUrl}
                              alt="صورة الكاتب"
                              className={`${memory.type === 'video' ? 'w-10 h-10' : 'w-8 h-8'} rounded-full object-cover border-2 border-purple-300`}
                            />
                          ) : (
                            <div className={`${memory.type === 'video' ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center`}>
                              <User className={`${memory.type === 'video' ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
                            </div>
                          )}
                          <div className="mr-2">
                            <span className={`${memory.type === 'video' ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
                              {memory.author?.firstName || memory.author?.username || memory.authorId}
                            </span>
                            {memory.type === 'video' && (
                              <div className="flex items-center mt-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                                <span className="text-xs text-red-600 font-medium">LIVE</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">منذ يوم</span>
                      </div>

                      {/* Engagement Stats */}
                      <div className="flex items-center text-xs text-gray-500 mb-3 space-x-4 rtl:space-x-reverse">
                        <span>👁 {memory.viewCount || 0} مشاهدة</span>
                        <span>❤️ {memory.likeCount || 0} إعجاب</span>
                        <span>🎁 {memory.giftCount || 0} هدية</span>
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(`memory-${memory.id}`)}
                            className={`p-1 ${likedItems.has(`memory-${memory.id}`) ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                          >
                            <Heart className={`w-4 h-4 ${likedItems.has(`memory-${memory.id}`) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('التعليق')}
                            className="p-1 text-gray-500 hover:text-blue-500"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('المشاركة')}
                            className="p-1 text-gray-500 hover:text-green-500"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('الهدية')}
                            className="p-1 text-gray-500 hover:text-purple-500"
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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