import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User,
  Heart,
  MessageCircle,
  Share2,
  Gift
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import MemoryCard from "@/components/memory-card";

export default function SimpleExplore() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // المنشورات العامة فقط (بدون البثوث)
  const { data: memories = [] } = useQuery<any[]>({
    queryKey: ['/api/memories/public'], 
    refetchInterval: 10000,
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
          <h1 className="text-xl font-bold text-gray-800">استكشاف</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* المنشورات مع البطاقات التفاعلية */}
        <div className="p-4">
          {memories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📱</div>
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
              {memories.map((memory: any) => {
                // تحويل البيانات لتناسب MemoryCard
                const formattedMemory = {
                  id: memory.id.toString(),
                  type: memory.type || 'post',
                  title: memory.title,
                  caption: memory.content,
                  mediaUrls: memory.imageUrl ? [memory.imageUrl] : [],
                  thumbnailUrl: memory.imageUrl,
                  currentEnergy: 100,
                  initialEnergy: 100,
                  memoryType: 'precious' as const,
                  viewCount: 0,
                  likeCount: 0,
                  shareCount: 0,
                  giftCount: 0,
                  visibilityLevel: 'public' as const,
                  allowComments: true,
                  allowSharing: true,
                  allowGifts: true,
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  createdAt: memory.createdAt || new Date().toISOString(),
                  author: {
                    id: memory.authorId,
                    username: memory.authorId,
                    firstName: memory.authorId
                  }
                };
                
                return (
                  <MemoryCard 
                    key={`memory-${memory.id}`} 
                    memory={formattedMemory}
                    onLike={() => handleLike(memory.id.toString())}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}