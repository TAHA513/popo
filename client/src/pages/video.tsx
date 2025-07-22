import { useState } from "react";
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
  Star
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

  // Fetch video data
  const { data: video, isLoading: videoLoading } = useQuery<VideoData>({
    queryKey: ['/api/memories', videoId],
    enabled: !!videoId,
    queryFn: async () => {
      const response = await fetch(`/api/memories/${videoId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل في تحميل الفيديو');
      return response.json();
    }
  });

  // Fetch author's other videos
  const { data: authorVideos = [], isLoading: authorVideosLoading } = useQuery<VideoData[]>({
    queryKey: ['/api/memories/user', video?.authorId],
    enabled: !!video?.authorId,
    queryFn: async () => {
      const response = await fetch(`/api/memories/user/${video?.authorId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل في تحميل فيديوهات المستخدم');
      return response.json();
    }
  });

  // Filter only videos (not images) and exclude current video
  const otherVideos = authorVideos.filter(v => 
    v.type === 'video' && v.id !== parseInt(videoId || '0')
  );

  const handleVideoToggle = () => {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
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
    const videoElement = document.querySelector('video') as HTMLVideoElement;
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
    if (!video) return;
    
    const videoKey = `video-${video.id}`;
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

  if (videoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الفيديو...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">الفيديو غير موجود</h2>
          <Button onClick={() => window.history.back()}>العودة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-4 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة
        </Button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="xl:col-span-2">
            <Card className="overflow-hidden shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              {/* Video Player */}
              <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
                <video
                  src={video.mediaUrls[0]}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  preload="auto"
                  poster={video.thumbnailUrl}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />

                {/* Video Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group">
                  {/* Play/Pause Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleVideoToggle}
                      className={`w-16 h-16 rounded-full text-white bg-black/30 hover:bg-black/50 transition-all duration-300 ${isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-80 hover:opacity-100'}`}
                    >
                      {isVideoPlaying ? (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="w-1.5 h-4 bg-white rounded mr-1"></div>
                          <div className="w-1.5 h-4 bg-white rounded"></div>
                        </div>
                      ) : (
                        <Play className="w-6 h-6 ml-1" fill="white" />
                      )}
                    </Button>
                  </div>

                  {/* Volume Control */}
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
                </div>

                {/* Memory Type Badge */}
                <Badge className={`absolute top-4 left-4 ${getMemoryTypeColor(video.memoryType)} text-white`}>
                  <div className="flex items-center">
                    {getMemoryTypeIcon(video.memoryType)}
                    <span className="text-xs">{video.memoryType}</span>
                  </div>
                </Badge>
              </div>

              <CardContent className="p-6">
                {/* Video Title & Description */}
                <div className="mb-6">
                  {video.title && (
                    <h1 className="text-2xl font-bold text-gray-900 mb-3 text-right">
                      {video.title}
                    </h1>
                  )}
                  <p className="text-gray-700 text-right leading-relaxed">
                    {video.caption || "فيديو رائع"}
                  </p>
                </div>

                {/* Video Stats & Actions */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-6 rtl:space-x-reverse">
                    <div className="flex items-center text-gray-600">
                      <Eye className="w-4 h-4 ml-1" />
                      <span className="text-sm">{video.viewCount}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 ml-1" />
                      <span className="text-sm">{new Date(video.createdAt).toLocaleDateString('ar')}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={`${likedVideos.has(`video-${video.id}`) ? 'text-red-500' : 'text-gray-600'} hover:text-red-400`}
                    >
                      <Heart className={`w-5 h-5 ml-1 ${likedVideos.has(`video-${video.id}`) ? 'fill-current' : ''}`} />
                      <span>{video.likeCount}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInteraction('التعليق')}
                      className="text-gray-600 hover:text-blue-400"
                    >
                      <MessageCircle className="w-5 h-5 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInteraction('المشاركة')}
                      className="text-gray-600 hover:text-green-400"
                    >
                      <Share2 className="w-5 h-5 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInteraction('إرسال هدية')}
                      className="text-gray-600 hover:text-yellow-400"
                    >
                      <Gift className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Author Profile */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">منشور بواسطة</h3>
                
                <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                  {video.author?.profileImageUrl ? (
                    <img
                      src={video.author.profileImageUrl}
                      alt="صورة المنشور"
                      className="w-16 h-16 rounded-full object-cover border-3 border-purple-300"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {video.author?.firstName || video.author?.username || 'مستخدم'}
                    </h4>
                    <p className="text-sm text-gray-600">@{video.author?.username}</p>
                    {video.author?.points && (
                      <div className="flex items-center mt-1">
                        <Sparkles className="w-3 h-3 text-yellow-500 ml-1" />
                        <span className="text-xs text-gray-600">{video.author.points} نقطة</span>
                      </div>
                    )}
                  </div>
                </div>

                {video.author?.id !== user?.id && (
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    onClick={() => handleInteraction('المتابعة')}
                  >
                    متابعة
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Other Videos from Author */}
            {otherVideos.length > 0 && (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">فيديوهات أخرى</h3>
                  
                  <div className="space-y-4">
                    {otherVideos.slice(0, 3).map((otherVideo) => (
                      <div 
                        key={otherVideo.id}
                        className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => window.location.href = `/video/${otherVideo.id}`}
                      >
                        {otherVideo.thumbnailUrl ? (
                          <img
                            src={otherVideo.thumbnailUrl}
                            alt="فيديو"
                            className="w-20 h-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                            <Play className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm text-right line-clamp-2">
                            {otherVideo.title || otherVideo.caption || 'فيديو بدون عنوان'}
                          </h5>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Eye className="w-3 h-3 ml-1" />
                            <span>{otherVideo.viewCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {otherVideos.length > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => window.location.href = `/profile/${video.author?.username}`}
                    >
                      مشاهدة جميع الفيديوهات ({otherVideos.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}