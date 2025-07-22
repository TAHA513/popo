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
  Send,
  Plus,
  Camera
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
        return <Zap className="w-3 h-3" />;
      case 'trending':
        return <Sparkles className="w-3 h-3" />;
      case 'star':
        return <Crown className="w-3 h-3" />;
      case 'legend':
        return <Timer className="w-3 h-3" />;
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
      <div className="min-h-screen bg-black">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-lg">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // Mix streams and memories in chronological order
  const allContent = [
    ...typedStreams.map(stream => ({ ...stream, type: 'stream' })),
    ...typedMemories.map(memory => ({ ...memory, type: 'memory' }))
  ].sort(() => Math.random() - 0.5); // Random mix for demo

  return (
    <div className="min-h-screen bg-black text-white">
      <SimpleNavigation />
      
      {/* Main Content Feed */}
      <main className="pt-16 pb-20">
        {/* Create Story/Post Button */}
        <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/create-memory">
              <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mr-2">
                <Plus className="w-4 h-4 mr-2" />
                إنشاء منشور
              </Button>
            </Link>
            <Link href="/start-stream">
              <Button className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                <Video className="w-4 h-4 mr-2" />
                بث مباشر
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Feed */}
        <div className="max-w-md mx-auto space-y-0">
          {allContent.length > 0 ? (
            allContent.map((item, index) => (
              <div key={`${item.type}-${item.id}`} className="relative">
                {item.type === 'stream' ? (
                  // Live Stream Card
                  <div className="relative h-screen w-full bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
                    {/* Live Stream Content */}
                    <div 
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => handleJoinStream(item.id)}
                    >
                      <div className="relative h-full w-full flex items-center justify-center">
                        <Play className="w-20 h-20 text-white opacity-80" />
                        
                        {/* Live Badge */}
                        <div className="absolute top-6 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                          <span className="text-sm font-semibold">مباشر</span>
                        </div>

                        {/* Viewer Count */}
                        <div className="absolute top-6 right-4 bg-black/50 text-white px-3 py-1 rounded-full flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span className="text-sm">{item.viewerCount || 0}</span>
                        </div>

                        {/* Stream Info Overlay */}
                        <div className="absolute bottom-20 left-4 right-20">
                          <div className="flex items-center mb-3">
                            <Avatar className="w-10 h-10 mr-3">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                {item.hostId?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-white">{item.hostId}</p>
                              <p className="text-gray-300 text-sm">بث مباشر</p>
                            </div>
                          </div>
                          <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                          <p className="text-gray-200 text-sm">{item.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Right Side */}
                    <div className="absolute bottom-32 right-4 space-y-6">
                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(item.id, true)}
                          className={`p-3 rounded-full ${likedStreams.has(item.id) ? 'bg-red-500' : 'bg-black/40'} hover:bg-red-500/80`}
                        >
                          <Heart className={`w-6 h-6 ${likedStreams.has(item.id) ? 'fill-current text-white' : 'text-white'}`} />
                        </Button>
                        <span className="text-white text-xs mt-1">123</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleComment(item.id)}
                          className="p-3 rounded-full bg-black/40 hover:bg-blue-500/80"
                        >
                          <MessageCircle className="w-6 h-6 text-white" />
                        </Button>
                        <span className="text-white text-xs mt-1">45</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(item.id)}
                          className="p-3 rounded-full bg-black/40 hover:bg-green-500/80"
                        >
                          <Share2 className="w-6 h-6 text-white" />
                        </Button>
                        <span className="text-white text-xs mt-1">12</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendGift(item.id)}
                          className="p-3 rounded-full bg-black/40 hover:bg-purple-500/80"
                        >
                          <Gift className="w-6 h-6 text-white" />
                        </Button>
                        <span className="text-white text-xs mt-1">هدية</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Memory/Post Card
                  <div className="relative h-screen w-full bg-black">
                    {/* Media Content */}
                    <div className="absolute inset-0">
                      {item.mediaUrl ? (
                        item.mediaUrl.includes('.mp4') || item.mediaUrl.includes('.webm') ? (
                          <video
                            src={item.mediaUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img
                            src={item.mediaUrl}
                            alt="Memory"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center">
                          <Sparkles className="w-20 h-20 text-white opacity-60" />
                        </div>
                      )}
                    </div>

                    {/* Memory Type Badge */}
                    <div className="absolute top-6 left-4">
                      <Badge className={`${getMemoryTypeColor(item.memoryType)} text-white`}>
                        <div className="flex items-center">
                          {getMemoryTypeIcon(item.memoryType)}
                          <span className="mr-1 text-xs">{item.memoryType}</span>
                        </div>
                      </Badge>
                    </div>

                    {/* More Options */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-6 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>

                    {/* Content Info Overlay */}
                    <div className="absolute bottom-20 left-4 right-20">
                      <div className="flex items-center mb-3">
                        <Avatar className="w-10 h-10 mr-3">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {item.authorId?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">{item.authorId}</p>
                          <p className="text-gray-300 text-sm">منذ ساعة</p>
                        </div>
                      </div>
                      <p className="text-white mb-4">{item.caption || "منشور جديد"}</p>
                    </div>

                    {/* Action Buttons - Right Side */}
                    <div className="absolute bottom-32 right-4 space-y-6">
                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(item.id)}
                          className={`p-3 rounded-full ${likedPosts.has(item.id) ? 'bg-red-500' : 'bg-black/40'} hover:bg-red-500/80`}
                        >
                          <Heart className={`w-6 h-6 ${likedPosts.has(item.id) ? 'fill-current text-white' : 'text-white'}`} />
                        </Button>
                        <span className="text-white text-xs mt-1">89</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleComment(item.id)}
                          className="p-3 rounded-full bg-black/40 hover:bg-blue-500/80"
                        >
                          <MessageCircle className="w-6 h-6 text-white" />
                        </Button>
                        <span className="text-white text-xs mt-1">23</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(item.id)}
                          className="p-3 rounded-full bg-black/40 hover:bg-green-500/80"
                        >
                          <Share2 className="w-6 h-6 text-white" />
                        </Button>
                        <span className="text-white text-xs mt-1">7</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendGift(item.id)}
                          className="p-3 rounded-full bg-black/40 hover:bg-purple-500/80"
                        >
                          <Gift className="w-6 h-6 text-white" />
                        </Button>
                        <span className="text-white text-xs mt-1">هدية</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmark(item.id)}
                          className={`p-3 rounded-full ${bookmarkedPosts.has(item.id) ? 'bg-yellow-500' : 'bg-black/40'} hover:bg-yellow-500/80`}
                        >
                          <Bookmark className={`w-6 h-6 ${bookmarkedPosts.has(item.id) ? 'fill-current text-white' : 'text-white'}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center h-screen text-center px-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">مرحباً بك في LaaBoBo! 🐰</h3>
              <p className="text-gray-400 mb-8 max-w-sm">
                لا يوجد محتوى حالياً. كن أول من ينشر أو يبدأ بث مباشر!
              </p>
              <div className="space-y-4 w-full max-w-xs">
                <Link href="/create-memory">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    إنشاء منشور
                  </Button>
                </Link>
                <Link href="/start-stream">
                  <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                    <Video className="w-4 h-4 mr-2" />
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