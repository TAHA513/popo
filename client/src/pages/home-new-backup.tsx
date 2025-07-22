import { useAuth } from "@/hooks/useAuth";
import SimpleNavigation from "@/components/simple-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Play, 
  Users, 
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
  Bookmark,
  Send,
  MoreHorizontal
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Stream } from "@/types";
import { Link } from "wouter";

export default function HomeNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      return await apiRequest('POST', `/api/memories/${memoryId}/interact`, { type });
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

  const handleSendGift = (postId: number) => {
    interactionMutation.mutate({ memoryId: postId, type: 'gift' });
  };

  const getMemoryTypeIcon = (type: string) => {
    switch (type) {
      case 'flash':
        return <Zap className="w-4 h-4" />;
      case 'trending':
        return <Sparkles className="w-4 h-4" />;
      case 'star':
        return <Crown className="w-4 h-4" />;
      case 'legend':
        return <Timer className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
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
        return 'bg-orange-500';
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
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            مرحباً، {user?.firstName || user?.username || 'مستخدم'}! 🐰
          </h1>
          <p className="text-gray-600">استكشف البثوث المباشرة والمحتوى الجديد</p>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all" className="text-sm">
              <Users className="w-4 h-4 mr-2" />
              الكل
            </TabsTrigger>
            <TabsTrigger value="live" className="text-sm">
              <Video className="w-4 h-4 mr-2" />
              بث مباشر ({typedStreams.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              منشورات ({typedMemories.length})
            </TabsTrigger>
          </TabsList>

          {/* All Content */}
          <TabsContent value="all" className="space-y-6">
            {/* Live Streams Section */}
            {typedStreams.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  بث مباشر الآن
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {typedStreams.slice(0, 6).map((stream) => (
                    <Card 
                      key={stream.id} 
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                      onClick={() => handleJoinStream(stream.id)}
                    >
                      <div className="relative h-64 bg-gradient-to-br from-purple-500 to-pink-500">
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
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                أحدث المنشورات
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typedMemories.slice(0, 9).map((memory) => (
                  <Card key={memory.id} className="overflow-hidden hover:shadow-lg transition-all">
                    {/* Media Content */}
                    <div className="relative h-64 bg-gray-200">
                      {memory.mediaUrls?.[0] || memory.thumbnailUrl ? (
                        memory.mediaUrls?.[0] || memory.thumbnailUrl.includes('.mp4') || memory.mediaUrls?.[0] || memory.thumbnailUrl.includes('.webm') ? (
                          <video
                            src={memory.mediaUrls?.[0] || memory.thumbnailUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            poster="/placeholder-video.jpg"
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <img
                            src={memory.mediaUrls?.[0] || memory.thumbnailUrl}
                            alt="Memory"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.jpg';
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
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="mr-2 text-sm text-gray-600">{memory.authorId}</span>
                        </div>
                        <span className="text-xs text-gray-400">منذ ساعة</span>
                      </div>

                      {/* Interaction Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(memory.id)}
                            className={`p-2 ${likedPosts.has(memory.id) ? 'text-red-500' : 'text-gray-500'}`}
                          >
                            <Heart className={`w-4 h-4 ${likedPosts.has(memory.id) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComment(memory.id)} className="p-2 text-gray-500 hover:text-blue-500"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(memory.id)} className="p-2 text-gray-500 hover:text-green-500"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendGift(memory.id)}
                            className="p-2 text-gray-500 hover:text-purple-500"
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmark(memory.id)}
                            className={`p-2 ${bookmarkedPosts.has(memory.id) ? 'text-yellow-500' : 'text-gray-500'}`}
                          >
                            <Bookmark className={`w-4 h-4 ${bookmarkedPosts.has(memory.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Live Streams Only */}
          <TabsContent value="live" className="space-y-4">
            {typedStreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typedStreams.map((stream) => (
                  <Card 
                    key={stream.id} 
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                    onClick={() => handleJoinStream(stream.id)}
                  >
                    <div className="relative h-64 bg-gradient-to-br from-purple-500 to-pink-500">
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
                      <h3 className="font-semibold text-gray-800 mb-2">{stream.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{stream.description}</p>
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
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد بثوث مباشرة حالياً</h3>
                <p className="text-gray-500 mb-4">كن أول من يبدأ بث مباشر!</p>
                <Link href="/start-stream">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    ابدأ بث مباشر
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Posts Only */}
          <TabsContent value="posts" className="space-y-4">
            {typedMemories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typedMemories.map((memory) => (
                  <Card key={memory.id} className="overflow-hidden hover:shadow-lg transition-all">
                    {/* Media Content */}
                    <div className="relative h-64 bg-gray-200">
                      {memory.mediaUrls?.[0] || memory.thumbnailUrl ? (
                        memory.mediaUrls?.[0] || memory.thumbnailUrl.includes('.mp4') || memory.mediaUrls?.[0] || memory.thumbnailUrl.includes('.webm') ? (
                          <video
                            src={memory.mediaUrls?.[0] || memory.thumbnailUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            poster="/placeholder-video.jpg"
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <img
                            src={memory.mediaUrls?.[0] || memory.thumbnailUrl}
                            alt="Memory"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.jpg';
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
                    </div>

                    <CardContent className="p-4">
                      {/* Caption */}
                      <p className="text-gray-800 mb-3 line-clamp-2 text-right">
                        {memory.caption || "منشور جديد"}
                      </p>

                      {/* Author Info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="mr-2 text-sm text-gray-600">{memory.authorId}</span>
                        </div>
                        <span className="text-xs text-gray-400">منذ ساعة</span>
                      </div>

                      {/* Interaction Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(memory.id)}
                            className={`p-2 ${likedPosts.has(memory.id) ? 'text-red-500' : 'text-gray-500'}`}
                          >
                            <Heart className={`w-4 h-4 ${likedPosts.has(memory.id) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComment(memory.id)} className="p-2 text-gray-500 hover:text-blue-500"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(memory.id)} className="p-2 text-gray-500 hover:text-green-500"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendGift(memory.id)}
                            className="p-2 text-gray-500 hover:text-purple-500"
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmark(memory.id)}
                            className={`p-2 ${bookmarkedPosts.has(memory.id) ? 'text-yellow-500' : 'text-gray-500'}`}
                          >
                            <Bookmark className={`w-4 h-4 ${bookmarkedPosts.has(memory.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد منشورات حالياً</h3>
                <p className="text-gray-500 mb-4">كن أول من ينشر ذكرى!</p>
                <Link href="/create-memory">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    إنشاء ذكرى
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}