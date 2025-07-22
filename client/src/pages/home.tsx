import { useAuth } from "@/hooks/useAuth";
import SimpleNavigation from "@/components/simple-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  MoreHorizontal,
  Plus,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Stream } from "@/types";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  const [likedStreams, setLikedStreams] = useState<Set<number>>(new Set());
  
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

  const handleLike = (postId: number, isStream = false) => {
    if (isStream) {
      setLikedStreams(prev => {
        const newLiked = new Set(prev);
        if (newLiked.has(postId)) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });
    } else {
      setLikedPosts(prev => {
        const newLiked = new Set(prev);
        if (newLiked.has(postId)) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });
    }
    
    toast({
      title: "تم الإعجاب!",
      description: "تم إضافة إعجاب",
    });
  };

  const handleComment = (postId: number) => {
    toast({
      title: "التعليقات",
      description: "ميزة التعليقات ستكون متاحة قريباً",
    });
  };

  const handleShare = (postId: number) => {
    toast({
      title: "تم المشاركة",
      description: "تم نسخ الرابط للحافظة",
    });
  };

  const handleSendGift = (postId: number) => {
    toast({
      title: "إرسال هدية",
      description: "سيتم فتح متجر الهدايا قريباً",
    });
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
    
    toast({
      title: bookmarkedPosts.has(postId) ? "تم إلغاء الحفظ" : "تم الحفظ!",
      description: bookmarkedPosts.has(postId) ? "تم إزالة من المحفوظات" : "تم الحفظ في المحفوظات",
    });
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
      <div className="min-h-screen bg-white">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-600">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // Mix all content chronologically
  const allContent = [
    ...typedStreams.map(stream => ({ ...stream, type: 'stream', timestamp: new Date() })),
    ...typedMemories.map(memory => ({ ...memory, type: 'memory', timestamp: new Date() }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="min-h-screen bg-white">
      <SimpleNavigation />
      
      <main className="pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              مرحباً، {user?.firstName || user?.username || 'مستخدم'}! 🐰
            </h1>
            <p className="text-gray-600 mb-6">تابع أحدث البثوث والمنشورات من المجتمع</p>
            
            {/* Quick Actions */}
            <div className="flex gap-4 justify-center mb-8">
              <Link href="/create-memory">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3">
                  <Plus className="w-4 h-4 mr-2" />
                  إنشاء منشور
                </Button>
              </Link>
              <Link href="/start-stream">
                <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3">
                  <Video className="w-4 h-4 mr-2" />
                  بث مباشر
                </Button>
              </Link>
            </div>
          </div>

          {/* Content Timeline */}
          <div className="space-y-6">
            {allContent.length > 0 ? (
              allContent.map((item, index) => (
                <Card key={`${item.type}-${item.id}`} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white">
                  {item.type === 'stream' ? (
                    // Live Stream
                    <div className="relative">
                      {/* Stream Header */}
                      <div className="p-4 border-b bg-gradient-to-r from-red-50 to-pink-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="w-12 h-12 mr-3">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                {item.hostId?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900">{item.hostId}</h3>
                              <div className="flex items-center text-sm text-gray-600">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                                <span>بث مباشر الآن</span>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-red-600 text-white px-3 py-1">
                            <Eye className="w-3 h-3 mr-1" />
                            {item.viewerCount || 0} مشاهد
                          </Badge>
                        </div>
                      </div>

                      {/* Stream Content */}
                      <div 
                        className="relative h-80 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 cursor-pointer"
                        onClick={() => handleJoinStream(item.id)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                            <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                            <p className="text-gray-200">{item.description}</p>
                          </div>
                        </div>
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-red-600 text-white">
                            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                            مباشر
                          </Badge>
                        </div>
                      </div>

                      {/* Stream Actions */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(item.id, true)}
                              className={`flex items-center ${likedStreams.has(item.id) ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                            >
                              <Heart className={`w-5 h-5 mr-1 ${likedStreams.has(item.id) ? 'fill-current' : ''}`} />
                              <span>123</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleComment(item.id)}
                              className="flex items-center text-gray-500 hover:text-blue-500"
                            >
                              <MessageCircle className="w-5 h-5 mr-1" />
                              <span>45</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(item.id)}
                              className="flex items-center text-gray-500 hover:text-green-500"
                            >
                              <Share2 className="w-5 h-5 mr-1" />
                              <span>مشاركة</span>
                            </Button>
                          </div>
                          <Button
                            onClick={() => handleJoinStream(item.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6"
                          >
                            انضم للبث
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Memory/Post
                    <div className="relative">
                      {/* Post Header */}
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="w-12 h-12 mr-3">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                {item.authorId?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900">{item.authorId}</h3>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>منذ ساعة</span>
                                <Badge className={`mr-2 ${getMemoryTypeColor(item.memoryType)} text-white`}>
                                  {getMemoryTypeIcon(item.memoryType)}
                                  <span className="mr-1 text-xs">{item.memoryType}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </div>
                        
                        {/* Post Caption */}
                        {item.caption && (
                          <div className="mt-3">
                            <p className="text-gray-800 text-right leading-relaxed">{item.caption}</p>
                          </div>
                        )}
                      </div>

                      {/* Media Content */}
                      <div className="relative">
                        {item.mediaUrl ? (
                          item.mediaUrl.includes('.mp4') || item.mediaUrl.includes('.webm') ? (
                            <video
                              src={item.mediaUrl}
                              className="w-full h-80 object-cover"
                              controls
                              poster="/placeholder-video.jpg"
                            />
                          ) : (
                            <img
                              src={item.mediaUrl}
                              alt="Memory"
                              className="w-full h-80 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.jpg';
                              }}
                            />
                          )
                        ) : (
                          <div className="w-full h-80 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <Sparkles className="w-12 h-12 mx-auto mb-2" />
                              <p>منشور نصي</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 rtl:space-x-reverse">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(item.id)}
                              className={`flex items-center ${likedPosts.has(item.id) ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                            >
                              <Heart className={`w-5 h-5 mr-1 ${likedPosts.has(item.id) ? 'fill-current' : ''}`} />
                              <span>89</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleComment(item.id)}
                              className="flex items-center text-gray-500 hover:text-blue-500"
                            >
                              <MessageCircle className="w-5 h-5 mr-1" />
                              <span>23</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(item.id)}
                              className="flex items-center text-gray-500 hover:text-green-500"
                            >
                              <Share2 className="w-5 h-5 mr-1" />
                              <span>7</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendGift(item.id)}
                              className="flex items-center text-gray-500 hover:text-purple-500"
                            >
                              <Gift className="w-5 h-5 mr-1" />
                              <span>هدية</span>
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmark(item.id)}
                            className={`${bookmarkedPosts.has(item.id) ? 'text-yellow-500' : 'text-gray-500'} hover:text-yellow-500`}
                          >
                            <Bookmark className={`w-5 h-5 ${bookmarkedPosts.has(item.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              // Empty State
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  مرحباً بك في LaaBoBo Live! 🐰
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  لا يوجد محتوى حالياً. ابدأ بإنشاء منشور أو بث مباشر لمشاركة إبداعك مع المجتمع!
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/create-memory">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3">
                      <Plus className="w-4 h-4 mr-2" />
                      إنشاء منشور
                    </Button>
                  </Link>
                  <Link href="/start-stream">
                    <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3">
                      <Video className="w-4 h-4 mr-2" />
                      ابدأ بث مباشر
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}