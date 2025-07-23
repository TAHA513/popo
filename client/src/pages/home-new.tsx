import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Users, 
  Eye, 
  Play, 
  User, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Bookmark,
  Sparkles,
  Crown,
  Star,
  Zap,
  MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Stream } from "@/types";
import { Link, useLocation } from "wouter";

export default function HomeNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  
  // Fetch live streams
  const { data: streams = [], isLoading: streamsLoading } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 3000, // كل 3 ثواني
    staleTime: 0,
  });

  // Fetch public memories/posts
  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories/public'],
    refetchInterval: 2000, // كل ثانيتين - سرعة البرق!
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const typedStreams = (streams as Stream[]);
  const typedMemories = (memories as any[]);

  const handleJoinStream = (streamId: number) => {
    window.location.href = `/stream/${streamId}`;
  };

  // Memory interaction mutation
  const interactionMutation = useMutation({
    mutationFn: async ({ memoryId, type }: { memoryId: number; type: string }) => {
      return await apiRequest(`/api/memories/${memoryId}/interact`, 'POST', { type });
    },
    onSuccess: (_, { type }) => {
      const messages = {
        like: "تم الإعجاب! ❤️",
        comment: "تم فتح التعليقات",
        share: "تم نسخ الرابط للمشاركة",
        gift: "تم إرسال الهدية! 🎁",
        bookmark: "تم حفظ المنشور! 📚"
      };
      
      toast({
        title: messages[type as keyof typeof messages] || "تم التفاعل",
        description: "شكراً لتفاعلك مع المحتوى",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
    },
    onError: () => {
      toast({
        title: "خطأ في التفاعل",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  });

  const handleLike = (postId: number) => {
    setLikedPosts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      return newLiked;
    });
    
    interactionMutation.mutate({ memoryId: postId, type: 'like' });
  };

  const handleComment = (postId: number) => {
    interactionMutation.mutate({ memoryId: postId, type: 'comment' });
  };

  const handleShare = (postId: number) => {
    navigator.clipboard?.writeText(`${window.location.origin}/memory/${postId}`);
    interactionMutation.mutate({ memoryId: postId, type: 'share' });
  };

  const handleBookmark = (postId: number) => {
    setBookmarkedPosts(prev => {
      const newBookmarked = new Set(prev);
      if (newBookmarked.has(postId)) {
        newBookmarked.delete(postId);
      } else {
        newBookmarked.add(postId);
      }
      return newBookmarked;
    });
    
    interactionMutation.mutate({ memoryId: postId, type: 'bookmark' });
  };

  const getMemoryTypeColor = (type: string) => {
    const colors = {
      fleeting: 'bg-gray-500',
      trending: 'bg-orange-500', 
      star: 'bg-purple-500',
      legend: 'bg-yellow-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getMemoryTypeIcon = (type: string) => {
    const icons = {
      fleeting: <Zap className="w-3 h-3" />,
      trending: <Sparkles className="w-3 h-3" />,
      star: <Star className="w-3 h-3" />,
      legend: <Crown className="w-3 h-3" />
    };
    return icons[type as keyof typeof icons] || <Sparkles className="w-3 h-3" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-lg mb-4">يرجى تسجيل الدخول</div>
            <Button onClick={() => window.location.href = '/login'}>
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = streamsLoading || memoriesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            مرحباً، {user?.firstName || user?.username || 'مستخدم'}! 🐰
          </h1>
          <p className="text-sm sm:text-base text-gray-600">استكشف البثوث المباشرة والمحتوى الجديد</p>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-12 sm:h-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-1 sm:px-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">الكل</span>
              <span className="sm:hidden">الكل</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs sm:text-sm px-1 sm:px-3">
              <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">بث مباشر ({typedStreams.length})</span>
              <span className="sm:hidden">مباشر</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-xs sm:text-sm px-1 sm:px-3">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">منشورات ({typedMemories.length})</span>
              <span className="sm:hidden">منشورات</span>
            </TabsTrigger>
          </TabsList>

          {/* All Content */}
          <TabsContent value="all" className="space-y-6">
            {/* Live Streams Section */}
            {typedStreams.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  بث مباشر الآن
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
                  {typedStreams.slice(0, 6).map((stream) => (
                    <Card 
                      key={stream.id} 
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                      onClick={() => handleJoinStream(stream.id)}
                    >
                      <div className="relative aspect-video bg-gradient-to-br from-purple-500 to-pink-500">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white opacity-80" />
                        </div>
                        <Badge className="absolute top-3 left-3 bg-red-600 text-white">
                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                          مباشر
                        </Badge>
                        <div className="absolute bottom-3 left-3 flex items-center text-white bg-black/50 px-2 py-1 rounded">
                          <Eye className="w-3 h-3 mr-1" />
                          <span className="text-sm">{stream.viewerCount || 0}</span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{stream.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{stream.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="w-4 h-4 mr-1" />
                            {stream.hostId}
                          </div>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            انضم الآن
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts Section */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                أحدث المنشورات
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {typedMemories.slice(0, 12).map((memory) => (
                  <Card key={memory.id} className="overflow-hidden hover:shadow-lg transition-all w-full">
                    {/* Media Content */}
                    <div className="relative aspect-square bg-gray-200 rounded-t-lg overflow-hidden w-full">
                      {memory.mediaUrls && memory.mediaUrls.length > 0 ? (
                        memory.type === 'video' ? (
                          <video
                            src={memory.mediaUrls[0]}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            poster={memory.thumbnailUrl}
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <img
                            src={memory.thumbnailUrl || memory.mediaUrls[0]}
                            alt="Memory"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.src = '/placeholder-image.jpg';
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-white opacity-60" />
                        </div>
                      )}
                      
                      {/* Memory Type Badge */}
                      <Badge className={`absolute top-3 left-3 ${getMemoryTypeColor(memory.memoryType)} text-white`}>
                        <div className="flex items-center">
                          {getMemoryTypeIcon(memory.memoryType)}
                          <span className="mr-1 text-xs">{memory.memoryType}</span>
                        </div>
                      </Badge>

                      {/* More Options */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 bg-black/20 hover:bg-black/40 text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>

                    <CardContent className="p-4">
                      {/* Caption */}
                      <p className="text-gray-800 mb-3 line-clamp-2 text-right">
                        {memory.caption || "منشور جديد"}
                      </p>

                      {/* Author Info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {memory.author?.username || `مستخدم #${memory.authorId?.slice(0, 6)}`}
                            </p>
                            <p className="text-xs text-gray-500">منذ دقائق</p>
                          </div>
                        </div>
                      </div>

                      {/* Interaction Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          <button 
                            onClick={() => handleLike(memory.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${likedPosts.has(memory.id) ? 'text-red-500 fill-current' : ''}`} />
                            <span className="text-xs">{memory.likeCount || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleComment(memory.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse text-gray-500 hover:text-blue-500 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">{memory.commentCount || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleShare(memory.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse text-gray-500 hover:text-green-500 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            <span className="text-xs">{memory.shareCount || 0}</span>
                          </button>
                        </div>

                        <button 
                          onClick={() => handleBookmark(memory.id)}
                          className={`p-1 ${bookmarkedPosts.has(memory.id) ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'} transition-colors`}
                        >
                          <Bookmark className={`w-4 h-4 ${bookmarkedPosts.has(memory.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Live Tab Content */}
          <TabsContent value="live" className="space-y-4">
            {typedStreams.length === 0 ? (
              <Card className="p-12 text-center">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد بثوث مباشرة حالياً</h3>
                <p className="text-gray-500 mb-6">كن أول من يبدأ بثاً مباشراً!</p>
                <Button onClick={() => setLocation('/start-stream')}>
                  ابدأ البث الآن
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {typedStreams.map((stream) => (
                  <Card 
                    key={stream.id} 
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleJoinStream(stream.id)}
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-purple-500 to-pink-500">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-16 h-16 text-white" />
                      </div>
                      <Badge className="absolute top-4 left-4 bg-red-600 text-white">
                        مباشر
                      </Badge>
                      <div className="absolute bottom-4 left-4 flex items-center text-white">
                        <Eye className="w-4 h-4 mr-1" />
                        <span>{stream.viewerCount || 0}</span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{stream.title}</h3>
                      <p className="text-gray-600 mb-4">{stream.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">البث #{stream.id}</span>
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          انضم الآن
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Posts Tab Content */}
          <TabsContent value="posts" className="space-y-4">
            {typedMemories.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد منشورات حالياً</h3>
                <p className="text-gray-500 mb-6">كن أول من يشارك منشوراً!</p>
                <Button onClick={() => window.location.href = '/create-memory'}>
                  إنشاء منشور جديد
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {typedMemories.map((memory) => (
                  <Card key={memory.id} className="overflow-hidden hover:shadow-lg transition-all w-full">
                    {/* Same card content as above */}
                    <div className="relative aspect-square bg-gray-200 rounded-t-lg overflow-hidden w-full">
                      {memory.mediaUrls && memory.mediaUrls.length > 0 ? (
                        memory.type === 'video' ? (
                          <video
                            src={memory.mediaUrls[0]}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            poster={memory.thumbnailUrl}
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <img
                            src={memory.thumbnailUrl || memory.mediaUrls[0]}
                            alt="Memory"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.src = '/placeholder-image.jpg';
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-white opacity-60" />
                        </div>
                      )}
                      
                      <Badge className={`absolute top-3 left-3 ${getMemoryTypeColor(memory.memoryType)} text-white`}>
                        <div className="flex items-center">
                          {getMemoryTypeIcon(memory.memoryType)}
                          <span className="mr-1 text-xs">{memory.memoryType}</span>
                        </div>
                      </Badge>
                    </div>

                    <CardContent className="p-4">
                      <p className="text-gray-800 mb-3 line-clamp-2 text-right">
                        {memory.caption || "منشور جديد"}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {memory.author?.username || `مستخدم #${memory.authorId?.slice(0, 6)}`}
                            </p>
                            <p className="text-xs text-gray-500">منذ دقائق</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          <button 
                            onClick={() => handleLike(memory.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${likedPosts.has(memory.id) ? 'text-red-500 fill-current' : ''}`} />
                            <span className="text-xs">{memory.likeCount || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleComment(memory.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse text-gray-500 hover:text-blue-500 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">{memory.commentCount || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleShare(memory.id)}
                            className="flex items-center space-x-1 rtl:space-x-reverse text-gray-500 hover:text-green-500 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            <span className="text-xs">{memory.shareCount || 0}</span>
                          </button>
                        </div>

                        <button 
                          onClick={() => handleBookmark(memory.id)}
                          className={`p-1 ${bookmarkedPosts.has(memory.id) ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'} transition-colors`}
                        >
                          <Bookmark className={`w-4 h-4 ${bookmarkedPosts.has(memory.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}