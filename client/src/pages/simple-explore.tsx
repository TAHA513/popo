import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  User,
  Search
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function SimpleExplore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // المنشورات العامة
  const { data: memories = [] } = useQuery<any[]>({
    queryKey: ['/api/memories/public'], 
    refetchInterval: 10000,
  });

  // المستخدمون المقترحون
  const { data: suggestedUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users/suggested'],
    refetchInterval: 30000,
  });

  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-40">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Search className="w-6 h-6 mr-2 text-laa-pink" />
            <h1 className="text-xl font-bold text-gray-800">استكشاف</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* المستخدمون المقترحون */}
        {suggestedUsers.length > 0 && (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-3 text-gray-800">👥 أشخاص قد تعرفهم</h2>
            <div className="flex overflow-x-auto space-x-3 rtl:space-x-reverse pb-2">
              {suggestedUsers.map((suggestedUser: any) => (
                <Card key={suggestedUser.id} className="min-w-[120px] border border-gray-200">
                  <CardContent className="p-3 text-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-800 truncate mb-2">
                      {suggestedUser.firstName || suggestedUser.username}
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-laa-pink hover:bg-laa-pink/90 text-xs px-3 py-1"
                      onClick={() => setLocation(`/user/${suggestedUser.id}`)}
                    >
                      عرض
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* المنشورات والفيديوهات والصور */}
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3 text-gray-800">📱 المنشورات والصور</h2>
          {memories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                لا توجد منشورات
              </h3>
              <p className="text-gray-500 mb-4">
                لم يتم العثور على محتوى للعرض
              </p>
              <Button 
                onClick={() => setLocation('/create-memory')}
                className="bg-laa-pink hover:bg-laa-pink/90"
              >
                أنشئ منشور
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {memories.map((memory: any) => (
                <Card key={`memory-${memory.id}`} className="border border-gray-200">
                  <CardContent className="p-0">
                    {/* صورة أو فيديو المنشور */}
                    <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                      {memory.imageUrl ? (
                        memory.imageUrl.includes('.mp4') || memory.imageUrl.includes('.webm') ? (
                          <video 
                            src={memory.imageUrl}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                          />
                        ) : (
                          <img 
                            src={memory.imageUrl}
                            alt="منشور"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <User className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* محتوى المنشور */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {memory.content || 'منشور'}
                        </div>
                        <button
                          onClick={() => handleLike(memory.id.toString())}
                          className="flex-shrink-0"
                        >
                          <Heart 
                            className={`w-4 h-4 ${
                              likedItems.has(memory.id.toString())
                                ? 'text-red-500 fill-current'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <Link href={`/user/${memory.authorId}`} className="hover:text-laa-pink">
                          {memory.authorId}
                        </Link>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <MessageCircle className="w-3 h-3" />
                          <Share2 className="w-3 h-3" />
                          <Gift className="w-3 h-3 text-yellow-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}