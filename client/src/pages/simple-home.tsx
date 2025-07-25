import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FlipCard from "@/components/flip-card";

export default function SimpleHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // المنشورات العامة (الفيديوهات والصور)
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🐰</div>
          <h1 className="text-3xl font-bold mb-4">مرحباً بك في LaaBoBo</h1>
          <p className="text-gray-300 mb-8">منصة لمشاركة الذكريات والمحتوى المميز</p>
          <Button 
            onClick={() => setLocation('/login')}
            className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-3 text-lg font-bold"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

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
            
            {/* Create Memory Button - Right Side */}
            <Button 
              onClick={() => {
                setLocation('/create-memory');
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">إنشاء ذكرى</span>
            </Button>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
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
            <div className="space-y-4">
              {memories.map((memory) => {
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
                
                const content = {
                  ...memory,
                  mediaUrls: mediaUrls,
                  author: memory.author || {
                    id: memory.authorId,
                    firstName: memory.author?.firstName || 'مستخدم',
                    username: memory.author?.username || 'LaaBoBo',
                    profileImageUrl: memory.author?.profileImageUrl
                  }
                };

                return (
                  <FlipCard
                    key={`memory-${memory.id}`}
                    content={content}
                    type={cardType}
                    onAction={(action) => {
                      if (action === 'like') handleLike(memory.id);
                      if (action === 'profile') setLocation(`/user/${memory.authorId}`);
                    }}
                    onLike={() => handleLike(memory.id)}
                    isLiked={likedItems.has(memory.id)}
                  />
                );
              })}
              
              {/* رسالة نهاية المحتوى */}
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-gray-500 text-sm">تم عرض جميع المنشورات المتاحة</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}