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
  Star,
  TrendingUp,
  Users,
  Fire
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-white">جاري التحميل المحتوى...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <SimpleNavigation />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-400/10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-pink-400/10 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-indigo-400/10 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-purple-400/10 rounded-full animate-pulse delay-1000"></div>
      </div>
      
      <main className="pt-20 pb-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="relative">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                منصة الإبداع
              </h1>
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Star className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            </div>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              اكتشف عالماً من الإبداع والمواهب، شاهد البثوث المباشرة وتفاعل مع المحتوى الأكثر إثارة
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-center mb-2">
                  <Fire className="w-6 h-6 mr-2" />
                  <span className="font-bold text-xl">{typedStreams.length}</span>
                </div>
                <p className="text-sm opacity-90">بث مباشر</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 mr-2" />
                  <span className="font-bold text-xl">{typedMemories.length}</span>
                </div>
                <p className="text-sm opacity-90">منشور مميز</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-4 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 mr-2" />
                  <span className="font-bold text-xl">{Math.floor(Math.random() * 100) + 50}</span>
                </div>
                <p className="text-sm opacity-90">مستخدم نشط</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 mr-2" />
                  <span className="font-bold text-xl">{(Math.floor(Math.random() * 50) + 10)}k</span>
                </div>
                <p className="text-sm opacity-90">مشاهدة</p>
              </div>
            </div>
          </div>

          {/* Live Streams Section */}
          {typedStreams.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-center mb-8">
                <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-full px-6 py-3 flex items-center shadow-xl">
                  <div className="w-3 h-3 bg-white rounded-full mr-3 animate-ping"></div>
                  <h2 className="text-xl font-bold text-white">البث المباشر الآن</h2>
                  <Badge className="bg-white/20 text-white mr-3 px-2 py-1">
                    {typedStreams.length}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {typedStreams.map((stream) => (
                  <Card key={`stream-${stream.id}`} className="overflow-hidden bg-black/40 backdrop-blur-lg border-2 border-purple-500/30 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                    <div 
                      className="relative h-48 bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 cursor-pointer"
                      onClick={() => handleJoinStream(stream.id)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-20 h-20 text-white opacity-80 group-hover:opacity-100" />
                      </div>
                      
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-600 text-white px-3 py-1 animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                          مباشر
                        </Badge>
                      </div>
                      
                      <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {stream.viewerCount || 0}
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="text-white font-bold text-lg">{stream.title}</h3>
                        <p className="text-gray-200 text-sm">{stream.description}</p>
                      </div>
                    </div>

                    <CardContent className="p-4 bg-gradient-to-b from-purple-900/50 to-black/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <span className="mr-3 text-white font-medium">{stream.hostId}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(`stream-${stream.id}`)}
                            className={`p-2 rounded-full ${likedItems.has(`stream-${stream.id}`) ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-red-500'} transition-all`}
                          >
                            <Heart className={`w-4 h-4 ${likedItems.has(`stream-${stream.id}`) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('التعليق')}
                            className="p-2 rounded-full bg-white/20 text-white hover:bg-blue-500 transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('الهدية')}
                            className="p-2 rounded-full bg-white/20 text-white hover:bg-purple-500 transition-all"
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => handleJoinStream(stream.id)}
                          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2 rounded-full font-bold transition-all hover:scale-105"
                        >
                          انضم الآن
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
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full px-6 py-3 flex items-center shadow-xl">
                <Sparkles className="w-6 h-6 mr-3 text-yellow-300" />
                <h2 className="text-xl font-bold text-white">المحتوى المميز</h2>
                <Badge className="bg-white/20 text-white mr-3 px-2 py-1">
                  {typedMemories.length}
                </Badge>
              </div>
            </div>
            
            {typedMemories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {typedMemories.map((memory) => (
                  <Card key={`memory-${memory.id}`} className="overflow-hidden bg-black/40 backdrop-blur-lg border-2 border-purple-500/30 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                    <div className="relative h-48">
                      {memory.mediaUrls && memory.mediaUrls.length > 0 ? (
                        memory.type === 'video' ? (
                          <video
                            src={memory.mediaUrls[0]}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            muted
                            poster={memory.thumbnailUrl}
                          />
                        ) : (
                          <img
                            src={memory.mediaUrls[0]}
                            alt="منشور"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.jpg';
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <Image className="w-16 h-16 text-white opacity-60" />
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getMemoryTypeColor(memory.memoryType)} text-white px-3 py-1`}>
                          <div className="flex items-center">
                            {getMemoryTypeIcon(memory.memoryType)}
                            <span className="mr-1 text-xs">{memory.memoryType}</span>
                          </div>
                        </Badge>
                      </div>

                      {memory.type === 'video' && (
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                          <PlayCircle className="w-3 h-3 mr-1" />
                          فيديو
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>

                    <CardContent className="p-4 bg-gradient-to-b from-purple-900/50 to-black/50">
                      {memory.title && (
                        <h3 className="text-white font-bold mb-2 line-clamp-1">
                          {memory.title}
                        </h3>
                      )}
                      
                      <p className="text-gray-300 mb-3 line-clamp-2 text-right leading-relaxed text-sm">
                        {memory.caption || "منشور جديد"}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="mr-2">
                            <span className="text-white font-medium text-sm">
                              {memory.author?.firstName || memory.author?.username || memory.authorId}
                            </span>
                          </div>
                        </div>
                        <span className="text-gray-400 text-xs">منذ يوم</span>
                      </div>

                      <div className="flex items-center text-xs text-gray-400 mb-3 space-x-4 rtl:space-x-reverse">
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {memory.viewCount || 0}
                        </span>
                        <span className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {memory.likeCount || 0}
                        </span>
                        <span className="flex items-center">
                          <Gift className="w-3 h-3 mr-1" />
                          {memory.giftCount || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(`memory-${memory.id}`)}
                            className={`p-2 rounded-full ${likedItems.has(`memory-${memory.id}`) ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-red-500'} transition-all`}
                          >
                            <Heart className={`w-4 h-4 ${likedItems.has(`memory-${memory.id}`) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('التعليق')}
                            className="p-2 rounded-full bg-white/20 text-white hover:bg-blue-500 transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('المشاركة')}
                            className="p-2 rounded-full bg-white/20 text-white hover:bg-green-500 transition-all"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInteraction('الهدية')}
                            className="p-2 rounded-full bg-white/20 text-white hover:bg-purple-500 transition-all"
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
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                  <Sparkles className="w-16 h-16 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  لا توجد منشورات حالياً
                </h3>
                <p className="text-gray-300 max-w-md mx-auto">
                  كن أول من يضيف محتوى مميز إلى المنصة
                </p>
              </div>
            )}
          </div>

          {/* Empty State for No Content */}
          {typedStreams.length === 0 && typedMemories.length === 0 && (
            <div className="text-center py-24">
              <div className="relative">
                <div className="w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center mx-auto mb-12 backdrop-blur-sm">
                  <Sparkles className="w-20 h-20 text-purple-400 animate-pulse" />
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                  <Star className="w-6 h-6 text-yellow-400 animate-spin" />
                </div>
              </div>
              <h3 className="text-4xl font-bold text-white mb-6">
                مرحباً بك في منصة الإبداع
              </h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                استعد لاكتشاف عالم مليء بالمحتوى المذهل والمواهب الاستثنائية
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}