import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MemoryCard from "@/components/memory-card";

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
              {memories.map((memory) => (
                <div key={memory.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* صورة أو فيديو المنشور */}
                  {memory.mediaUrls && memory.mediaUrls.length > 0 && (
                    <div className="relative aspect-square">
                      {memory.type === 'video' ? (
                        <video 
                          src={memory.mediaUrls[0]} 
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <img 
                          src={memory.mediaUrls[0]} 
                          alt={memory.title || 'منشور'}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* نوع المحتوى */}
                      <div className="absolute top-3 left-3">
                        {memory.type === 'video' ? (
                          <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                            <span>🎥</span>
                            <span>فيديو</span>
                          </div>
                        ) : (
                          <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                            <span>📷</span>
                            <span>صورة</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* معلومات المنشور */}
                  <div className="p-4">
                    {/* معلومات المؤلف */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {memory.author?.username?.charAt(0) || 'م'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{memory.author?.username || 'مستخدم'}</p>
                        <p className="text-sm text-gray-500">
                          {memory.createdAt ? new Date(memory.createdAt).toLocaleDateString('ar') : 'اليوم'}
                        </p>
                      </div>
                    </div>
                    
                    {/* عنوان ووصف */}
                    {memory.title && (
                      <h3 className="font-semibold text-gray-900 mb-2">{memory.title}</h3>
                    )}
                    {memory.description && (
                      <p className="text-gray-600 text-sm mb-3">{memory.description}</p>
                    )}
                    
                    {/* أزرار التفاعل */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(memory.id)}
                          className={`flex items-center space-x-1 text-sm transition-colors ${
                            likedItems.has(memory.id) 
                              ? 'text-red-500' 
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <span>{likedItems.has(memory.id) ? '❤️' : '🤍'}</span>
                          <span>إعجاب</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                          <span>💬</span>
                          <span>تعليق</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-500 transition-colors">
                          <span>📤</span>
                          <span>مشاركة</span>
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => setLocation(`/user/${memory.authorId}`)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        عرض الملف الشخصي
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
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