import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Users } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import FlipCard from "@/components/flip-card";

export default function SimpleHome() {
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
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left Side */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
            </div>
            
            {/* Action Buttons - Right Side */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Button 
                onClick={() => setLocation('/characters')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-3 py-2 rounded-full flex items-center space-x-1 rtl:space-x-reverse shadow-lg"
              >
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold">شخصيات</span>
              </Button>
              
              <Button 
                onClick={() => setLocation('/create-memory')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-full flex items-center space-x-1 rtl:space-x-reverse shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-bold">ذكرى</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-sm mx-auto">
        {/* الصفحة الرئيسية - المنشورات مع البطاقات التفاعلية */}
        <div className="p-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🏠 الرئيسية</h2>
            <p className="text-gray-600 text-sm">اكتشف المنشورات والذكريات</p>
          </div>
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