import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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

  // Fetch live streams
  const { data: streams = [], isLoading: streamsLoading } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch public memories/posts
  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories/public'],
    refetchInterval: 30000,
  });

  const typedStreams = (streams as Stream[]);
  const typedMemories = (memories as any[]);

  const handleJoinStream = (streamId: number) => {
    window.location.href = `/stream/${streamId}`;
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
                                />
                              ) : (
                                <User className="w-6 h-6 text-white m-3" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                              {memory.author?.username || `مستخدم #${memory.authorId?.slice(0, 6)}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(memory.createdAt).toLocaleDateString('ar')} • 
                              <span className="mr-1">منشور</span>
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
                              console.log('Follow user:', memory.authorId);
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
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <button className="flex items-center space-x-1 rtl:space-x-reverse p-2 -m-2 group">
                          <Heart className="w-6 h-6 text-gray-700 group-hover:text-red-500 group-active:scale-125 transition-all duration-200" />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-red-500">
                            {memory.likeCount || 0}
                          </span>
                        </button>
                        
                        <button className="flex items-center space-x-1 rtl:space-x-reverse p-2 -m-2 group">
                          <MessageCircle className="w-6 h-6 text-gray-700 group-hover:text-blue-500 transition-colors duration-200" />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-500">تعليق</span>
                        </button>
                        
                        <button className="p-2 -m-2 group">
                          <Share2 className="w-6 h-6 text-gray-700 group-hover:text-green-500 transition-colors duration-200" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <Link href={`/profile/${memory.authorId}`}>
                          <button className="p-2 -m-2 group">
                            <Gift className="w-6 h-6 text-gray-700 group-hover:text-purple-500 transition-colors duration-200" />
                          </button>
                        </Link>
                        <button className="p-2 -m-2 group">
                          <Bookmark className="w-6 h-6 text-gray-700 group-hover:text-yellow-500 transition-colors duration-200" />
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
                      <p className="text-gray-500 text-xs uppercase">
                        {new Date(memory.createdAt).toLocaleDateString('ar')}
                      </p>
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