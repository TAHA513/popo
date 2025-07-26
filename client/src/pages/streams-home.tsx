import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Play, Users, Eye, Radio } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";

export default function StreamsHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // جلب البثوث المباشرة
  const { data: streams = [] } = useQuery<any[]>({
    queryKey: ['/api/streams'], 
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
            </div>
            <div className="flex-1"></div>
            {/* Live Stream Button */}
            <Button
              onClick={() => setLocation('/start-stream')}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1 rtl:space-x-reverse"
            >
              <Radio className="w-4 h-4" />
              <span>ابدأ البث</span>
            </Button>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>



      <div className="max-w-sm mx-auto">
        {/* الصفحة الرئيسية - البثوث المباشرة */}
        <div className="p-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🏠 الرئيسية</h2>
            <p className="text-gray-600 text-sm">شاهد البثوث المباشرة من الأصدقاء</p>
          </div>
          
          {streams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                لا توجد بثوث مباشرة
              </h3>
              <p className="text-gray-500">
                لا يوجد أحد يبث الآن، انتظر حتى يبدأ أحد الأصدقاء بثاً مباشراً
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {streams.map((stream: any) => (
                <Card 
                  key={stream.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/stream/${stream.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Stream Thumbnail/Preview */}
                    <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 h-48 flex items-center justify-center">
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                        مباشر
                      </div>
                      <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {stream.viewerCount || 0}
                      </div>
                      <Play className="w-16 h-16 text-white/80" />
                    </div>
                    
                    {/* Stream Info */}
                    <div className="p-4">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">
                            {stream.title || 'بث مباشر'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {stream.description || 'لا يوجد وصف'}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>المضيف: {stream.hostUsername || 'مجهول'}</span>
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {stream.viewerCount || 0} مشاهد
                            </span>
                          </div>
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