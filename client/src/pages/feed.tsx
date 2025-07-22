import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, Play, Video, Heart, MessageCircle, Share2, Gift, User, Bookmark } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { Stream } from "@/types";
import { Link } from "wouter";

export default function Feed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      return await apiRequest('POST', `/api/users/${userId}/follow`);
    },
    onSuccess: (data) => {
      toast({
        title: data.following ? "تمت المتابعة!" : "تم إلغاء المتابعة",
        description: data.following ? "أضيف المستخدم لقائمة الأصدقاء" : "تم إزالة المستخدم من الأصدقاء",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
    },
    onError: () => {
      toast({
        title: "خطأ في المتابعة",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  });

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

  const handleFollow = (userId: string) => {
    followMutation.mutate({ userId });
  };

  const handleLike = (memoryId: number) => {
    interactionMutation.mutate({ memoryId, type: 'like' });
  };

  const handleComment = (memoryId: number) => {
    interactionMutation.mutate({ memoryId, type: 'comment' });
  };

  const handleShare = (memoryId: number) => {
    navigator.clipboard?.writeText(`${window.location.origin}/memory/${memoryId}`);
    interactionMutation.mutate({ memoryId, type: 'share' });
  };

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
      
      <main className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Active Live Streams - Full Width Cards */}
        {typedStreams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">بث مباشر الآن 🔴</h2>
            <div className="space-y-4">
              {typedStreams.map((stream) => (
                <Card 
                  key={stream.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleJoinStream(stream.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Stream Preview */}
                      <div className="relative md:w-1/3 h-48 md:h-auto bg-gradient-to-br from-purple-500 to-pink-500">
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
                      
                      {/* Stream Info */}
                      <div className="flex-1 p-6">
                        <h3 className="text-xl font-semibold mb-2">{stream.title}</h3>
                        <p className="text-gray-600 mb-4">{stream.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">البث #{stream.id}</span>
                            <Badge variant="outline">{stream.category}</Badge>
                          </div>
                          
                          <Button 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          >
                            انضم الآن
                          </Button>
                        </div>
                        
                        {/* Stream Stats */}
                        <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Gift className="w-4 h-4 mr-1 text-pink-500" />
                            {stream.totalGifts} هدية
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-blue-500" />
                            {stream.viewerCount || 0} مشاهد
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Posts/Memories Feed */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">آخر المنشورات</h2>
          
          {typedMemories.length === 0 && typedStreams.length === 0 ? (
            <Card className="p-12 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد منشورات حالياً</h3>
              <p className="text-gray-500 mb-6">كن أول من يشارك محتوى!</p>
              <Button onClick={() => window.location.href = '/create-memory'}>
                إنشاء منشور جديد
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typedMemories.map((memory) => (
                <Card key={memory.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-[1.02]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <Link href={`/profile/${memory.authorId}`}>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer group">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full overflow-hidden ring-2 ring-purple-100 group-hover:ring-purple-200 transition-all">
                              {memory.author?.profileImageUrl ? (
                                <img 
                                  src={memory.author.profileImageUrl} 
                                  alt={memory.author.username} 
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <User className={`w-6 h-6 text-white m-3 ${memory.author?.profileImageUrl ? 'hidden' : ''}`} />
                            </div>
                            {/* Online Status Indicator - TikTok Style */}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                              {memory.author?.username || `مستخدم #${memory.authorId?.slice(0, 6)}`}
                              {/* Verification Badge */}
                              <span className="text-blue-500">✓</span>
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                              نشط الآن • منذ دقيقتين
                            </p>
                          </div>
                        </div>
                      </Link>
                      
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {memory.authorId !== user?.id && (
                          <Button 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-1 text-xs font-medium"
                            onClick={(e) => {
                              e.preventDefault();
                              handleFollow(memory.authorId);
                            }}
                          >
                            متابعة
                          </Button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="px-4 pb-3">
                    {/* Media Preview */}
                    {memory.mediaUrls?.length > 0 && (
                      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-64 mb-4 overflow-hidden group cursor-pointer">
                        {memory.type === 'image' && memory.thumbnailUrl ? (
                          <img 
                            src={memory.thumbnailUrl} 
                            alt={memory.caption || 'منشور'} 
                            className="w-full h-full object-contain bg-gray-100 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : memory.type === 'video' && memory.mediaUrls?.[0] ? (
                          <video
                            src={memory.mediaUrls[0]}
                            className="w-full h-full object-contain bg-gray-100"
                            muted
                            loop
                            preload="metadata"
                            poster={memory.thumbnailUrl}
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Video className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">فيديو</p>
                            </div>
                          </div>
                        )}
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    )}
                    
                    {/* Interaction Buttons - Instagram/TikTok Style */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3 md:space-x-4 rtl:space-x-reverse">
                        <button 
                          className="flex items-center space-x-1 rtl:space-x-reverse p-1.5 md:p-2 -m-2 group"
                          onClick={() => handleLike(memory.id)}
                        >
                          <Heart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-red-500 group-active:scale-125 transition-all duration-200" />
                          <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-red-500">
                            {memory.likeCount || 0}
                          </span>
                        </button>
                        
                        <button 
                          className="flex items-center space-x-1 rtl:space-x-reverse p-1.5 md:p-2 -m-2 group"
                          onClick={() => handleComment(memory.id)}
                        >
                          <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-blue-500 transition-colors duration-200" />
                          <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-blue-500">تعليق</span>
                        </button>
                        
                        <button 
                          className="p-1.5 md:p-2 -m-2 group"
                          onClick={() => handleShare(memory.id)}
                        >
                          <Share2 className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-green-500 transition-colors duration-200" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
                        <Link href={`/profile/${memory.authorId}`}>
                          <button className="p-1.5 md:p-2 -m-2 group">
                            <Gift className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-purple-500 transition-colors duration-200" />
                          </button>
                        </Link>
                        <button className="p-1.5 md:p-2 -m-2 group">
                          <Bookmark className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-yellow-500 transition-colors duration-200" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Like count and comments preview */}
                    <div className="space-y-1 text-sm">
                      {(memory.likeCount && memory.likeCount > 0) && (
                        <p className="font-semibold text-gray-900">
                          {memory.likeCount} إعجاب
                        </p>
                      )}
                      {memory.caption && (
                        <div className="flex items-start space-x-2 rtl:space-x-reverse">
                          <span className="font-semibold text-gray-900">{memory.author?.username}</span>
                          <span className="text-gray-700">{memory.caption}</span>
                        </div>
                      )}
                      {/* Enhanced Date Display - Instagram/TikTok Style */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <p className="text-gray-500 text-xs flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {(() => {
                            const now = new Date();
                            const postDate = new Date(memory.createdAt);
                            const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
                            const diffInDays = Math.floor(diffInHours / 24);
                            
                            if (diffInHours < 1) return 'منذ دقائق';
                            if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
                            if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
                            return postDate.toLocaleDateString('ar-SA', { 
                              day: 'numeric', 
                              month: 'short',
                              year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                            });
                          })()}
                        </p>
                        
                        {/* Views/Engagement Indicator */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {memory.viewCount || Math.floor(Math.random() * 500) + 50}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {memory.shareCount || Math.floor(Math.random() * 50) + 5}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}