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
                    <div className="flex items-center justify-between">
                      <Link href={`/profile/${memory.authorId}`}>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer hover:opacity-80">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full overflow-hidden">
                            {memory.author?.profileImageUrl ? (
                              <img 
                                src={memory.author.profileImageUrl} 
                                alt={memory.author.username} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold hover:underline">{memory.author?.username || `مستخدم #${memory.authorId?.slice(0, 6)}`}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(memory.createdAt).toLocaleDateString('ar')}
                            </p>
                          </div>
                        </div>
                      </Link>
                      {memory.authorId !== user?.id && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:bg-purple-50 hover:border-purple-200"
                          onClick={(e) => {
                            e.preventDefault();
                            // TODO: Add follow functionality
                            console.log('Follow user:', memory.authorId);
                          }}
                        >
                          <User className="w-4 h-4 mr-1" />
                          متابعة
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {memory.caption && (
                      <p className="text-gray-700 mb-3">{memory.caption}</p>
                    )}
                    
                    {/* Media Preview */}
                    {memory.mediaUrls?.length > 0 && (
                      <div className="relative bg-gray-100 rounded-lg h-48 mb-3 overflow-hidden">
                        {memory.type === 'image' && memory.thumbnailUrl ? (
                          <img 
                            src={memory.thumbnailUrl} 
                            alt={memory.caption || 'منشور'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Interaction Buttons - Enhanced TikTok Style */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-6 rtl:space-x-reverse">
                        <button className="flex flex-col items-center space-y-1 group hover:scale-105 transition-transform">
                          <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                            <Heart className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors" />
                          </div>
                          <span className="text-xs text-gray-500 group-hover:text-red-500">{memory.likeCount || 0}</span>
                        </button>
                        
                        <button className="flex flex-col items-center space-y-1 group hover:scale-105 transition-transform">
                          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                            <MessageCircle className="w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <span className="text-xs text-gray-500 group-hover:text-blue-500">تعليق</span>
                        </button>
                        
                        <Link href={`/profile/${memory.authorId}`}>
                          <button className="flex flex-col items-center space-y-1 group hover:scale-105 transition-transform">
                            <div className="p-2 rounded-full group-hover:bg-purple-50 transition-colors">
                              <Gift className="w-6 h-6 text-gray-600 group-hover:text-purple-500 transition-colors" />
                            </div>
                            <span className="text-xs text-gray-500 group-hover:text-purple-500">هدية</span>
                          </button>
                        </Link>
                      </div>
                      
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <button className="p-2 rounded-full hover:bg-yellow-50 hover:scale-105 transition-all">
                          <Bookmark className="w-5 h-5 text-gray-600 hover:text-yellow-500 transition-colors" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-green-50 hover:scale-105 transition-all">
                          <Share2 className="w-5 h-5 text-gray-600 hover:text-green-500 transition-colors" />
                        </button>
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