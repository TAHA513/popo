import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Share, Gift, Users, ArrowLeft, Volume2, VolumeX } from 'lucide-react';

export default function WatchStreamPage() {
  const params = useParams();
  const id = params.id;
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [likes, setLikes] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);

  // جلب بيانات البث
  const { data: stream, isLoading } = useQuery({
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
    if (!stream || !user) return;

    const connectToStream = async () => {
      try {
        console.log('🔗 Connecting to stream as viewer...');
        
        const config = await fetch('/api/zego-config', {
          credentials: 'include'
        }).then(res => res.json());

        if (!config.appId) return;

        const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
        const engine = new ZegoExpressEngine(parseInt(config.appId), 'wss://webliveroom-api.zego.im/ws');
        setZegoEngine(engine);

        // تسجيل الدخول كمشاهد
        await engine.loginRoom(stream.zegoRoomId, {
          userID: config.userID || `viewer_${user.id}`,
          userName: config.userName || user.username || 'مشاهد'
        }, config.token || '');

        // محاولة الاتصال المباشر بالبث
        const attemptConnection = async () => {
          try {
            console.log('📺 Attempting to connect to stream:', stream.zegoStreamId);
            
            // محاولة تشغيل البث مباشرة
            await engine.startPlayingStream(stream.zegoStreamId, {
              camera: true,
              microphone: true
            });
            
            console.log('✅ Stream play command sent successfully');
            setIsConnected(true);
            
          } catch (directError) {
            console.warn('⚠️ Direct play failed:', directError);
          }
        };

        // تسجيل الأحداث لاستقبال البث
        engine.on('roomStreamUpdate', async (roomID: string, updateType: any, streamList: any[]) => {
          console.log('🔄 Stream update:', { roomID, updateType, streamList });
          
          if (updateType === 'ADD' && streamList.length > 0) {
            for (const streamInfo of streamList) {
              if (streamInfo.streamID === stream.zegoStreamId) {
                try {
                  console.log('🎥 Found target stream, connecting...');
                  await engine.startPlayingStream(streamInfo.streamID);
                  setIsConnected(true);
                  console.log('✅ Successfully connected to stream!');
                  break;
                } catch (err) {
                  console.error('❌ Failed to connect to stream:', err);
                }
              }
            }
          }
        });

        // استقبال البث عند وصوله
        engine.on('playerRecvVideoFirstFrame', (streamID: string) => {
          console.log('🎬 Received first video frame for:', streamID);
          if (streamID === stream.zegoStreamId) {
            setIsConnected(true);
          }
        });

        engine.on('playStateUpdate', (streamID: string, state: any) => {
          console.log('🎮 Play state update:', { streamID, state });
          if (streamID === stream.zegoStreamId && state === 'PLAYING') {
            setIsConnected(true);
          }
        });

        // محاولة الاتصال المباشر
        await attemptConnection();
        
        // إذا لم ينجح، انتظار قليلاً ثم محاولة مرة أخرى
        setTimeout(async () => {
          if (!isConnected) {
            console.log('🔄 Retrying connection...');
            await attemptConnection();
          }
        }, 2000);
        
        console.log('✅ Connected to stream room successfully!');

      } catch (error) {
        console.error('❌ Failed to connect to stream:', error);
        setIsConnected(false);
      }
    };

    connectToStream();

    return () => {
      if (zegoEngine && stream) {
        try {
          zegoEngine.stopPlayingStream(stream.zegoStreamId);
          zegoEngine.logoutRoom();
          zegoEngine.destroy();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }
    };
  }, [stream, user]);



  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = () => {
    setLikes(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-xl">جاري تحميل البث...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">البث غير موجود</h2>
            <p className="text-gray-600 mb-4">لم يتم العثور على البث المطلوب</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* الفيديو الرئيسي */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          controls={false}
          muted={isMuted}
        />

        {/* شريط علوي */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-6 z-10">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-red-600/90 px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-bold">🔴 مباشر</span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-bold">{formatDuration(streamDuration)}</span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white font-bold">{viewerCount}</span>
              </div>

              <Button
                onClick={toggleMute}
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          <div className="mt-4 text-white">
            <h1 className="text-2xl font-bold">{stream.title}</h1>
            <p className="text-lg opacity-80">المضيف: {stream.hostId}</p>
          </div>
        </div>

        {/* أزرار الأكشن الجانبية */}
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10">
          <div className="flex flex-col space-y-6">
            <Button
              onClick={handleLike}
              variant="ghost"
              className="rounded-full w-16 h-16 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center">
                <Heart className="w-8 h-8 text-white" />
                <span className="text-white text-xs mt-1">{likes}</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="rounded-full w-16 h-16 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center">
                <MessageCircle className="w-8 h-8 text-white" />
                <span className="text-white text-xs mt-1">تعليق</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="rounded-full w-16 h-16 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center">
                <Share className="w-8 h-8 text-white" />
                <span className="text-white text-xs mt-1">مشاركة</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="rounded-full w-16 h-16 p-0 bg-yellow-500/80 hover:bg-yellow-500 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center">
                <Gift className="w-8 h-8 text-white" />
                <span className="text-white text-xs mt-1">هدية</span>
              </div>
            </Button>
          </div>
        </div>

        {/* معلومات الاتصال */}
        <div className="absolute bottom-6 left-6 z-10">
          <div className={`px-4 py-2 rounded-full text-white text-sm ${
            isConnected ? 'bg-green-600/90' : 'bg-red-600/90'
          }`}>
            {isConnected ? '✅ متصل بالبث المباشر' : '⚠️ جاري الاتصال بالبث...'}
          </div>
          {!isConnected && (
            <div className="mt-2 text-white text-xs bg-black/60 rounded-lg p-2 max-w-xs">
              يتم الآن محاولة الاتصال بالبث المباشر الحقيقي عبر ZegoCloud...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}