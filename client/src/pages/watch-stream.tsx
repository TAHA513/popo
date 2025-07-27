import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Share, Gift, Users, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { apiRequest } from "@/lib/queryClient";

interface Stream {
  id: number;
  title: string;
  hostId: string;
  hostName: string;
  hostProfileImage?: string;
  zegoRoomId: string;
  zegoStreamId: string;
  startedAt: string;
  viewerCount: number;
  isActive: boolean;
}

export default function WatchStreamPage() {
  const params = useParams();
  const id = params.id;
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const [zegoInstance, setZegoInstance] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [likes, setLikes] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);

  // جلب بيانات البث
  const { data: stream, isLoading, error } = useQuery<Stream>({
    queryKey: ['/api/streams', id],
    enabled: !!id
  });

  // حساب مدة البث
  useEffect(() => {
    if (!stream?.startedAt) return;
    
    const startTime = new Date(stream.startedAt).getTime();
    const timer = setInterval(() => {
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      setStreamDuration(duration);
    }, 1000);

    return () => clearInterval(timer);
  }, [stream]);

  // تحديث الإحصائيات
  useEffect(() => {
    const statsTimer = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
      setLikes(prev => prev + Math.floor(Math.random() * 2));
    }, 5000);

    return () => clearInterval(statsTimer);
  }, []);

  // الاتصال بـ ZegoCloud لمشاهدة البث
  useEffect(() => {
    if (!stream || !user || !streamContainerRef.current) return;

    const connectToStream = async () => {
      try {
        console.log('🔗 Connecting to stream as viewer...');
        
        const config = await apiRequest('/api/zego-config', 'GET');
        if (!config.appId || !stream.zegoRoomId) return;

        // إنشاء token للمشاهدة - نفس الغرفة التي ينشئها المذيع
        const viewerUserId = `viewer_${user.id}_${Date.now()}`;
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          parseInt(config.appId),
          config.appSign,
          stream.zegoRoomId, // نفس معرف الغرفة
          viewerUserId,
          user.username || 'مشاهد'
        );

        console.log('🔗 Viewer joining room:', {
          roomId: stream.zegoRoomId,
          streamId: stream.zegoStreamId,
          viewerId: viewerUserId
        });

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        setZegoInstance(zp);

        // الانضمام للبث كمشاهد
        zp.joinRoom({
          container: streamContainerRef.current,
          sharedLinks: [{
            name: 'LaaBoBo Live',
            url: window.location.href,
          }],
          scenario: {
            mode: ZegoUIKitPrebuilt.LiveStreaming,
            config: {
              role: ZegoUIKitPrebuilt.Audience,
            }
          },
          showScreenSharingButton: false,
          showTextChat: true,
          showUserCount: true,
          showUserList: false,
          showRemoveUserButton: false,
          showPinButton: false,
          showLayoutButton: false,
          turnOnMicrophoneWhenJoining: false,
          turnOnCameraWhenJoining: false,
          showMyCameraToggleButton: false,
          showMyMicrophoneToggleButton: false,
          showAudioVideoSettingsButton: false,
          showLeaveRoomConfirmDialog: false,
          maxUsers: 50,
          layout: "Grid",
          onJoinRoom: () => {
            console.log('✅ Joined stream successfully as viewer');
            setIsConnected(true);
          },
          onLeaveRoom: () => {
            console.log('❌ Left stream');
            setIsConnected(false);
          },
          onUserJoin: (users: any[]) => {
            console.log('👥 Users joined:', users);
            setViewerCount(prev => prev + users.length);
          },
          onUserLeave: (users: any[]) => {
            console.log('👥 Users left:', users);
            setViewerCount(prev => Math.max(1, prev - users.length));
          }
        });

      } catch (error) {
        console.error('❌ Error connecting to stream:', error);
      }
    };

    connectToStream();

    // تنظيف الاتصال عند المغادرة
    return () => {
      if (zegoInstance) {
        try {
          zegoInstance.destroy();
        } catch (error) {
          console.error('Error destroying zego instance:', error);
        }
      }
    };
  }, [stream, user]);

  // تنسيق مدة البث
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // معالجة حالات التحميل والأخطاء
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-lg">جاري تحميل البث...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">البث غير متاح</h2>
          <p className="mb-6">عذراً، لا يمكن العثور على هذا البث أو انتهى البث</p>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">تجربة الوصول المباشر للبث رقم: {id}</p>
              <p className="text-xs text-gray-500">خطأ: {error?.message || 'البث غير موجود'}</p>
            </div>
            <Button 
              onClick={() => setLocation('/')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              العودة للرئيسية
            </Button>
            <Button 
              onClick={() => setLocation('/simple-stream')}
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              إنشاء بث جديد
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* حاوية البث الرئيسية */}
      <div className="absolute inset-0">
        {/* زر العودة */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 ml-2" />
          عودة
        </Button>

        {/* معلومات البث العلوية */}
        <div className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-bold">مباشر</span>
            <span className="text-white">•</span>
            <span className="text-white">{formatDuration(streamDuration)}</span>
          </div>
        </div>

        {/* حاوية ZegoCloud للبث */}
        <div 
          ref={streamContainerRef}
          className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900"
          style={{ position: 'relative', width: '100%', height: '100vh' }}
        >
          {/* شاشة تحميل أثناء الاتصال */}
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 z-10">
              <div className="text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
                  {stream.hostProfileImage ? (
                    <img 
                      src={stream.hostProfileImage} 
                      alt={stream.hostName}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-purple-600">
                      {stream.hostName?.[0]?.toUpperCase() || 'S'}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{stream.hostName}</h3>
                <p className="text-sm opacity-80 mb-4">{stream.title}</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-sm mt-2">جاري الاتصال بالبث...</p>
              </div>
            </div>
          )}
        </div>

        {/* أزرار التفاعل الجانبية */}
        <div className="absolute right-4 bottom-32 z-50 space-y-4">
          {/* إعجاب */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setLikes(prev => prev + 1)}
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-red-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Heart className="w-6 h-6" />
            <span className="text-xs mt-1">{likes}</span>
          </Button>

          {/* تعليق */}
          <Button
            variant="ghost"
            size="lg"
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-blue-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs mt-1">تعليق</span>
          </Button>

          {/* مشاركة */}
          <Button
            variant="ghost"
            size="lg"
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-green-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Share className="w-6 h-6" />
            <span className="text-xs mt-1">مشاركة</span>
          </Button>

          {/* هدية */}
          <Button
            variant="ghost"
            size="lg"
            className="w-14 h-14 rounded-full bg-black/50 text-yellow-400 hover:bg-yellow-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Gift className="w-6 h-6" />
            <span className="text-xs mt-1">هدية</span>
          </Button>
        </div>

        {/* إحصائيات البث السفلية */}
        <div className="absolute bottom-4 left-4 right-20 z-50">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-semibold">{viewerCount} مشاهد</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-semibold">{likes} إعجاب</span>
              </div>
            </div>
            <h3 className="text-white font-bold">{stream.title}</h3>
            <p className="text-gray-300 text-sm">بث من {stream.hostName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}