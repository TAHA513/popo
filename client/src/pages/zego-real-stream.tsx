import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Users, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// إعلان النوع العالمي لـ ZegoExpressEngine
declare global {
  interface Window {
    ZegoExpressEngine: any;
    zg: any;
    liveRooms: Array<{
      roomID: string;
      streamID: string;
      userName: string;
      userID: string;
      timestamp: number;
    }>;
  }
}

export default function ZegoRealStream() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);

  // تحميل ZEGO SDK
  useEffect(() => {
    const loadZegoSDK = () => {
      if (window.ZegoExpressEngine) {
        setIsSDKLoaded(true);
        initializeLiveRooms();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://download.zegocloud.com/sdk/latest/zego-express-video.min.js';
      script.onload = () => {
        console.log('✅ ZEGO SDK loaded successfully');
        setIsSDKLoaded(true);
        initializeLiveRooms();
        toast({
          title: "تم تحميل النظام",
          description: "نظام البث المباشر جاهز للاستخدام",
        });
      };
      script.onerror = () => {
        console.error('❌ Failed to load ZEGO SDK');
        toast({
          title: "خطأ في التحميل",
          description: "فشل في تحميل نظام البث المباشر",
          variant: "destructive"
        });
      };
      document.head.appendChild(script);
    };

    loadZegoSDK();
  }, [toast]);

  // تهيئة قائمة البث المباشر
  const initializeLiveRooms = () => {
    if (!window.liveRooms) {
      window.liveRooms = [];
    }
    setLiveRooms([...window.liveRooms]);
    
    // تحديث القائمة كل 5 ثوان
    const interval = setInterval(() => {
      // إزالة الغرف القديمة (أكثر من 10 دقائق)
      const now = Date.now();
      window.liveRooms = window.liveRooms.filter(room => 
        now - room.timestamp < 10 * 60 * 1000
      );
      setLiveRooms([...window.liveRooms]);
    }, 5000);

    return () => clearInterval(interval);
  };

  // بدء البث المباشر
  const startLiveStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث المباشر",
        variant: "destructive"
      });
      return;
    }

    if (!isSDKLoaded || !window.ZegoExpressEngine) {
      toast({
        title: "النظام غير جاهز",
        description: "يرجى الانتظار حتى يتم تحميل النظام",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🚀 Starting ZEGO live stream...');
      
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID || '');
      const serverSecret = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN || '';
      
      if (!appID || !serverSecret) {
        toast({
          title: "إعدادات مفقودة",
          description: "إعدادات البث غير موجودة في النظام",
          variant: "destructive"
        });
        return;
      }

      const roomID = `room_${Date.now()}`;
      const streamID = `stream_${Date.now()}`;
      const userID = user?.id || `user_${Date.now()}`;
      const userName = user?.username || streamTitle;

      // إنشاء ZEGO Engine
      const zg = new window.ZegoExpressEngine(appID, serverSecret);
      window.zg = zg;

      // دخول الغرفة
      await zg.loginRoom(roomID, { userID, userName });
      console.log('✅ Joined room:', roomID);

      // الحصول على الكاميرا والميكروفون
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // بدء النشر
      await zg.startPublishingStream(streamID, localStream);
      console.log('✅ Started publishing stream:', streamID);

      // عرض الفيديو المحلي
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // إضافة الغرفة للقائمة العامة
      const roomData = {
        roomID,
        streamID,
        userName,
        userID,
        timestamp: Date.now(),
        title: streamTitle
      };
      
      window.liveRooms.push(roomData);
      setLiveRooms([...window.liveRooms]);
      setCurrentRoom(roomData);
      setIsStreaming(true);

      // محاكاة عدد المشاهدين
      const viewerInterval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 3));
      }, 5000);

      toast({
        title: "🔴 بث مباشر",
        description: "بدأ البث المباشر بنجاح!",
      });

      // تنظيف عند إنهاء البث
      window.addEventListener('beforeunload', () => {
        stopLiveStream();
      });

      return () => clearInterval(viewerInterval);

    } catch (error: any) {
      console.error('❌ ZEGO stream error:', error);
      toast({
        title: "خطأ في البث",
        description: `فشل في بدء البث: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive"
      });
    }
  };

  // إيقاف البث
  const stopLiveStream = async () => {
    try {
      if (window.zg && currentRoom) {
        await window.zg.stopPublishingStream(currentRoom.streamID);
        await window.zg.logoutRoom(currentRoom.roomID);
        
        // إزالة الغرفة من القائمة
        window.liveRooms = window.liveRooms.filter(room => room.roomID !== currentRoom.roomID);
        setLiveRooms([...window.liveRooms]);
        
        console.log('✅ Stream stopped and room removed');
      }
      
      setIsStreaming(false);
      setCurrentRoom(null);
      setLocation('/');
    } catch (error) {
      console.error('❌ Error stopping stream:', error);
    }
  };

  // مشاهدة بث
  const watchLiveStream = async (room: any) => {
    try {
      console.log('👀 Watching stream:', room);
      
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID || '');
      const serverSecret = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN || '';
      const viewerID = `viewer_${Date.now()}`;

      const zg = new window.ZegoExpressEngine(appID, serverSecret);
      window.zg = zg;

      // دخول الغرفة كمشاهد
      await zg.loginRoom(room.roomID, { userID: viewerID, userName: "مشاهد" });

      // بدء مشاهدة البث
      zg.startPlayingStream(room.streamID, (stream: MediaStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      setIsWatching(true);
      setCurrentRoom(room);

      toast({
        title: "بدأت المشاهدة",
        description: `تشاهد الآن بث ${room.userName}`,
      });

    } catch (error: any) {
      console.error('❌ Error watching stream:', error);
      toast({
        title: "خطأ في المشاهدة",
        description: `فشل في مشاهدة البث: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // إيقاف المشاهدة
  const stopWatching = async () => {
    try {
      if (window.zg && currentRoom) {
        await window.zg.stopPlayingStream(currentRoom.streamID);
        await window.zg.logoutRoom(currentRoom.roomID);
      }
      
      setIsWatching(false);
      setCurrentRoom(null);
    } catch (error) {
      console.error('❌ Error stopping watching:', error);
    }
  };

  // إذا كان يبث
  if (isStreaming) {
    return (
      <div className="min-h-screen bg-black">
        {/* الفيديو المحلي */}
        <video
          ref={localVideoRef}
          className="w-full h-screen object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* شريط علوي */}
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold">مباشر</span>
                <span className="text-white">{streamTitle}</span>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-white text-sm">
                <Users className="w-4 h-4" />
                <span>{viewerCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="absolute bottom-20 left-4 right-4 z-50">
          <div className="flex justify-center">
            <Button
              onClick={stopLiveStream}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full"
            >
              إنهاء البث
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // إذا كان يشاهد
  if (isWatching) {
    return (
      <div className="min-h-screen bg-black">
        {/* الفيديو البعيد */}
        <video
          ref={remoteVideoRef}
          className="w-full h-screen object-cover"
          autoPlay
          playsInline
        />
        
        {/* شريط علوي */}
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold">مباشر</span>
                <span className="text-white">{currentRoom?.title || currentRoom?.userName}</span>
              </div>
              
              <Button
                onClick={stopWatching}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // الواجهة الرئيسية
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      <div className="max-w-md mx-auto">
        {/* بدء بث جديد */}
        <Card className="mb-6 bg-black/50 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">
              🔴 بث مباشر حقيقي
            </CardTitle>
            <p className="text-gray-300">
              بث مباشر عبر ZEGO Cloud
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium block mb-2">
                عنوان البث
              </label>
              <Input
                type="text"
                placeholder="أدخل عنوان البث المباشر..."
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            
            {!isSDKLoaded && (
              <div className="text-center text-yellow-300 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300 mx-auto mb-2"></div>
                جاري تحميل نظام البث...
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation('/')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                رجوع
              </Button>
              <Button
                onClick={startLiveStream}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={!streamTitle.trim() || !isSDKLoaded}
              >
                🔴 ابدأ البث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* قائمة البثوث المباشرة */}
        {liveRooms.length > 0 && (
          <Card className="bg-black/50 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                🎥 البثوث المباشرة ({liveRooms.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {liveRooms.map((room, index) => (
                <div
                  key={room.roomID}
                  className="bg-white/10 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-medium">{room.title || room.userName}</div>
                    <div className="text-gray-400 text-sm flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      مباشر الآن
                    </div>
                  </div>
                  <Button
                    onClick={() => watchLiveStream(room)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    مشاهدة
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {liveRooms.length === 0 && isSDKLoaded && (
          <Card className="bg-black/50 backdrop-blur-lg border-white/20">
            <CardContent className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">📡</div>
              <p className="text-gray-400">لا توجد بثوث مباشرة حالياً</p>
              <p className="text-gray-500 text-sm">ابدأ بثك لتكون أول المذيعين!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}