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
  PlayCircle
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
    <div className="min-h-screen bg-gray-100">
      <SimpleNavigation />
      
      <main className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              مرحباً في LaaBoBo! 🐰
            </h1>
            <p className="text-gray-600 text-lg">شاهد وتفاعل مع كل المحتوى</p>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center gap-4 mb-10">
            <Link href="/create-memory">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg">
                <Plus className="w-5 h-5 mr-2" />
                إنشاء منشور
              </Button>
            </Link>
            <Link href="/start-stream">
              <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 text-lg">
                <Video className="w-5 h-5 mr-2" />
                بث مباشر
              </Button>
            </Link>
          </div>

          {/* Live Streams Section */}
          {typedStreams.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                البث المباشر ({typedStreams.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {typedStreams.map((stream) => (
                  <Card key={`stream-${stream.id}`} className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-red-200">
                    <div 
                      className="relative h-48 bg-gradient-to-br from-red-500 to-pink-600"
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
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="mr-2 text-sm font-medium text-gray-700">{stream.hostId}</span>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Sparkles className="w-5 h-5 mr-3 text-purple-600" />
              المنشورات ({typedMemories.length})
            </h2>
            
            {typedMemories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {typedMemories.map((memory) => (
                  <Card key={`memory-${memory.id}`} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                    {/* Media Display */}
                    <div className="relative h-48 bg-gray-200">
                      {memory.mediaUrls && memory.mediaUrls.length > 0 ? (
                        memory.type === 'video' ? (
                          <video
                            src={memory.mediaUrls[0]}
                            className="w-full h-full object-cover"
                            muted
                            poster={memory.thumbnailUrl}
                          />
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

                      {/* Video Indicator */}
                      {memory.type === 'video' && (
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                          <PlayCircle className="w-3 h-3 mr-1" />
                          فيديو
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      {/* Title */}
                      {memory.title && (
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">
                          {memory.title}
                        </h3>
                      )}
                      
                      {/* Caption */}
                      <p className="text-gray-700 mb-3 line-clamp-2 text-right leading-relaxed">
                        {memory.caption || "منشور جديد"}
                      </p>

                      {/* Author Info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="mr-2">
                            <span className="text-sm font-medium text-gray-700">
                              {memory.author?.firstName || memory.author?.username || memory.authorId}
                            </span>
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
                <p className="text-gray-500 mb-6">ابدأ بإنشاء منشور لمشاركة إبداعك!</p>
                <Link href="/create-memory">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3">
                    إنشاء منشور الآن
                  </Button>
                </Link>
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
                مرحباً بك في مجتمع LaaBoBo! 🐰
              </h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                ابدأ بإنشاء محتوى رائع أو انطلق في بث مباشر لتكون جزءاً من المجتمع
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/create-memory">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4">
                    <Plus className="w-5 h-5 mr-2" />
                    إنشاء منشور
                  </Button>
                </Link>
                <Link href="/start-stream">
                  <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4">
                    <Video className="w-5 h-5 mr-2" />
                    ابدأ بث مباشر
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}