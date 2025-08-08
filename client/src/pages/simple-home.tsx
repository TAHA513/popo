import { useAuth } from "@/hooks/useAuth";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, Mail, Search } from "lucide-react";

import BottomNavigation from "@/components/bottom-navigation";
import FlipCard from "@/components/flip-card";
import PromotionalBanner from "@/components/promotional-banner";
import { useTranslation } from "@/lib/i18n";

export default function SimpleHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const { t } = useTranslation();
  
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

  // Get unread notifications count
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 15000,
  });

  // Get conversations to check for unread messages
  const { data: conversations } = useQuery<any[]>({
    queryKey: ['/api/messages/conversations'],
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Calculate unread messages count based on conversations with unread messages
  const unreadMessagesCount = conversations ? conversations.reduce((count: number, conv: any) => {
    return count + (conv.unreadCount || 0);
  }, 0) : 0;



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
              {/* Search Button */}
              <button 
                onClick={() => setLocation('/search')}
                className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                title={t('common.search')}
              >
                <Search className="w-6 h-6" />
              </button>

              {/* Notifications Button */}
              <button 
                onClick={() => setLocation('/notifications')}
                className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
              >
                <Bell className="w-6 h-6" />
                {(unreadCount?.count || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {(unreadCount?.count || 0) > 9 ? '9+' : unreadCount?.count}
                  </span>
                )}
              </button>

              {/* Messages Button */}
              <button 
                onClick={() => setLocation('/messages')}
                className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
              >
                <Mail className="w-6 h-6" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </button>

              {/* Create Memory Button */}
              <button 
                onClick={() => setLocation('/create-memory')}
                className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                title={t('memory.createMemory')}
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-white font-medium text-xs">
                  {t('memory.createMemory').split(' ')[1] || t('common.create')}
                </span>
              </button>
            </div>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

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