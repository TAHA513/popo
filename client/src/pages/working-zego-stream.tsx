import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Heart, MessageCircle, Gift } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

export default function WorkingZegoStream() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);

  // تحميل ZegoCloud SDK
  useEffect(() => {
    const loadZegoSDK = () => {
      if (window.ZegoUIKitPrebuilt) {
        console.log('✅ ZegoCloud SDK already loaded');
        setIsInitialized(true);
        return;
      }

      console.log('📥 Loading ZegoCloud SDK...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ ZegoCloud SDK loaded successfully');
        if (window.ZegoUIKitPrebuilt) {
          setIsInitialized(true);
          toast({
            title: "✅ نجح التحميل",
            description: "نظام البث المباشر جاهز للاستخدام",
          });
        }
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load ZegoCloud SDK');
        toast({
          title: "❌ خطأ في التحميل",
          description: "فشل في تحميل نظام البث",
          variant: "destructive"
        });
      };
      
      document.head.appendChild(script);
    };

    loadZegoSDK();
  }, [toast]);

  // بدء البث المباشر
  const startLiveStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "⚠️ عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث المباشر",
        variant: "destructive"
      });
      return;
    }

    if (!isInitialized || !window.ZegoUIKitPrebuilt) {
      toast({
        title: "⏳ النظام غير جاهز",
        description: "يرجى انتظار تحميل النظام",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🚀 Starting ZegoCloud live stream...');
      
      // المفاتيح من environment variables
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;
      
      if (!appID || !serverSecret) {
        toast({
          title: "⚙️ إعدادات مفقودة",
          description: "مفاتيح ZegoCloud غير موجودة",
          variant: "destructive"
        });
        return;
      }

      // إنشاء room ID فريد
      const roomID = `live_${user?.id}_${Date.now()}`;
      const userID = user?.id || `user_${Date.now()}`;
      const userName = user?.username || 'مستخدم';

      console.log('🏠 Creating room:', roomID);
      console.log('👤 User:', userName);

      // إنشاء kit token
      const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        userID,
        userName
      );

      // إنشاء ZegoUIKit instance
      const zp = window.ZegoUIKitPrebuilt.create(kitToken);
      
      console.log('📱 Joining room as host...');

      // انضمام كمضيف للبث المباشر
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: window.ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: window.ZegoUIKitPrebuilt.Host,
          },
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: false,
        showTextChat: true,
        showUserList: true,
        maxUsers: 50,
        layout: 'Grid',
        showLayoutButton: false,
        
        onJoinRoom: () => {
          console.log('✅ Successfully joined room as host');
          setIsStreaming(true);
          
          // محاكاة المشاهدين
          setTimeout(() => {
            setViewerCount(Math.floor(Math.random() * 5) + 1);
            setLikes(Math.floor(Math.random() * 10) + 1);
          }, 2000);

          toast({
            title: "🔴 بث مباشر",
            description: `بدأ البث: ${streamTitle}`,
          });
        },
        
        onLeaveRoom: () => {
          console.log('👋 Left the room');
          setIsStreaming(false);
          setViewerCount(0);
          setLikes(0);
          setLocation('/');
        },
        
        onUserJoin: (users: any[]) => {
          console.log('👥 Users joined:', users);
          setViewerCount(prev => prev + users.length);
        },
        
        onUserLeave: (users: any[]) => {
          console.log('👋 Users left:', users);
          setViewerCount(prev => Math.max(0, prev - users.length));
        }
      });

    } catch (error: any) {
      console.error('❌ Error starting stream:', error);
      toast({
        title: "❌ خطأ في البث",
        description: error.message || "فشل في بدء البث المباشر",
        variant: "destructive"
      });
    }
  };

  // صفحة إدخال العنوان
  if (!isStreaming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">
              🔴 بث مباشر
            </CardTitle>
            <p className="text-gray-300">
              بث مباشر احترافي
            </p>
            {!isInitialized && (
              <div className="text-yellow-300 text-xs">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300 mx-auto mb-2"></div>
                جاري تحميل ZegoCloud...
              </div>
            )}
            {isInitialized && (
              <div className="text-green-300 text-xs">
                ✅ ZegoCloud جاهز
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium block mb-2">
                عنوان البث المباشر
              </label>
              <Input
                type="text"
                placeholder="مثال: مرحباً بكم في بثي المباشر"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && streamTitle.trim() && isInitialized) {
                    startLiveStream();
                  }
                }}
              />
            </div>
            
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
                disabled={!streamTitle.trim() || !isInitialized}
              >
                🔴 ابدأ البث
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // واجهة البث المباشر
  return (
    <div className="min-h-screen bg-black relative">
      {/* ZegoCloud Container */}
      <div 
        ref={containerRef} 
        className="w-full h-screen"
        style={{ backgroundColor: '#000' }}
      />
      
      {/* شريط علوي */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold">مباشر</span>
              <span className="text-white text-sm">{streamTitle}</span>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse text-white text-sm">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Users className="w-4 h-4" />
                <span>{viewerCount}</span>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Heart className="w-4 h-4 text-red-500" />
                <span>{likes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التفاعل الجانبية */}
      <div className="absolute bottom-20 right-4 z-40">
        <div className="flex flex-col space-y-3">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">{viewerCount}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <Heart className="w-6 h-6 mx-auto mb-1 text-red-500" />
            <span className="text-xs">{likes}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">💬</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <Gift className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
            <span className="text-xs">🎁</span>
          </div>
        </div>
      </div>
    </div>
  );
}