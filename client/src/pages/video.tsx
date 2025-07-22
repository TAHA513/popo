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
    <div className="min-h-screen bg-black flex">
      {/* Main Video Area - Like Instagram */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        {/* Video Player - Full Screen Style */}
        <div className="relative w-full h-full flex items-center justify-center group">
          <video
            src={video.mediaUrls[0]}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            poster={video.thumbnailUrl}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            style={{ maxHeight: '90vh' }}
          />

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
            <Badge className={`absolute top-4 left-20 ${getMemoryTypeColor(video.memoryType)} text-white`}>
              <div className="flex items-center">
                {getMemoryTypeIcon(video.memoryType)}
                <span className="text-xs mr-1">{video.memoryType}</span>
              </div>
            </Badge>
          </div>

          {/* Video Info Overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
            <div className="flex items-center justify-between">
              {/* Author Info */}
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                {video.author?.profileImageUrl ? (
                  <img
                    src={video.author.profileImageUrl}
                    alt="صورة المنشور"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                
                <div>
                  <h4 className="font-bold text-white text-lg">
                    {video.author?.firstName || video.author?.username || 'مستخدم'}
                  </h4>
                  <p className="text-white/80 text-sm">@{video.author?.username}</p>
                </div>
                
                {video.author?.id !== user?.id && (
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none hover:from-purple-700 hover:to-pink-700"
                    onClick={() => handleInteraction('المتابعة')}
                  >
                    متابعة
                  </Button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`${likedVideos.has(`video-${video.id}`) ? 'text-red-500' : 'text-white'} hover:text-red-400 bg-black/30 hover:bg-black/50`}
                >
                  <Heart className={`w-6 h-6 ${likedVideos.has(`video-${video.id}`) ? 'fill-current' : ''}`} />
                  <span className="ml-1">{video.likeCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInteraction('التعليق')}
                  className="text-white hover:text-blue-400 bg-black/30 hover:bg-black/50"
                >
                  <MessageCircle className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInteraction('المشاركة')}
                  className="text-white hover:text-green-400 bg-black/30 hover:bg-black/50"
                >
                  <Share2 className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInteraction('إرسال هدية')}
                  className="text-white hover:text-yellow-400 bg-black/30 hover:bg-black/50"
                >
                  <Gift className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Caption */}
            {video.title || video.caption ? (
              <div className="mt-4">
                {video.title && (
                  <h2 className="text-white font-bold text-xl mb-2 text-right">
                    {video.title}
                  </h2>
                )}
                <p className="text-white/90 text-right leading-relaxed">
                  {video.caption || "فيديو رائع"}
                </p>
              </div>
            ) : null}

            {/* Video Stats */}
            <div className="flex items-center space-x-6 rtl:space-x-reverse mt-4 text-white/70">
              <div className="flex items-center">
                <Eye className="w-4 h-4 ml-1" />
                <span className="text-sm">{video.viewCount}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 ml-1" />
                <span className="text-sm">{new Date(video.createdAt).toLocaleDateString('ar')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - More Videos */}
      <div className="w-80 bg-black/95 backdrop-blur-sm border-l border-gray-800 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-white font-bold text-lg mb-4 text-right">فيديوهات أخرى</h3>
          
          {otherVideos.length > 0 ? (
            <div className="space-y-3">
              {otherVideos.map((otherVideo) => (
                <div 
                  key={otherVideo.id}
                  className="cursor-pointer hover:bg-white/10 p-3 rounded-lg transition-all duration-300 group"
                  onClick={() => window.location.href = `/video/${otherVideo.id}`}
                >
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    {/* Video Thumbnail */}
                    <div className="relative flex-shrink-0">
                      {otherVideo.thumbnailUrl || otherVideo.mediaUrls[0] ? (
                        <img
                          src={otherVideo.thumbnailUrl || otherVideo.mediaUrls[0]}
                          alt="فيديو"
                          className="w-24 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-16 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-lg flex items-center justify-center">
                          <Play className="w-8 h-8 text-white/50" />
                        </div>
                      )}
                      
                      {/* Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                        <Play className="w-6 h-6 text-white" fill="white" />
                      </div>

                      {/* Memory Type Badge */}
                      <Badge className={`absolute top-1 left-1 ${getMemoryTypeColor(otherVideo.memoryType)} text-white text-xs`}>
                        {getMemoryTypeIcon(otherVideo.memoryType)}
                      </Badge>
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-white font-medium text-sm text-right line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {otherVideo.title || otherVideo.caption || 'فيديو بدون عنوان'}
                      </h5>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-white/60">
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 ml-1" />
                          <span>{otherVideo.viewCount}</span>
                        </div>
                        <span>{new Date(otherVideo.createdAt).toLocaleDateString('ar')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-white/60 text-sm">لا توجد فيديوهات أخرى</p>
            </div>
          )}

          {/* View All Videos Button */}
          {otherVideos.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full mt-4 border-white/20 text-white hover:bg-white/10 hover:border-white/40"
              onClick={() => window.location.href = `/profile/${video.author?.username}`}
            >
              مشاهدة جميع الفيديوهات ({otherVideos.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}