import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Eye, 
  User,
  Radio
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Stream } from "@/types";
import { Link, useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function SimpleHome() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // البثوث المباشرة
  const { data: streams = [] } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 10000,
  });

  // المنشورات العامة
  const { data: memories = [] } = useQuery({
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
          <div className="flex items-center justify-center">
            <div className="text-2xl mr-2">🐰</div>
            <h1 className="text-2xl font-bold text-laa-pink">LaaBoBo</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* البثوث المباشرة */}
        {streams.length > 0 && (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-3 text-gray-800">🔴 البث المباشر</h2>
            <div className="space-y-3">
              {streams.map((stream: Stream) => (
                <Card key={stream.id} className="border border-gray-200">
                  <CardContent className="p-3">
                    <div 
                      className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer"
                      onClick={() => setLocation(`/stream/${stream.id}`)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Radio className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {stream.title || `البث رقم ${stream.id}`}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Eye className="w-4 h-4 ml-1" />
                          {stream.viewerCount || 0} مشاهد
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                        مباشر
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* المنشورات */}
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3 text-gray-800">📱 المنشورات</h2>
          {memories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد منشورات متاحة
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((memory: any) => (
                <Card key={memory.id} className="border border-gray-200">
                  <CardContent className="p-0">
                    {/* صورة أو فيديو المنشور */}
                    {memory.imageUrl && (
                      <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                        {memory.imageUrl.includes('.mp4') || memory.imageUrl.includes('.webm') ? (
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
                        )}
                      </div>
                    )}
                    
                    {/* محتوى المنشور */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-800">
                            {memory.authorId}
                          </div>
                        </div>
                      </div>
                      
                      {memory.content && (
                        <p className="text-gray-700 mb-3 text-sm">{memory.content}</p>
                      )}
                      
                      {/* أزرار التفاعل */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          <button
                            onClick={() => handleLike(memory.id.toString())}
                            className="flex items-center space-x-1 rtl:space-x-reverse"
                          >
                            <Heart 
                              className={`w-5 h-5 ${
                                likedItems.has(memory.id.toString())
                                  ? 'text-red-500 fill-current'
                                  : 'text-gray-500'
                              }`}
                            />
                            <span className="text-sm text-gray-600">إعجاب</span>
                          </button>
                          
                          <button className="flex items-center space-x-1 rtl:space-x-reverse">
                            <MessageCircle className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">تعليق</span>
                          </button>
                          
                          <button className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Share2 className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">مشاركة</span>
                          </button>
                        </div>
                        
                        <button className="flex items-center space-x-1 rtl:space-x-reverse">
                          <Gift className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm text-yellow-600">هدية</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* رسالة إذا لم توجد محتويات */}
        {streams.length === 0 && memories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐰</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              مرحباً بك في LaaBoBo
            </h3>
            <p className="text-gray-500 mb-4">
              لا يوجد محتوى متاح حالياً
            </p>
            <Button 
              onClick={() => setLocation('/start-stream')}
              className="bg-laa-pink hover:bg-laa-pink/90"
            >
              ابدأ البث الآن
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}