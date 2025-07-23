import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import FlipCard from "@/components/flip-card";

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

      <div className="max-w-sm mx-auto">
        {/* المنشورات مع البطاقات التفاعلية */}
        <div className="p-2">
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
            <div className="grid grid-cols-1 gap-4">
              {memories.map((memory: any) => {
                // تحديد نوع المحتوى بناءً على البيانات الحقيقية
                const hasVideo = memory.type === 'video' || 
                  (memory.mediaUrls && memory.mediaUrls.some((url: string) => 
                    url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')
                  )) ||
                  (memory.imageUrl && (
                    memory.imageUrl.includes('.mp4') || 
                    memory.imageUrl.includes('.webm') || 
                    memory.imageUrl.includes('.mov')
                  ));
                
                const cardType = hasVideo ? 'video' : 'image';
                
                // إعداد URLs الوسائط بشكل صحيح
                let mediaUrls = [];
                if (memory.mediaUrls && Array.isArray(memory.mediaUrls)) {
                  mediaUrls = memory.mediaUrls;
                } else if (memory.imageUrl) {
                  mediaUrls = [memory.imageUrl];
                } else if (memory.thumbnailUrl) {
                  mediaUrls = [memory.thumbnailUrl];
                }
                
                return (
                  <FlipCard
                    key={`memory-${memory.id}`}
                    content={{
                      ...memory,
                      mediaUrls: mediaUrls,
                      author: memory.author || {
                        id: memory.authorId,
                        firstName: memory.author?.firstName || 'مستخدم',
                        username: memory.author?.username || 'LaaBoBo',
                        profileImageUrl: memory.author?.profileImageUrl
                      }
                    }}
                    type={cardType}
                    isLiked={likedItems.has(memory.id.toString())}
                    onLike={(id) => handleLike(memory.id.toString())}
                    onAction={(action) => {
                      // يمكن إضافة إجراءات هنا إذا لزم الأمر
                    }}
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