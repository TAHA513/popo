import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Play, Users, Eye, Radio, Clock, Heart, Video } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { apiRequest } from "@/lib/queryClient";

export default function StreamsHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const previewRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [zegoConfig, setZegoConfig] = useState<any>(null);
  const [previewInstances, setPreviewInstances] = useState<{[key: string]: any}>({});
  
  // جلب البثوث المباشرة
  const { data: streams = [] } = useQuery<any[]>({
    queryKey: ['/api/streams'], 
    refetchInterval: 5000,
  });

  // جلب إعدادات ZegoCloud
  useEffect(() => {
    const fetchZegoConfig = async () => {
      try {
        if (user) {
          const config = await apiRequest('/api/zego-config', 'GET');
          setZegoConfig(config);
        }
      } catch (error) {
        console.error('Failed to load ZegoCloud config:', error);
      }
    };

    fetchZegoConfig();
  }, [user]);

  // إنشاء معاينة البث الحقيقي لكل بث
  useEffect(() => {
    if (!zegoConfig || !streams.length || !user) return;

    streams.forEach((stream: any) => {
      const previewElement = previewRefs.current[`preview-${stream.id}`];
      if (previewElement && stream.zegoRoomId && !previewInstances[stream.id]) {
        try {
          // إنشاء معاينة البث المباشر الحقيقي
          const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            parseInt(zegoConfig.appId),
            zegoConfig.appSign,
            stream.zegoRoomId,
            `preview_${user.id}_${Date.now()}`,
            user.username || 'مشاهد'
          );

          const zp = ZegoUIKitPrebuilt.create(kitToken);
          
          // إعداد معاينة البث (مشاهدة فقط بدون تفاعل)
          zp.joinRoom({
            container: previewElement,
            scenario: {
              mode: ZegoUIKitPrebuilt.LiveStreaming,
              config: {
                role: ZegoUIKitPrebuilt.Audience,
              }
            },
            onJoinRoom: () => {
              console.log(`Preview joined room: ${stream.zegoRoomId}`);
            },
            onLeaveRoom: () => {
              console.log(`Preview left room: ${stream.zegoRoomId}`);
            }
          });

          setPreviewInstances(prev => ({
            ...prev,
            [stream.id]: zp
          }));

        } catch (error) {
          console.error('Error creating stream preview:', error);
        }
      }
    });

    // تنظيف المعاينات المنتهية
    return () => {
      Object.keys(previewInstances).forEach(streamId => {
        const currentStreamExists = streams.find(s => s.id.toString() === streamId);
        if (!currentStreamExists && previewInstances[streamId]) {
          try {
            previewInstances[streamId].destroy();
          } catch (error) {
            console.error('Error destroying preview:', error);
          }
        }
      });
    };
  }, [zegoConfig, streams, user, previewInstances]);

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
                  onClick={() => {
                    console.log('🎯 Joining stream:', stream.id);
                    setLocation(`/stream/${stream.id}`);
                  }}
                >
                  <CardContent className="p-0">
                    {/* Live Stream Preview */}
                    <div className="relative h-56 overflow-hidden">
                      {/* Real ZegoCloud Stream Preview Container */}
                      <div 
                        ref={(el) => previewRefs.current[`preview-${stream.id}`] = el}
                        className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 relative overflow-hidden"
                        style={{
                          borderRadius: '0px',
                          position: 'relative'
                        }}
                      >
                        {/* Loading/Fallback state while real stream loads */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-pink-600/80 to-blue-600/80 flex items-center justify-center z-10">
                          <div className="text-center text-white">
                            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xl border-4 border-yellow-300 animate-pulse">
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
                            <h4 className="font-bold text-lg mb-1 drop-shadow-lg">{stream.hostName || 'مضيف البث'}</h4>
                            <div className="flex items-center justify-center gap-2 text-sm bg-red-500/80 px-3 py-1 rounded-full backdrop-blur-sm">
                              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                              <span className="font-semibold">يبث الآن...</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live indicator with pulsing effect */}
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-ping"></div>
                        مباشر
                      </div>

                      {/* Real-time viewer count */}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center animate-fade-in">
                        <Eye className="w-3 h-3 mr-1 animate-pulse" />
                        <span className="font-bold">{stream.viewerCount || 0}</span>
                      </div>

                      {/* Stream category badge */}
                      <div className="absolute bottom-3 left-3 bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-md text-xs font-semibold">
                        {stream.category || 'بث سريع'}
                      </div>

                      {/* Interactive join overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 cursor-pointer z-20">
                        <div className="bg-white/30 backdrop-blur-sm rounded-full p-4 shadow-xl transform hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
                          انقر لدخول البث كاملاً
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