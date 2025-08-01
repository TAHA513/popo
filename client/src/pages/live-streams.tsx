import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Play, Users, Eye, MessageCircle, Clock, Heart, Video, Radio, Sparkles } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";

export default function LiveStreams() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const previewRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // جلب البثوث المباشرة
  const { data: streams = [] } = useQuery<any[]>({
    queryKey: ['/api/streams'], 
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">البثوث المباشرة</h1>
            <Button 
              onClick={() => setLocation('/start-stream')}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0"
            >
              <Radio className="w-5 h-5 ml-2" />
              ابدأ البث
            </Button>
          </div>
        </div>
      </div>

      {/* Live Streaming Promotional Banner */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="mb-6 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 text-white border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardContent className="relative p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-2/3 text-center md:text-right mb-6 md:mb-0">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  🔴 ابدأ البث المباشر الآن
                </h2>
                <p className="text-xl mb-6 text-white/90 leading-relaxed">
                  شارك محتواك مع العالم • تفاعل مع المتابعين • اكسب المال من البث
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                  <div className="flex items-center bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                    <Eye className="w-5 h-5 mr-2" />
                    <span className="font-medium">مشاهدة فورية</span>
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                    <Heart className="w-5 h-5 mr-2" />
                    <span className="font-medium">تفاعل مباشر</span>
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                    <Sparkles className="w-5 h-5 mr-2" />
                    <span className="font-medium">جودة HD</span>
                  </div>
                </div>
                <Button 
                  size="lg"
                  className="bg-white text-red-600 hover:bg-gray-100 font-bold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => setLocation('/start-stream')}
                >
                  <Radio className="w-6 h-6 mr-2" />
                  ابدأ البث الآن مجاناً
                </Button>
              </div>
              <div className="md:w-1/3 text-center">
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Radio className="w-16 h-16 md:w-20 md:h-20 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Streams Grid */}
      <div className="max-w-4xl mx-auto px-4">
        {streams.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد بثوث مباشرة حالياً</h3>
            <p className="text-gray-500 mb-6">كن أول من يبدأ البث واكسب المشاهدين!</p>
            <Button 
              onClick={() => setLocation('/start-stream')}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
            >
              <Radio className="w-5 h-5 ml-2" />
              ابدأ البث الآن
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {streams.map((stream: any) => (
              <Card 
                key={stream.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
                onClick={() => setLocation(`/stream/${stream.id}`)}
              >
                <div className="relative">
                  {/* Stream Preview */}
                  <div 
                    ref={el => previewRefs.current[`preview-${stream.id}`] = el}
                    className="aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden"
                  >
                    {/* Live Badge */}
                    {stream.isLive && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-red-600/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-bold">مباشر</span>
                        </div>
                      </div>
                    )}

                    {/* Viewer Count */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1 rtl:space-x-reverse">
                        <Users className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-medium">{stream.viewerCount || 0}</span>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>

                    {/* Fallback gradient when no stream */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20"></div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{stream.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{stream.hostUsername || 'مضيف مجهول'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <Eye className="w-4 h-4" />
                        <span>{stream.viewerCount || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <Heart className="w-4 h-4" />
                        <span>{stream.totalGifts || 0}</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      {stream.category || 'عام'}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Button 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/stream/${stream.id}`);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 ml-2" />
                      انضم للدردشة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}