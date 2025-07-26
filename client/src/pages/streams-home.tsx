import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Play, Users, Eye, Radio, Clock, Heart } from "lucide-react";
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
                  className="overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-white border-2 border-transparent hover:border-purple-200"
                  onClick={() => setLocation(`/stream/${stream.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Enhanced Stream Preview */}
                    <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 h-56 flex items-center justify-center overflow-hidden">
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-600/20 animate-pulse"></div>
                      
                      {/* Floating animation particles */}
                      <div className="absolute top-4 left-4 w-3 h-3 bg-white/40 rounded-full animate-bounce"></div>
                      <div className="absolute top-8 right-8 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute bottom-6 left-8 w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>

                      {/* Streamer Profile in center */}
                      <div className="relative z-10 text-center text-white">
                        <div className="w-20 h-20 bg-white/95 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl border-4 border-white/50">
                          {stream.hostProfileImage ? (
                            <img 
                              src={stream.hostProfileImage} 
                              alt={stream.hostName}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-purple-600">
                              {stream.hostName?.[0]?.toUpperCase() || stream.hostId?.[0]?.toUpperCase() || 'S'}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-lg mb-1">{stream.hostName || 'مضيف البث'}</h4>
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Radio className="w-4 h-4 animate-pulse" />
                          <span>بث مباشر الآن</span>
                        </div>
                      </div>

                      {/* Live indicator */}
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                        مباشر
                      </div>

                      {/* Viewer count */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {stream.viewerCount || 0}
                      </div>

                      {/* Category */}
                      <div className="absolute bottom-3 left-3 bg-purple-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs">
                        {stream.category || 'بث سريع'}
                      </div>

                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Stream Info */}
                    <div className="p-5">
                      <div className="mb-4">
                        <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-2">
                          {stream.title || 'بث مباشر'}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {stream.description || 'انضم للبث المباشر الآن'}
                        </p>
                      </div>

                      {/* Stream metadata */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>منذ {Math.floor((Date.now() - new Date(stream.startedAt).getTime()) / 60000)} دقيقة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{stream.totalGifts || 0}</span>
                        </div>
                      </div>

                      {/* Join button */}
                      <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
                        <Play className="w-5 h-5 mr-2" />
                        انضم للبث المباشر
                      </button>
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