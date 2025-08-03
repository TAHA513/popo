import { useAuth } from "@/hooks/useAuth";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

import BottomNavigation from "@/components/bottom-navigation";
import FlipCard from "@/components/flip-card";
import PromotionalBanner from "@/components/promotional-banner";

export default function SimpleHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // المنشورات العامة فقط (بدون البثوث) - محسّن للسرعة
  const { data: memories = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ['/api/memories/public'], 
    refetchInterval: 15000, // تقليل تحديث البيانات من 10 إلى 15 ثانية
    staleTime: 30000, // البيانات تبقى صالحة لـ 30 ثانية
    gcTime: 300000, // تنظيف الكاش بعد 5 دقائق
    retry: 1, // محاولة واحدة فقط
    refetchOnWindowFocus: false, // منع إعادة التحميل عند التركيز
    refetchOnReconnect: false, // منع إعادة التحميل عند الاتصال
  });

  // البثوث المباشرة النشطة
  const { data: liveStreams = [] } = useQuery<any[]>({
    queryKey: ['/api/streams'], 
    refetchInterval: 10000, // تحديث كل 10 ثوان للبثوث المباشرة
    staleTime: 5000,
    gcTime: 60000,
    retry: 1,
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
            <div className="flex items-center gap-2">
              {/* Create Memory Button */}
              <button 
                onClick={() => setLocation('/create-memory')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20 backdrop-blur-sm"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-white font-medium text-sm hidden sm:block">إنشاء ذكرى</span>
                <span className="text-white font-medium text-xs block sm:hidden">ذكرى</span>
              </button>
            </div>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      {/* Live Streams Section */}
      {liveStreams.length > 0 && (
        <div className="max-w-sm mx-auto px-2 pt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-bold text-gray-800">بثوث مباشرة</h2>
            </div>
            <div className="space-y-3">
              {liveStreams.map((stream) => (
                <div 
                  key={stream.id}
                  onClick={() => setLocation(`/watch-stream/${stream.id}`)}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100 cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{stream.title}</h3>
                    <p className="text-xs text-gray-500">بواسطة {stream.host?.firstName || stream.host?.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600">نشط الآن</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    انضم →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Promotional Banner */}
      <div className="max-w-sm mx-auto px-2 pt-4">
        <PromotionalBanner />
      </div>

      <div className="max-w-sm mx-auto">
        {/* الصفحة الرئيسية - المنشورات مع البطاقات التفاعلية */}
        <div className="p-2">
          {isLoading && memories.length === 0 && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-laa-pink border-t-transparent rounded-full"></div>
            </div>
          )}

          {memories.length > 0 && (
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